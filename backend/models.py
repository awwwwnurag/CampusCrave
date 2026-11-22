"""
Campus Crave — SQLAlchemy Database Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), default="+91 98765 43210")
    hostel_block = Column(String(100), default="Hostel Block 1 (Boys)")
    room_number = Column(String(50), default="Room 204")
    avatar = Column(String(255), nullable=True)
    role = Column(String(20), default="student")  # 'student', 'canteen_staff', 'admin'
    auth_provider = Column(String(50), default="email")  # 'email', 'google'
    wallet_balance = Column(Float, default=500.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "dice-n-sip"
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    max_capacity = Column(Integer, default=50)
    occupancy = Column(Integer, default=0)
    is_open = Column(Boolean, default=True)
    opening_time = Column(String(20), default="08:00 AM")
    closing_time = Column(String(20), default="10:00 PM")

    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(String(50), ForeignKey("restaurants.id"), nullable=False)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    rating = Column(Float, default=4.5)
    image = Column(String(255), nullable=True)
    category = Column(String(50), default="Popular")
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)

    restaurant = relationship("Restaurant", back_populates="menu_items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(20), primary_key=True, index=True)      # e.g. "CC-8429"
    token = Column(String(10), index=True, nullable=False)     # e.g. "TK-48"
    user_email = Column(String(120), nullable=True, index=True)
    customer_phone = Column(String(20), default="+91 98765 43210")
    outlet_id = Column(String(50), nullable=False)
    outlet_name = Column(String(100), nullable=False)
    items_json = Column(Text, nullable=False)                  # JSON string of cart items
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    coupon_code = Column(String(30), nullable=True)
    delivery_fee = Column(Float, default=0.0)
    taxes = Column(Float, default=0.0)
    platform_fee = Column(Float, default=5.0)
    tip = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    order_type = Column(String(20), default="pickup")          # 'pickup' or 'delivery'
    delivery_address = Column(String(255), nullable=True)
    status = Column(String(30), default="Received")            # 'Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'
    payment_status = Column(String(20), default="PAID")        # 'PENDING', 'PAID', 'REFUNDED'
    payment_method = Column(String(30), default="UPI")         # 'UPI', 'CAMPUS_WALLET', 'CARD', 'CASH_ON_PICKUP'
    payment_id = Column(String(100), nullable=True)            # e.g. "pay_campus_98412"
    created_at = Column(DateTime, default=datetime.utcnow)
    ready_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_ready_time = Column(String(50), default="~12-15 mins")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(50), primary_key=True)                  # e.g. "TXN_CC_98241"
    order_id = Column(String(20), ForeignKey("orders.id"), nullable=True)
    user_email = Column(String(120), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(20), default="SUCCESS")             # 'PENDING', 'SUCCESS', 'FAILED'
    payment_method = Column(String(30), default="UPI")         # 'UPI', 'CAMPUS_WALLET', 'CARD', 'CASH'
    gateway_order_id = Column(String(100), nullable=True)
    gateway_payment_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(20), index=True, nullable=False)
    token = Column(String(10), nullable=False)
    channel = Column(String(30), default="SMS_WHATSAPP")      # 'SMS', 'WHATSAPP', 'WEBHOOK'
    recipient_phone = Column(String(20), nullable=False)
    recipient_email = Column(String(120), nullable=True)
    outlet_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="DELIVERED")          # 'SENT', 'DELIVERED', 'FAILED'
    created_at = Column(DateTime, default=datetime.utcnow)


class Coupon(Base):
    __tablename__ = "coupons"

    code = Column(String(30), primary_key=True, index=True)    # e.g. "CAMPUS50"
    discount = Column(Float, nullable=False)
    coupon_type = Column(String(20), default="flat")           # 'flat', 'delivery', 'percentage'
    min_order = Column(Float, default=0.0)
    description = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
