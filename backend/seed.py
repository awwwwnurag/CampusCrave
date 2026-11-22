"""
Campus Crave — Database Seeding Script
Initializes SQLite with all 10 campus dining outlets, menus, coupons, and demo user.
"""

import json
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User, Restaurant, MenuItem, Order, Coupon


def hash_password(password: str) -> str:
    """Simple SHA-256 password hash for SQLite authentication."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


SEED_RESTAURANTS = [
    {
        "id": "dice-n-sip",
        "name": "Dice n Sip",
        "description": "Indian cuisine with a modern twist, perfect for board game sessions and student catch-ups.",
        "image": "/cafes/Dice n Sip - 1.jpg",
        "max_capacity": 50,
        "occupancy": 3,
        "opening_time": "10:00 AM",
        "closing_time": "11:00 PM",
        "menu": [
            {
                "name": "Kadhaai Paneer",
                "description": "Cottage cheese cubes in rich spiced tomato gravy with bell peppers",
                "price": 180.0,
                "rating": 4.6,
                "image": "https://cdn.zeptonow.com/production///tr:w-600,ar-100-100,pr-true,f-auto,q-80/web/recipes/kadai-paneer.png",
                "category": "Main Course",
                "is_veg": True
            },
            {
                "name": "Chilly Potato",
                "description": "Crispy fried potato fingers tossed in spicy sweet chili garlic sauce",
                "price": 120.0,
                "rating": 4.8,
                "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1mVAju22bnIsBceoWZ8FeoWcLq0d_mVnTCA&s",
                "category": "Quick Bites",
                "is_veg": True
            },
            {
                "name": "Aloo Tikki Chaat",
                "description": "Crispy spiced potato patties with beaten curd, mint, and sweet tamarind chutney",
                "price": 80.0,
                "rating": 4.4,
                "image": "https://www.honeywhatscooking.com/wp-content/uploads/2020/10/Aloo-Tikki-Chaat61.jpg",
                "category": "Chaat",
                "is_veg": True
            },
            {
                "name": "Butter Naan",
                "description": "Traditional tandoor oven flatbread brushed with fresh creamy butter",
                "price": 40.0,
                "rating": 4.7,
                "image": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=300",
                "category": "Breads",
                "is_veg": True
            }
        ]
    },
    {
        "id": "georgia",
        "name": "Georgia",
        "description": "Beloved campus coffee hub, grilled sandwiches, and fast breakfast comfort food.",
        "image": "/cafes/Georgia.jpg",
        "max_capacity": 40,
        "occupancy": 7,
        "opening_time": "08:30 AM",
        "closing_time": "10:30 PM",
        "menu": [
            {
                "name": "Georgia Cold Coffee",
                "description": "Thick chilled espresso blended with velvety vanilla ice cream",
                "price": 90.0,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300",
                "category": "Beverages",
                "is_veg": True
            },
            {
                "name": "Grilled Cheese Sandwich",
                "description": "Golden toasted triple cheese bread loaded with herbs and sweet corn",
                "price": 110.0,
                "rating": 4.6,
                "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300",
                "category": "Sandwiches",
                "is_veg": True
            },
            {
                "name": "Chicken Club Sandwich",
                "description": "Juicy grilled shredded chicken, fried egg, lettuce, and secret house spread",
                "price": 140.0,
                "rating": 4.7,
                "image": "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=300",
                "category": "Sandwiches",
                "is_veg": False
            },
            {
                "name": "Hot Chocolate",
                "description": "Silky dark chocolate drink topped with mini marshmallows",
                "price": 85.0,
                "rating": 4.5,
                "image": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&q=80&w=300",
                "category": "Beverages",
                "is_veg": True
            }
        ]
    },
    {
        "id": "basil",
        "name": "Basil",
        "description": "Italian pizzas, creamy pastas, and European artisan bites right next to library.",
        "image": "/cafes/Basil.jpg",
        "max_capacity": 30,
        "occupancy": 4,
        "opening_time": "11:00 AM",
        "closing_time": "11:00 PM",
        "menu": [
            {
                "name": "Margherita Pizza",
                "description": "Classic Neapolitan crust with san marzano tomato base and buffalo mozzarella",
                "price": 190.0,
                "rating": 4.7,
                "image": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300",
                "category": "Pizzas",
                "is_veg": True
            },
            {
                "name": "Penne Alfredo Pasta",
                "description": "Al dente penne in velvety garlic parmesan sauce with sautéed mushrooms",
                "price": 160.0,
                "rating": 4.5,
                "image": "https://images.unsplash.com/photo-1621996346565-e3d5d6281729?auto=format&fit=crop&q=80&w=300",
                "category": "Pastas",
                "is_veg": True
            },
            {
                "name": "Garlic Bread with Cheese",
                "description": "Fresh baguette toasted with roasted garlic butter and molten cheddar",
                "price": 100.0,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=300",
                "category": "Sides",
                "is_veg": True
            }
        ]
    },
    {
        "id": "subway",
        "name": "Subway",
        "description": "Freshly baked subs, healthy salad bowls, and cookies made to order.",
        "image": "/cafes/Subway - 1.jpg",
        "max_capacity": 45,
        "occupancy": 12,
        "opening_time": "09:00 AM",
        "closing_time": "11:00 PM",
        "menu": [
            {
                "name": "Paneer Tikka Sub",
                "description": "Marinated paneer cubes, crisp vegetables, and southwest chipotle sauce",
                "price": 180.0,
                "rating": 4.6,
                "image": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=300",
                "category": "Subs",
                "is_veg": True
            },
            {
                "name": "Roasted Chicken Sub",
                "description": "Tender seasoned chicken slices with your choice of greens and sweet onion sauce",
                "price": 210.0,
                "rating": 4.7,
                "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=300",
                "category": "Subs",
                "is_veg": False
            },
            {
                "name": "Double Choc Cookie",
                "description": "Chewy warm chocolate cookie packed with melted chocolate chips",
                "price": 50.0,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300",
                "category": "Desserts",
                "is_veg": True
            }
        ]
    },
    {
        "id": "uncles",
        "name": "Uncle's Cafe",
        "description": "Late-night maggie, steaming momos, stuffed parathas, and hot cutting chai.",
        "image": "/cafes/Uncles.jpg",
        "max_capacity": 50,
        "occupancy": 8,
        "opening_time": "08:00 AM",
        "closing_time": "02:00 AM",
        "menu": [
            {
                "name": "Butter Cheese Maggi",
                "description": "Double noodles tossed with sweet corn, spices, and a mountain of cheese",
                "price": 70.0,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=300",
                "category": "Maggi",
                "is_veg": True
            },
            {
                "name": "Steamed Veg Momos (8 Pcs)",
                "description": "Thin wrapper dumplings stuffed with cabbage, onions, and red spicy chutney",
                "price": 80.0,
                "rating": 4.6,
                "image": "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&q=80&w=300",
                "category": "Momos",
                "is_veg": True
            },
            {
                "name": "Chicken Fried Momos (8 Pcs)",
                "description": "Crispy golden fried chicken dumplings served with spicy garlic dip",
                "price": 110.0,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&q=80&w=300",
                "category": "Momos",
                "is_veg": False
            },
            {
                "name": "Adrak Cutting Chai",
                "description": "Fresh brewed ginger cardamom tea sweetened just right",
                "price": 20.0,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300",
                "category": "Chai",
                "is_veg": True
            }
        ]
    },
    {
        "id": "food-court",
        "name": "Food Court",
        "description": "Multi-cuisine giant dining hall serving authentic South Indian dosas and meals.",
        "image": "/cafes/Food Court- 1.jpg",
        "max_capacity": 120,
        "occupancy": 15,
        "opening_time": "07:30 AM",
        "closing_time": "10:30 PM",
        "menu": [
            {
                "name": "Masala Dosa",
                "description": "Crispy golden fermented crepe filled with fragrant potato curry & chutneys",
                "price": 100.0,
                "rating": 4.7,
                "image": "/food/masala-dosa.jpg",
                "category": "South Indian",
                "is_veg": True
            },
            {
                "name": "Idli Sambar (2 Pcs)",
                "description": "Fluffy steamed rice and lentil cakes served with piping hot dal sambar",
                "price": 80.0,
                "rating": 4.5,
                "image": "/food/idli.jpg",
                "category": "South Indian",
                "is_veg": True
            },
            {
                "name": "Medu Vada (2 Pcs)",
                "description": "Deep fried crispy lentil donuts with coconut and tomato chutneys",
                "price": 80.0,
                "rating": 4.6,
                "image": "/food/vada.jpg",
                "category": "South Indian",
                "is_veg": True
            }
        ]
    },
    {
        "id": "nescafe",
        "name": "Nescafe",
        "description": "Quick kiosk for hot coffee, iced frappes, iced tea, and packaged snacks.",
        "image": "/cafes/Georgia.jpg",
        "max_capacity": 40,
        "occupancy": 5,
        "opening_time": "08:00 AM",
        "closing_time": "11:30 PM",
        "menu": [
            {
                "name": "Nescafe Frappe",
                "description": "Frothy classic iced cold coffee with chocolate drizzle",
                "price": 60.0,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300",
                "category": "Coffee",
                "is_veg": True
            },
            {
                "name": "Veg Puff",
                "description": "Flaky golden pastry filled with spiced diced vegetables and potatoes",
                "price": 30.0,
                "rating": 4.3,
                "image": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=300",
                "category": "Bakery",
                "is_veg": True
            }
        ]
    },
    {
        "id": "ccd",
        "name": "CCD (Cafe Coffee Day)",
        "description": "Premium coffees, signature cappuccinos, croissants, and chocolate sundaes.",
        "image": "/cafes/Dice n Sip - 1.jpg",
        "max_capacity": 50,
        "occupancy": 6,
        "opening_time": "09:00 AM",
        "closing_time": "11:00 PM",
        "menu": [
            {
                "name": "Cafe Frappe",
                "description": "Signature CCD rich coffee blend whipped with ice cream",
                "price": 130.0,
                "rating": 4.7,
                "image": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=300",
                "category": "Coffee",
                "is_veg": True
            },
            {
                "name": "Sizzling Brownie Sundae",
                "description": "Gooey chocolate walnut brownie with vanilla ice cream and hot fudge",
                "price": 160.0,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300",
                "category": "Desserts",
                "is_veg": True
            }
        ]
    },
    {
        "id": "happiness-store",
        "name": "Happiness Store",
        "description": "Campus convenience confectionery, fresh dairy, smoothies, and quick pastries.",
        "image": "/cafes/Basil.jpg",
        "max_capacity": 35,
        "occupancy": 2,
        "opening_time": "09:00 AM",
        "closing_time": "10:00 PM",
        "menu": [
            {
                "name": "Mango Lassi Smoothie",
                "description": "Sweet Alphonso mango pulp blended with rich fresh yogurt",
                "price": 60.0,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300",
                "category": "Smoothies",
                "is_veg": True
            }
        ]
    },
    {
        "id": "ahaar-cafe",
        "name": "Ahaar Cafe",
        "description": "Homestyle Thalis, Rajma Chawal, Kadi Pakoda, and daily comforting student meals.",
        "image": "/cafes/Food Court- 1.jpg",
        "max_capacity": 40,
        "occupancy": 9,
        "opening_time": "11:30 AM",
        "closing_time": "09:30 PM",
        "menu": [
            {
                "name": "Special Punjabi Thali",
                "description": "Paneer sabzi, Dal Makhani, 3 rotis, Jeera rice, Raita, and Gulab Jamun",
                "price": 150.0,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=300",
                "category": "Thalis",
                "is_veg": True
            }
        ]
    }
]

SEED_COUPONS = [
    {
        "code": "CAMPUS50",
        "discount": 50.0,
        "coupon_type": "flat",
        "min_order": 100.0,
        "description": "Flat ₹50 off on campus meals above ₹100",
        "is_active": True
    },
    {
        "code": "FIRSTBITE",
        "discount": 30.0,
        "coupon_type": "flat",
        "min_order": 80.0,
        "description": "Flat ₹30 off on your order above ₹80",
        "is_active": True
    },
    {
        "code": "FREESHIP",
        "discount": 25.0,
        "coupon_type": "delivery",
        "min_order": 50.0,
        "description": "Free hostel delivery (saves ₹25)",
        "is_active": True
    },
    {
        "code": "CRAVE20",
        "discount": 40.0,
        "coupon_type": "flat",
        "min_order": 150.0,
        "description": "Save ₹40 on orders above ₹150",
        "is_active": True
    }
]


def seed_database(db: Session):
    """Populates initial database if tables are empty."""
    # 1. Seed Restaurants & Menus
    if db.query(Restaurant).count() == 0:
        print("[SEED] Seeding 10 campus dining outlets and menu items...")
        for r_data in SEED_RESTAURANTS:
            menu_data = r_data.pop("menu", [])
            rest = Restaurant(**r_data)
            db.add(rest)
            db.flush()

            for item_data in menu_data:
                item = MenuItem(restaurant_id=rest.id, **item_data)
                db.add(item)
        db.commit()

    # 2. Seed Coupons
    if db.query(Coupon).count() == 0:
        print("[SEED] Seeding active campus coupons...")
        for c_data in SEED_COUPONS:
            db.add(Coupon(**c_data))
        db.commit()

    # 3. Seed Default Demo Student User
    demo_email = "alex.sharma@campus.edu"
    if db.query(User).filter(User.email == demo_email).count() == 0:
        print(f"[SEED] Creating default verified student user: {demo_email}...")
        user = User(
            name="Alex Sharma",
            email=demo_email,
            password_hash=hash_password("campus123"),
            hostel_block="Hostel Block 1 (Boys)",
            room_number="Room 204",
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
            role="student"
        )
        db.add(user)
        db.commit()

    # 4. Seed Initial Sample Orders
    if db.query(Order).count() == 0:
        print("[SEED] Seeding sample orders for kitchen queue & token tracker...")
        sample_order_1 = Order(
            id="CC-3194",
            token="TK-28",
            user_email=demo_email,
            outlet_id="dice-n-sip",
            outlet_name="Dice n Sip",
            items_json=json.dumps([
                {"name": "Kadhaai Paneer", "price": 180, "quantity": 1, "is_veg": True},
                {"name": "Chilly Potato", "price": 120, "quantity": 1, "is_veg": True}
            ]),
            subtotal=300.0,
            discount=50.0,
            coupon_code="CAMPUS50",
            delivery_fee=0.0,
            taxes=15.0,
            platform_fee=5.0,
            tip=20.0,
            total=290.0,
            order_type="pickup",
            delivery_address="Canteen Counter (Token Pickup)",
            status="Ready for Pickup",
            created_at=datetime.utcnow() - timedelta(minutes=15),
            estimated_ready_time="Ready at Counter"
        )
        sample_order_2 = Order(
            id="CC-2108",
            token="TK-14",
            user_email=demo_email,
            outlet_id="georgia",
            outlet_name="Georgia",
            items_json=json.dumps([
                {"name": "Georgia Cold Coffee", "price": 90, "quantity": 2, "is_veg": True}
            ]),
            subtotal=180.0,
            discount=0.0,
            coupon_code=None,
            delivery_fee=25.0,
            taxes=9.0,
            platform_fee=5.0,
            tip=0.0,
            total=219.0,
            order_type="delivery",
            delivery_address="Hostel Block 3, Room 402",
            status="Completed",
            created_at=datetime.utcnow() - timedelta(days=2),
            estimated_ready_time="Delivered"
        )
        db.add(sample_order_1)
        db.add(sample_order_2)
        db.commit()

    print("[SEED] Database initialized and verified successfully!")
