"""
Campus Crave — Pydantic Validation Schemas
"""

from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# User Schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    hostel_block: Optional[str] = "Hostel Block 1 (Boys)"
    room_number: Optional[str] = "Room 204"


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    avatar: Optional[str] = None
    google_id: Optional[str] = None
    credential: Optional[str] = None
    hostel_block: Optional[str] = "Hostel Block 1 (Boys)"
    room_number: Optional[str] = "Room 204"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    hostel_block: Optional[str] = None
    room_number: Optional[str] = None
    avatar: Optional[str] = None
    role: str = "student"
    created_at: Optional[datetime] = None
    auth_provider: Optional[str] = "email"

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    hostel_block: Optional[str] = None
    room_number: Optional[str] = None
    avatar: Optional[str] = None


# ---------------------------------------------------------------------------
# Menu & Restaurant Schemas
# ---------------------------------------------------------------------------
class MenuItemOut(BaseModel):
    id: int
    restaurant_id: str
    name: str
    description: Optional[str] = None
    price: float
    rating: float = 4.5
    image: Optional[str] = None
    category: str = "Popular"
    is_veg: bool = True
    is_available: bool = True

    class Config:
        from_attributes = True


class RestaurantOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    max_capacity: int = 50
    occupancy: int = 0
    status: str = "Quiet"
    density_level: str = "Low"
    density_range: str = "LOW (1-5)"
    is_open: bool = True
    opening_time: str = "08:00 AM"
    closing_time: str = "10:00 PM"

    class Config:
        from_attributes = True


class RestaurantDetailOut(RestaurantOut):
    menu: List[MenuItemOut] = []


# ---------------------------------------------------------------------------
# Order Schemas
# ---------------------------------------------------------------------------
class OrderItemSchema(BaseModel):
    id: Optional[str] = None
    name: str
    price: float
    quantity: int = 1
    image: Optional[str] = None
    is_veg: Optional[bool] = True


class OrderCreate(BaseModel):
    id: Optional[str] = None
    token: Optional[str] = None
    outlet_id: Optional[str] = "campus-crave"
    outlet_name: Optional[str] = "Campus Cafe"
    user_email: Optional[str] = None
    customer_phone: Optional[str] = "+91 98765 43210"
    items: List[OrderItemSchema]
    subtotal: float
    discount: Optional[float] = 0.0
    coupon_code: Optional[str] = None
    delivery_fee: Optional[float] = 0.0
    taxes: Optional[float] = 0.0
    platform_fee: Optional[float] = 5.0
    tip: Optional[float] = 0.0
    total: float
    order_type: Optional[str] = "pickup"
    delivery_address: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    payment_status: Optional[str] = "PAID"
    payment_id: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # 'Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'


class PaymentCreateRequest(BaseModel):
    amount: float
    currency: Optional[str] = "INR"
    order_id: Optional[str] = None
    customer_email: Optional[str] = "alex.sharma@campus.edu"
    customer_phone: Optional[str] = "+91 98765 43210"
    payment_method: Optional[str] = "UPI"


class PaymentVerifyRequest(BaseModel):
    transaction_id: str
    payment_id: str
    signature: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    order_id: Optional[str] = None


class RazorpayOrderRequest(BaseModel):
    amount: float
    currency: Optional[str] = "INR"
    receipt: Optional[str] = None
    order_id: Optional[str] = None
    customer_email: Optional[str] = None


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    transaction_id: Optional[str] = None
    order_id: Optional[str] = None
    amount: Optional[float] = None
    customer_email: Optional[str] = None


class NotificationSendRequest(BaseModel):
    order_id: str
    channel: Optional[str] = "SMS_WHATSAPP"
    custom_message: Optional[str] = None


class WebhookConfigRequest(BaseModel):
    webhook_url: str
    secret_key: Optional[str] = None
    enabled: Optional[bool] = True


class OrderOut(BaseModel):
    id: str
    token: str
    user_email: Optional[str] = None
    outlet_id: str
    outlet_name: str
    items: List[Any] = []
    subtotal: float
    discount: float = 0.0
    coupon_code: Optional[str] = None
    delivery_fee: float = 0.0
    taxes: float = 0.0
    platform_fee: float = 5.0
    tip: float = 0.0
    total: float
    order_type: str = "pickup"
    delivery_address: Optional[str] = None
    status: str
    created_at: datetime
    estimated_ready_time: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Coupon Schemas
# ---------------------------------------------------------------------------
class CouponOut(BaseModel):
    code: str
    discount: float
    coupon_type: str
    min_order: float
    description: str
    is_active: bool

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float
    order_type: Optional[str] = "pickup"


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount: float
    message: str
