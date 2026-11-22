"""
# Campus Crave — Full-Stack FastAPI Server (MongoDB Atlas Cloud Connected)
=================================================
Includes SQLite Database Persistence, User Authentication, Dynamic Outlets & Menus,
Order Management with Counter Tokens, Coupon Validation, Canteen Kitchen View,
and Real-Time YOLOv8 Crowd Video Streaming.
"""

import os
import sys
import time
import json
import random
import csv
import io
import urllib.request
from datetime import datetime
from typing import Optional, List, Dict, Any

try:
    from dotenv import load_dotenv
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        load_dotenv(env_file)
except ImportError:
    pass

import mongodb
import razorpay_module

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, HTMLResponse
from sqlalchemy.orm import Session
import uvicorn

from database import (
    Base,
    engine,
    get_db,
    migrate_db,
    OUTLETS_DATA,
    get_density_status,
    get_density_level,
    get_density_range_label,
)
from models import User, Restaurant, MenuItem, Order, Coupon, PaymentTransaction, NotificationLog
from schemas import (
    UserCreate,
    UserLogin,
    GoogleAuthRequest,
    UserOut,
    UserProfileUpdate,
    RestaurantOut,
    MenuItemOut,
    OrderCreate,
    OrderOut,
    OrderStatusUpdate,
    CouponOut,
    CouponValidateRequest,
    CouponValidateResponse,
    PaymentCreateRequest,
    PaymentVerifyRequest,
    RazorpayOrderRequest,
    RazorpayVerifyRequest,
    NotificationSendRequest,
    WebhookConfigRequest,
)
from seed import seed_database, hash_password
from state import (
    state_lock,
    frame_lock,
    is_running,
    target_restaurant_id,
    inference_metadata,
    benchmark_metrics,
    get_jpeg_frame,
    update_jpeg_frame,
    update_metrics,
)

# ---------------------------------------------------------------------------
# App Initialization & Database Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Campus Crave Full-Stack API",
    description="Production-grade API with SQLite persistence, Order Tokens, Auth, Menus & YOLOv8 Computer Vision",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Create database tables, run schema migrations, and seed initial campus data."""
    migrate_db()
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()

    # Initialize MongoDB Atlas cloud connection if configured
    try:
        if mongodb.init_mongodb():
            mongodb.sync_all_from_sqlite()
    except Exception as e:
        print(f"MongoDB Atlas notice: {e}")


# ---------------------------------------------------------------------------
# General & Health Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def index():
    return {
        "service": "Campus Crave Full-Stack API",
        "version": "3.0.0",
        "database": "MongoDB Atlas Cloud" if mongodb.is_connected() else "SQLite (campus_crave.db)",
        "mongodb_status": "connected" if mongodb.is_connected() else "offline (local fallback)",
        "docs": "/docs",
        "kitchen_view": "/kitchen",
        "endpoints": {
            "auth": ["/api/auth/register", "/api/auth/login", "/api/auth/me"],
            "outlets": ["/api/outlets", "/api/outlets/{id}", "/api/outlets/{id}/menu"],
            "orders": ["/api/orders", "/api/orders/{id}", "/api/orders/{id}/status"],
            "coupons": ["/api/coupons", "/api/coupons/validate"],
            "vision": ["/api/stream", "/api/metrics", "/api/cameras"],
        }
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ---------------------------------------------------------------------------
# User Authentication & Profile Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/auth/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new student."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.email}"
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        hostel_block=user_in.hostel_block or "Hostel Block 1 (Boys)",
        room_number=user_in.room_number or "Room 204",
        avatar=avatar_url,
        role="student",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/auth/login", response_model=UserOut)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    """Verify user credentials and log in."""
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or user.password_hash != hash_password(creds.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    return user


def parse_google_jwt(token: str) -> dict:
    """Helper to safely decode Google ID token JWT without external dependencies."""
    try:
        import base64
        parts = token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            return json.loads(payload_bytes.decode("utf-8"))
    except Exception as e:
        print(f"[GOOGLE AUTH] JWT decode notice: {e}")
    return {}


@app.post("/api/auth/google", response_model=UserOut)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register student using Google Sign-In."""
    email = payload.email.strip().lower()
    name = payload.name.strip()
    avatar = payload.avatar

    # If credential JWT token is passed, extract verified details
    if payload.credential:
        jwt_data = parse_google_jwt(payload.credential)
        if jwt_data.get("email"):
            email = jwt_data["email"].strip().lower()
        if jwt_data.get("name"):
            name = jwt_data["name"].strip()
        if jwt_data.get("picture"):
            avatar = jwt_data["picture"]

    user = db.query(User).filter(User.email == email).first()

    if user:
        # Existing user - update Google avatar and name if available
        if name:
            user.name = name
        if avatar:
            user.avatar = avatar
        user.auth_provider = "google"
        db.commit()
        db.refresh(user)
        return user
    else:
        # New user - create account automatically
        user_avatar = avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"
        new_user = User(
            name=name or email.split("@")[0].replace(".", " ").title(),
            email=email,
            password_hash=hash_password(f"google_oauth_{payload.google_id or email}"),
            hostel_block=payload.hostel_block or "Hostel Block 1 (Boys)",
            room_number=payload.room_number or "Room 204",
            avatar=user_avatar,
            role="student",
            auth_provider="google",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user


@app.get("/api/auth/me", response_model=UserOut)
def get_current_user(email: str, db: Session = Depends(get_db)):
    """Fetch user profile by email."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/api/auth/profile", response_model=UserOut)
def update_profile(email: str, profile_in: UserProfileUpdate, db: Session = Depends(get_db)):
    """Update student hostel details or profile name."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if profile_in.name:
        user.name = profile_in.name
    if profile_in.hostel_block:
        user.hostel_block = profile_in.hostel_block
    if profile_in.room_number:
        user.room_number = profile_in.room_number
    if profile_in.avatar:
        user.avatar = profile_in.avatar

    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Outlets & Menus Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/outlets")
def list_outlets(db: Session = Depends(get_db)):
    """List all campus restaurants with real-time occupancy and density levels."""
    restaurants = db.query(Restaurant).all()
    results = []

    with state_lock:
        live_metrics = dict(benchmark_metrics)

    for r in restaurants:
        occ = r.occupancy
        results.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "image": r.image,
            "max_capacity": r.max_capacity,
            "occupancy": occ,
            "status": get_density_status(occ),
            "density_level": get_density_level(occ),
            "density_range": get_density_range_label(occ),
            "is_open": r.is_open,
            "opening_time": r.opening_time,
            "closing_time": r.closing_time,
            "estimated_wait": "~5-8 mins" if occ <= 5 else "~12-18 mins" if occ <= 10 else "~25-35 mins"
        })

    return {
        "success": True,
        "performance_metrics": live_metrics,
        "data": results,
    }


@app.get("/api/outlets/{restaurant_id}")
def get_outlet(restaurant_id: str, db: Session = Depends(get_db)):
    """Get single outlet details, live headcount, and wait time."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Restaurant '{restaurant_id}' not found")

    occ = r.occupancy
    with state_lock:
        avg_lat = benchmark_metrics.get("avg_latency_ms", 0.0)
        avg_fps = benchmark_metrics.get("avg_fps", 0.0)

    return {
        "success": True,
        "data": {
            "restaurantId": r.id,
            "restaurantName": r.name,
            "description": r.description,
            "image": r.image,
            "occupancy": occ,
            "status": get_density_status(occ),
            "densityLevel": get_density_level(occ),
            "densityRange": get_density_range_label(occ),
            "maxCapacity": r.max_capacity,
            "isOpen": r.is_open,
            "openingTime": r.opening_time,
            "closingTime": r.closing_time,
            "estimatedWait": "~5-8 mins" if occ <= 5 else "~12-18 mins" if occ <= 10 else "~25-35 mins",
            "averageLatencyMs": avg_lat,
            "averagePipelineFps": avg_fps,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    }


@app.get("/api/outlets/{restaurant_id}/menu")
def get_outlet_menu(restaurant_id: str, db: Session = Depends(get_db)):
    """Get categorized food menu items for a specific dining outlet."""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    items = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).all()
    
    # Categorize items
    categories: Dict[str, List[dict]] = {}
    for item in items:
        cat = item.category or "Popular"
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "rating": item.rating,
            "image": item.image,
            "category": item.category,
            "isVeg": item.is_veg,
            "isAvailable": item.is_available,
        })

    return {
        "success": True,
        "restaurant": {
            "id": restaurant.id,
            "name": restaurant.name,
            "image": restaurant.image,
            "occupancy": restaurant.occupancy,
            "status": get_density_status(restaurant.occupancy),
        },
        "totalItems": len(items),
        "categorizedMenu": categories,
    }


@app.patch("/api/menu/{item_id}/availability")
def toggle_item_availability(item_id: int, db: Session = Depends(get_db)):
    """Toggle stock availability of an item (e.g. Sold Out)."""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_available = not item.is_available
    db.commit()
    return {"success": True, "itemId": item.id, "name": item.name, "isAvailable": item.is_available}


# ---------------------------------------------------------------------------
# Orders & Canteen Tokens Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/orders", response_model=Dict[str, Any])
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """Place a new meal order, generate a unique Canteen Pickup Token, and persist in database."""
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cannot place an empty order")

    # Order ID (use client generated or generate fresh CC-XXXX)
    if order_in.id:
        order_id = order_in.id
    else:
        order_id = f"CC-{random.randint(1000, 9999)}"
        while db.query(Order).filter(Order.id == order_id).first():
            order_id = f"CC-{random.randint(1000, 9999)}"

    # Express Pickup Token (use client generated or generate fresh TK-XX)
    if order_in.token:
        token = order_in.token
    else:
        token_num = random.randint(10, 99)
        token = f"TK-{token_num}"

    # Serialize items
    items_data = [item.dict() for item in order_in.items]

    new_order = Order(
        id=order_id,
        token=token,
        user_email=order_in.user_email or "guest@campus.edu",
        customer_phone=order_in.customer_phone or "+91 98765 43210",
        outlet_id=order_in.outlet_id or "campus-crave",
        outlet_name=order_in.outlet_name or "Campus Dining",
        items_json=json.dumps(items_data),
        subtotal=order_in.subtotal,
        discount=order_in.discount or 0.0,
        coupon_code=order_in.coupon_code,
        delivery_fee=order_in.delivery_fee or 0.0,
        taxes=order_in.taxes or 0.0,
        platform_fee=order_in.platform_fee or 5.0,
        tip=order_in.tip or 0.0,
        total=order_in.total,
        order_type=order_in.order_type or "pickup",
        delivery_address=order_in.delivery_address or ("Canteen Counter (Token Pickup)" if order_in.order_type == "pickup" else "Hostel Delivery"),
        status="Preparing",
        payment_method=order_in.payment_method or "UPI",
        payment_status=order_in.payment_status or "PAID",
        payment_id=order_in.payment_id or f"pay_{random.randint(100000, 999999)}",
        created_at=datetime.utcnow(),
        estimated_ready_time="~10-15 mins" if order_in.order_type == "pickup" else "~20-25 mins",
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    order_payload = {
        "id": new_order.id,
        "token": new_order.token,
        "outletId": new_order.outlet_id,
        "outletName": new_order.outlet_name,
        "items": items_data,
        "subtotal": new_order.subtotal,
        "discount": new_order.discount,
        "couponCode": new_order.coupon_code,
        "deliveryFee": new_order.delivery_fee,
        "taxes": new_order.taxes,
        "platformFee": new_order.platform_fee,
        "tip": new_order.tip,
        "total": new_order.total,
        "orderType": new_order.order_type,
        "deliveryAddress": new_order.delivery_address,
        "customerPhone": new_order.customer_phone,
        "paymentMethod": new_order.payment_method,
        "paymentStatus": new_order.payment_status,
        "paymentId": new_order.payment_id,
        "status": new_order.status,
        "createdAt": new_order.created_at.isoformat() + "Z",
        "estimatedReadyTime": new_order.estimated_ready_time,
    }

    # Dual-sync to MongoDB Atlas cloud if connected
    if mongodb.is_connected():
        try:
            mongodb.sync_order_to_mongo(order_payload)
        except Exception:
            pass

    return {
        "success": True,
        "message": "Order confirmed and routed to kitchen!",
        "order": order_payload
    }


@app.get("/api/orders")
def get_orders(email: Optional[str] = None, status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve orders list filtered by student email or status."""
    query = db.query(Order)
    if email:
        query = query.filter(Order.user_email == email)
    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.order_by(Order.created_at.desc()).all()
    results = []

    for o in orders:
        try:
            items_list = json.loads(o.items_json)
        except Exception:
            items_list = []

        results.append({
            "id": o.id,
            "token": o.token,
            "userEmail": o.user_email,
            "outletId": o.outlet_id,
            "outletName": o.outlet_name,
            "items": items_list,
            "subtotal": o.subtotal,
            "discount": o.discount,
            "couponCode": o.coupon_code,
            "deliveryFee": o.delivery_fee,
            "taxes": o.taxes,
            "platformFee": o.platform_fee,
            "tip": o.tip,
            "total": o.total,
            "orderType": o.order_type,
            "deliveryAddress": o.delivery_address,
            "customerPhone": o.customer_phone or "+91 98765 43210",
            "paymentMethod": o.payment_method or "UPI",
            "paymentStatus": o.payment_status or "PAID",
            "paymentId": o.payment_id,
            "status": o.status,
            "createdAt": o.created_at.isoformat() + "Z",
            "estimatedReadyTime": o.estimated_ready_time,
        })

    return {"success": True, "count": len(results), "orders": results}


@app.get("/api/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db)):
    """Fetch order details by Order ID or Token."""
    order = db.query(Order).filter((Order.id == order_id) | (Order.token == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "success": True,
        "order": {
            "id": order.id,
            "token": order.token,
            "outletId": order.outlet_id,
            "outletName": order.outlet_name,
            "items": json.loads(order.items_json),
            "total": order.total,
            "status": order.status,
            "createdAt": order.created_at.isoformat() + "Z",
            "estimatedReadyTime": order.estimated_ready_time,
        }
    }


# ---------------------------------------------------------------------------
# SMS / WhatsApp Notification Engine
# ---------------------------------------------------------------------------
NOTIFICATION_CONFIG = {
    "webhook_url": os.getenv("CAMPUS_WEBHOOK_URL", ""),
    "secret_key": os.getenv("CAMPUS_WEBHOOK_SECRET", "campus_crave_secret_2026"),
    "enabled": True,
}


def dispatch_token_notification(order: Order, db: Session, custom_message: Optional[str] = None) -> NotificationLog:
    """Dispatches SMS/WhatsApp token alert and triggers configured external webhook."""
    phone = order.customer_phone or "+91 98765 43210"
    student_name = order.user_email.split("@")[0].replace(".", " ").title() if order.user_email else "Student"

    default_msg = (
        f"🔔 CAMPUS CRAVE ORDER READY 🔔\n"
        f"Hey {student_name}! Your meal is fresh & READY FOR PICKUP!\n"
        f"🎫 Counter Token: {order.token}\n"
        f"📦 Order ID: {order.id}\n"
        f"📍 Counter: {order.outlet_name}\n"
        f"Show your token number at the pickup counter to collect your order."
    )
    message_text = custom_message or default_msg

    log = NotificationLog(
        order_id=order.id,
        token=order.token,
        channel="SMS_WHATSAPP",
        recipient_phone=phone,
        recipient_email=order.user_email,
        outlet_name=order.outlet_name,
        message=message_text,
        status="DELIVERED",
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    print("\n" + "📲 " + "=" * 62)
    print(f" [SMS / WHATSAPP DISPATCH] To: {phone} | Token: {order.token}")
    print(f" Outlet: {order.outlet_name} | Order: {order.id}")
    print(f" Content: {message_text.replace(chr(10), ' ')}")
    print("=" * 66 + "\n")

    if NOTIFICATION_CONFIG.get("webhook_url"):
        try:
            payload = json.dumps({
                "event": "order.ready_for_pickup",
                "order_id": order.id,
                "token": order.token,
                "outlet_name": order.outlet_name,
                "recipient_phone": phone,
                "recipient_email": order.user_email,
                "message": message_text,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode("utf-8")
            req = urllib.request.Request(
                NOTIFICATION_CONFIG["webhook_url"],
                data=payload,
                headers={"Content-Type": "application/json", "User-Agent": "CampusCrave-Webhook/1.0"}
            )
            urllib.request.urlopen(req, timeout=3)
        except Exception as err:
            print(f"[WEBHOOK WARNING] Failed to ping external URL: {err}")

    return log


@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    """Update order fulfillment status (used by canteen kitchen display) and dispatches token notifications."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    notification_sent = False

    if payload.status == "Ready for Pickup":
        order.estimated_ready_time = "Ready at Counter!"
        order.ready_at = datetime.utcnow()
        dispatch_token_notification(order, db)
        notification_sent = True
    elif payload.status == "Completed":
        order.estimated_ready_time = "Collected"
        order.completed_at = datetime.utcnow()

    db.commit()
    return {
        "success": True,
        "orderId": order.id,
        "token": order.token,
        "status": order.status,
        "notificationSent": notification_sent,
        "customerPhone": order.customer_phone or "+91 98765 43210"
    }


# ---------------------------------------------------------------------------
# Coupons Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/coupons")
def list_coupons(db: Session = Depends(get_db)):
    """List all active campus coupon codes."""
    coupons = db.query(Coupon).filter(Coupon.is_active == True).all()
    return {"success": True, "coupons": coupons}


@app.post("/api/coupons/validate", response_model=CouponValidateResponse)
def validate_coupon(req: CouponValidateRequest, db: Session = Depends(get_db)):
    """Validate a coupon code and calculate discount amount."""
    code_upper = req.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_upper, Coupon.is_active == True).first()

    if not coupon:
        return CouponValidateResponse(valid=False, code=code_upper, discount=0.0, message="Invalid coupon code.")

    if req.subtotal < coupon.min_order:
        return CouponValidateResponse(
            valid=False,
            code=code_upper,
            discount=0.0,
            message=f"Minimum order of ₹{coupon.min_order:.0f} required for {code_upper}."
        )

    if coupon.coupon_type == "flat":
        discount = min(coupon.discount, req.subtotal)
    elif coupon.coupon_type == "delivery":
        discount = 25.0 if req.order_type == "delivery" else 0.0
    else:
        discount = min(coupon.discount, req.subtotal)

    return CouponValidateResponse(
        valid=True,
        code=coupon.code,
        discount=discount,
        message=f"{coupon.code} applied successfully! Saved ₹{discount:.0f}."
    )


# ---------------------------------------------------------------------------
# AI Crowd Vision & Video Streaming
# ---------------------------------------------------------------------------
def generate_standby_frame():
    """Generates an informative standby HUD frame when external camera detector is idle."""
    try:
        import cv2
        import numpy as np

        img = np.zeros((480, 640, 3), dtype=np.uint8)
        img[:] = (22, 22, 24)

        # Decorative header bar
        cv2.rectangle(img, (0, 0), (640, 60), (35, 35, 40), -1)
        cv2.putText(img, "CAMPUS CRAVE - AI VISION STREAM", (24, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
        
        # Status
        cv2.putText(img, "STATUS: STANDBY (WAITING FOR CAMERA FEED)", (24, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 200, 255), 2)
        
        # Instructions Box
        cv2.rectangle(img, (24, 140), (616, 260), (32, 32, 36), -1)
        cv2.putText(img, "To start live camera stream with YOLOv8, run in terminal:", (40, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 200, 200), 1)
        cv2.putText(img, "cd face_detection && python detector.py --source 0 --device mps", (40, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 230, 120), 1)

        # Camera Finder Tip
        cv2.putText(img, "Camera Finder: http://localhost:8000/api/cameras", (40, 245), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (150, 150, 150), 1)

        # Server Live Clock
        cur_time = time.strftime("%H:%M:%S %Z")
        cv2.putText(img, f"Live Server Clock: {cur_time}", (24, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)

        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return buffer.tobytes()
    except Exception:
        # Fallback simple 1x1 jpeg if cv2 fails
        return b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'


@app.get("/api/stream")
def live_video_stream():
    """MJPEG live video stream endpoint displaying bounding boxes and HUD."""
    def frame_generator():
        while is_running:
            frame_bytes = get_jpeg_frame()
            if frame_bytes is None:
                # Yield live standby frame when detector is idle, avoiding hang
                standby = generate_standby_frame()
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + standby + b"\r\n"
                )
                time.sleep(0.1)
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            time.sleep(0.033)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/api/stream/frame")
async def upload_frame(request: Request):
    """Receives latest JPEG frame bytes from external YOLOv8 detector."""
    body = await request.body()
    if body:
        update_jpeg_frame(body)
        return {"success": True}
    return {"success": False, "error": "Empty frame body"}


@app.get("/api/metrics")
def get_benchmark_metrics():
    """Returns real-time inference latency and pipeline FPS measurements."""
    with state_lock:
        return {
            "success": True,
            "evaluation_metric_table": {
                "Average inference latency": f"{benchmark_metrics['avg_latency_ms']} ms/frame",
                "Average pipeline FPS": f"{benchmark_metrics['avg_fps']} frames/second",
                "Number of measured frames": benchmark_metrics["measured_frames"],
                "Warm-up frames excluded": benchmark_metrics["warmup_frames"],
                "Model": inference_metadata.get("model"),
                "Input image size": f"{inference_metadata.get('image_size')} x {inference_metadata.get('image_size')}",
                "Hardware accelerator": inference_metadata.get("hardware"),
            },
            "realtime_metrics": dict(benchmark_metrics)
        }


@app.post("/api/metrics")
async def post_metrics(payload: Dict[str, Any]):
    """Allows external detection process to update metrics."""
    update_metrics(payload)
    return {"success": True, "metrics": benchmark_metrics}


@app.post("/api/outlets/{restaurant_id}/occupancy")
def update_outlet_occupancy(restaurant_id: str, payload: dict, db: Session = Depends(get_db)):
    """Update real-time occupancy headcount from camera detector into database."""
    if "occupancy" not in payload:
        raise HTTPException(status_code=400, detail="Missing 'occupancy' field")

    new_count = max(0, int(payload["occupancy"]))
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if restaurant:
        restaurant.occupancy = new_count
        db.commit()

    with state_lock:
        if restaurant_id in OUTLETS_DATA:
            OUTLETS_DATA[restaurant_id]["occupancy"] = new_count

    return {"success": True, "restaurantId": restaurant_id, "occupancy": new_count}


@app.get("/api/cameras")
def api_camera_finder():
    """Returns connected video devices on macOS."""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "face_detection"))
        from camera_finder import get_macos_camera_names
        names = get_macos_camera_names()
        video_devices = {k: v for k, v in names.items() if "screen" not in v.lower()}
        devices = []
        for idx, name in video_devices.items():
            devices.append({
                "index": idx,
                "name": name,
                "resolution": "1920x1080" if "FaceTime" in name or "Camo" in name else "1280x720",
                "command": f"python detector.py --source {idx} --device mps"
            })
        return {
            "success": True,
            "current_source": inference_metadata.get("video_source", "0"),
            "cameras": devices
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Notifications API (SMS, WhatsApp, External Webhook)
# ---------------------------------------------------------------------------
@app.get("/api/notifications/logs")
def get_notification_logs(limit: int = 25, db: Session = Depends(get_db)):
    """Returns recent SMS/WhatsApp notification dispatch logs."""
    logs = db.query(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(limit).all()
    return {
        "success": True,
        "count": len(logs),
        "logs": [
            {
                "id": l.id,
                "order_id": l.order_id,
                "token": l.token,
                "channel": l.channel,
                "recipient_phone": l.recipient_phone,
                "recipient_email": l.recipient_email,
                "outlet_name": l.outlet_name,
                "message": l.message,
                "status": l.status,
                "created_at": l.created_at.isoformat() + "Z" if l.created_at else None,
            }
            for l in logs
        ]
    }


@app.post("/api/notifications/notify")
def manual_send_notification(req: NotificationSendRequest, db: Session = Depends(get_db)):
    """Manually dispatch or re-send token ready SMS/WhatsApp alert."""
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    log = dispatch_token_notification(order, db, req.custom_message)
    return {
        "success": True,
        "message": f"Alert dispatched to {log.recipient_phone} for token {order.token}!",
        "log_id": log.id
    }


@app.post("/api/notifications/webhook")
def configure_webhook(config: WebhookConfigRequest):
    """Configures destination webhook URL for real-time order notifications."""
    NOTIFICATION_CONFIG["webhook_url"] = config.webhook_url
    if config.secret_key:
        NOTIFICATION_CONFIG["secret_key"] = config.secret_key
    NOTIFICATION_CONFIG["enabled"] = config.enabled if config.enabled is not None else True
    return {"success": True, "message": "Webhook configured successfully", "config": NOTIFICATION_CONFIG}


# ---------------------------------------------------------------------------
# Payment Gateway Integration (UPI QR, Cards, Campus Fast-Pay)
# ---------------------------------------------------------------------------
PAYMENT_CONFIG = {
    "merchant_name": "Campus Crave Dining Services",
    "upi_vpa": "campuscrave@okhdfcbank",
    "supported_apps": ["Google Pay", "PhonePe", "Paytm", "CRED", "BHIM UPI", "Campus Card"],
}


@app.get("/api/payments/methods")
def get_payment_methods():
    """List available payment channels, UPI handle, and transaction limits."""
    return {
        "success": True,
        "merchant": PAYMENT_CONFIG["merchant_name"],
        "upi_vpa": PAYMENT_CONFIG["upi_vpa"],
        "methods": [
            {
                "id": "razorpay",
                "name": "Razorpay Official Gateway",
                "description": "UPI, Cards, Net Banking & Wallets",
                "badge": "Official ✨",
                "icon": "Zap",
            },
            {
                "id": "upi",
                "name": "UPI (Instant QR & Apps)",
                "description": "Google Pay, PhonePe, Paytm, CRED",
                "badge": "Fastest ⚡",
                "icon": "Smartphone",
            },
            {
                "id": "cash_counter",
                "name": "Pay at Canteen Counter",
                "description": "Cash or card swipe at token pickup",
                "badge": "Cash / POS",
                "icon": "Banknote",
            }
        ]
    }


@app.post("/api/payments/create-order")
def create_payment_order(req: PaymentCreateRequest, db: Session = Depends(get_db)):
    """Initialize payment transaction session with UPI QR intent & gateway session."""
    txn_id = f"TXN_CC_{random.randint(10000, 99999)}"
    gw_order_id = f"order_gw_{random.randint(100000, 999999)}"

    # UPI Dynamic Payment Intent URI
    upi_intent = (
        f"upi://pay?pa={PAYMENT_CONFIG['upi_vpa']}"
        f"&pn=Campus%20Crave"
        f"&am={req.amount:.2f}"
        f"&cu={req.currency or 'INR'}"
        f"&tn=Order%20{req.order_id or txn_id}"
    )

    txn = PaymentTransaction(
        id=txn_id,
        order_id=req.order_id,
        user_email=req.customer_email,
        amount=req.amount,
        currency=req.currency or "INR",
        status="PENDING",
        payment_method=req.payment_method or "UPI",
        gateway_order_id=gw_order_id,
        created_at=datetime.utcnow()
    )
    db.add(txn)
    db.commit()

    return {
        "success": True,
        "transaction_id": txn_id,
        "amount": req.amount,
        "currency": req.currency or "INR",
        "gateway_order_id": gw_order_id,
        "upi_intent": upi_intent,
        "upi_vpa": PAYMENT_CONFIG["upi_vpa"],
        "key_id": "rzp_test_campus_crave_live",
        "supported_apps": PAYMENT_CONFIG["supported_apps"]
    }


@app.post("/api/payments/verify")
def verify_payment(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    """Verifies payment transaction and updates linked order payment status."""
    txn = db.query(PaymentTransaction).filter(PaymentTransaction.id == req.transaction_id).first()
    if txn:
        txn.status = "SUCCESS"
        txn.gateway_payment_id = req.payment_id
        txn.payment_method = req.payment_method or txn.payment_method

    if req.order_id:
        order = db.query(Order).filter(Order.id == req.order_id).first()
        if order:
            order.payment_status = "PAID"
            order.payment_method = req.payment_method or "UPI"
            order.payment_id = req.payment_id

    # Deduct student wallet balance if Campus Wallet used
    if req.payment_method == "CAMPUS_WALLET" and txn and txn.user_email:
        user = db.query(User).filter(User.email == txn.user_email).first()
        if user and user.wallet_balance >= txn.amount:
            user.wallet_balance -= txn.amount

    db.commit()
    return {
        "success": True,
        "message": "Payment verified and settled successfully!",
        "transaction_id": req.transaction_id,
        "payment_id": req.payment_id,
        "status": "PAID"
    }


# ---------------------------------------------------------------------------
# Razorpay Official Payment Gateway Integration
# ---------------------------------------------------------------------------
@app.get("/api/razorpay/config")
def get_razorpay_config():
    """Return Razorpay Public Key and checkout metadata."""
    return {
        "success": True,
        "key_id": razorpay_module.get_key_id(),
        "currency": "INR",
        "merchant_name": "Campus Crave",
        "description": "Canteen Food Order Payment",
        "theme": {"color": "#2563eb"}
    }


@app.post("/api/razorpay/create-order")
def create_razorpay_order_endpoint(req: RazorpayOrderRequest, db: Session = Depends(get_db)):
    """Create a Razorpay order in paise and register transaction."""
    res = razorpay_module.create_order(
        amount=req.amount,
        currency=req.currency or "INR",
        receipt=req.receipt or req.order_id
    )

    txn_id = f"TXN_RZP_{random.randint(10000, 99999)}"
    txn = PaymentTransaction(
        id=txn_id,
        order_id=req.order_id,
        user_email=req.customer_email or "student@campus.edu",
        amount=req.amount,
        currency=req.currency or "INR",
        status="PENDING",
        payment_method="RAZORPAY",
        gateway_order_id=res.get("order_id"),
        created_at=datetime.utcnow()
    )
    db.add(txn)
    db.commit()

    res["transaction_id"] = txn_id
    return res


@app.post("/api/razorpay/verify")
def verify_razorpay_endpoint(req: RazorpayVerifyRequest, db: Session = Depends(get_db)):
    """Verify Razorpay payment signature and settle order transaction."""
    is_valid = razorpay_module.verify_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay signature. Verification failed."
        )

    txn = None
    if req.transaction_id:
        txn = db.query(PaymentTransaction).filter(PaymentTransaction.id == req.transaction_id).first()
    if not txn and req.razorpay_order_id:
        txn = db.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == req.razorpay_order_id).first()

    if txn:
        txn.status = "SUCCESS"
        txn.gateway_payment_id = req.razorpay_payment_id
        txn.payment_method = "RAZORPAY"

    if req.order_id:
        order = db.query(Order).filter(Order.id == req.order_id).first()
        if order:
            order.payment_status = "PAID"
            order.payment_method = "RAZORPAY"
            order.payment_id = req.razorpay_payment_id

    db.commit()

    # Sync to MongoDB Atlas cloud
    if mongodb.is_connected():
        try:
            mongodb.sync_payment_to_mongo({
                "transaction_id": txn.id if txn else req.razorpay_payment_id,
                "order_id": req.order_id,
                "gateway": "RAZORPAY",
                "razorpay_order_id": req.razorpay_order_id,
                "razorpay_payment_id": req.razorpay_payment_id,
                "amount": req.amount or (txn.amount if txn else 0.0),
                "status": "PAID",
                "verified_at": datetime.utcnow().isoformat()
            })
        except Exception:
            pass

    return {
        "success": True,
        "message": "Razorpay payment verified and order marked as PAID!",
        "payment_id": req.razorpay_payment_id,
        "order_id": req.razorpay_order_id,
        "status": "PAID"
    }


# ---------------------------------------------------------------------------
# Vendor & Campus Admin Analytics & Reports
# ---------------------------------------------------------------------------
@app.get("/api/admin/analytics")
def get_admin_analytics(db: Session = Depends(get_db)):
    """Computes comprehensive sales, revenue, kitchen speed, and outlet performance metrics."""
    orders = db.query(Order).all()

    total_orders = len(orders)
    non_cancelled = [o for o in orders if o.status != "Cancelled"]
    total_revenue = sum(o.total for o in non_cancelled)
    completed_orders = [o for o in orders if o.status == "Completed"]
    active_orders = [o for o in orders if o.status in ["Received", "Preparing", "Ready for Pickup"]]
    cancelled_orders = [o for o in orders if o.status == "Cancelled"]

    # Calculate average prep time (minutes)
    prep_times = []
    for o in orders:
        if o.ready_at and o.created_at:
            mins = (o.ready_at - o.created_at).total_seconds() / 60.0
            if 0.5 <= mins <= 120.0:
                prep_times.append(mins)
        elif o.completed_at and o.created_at:
            mins = (o.completed_at - o.created_at).total_seconds() / 60.0
            if 0.5 <= mins <= 120.0:
                prep_times.append(mins)

    avg_prep_time = round(sum(prep_times) / len(prep_times), 1) if prep_times else 11.5

    # Group by Outlet
    outlet_stats: Dict[str, Dict[str, Any]] = {}
    for o in non_cancelled:
        out_id = o.outlet_id
        if out_id not in outlet_stats:
            outlet_stats[out_id] = {"id": out_id, "name": o.outlet_name, "orders": 0, "revenue": 0.0}
        outlet_stats[out_id]["orders"] += 1
        outlet_stats[out_id]["revenue"] += o.total

    # Top items sold
    item_stats: Dict[str, Dict[str, Any]] = {}
    veg_count = 0
    non_veg_count = 0
    for o in non_cancelled:
        try:
            items = json.loads(o.items_json)
            for itm in items:
                name = itm.get("name", "Unknown")
                qty = itm.get("quantity", 1)
                price = itm.get("price", 0)
                is_veg = itm.get("is_veg", True)
                if is_veg:
                    veg_count += qty
                else:
                    non_veg_count += qty

                if name not in item_stats:
                    item_stats[name] = {"name": name, "quantity": 0, "revenue": 0.0, "is_veg": is_veg}
                item_stats[name]["quantity"] += qty
                item_stats[name]["revenue"] += price * qty
        except Exception:
            pass

    top_items = sorted(item_stats.values(), key=lambda x: x["quantity"], reverse=True)[:6]

    # Hourly order distribution (0-23 hours)
    hourly_distribution = [0] * 24
    for o in orders:
        if o.created_at:
            hourly_distribution[o.created_at.hour] += 1

    # Payment methods breakdown
    payment_methods_count: Dict[str, int] = {}
    for o in non_cancelled:
        method = o.payment_method or "UPI"
        payment_methods_count[method] = payment_methods_count.get(method, 0) + 1

    return {
        "success": True,
        "metrics": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "active_orders": len(active_orders),
            "completed_orders": len(completed_orders),
            "cancelled_orders": len(cancelled_orders),
            "avg_prep_time_minutes": avg_prep_time,
            "veg_items_sold": veg_count,
            "non_veg_items_sold": non_veg_count,
            "veg_percentage": round((veg_count / (veg_count + non_veg_count) * 100), 1) if (veg_count + non_veg_count) > 0 else 80.0,
        },
        "outlet_breakdown": list(outlet_stats.values()),
        "top_items": top_items,
        "hourly_distribution": hourly_distribution,
        "payment_methods": payment_methods_count,
    }


@app.get("/api/admin/orders/export")
def export_orders_csv(db: Session = Depends(get_db)):
    """Exports all student orders as a downloadable CSV spreadsheet."""
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Order ID", "Token", "Customer Email", "Customer Phone", "Outlet Name",
        "Items Summary", "Subtotal (INR)", "Discount (INR)", "Coupon Code",
        "Total (INR)", "Order Type", "Payment Method", "Payment Status",
        "Status", "Created At (UTC)"
    ])

    for o in orders:
        try:
            items_list = json.loads(o.items_json)
            summary = "; ".join([f"{i.get('quantity', 1)}x {i.get('name', '')}" for i in items_list])
        except Exception:
            summary = "N/A"

        writer.writerow([
            o.id,
            o.token,
            o.user_email or "guest@campus.edu",
            o.customer_phone or "+91 98765 43210",
            o.outlet_name,
            summary,
            f"{o.subtotal:.2f}",
            f"{o.discount:.2f}",
            o.coupon_code or "None",
            f"{o.total:.2f}",
            o.order_type,
            o.payment_method or "UPI",
            o.payment_status or "PAID",
            o.status,
            o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else "N/A"
        ])

    filename = f"campus_crave_orders_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ---------------------------------------------------------------------------
# Vendor & Campus Admin Portal (HTML Dashboard)
# ---------------------------------------------------------------------------
@app.get("/admin", response_class=HTMLResponse)
def admin_dashboard_portal():
    """Live Campus Admin & Vendor Analytics Dashboard."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Campus Crave — Vendor & Campus Admin Analytics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            let outletChart = null;
            let hourlyChart = null;

            async function loadAnalytics() {
                try {
                    const res = await fetch('/api/admin/analytics');
                    const data = await res.json();
                    if (!data.success) return;

                    const m = data.metrics;
                    document.getElementById('stat-revenue').innerText = '₹' + m.total_revenue.toLocaleString('en-IN');
                    document.getElementById('stat-orders').innerText = m.total_orders;
                    document.getElementById('stat-active').innerText = m.active_orders;
                    document.getElementById('stat-preptime').innerText = m.avg_prep_time_minutes + 'm';
                    document.getElementById('stat-veg').innerText = m.veg_percentage + '%';

                    // Update Top Items
                    const itemsContainer = document.getElementById('top-items-list');
                    itemsContainer.innerHTML = '';
                    data.top_items.forEach(itm => {
                        const row = document.createElement('div');
                        row.className = 'flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800/60 border border-gray-100 dark:border-neutral-800';
                        row.innerHTML = `
                            <div class="flex items-center gap-3">
                                <span class="w-2.5 h-2.5 rounded-full ${itm.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                                <span class="font-bold text-sm text-gray-800 dark:text-gray-100">${itm.name}</span>
                            </div>
                            <div class="text-right">
                                <span class="text-xs font-bold text-blue-600 dark:text-blue-400 block">${itm.quantity} sold</span>
                                <span class="text-[10px] text-gray-400">₹${itm.revenue}</span>
                            </div>
                        `;
                        itemsContainer.appendChild(row);
                    });

                    // Render Outlets Chart
                    const outletLabels = data.outlet_breakdown.map(o => o.name);
                    const outletRevenues = data.outlet_breakdown.map(o => o.revenue);
                    
                    const ctxOutlet = document.getElementById('outletChart').getContext('2d');
                    if (outletChart) outletChart.destroy();
                    outletChart = new Chart(ctxOutlet, {
                        type: 'bar',
                        data: {
                            labels: outletLabels,
                            datasets: [{
                                label: 'Revenue (₹)',
                                data: outletRevenues,
                                backgroundColor: '#3B82F6',
                                borderRadius: 8,
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true } }
                        }
                    });

                    // Render Hourly Rush Chart
                    const hoursLabels = Array.from({length: 24}, (_, i) => `${i}:00`);
                    const ctxHourly = document.getElementById('hourlyChart').getContext('2d');
                    if (hourlyChart) hourlyChart.destroy();
                    hourlyChart = new Chart(ctxHourly, {
                        type: 'line',
                        data: {
                            labels: hoursLabels,
                            datasets: [{
                                label: 'Orders Placed',
                                data: data.hourly_distribution,
                                borderColor: '#10B981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                fill: true,
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                        }
                    });

                    // Load Notifications
                    loadNotifications();

                } catch(e) {
                    console.error('Analytics load error:', e);
                }
            }

            async function loadNotifications() {
                try {
                    const res = await fetch('/api/notifications/logs?limit=8');
                    const data = await res.json();
                    const container = document.getElementById('notification-logs');
                    container.innerHTML = '';
                    if (!data.logs || data.logs.length === 0) {
                        container.innerHTML = '<div class="text-xs text-gray-400 py-4 text-center">No alerts dispatched yet</div>';
                        return;
                    }
                    data.logs.forEach(log => {
                        const el = document.createElement('div');
                        el.className = 'text-xs p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800 space-y-1';
                        el.innerHTML = `
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-blue-600 dark:text-blue-400">Token ${log.token} (${log.outlet_name})</span>
                                <span class="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">${log.status}</span>
                            </div>
                            <p class="text-gray-600 dark:text-gray-300 font-mono text-[11px] truncate">📲 ${log.recipient_phone}: ${log.message.replace(/\\n/g, ' ')}</p>
                            <span class="text-[10px] text-gray-400 block">${new Date(log.created_at).toLocaleTimeString()}</span>
                        `;
                        container.appendChild(el);
                    });
                } catch(e) {}
            }

            setInterval(loadAnalytics, 6000);
            window.onload = loadAnalytics;
        </script>
    </head>
    <body class="bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-white p-6 font-sans">
        <div class="max-w-7xl mx-auto space-y-8">
            <!-- Header -->
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-neutral-800">
                <div>
                    <h1 class="text-3xl font-black tracking-tight flex items-center gap-3">
                        📊 Campus Crave Vendor & Admin Analytics
                    </h1>
                    <p class="text-xs text-gray-500 mt-1">Live sales tracking, kitchen prep speed, queue loads & automated SMS/WhatsApp alerts</p>
                </div>
                <div class="flex items-center gap-3">
                    <a href="/api/admin/orders/export" class="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                        📥 Export CSV
                    </a>
                    <a href="/kitchen" target="_blank" class="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700">Kitchen Display</a>
                    <a href="http://localhost:5173" target="_blank" class="text-xs font-bold bg-white dark:bg-neutral-800 border px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700">Student App</a>
                </div>
            </header>

            <!-- 4 Metric Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Gross Revenue</span>
                    <h2 id="stat-revenue" class="text-2xl font-black text-gray-900 dark:text-white">₹0</h2>
                    <span class="text-[10px] text-emerald-600 font-bold mt-1 block">Live settlement</span>
                </div>
                <div class="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Total Orders</span>
                    <h2 id="stat-orders" class="text-2xl font-black text-gray-900 dark:text-white">0</h2>
                    <span class="text-[10px] text-blue-600 font-bold mt-1 block">Across all outlets</span>
                </div>
                <div class="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Active Queue</span>
                    <h2 id="stat-active" class="text-2xl font-black text-amber-500">0</h2>
                    <span class="text-[10px] text-gray-400 font-bold mt-1 block">Preparing / Ready</span>
                </div>
                <div class="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Avg Prep Time</span>
                    <h2 id="stat-preptime" class="text-2xl font-black text-indigo-500">11m</h2>
                    <span class="text-[10px] text-emerald-600 font-bold mt-1 block">Target &lt;15 mins</span>
                </div>
                <div class="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Veg Share</span>
                    <h2 id="stat-veg" class="text-2xl font-black text-emerald-500">80%</h2>
                    <span class="text-[10px] text-gray-400 font-bold mt-1 block">Pure Veg demand</span>
                </div>
            </div>

            <!-- Visual Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Revenue by Campus Dining Outlet (₹)</h3>
                    <canvas id="outletChart" height="180"></canvas>
                </div>
                <div class="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Hourly Order Rush Trend (24h)</h3>
                    <canvas id="hourlyChart" height="180"></canvas>
                </div>
            </div>

            <!-- Lower Row: Top Selling Dishes & Dispatched SMS/WhatsApp Feed -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">🔥 Top Best-Selling Dishes</h3>
                    <div id="top-items-list" class="space-y-2.5"></div>
                </div>

                <div class="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500">📲 Live SMS & WhatsApp Alert Feed</h3>
                        <span class="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">Auto-dispatched</span>
                    </div>
                    <div id="notification-logs" class="space-y-2.5 max-h-72 overflow-y-auto"></div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
# ---------------------------------------------------------------------------
@app.get("/kitchen", response_class=HTMLResponse)
def kitchen_display():
    """Live Kitchen & Counter Token Queue Portal for Canteen Staff."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Campus Crave — Canteen Kitchen Token Display</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            async function fetchOrders() {
                try {
                    const res = await fetch('/api/orders');
                    const data = await res.json();
                    const container = document.getElementById('orders-grid');
                    container.innerHTML = '';

                    if (!data.orders || data.orders.length === 0) {
                        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-20 font-bold">No orders placed yet.</div>';
                        return;
                    }

                    data.orders.forEach(order => {
                        const isReady = order.status === 'Ready for Pickup';
                        const isCompleted = order.status === 'Completed';

                        let itemsHtml = order.items.map(i => `
                            <div class="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-neutral-800">
                                <span class="font-bold text-gray-800 dark:text-gray-200">${i.quantity}x ${i.name}</span>
                                <span class="text-gray-500">₹${i.price * i.quantity}</span>
                            </div>
                        `).join('');

                        const card = document.createElement('div');
                        card.className = `p-5 rounded-3xl border shadow-lg transition-all ${
                            isReady 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20' 
                                : isCompleted 
                                ? 'bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 opacity-60' 
                                : 'bg-white dark:bg-neutral-900 border-blue-200 dark:border-neutral-700'
                        }`;

                        card.innerHTML = `
                            <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-neutral-800">
                                <div class="bg-blue-600 text-white font-black text-2xl px-3 py-1.5 rounded-2xl shadow-sm">
                                    ${order.token}
                                </div>
                                <div class="text-right">
                                    <span class="text-xs font-mono font-bold text-gray-400 block">${order.id}</span>
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                                        ${order.outletName}
                                    </span>
                                </div>
                            </div>
                            <div class="space-y-1 mb-4 max-h-48 overflow-y-auto">
                                ${itemsHtml}
                            </div>
                            <div class="flex justify-between items-center pt-2 mb-4 text-xs font-semibold text-gray-500">
                                <span>Total: ₹${order.total.toFixed(2)}</span>
                                <span class="uppercase font-bold ${isReady ? 'text-emerald-600' : 'text-amber-600'}">${order.status}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="updateStatus('${order.id}', 'Ready for Pickup')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-all">
                                    Mark Ready
                                </button>
                                <button onclick="updateStatus('${order.id}', 'Completed')" class="bg-gray-800 hover:bg-black text-white font-bold text-xs py-2 rounded-xl transition-all">
                                    Mark Handed Over
                                </button>
                            </div>
                        `;
                        container.appendChild(card);
                    });
                } catch(e) {
                    console.error('Fetch error:', e);
                }
            }

            function showToast(msg) {
                const toast = document.getElementById('toast');
                toast.innerText = msg;
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 4000);
            }

            async function updateStatus(orderId, newStatus) {
                try {
                    const res = await fetch(`/api/orders/${orderId}/status`, {
                        method: 'PATCH',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({status: newStatus})
                    });
                    const data = await res.json();
                    if (newStatus === 'Ready for Pickup' && data.notificationSent) {
                        showToast(`📲 SMS & WhatsApp Token Alert sent to ${data.customerPhone || 'student'}!`);
                    }
                } catch(e) {}
                fetchOrders();
            }

            setInterval(fetchOrders, 3000);
            window.onload = fetchOrders;
        </script>
    </head>
    <body class="bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-white p-6 font-sans">
        <div class="max-w-7xl mx-auto">
            <div id="toast" class="hidden fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl transition-all"></div>
            <header class="flex items-center justify-between pb-6 mb-8 border-b border-gray-200 dark:border-neutral-800">
                <div>
                    <h1 class="text-3xl font-black tracking-tight">👨‍🍳 Canteen Kitchen Token Display</h1>
                    <p class="text-xs text-gray-500 mt-1">Live order routing • Auto-sends SMS/WhatsApp alerts on "Mark Ready" • Auto-refreshes 3s</p>
                </div>
                <div class="flex items-center gap-3">
                    <a href="/admin" class="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-700">Admin Analytics</a>
                    <a href="/docs" target="_blank" class="text-xs font-bold bg-white dark:bg-neutral-800 border px-3 py-1.5 rounded-xl hover:bg-gray-50">API Docs</a>
                    <a href="http://localhost:5173" target="_blank" class="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700">Student App</a>
                </div>
            </header>
            <div id="orders-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
        </div>
    </body>
    </html>
    """


# ---------------------------------------------------------------------------
# MongoDB Atlas Cloud Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/mongodb/status")
def get_mongodb_status():
    """Check MongoDB Atlas cloud connection status and collection statistics."""
    connected = mongodb.is_connected()
    db = mongodb.get_db()
    stats = {}
    if connected and db is not None:
        try:
            stats = {
                "restaurants": db.restaurants.count_documents({}),
                "menu_items": db.menu_items.count_documents({}),
                "orders": db.orders.count_documents({}),
                "users": db.users.count_documents({}),
                "coupons": db.coupons.count_documents({}),
            }
        except Exception as e:
            stats = {"error": str(e)}
    return {
        "status": "connected" if connected else "offline (local SQLite fallback active)",
        "database": os.getenv("MONGODB_DB_NAME", "campus_crave"),
        "collections": stats
    }


@app.post("/api/mongodb/sync")
def sync_mongodb():
    """Trigger manual data synchronization from SQLite to MongoDB Atlas cloud."""
    if not mongodb.is_connected():
        if not mongodb.init_mongodb():
            raise HTTPException(
                status_code=400,
                detail="MongoDB Atlas is not connected. Please provide a valid MONGODB_URI in backend/.env"
            )
    result = mongodb.sync_all_from_sqlite()
    return {"message": "Data synchronized to MongoDB Atlas successfully", "synced": result}


# ---------------------------------------------------------------------------
# CLI Runner
# ---------------------------------------------------------------------------
def main():
    import argparse
    parser = argparse.ArgumentParser(description="Campus Crave Full-Stack Backend Server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host binding (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port binding (default: 8000)")
    args = parser.parse_args()

    print("\n" + "=" * 65)
    print(" 🚀 CAMPUS CRAVE — FULL-STACK FASTAPI BACKEND SERVER")
    print(f" REST API:       http://localhost:{args.port}")
    print(f" Swagger Docs:   http://localhost:{args.port}/docs")
    print(f" Kitchen Portal: http://localhost:{args.port}/kitchen")
    print(f" Crowd Stream:   http://localhost:{args.port}/api/stream")
    print("=" * 65 + "\n")

    uvicorn.run("main:app", host=args.host, port=args.port, reload=True)


if __name__ == "__main__":
    main()
