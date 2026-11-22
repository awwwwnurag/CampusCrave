"""
Campus Crave - Database Engine, Session & Density Utilities
"""

import os
from typing import Dict, Any, Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# SQLite Database Location
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "campus_crave.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def migrate_db():
    """Safely migrate SQLite database schema without data loss."""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            # Check orders table columns
            res = conn.execute(text("PRAGMA table_info(orders)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "payment_status" not in cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PAID'"))
                if "payment_method" not in cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(30) DEFAULT 'UPI'"))
                if "payment_id" not in cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100)"))
                if "customer_phone" not in cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20) DEFAULT '+91 98765 43210'"))
                if "completed_at" not in cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN completed_at DATETIME"))
                if "ready_at" not in cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN ready_at DATETIME"))

            # Check users table columns
            res = conn.execute(text("PRAGMA table_info(users)"))
            user_cols = [row[1] for row in res.fetchall()]
            if user_cols:
                if "phone" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT '+91 98765 43210'"))
                if "wallet_balance" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN wallet_balance FLOAT DEFAULT 500.0"))
                if "auth_provider" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email'"))

            conn.commit()
    except Exception as e:
        print(f"[DB MIGRATION NOTICE] {e}")


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Static Outlets reference for YOLOv8 Crowd Detection & backwards compatibility
OUTLETS_DATA: Dict[str, Dict[str, Any]] = {
    "dice-n-sip": {"name": "Dice n Sip", "max_capacity": 50, "occupancy": 0},
    "georgia": {"name": "Georgia", "max_capacity": 40, "occupancy": 0},
    "basil": {"name": "Basil", "max_capacity": 30, "occupancy": 0},
    "subway": {"name": "Subway", "max_capacity": 45, "occupancy": 0},
    "uncles": {"name": "Uncle's Cafe", "max_capacity": 50, "occupancy": 0},
    "happiness-store": {"name": "Happiness Store", "max_capacity": 35, "occupancy": 0},
    "nescafe": {"name": "Nescafe", "max_capacity": 40, "occupancy": 0},
    "ccd": {"name": "CCD", "max_capacity": 50, "occupancy": 0},
    "food-court": {"name": "Food Court", "max_capacity": 120, "occupancy": 0},
    "ahaar-cafe": {"name": "Ahaar Cafe", "max_capacity": 40, "occupancy": 0},
}


def get_density_status(occupancy: int) -> str:
    """
    Map occupancy headcount to status keyword:
    Low:    1 - 5 (and 0) -> Quiet
    Medium: 6 - 10        -> Moderate
    High:   > 10          -> Crowded
    """
    if occupancy <= 5:
        return "Quiet"
    elif occupancy <= 10:
        return "Moderate"
    else:
        return "Crowded"


def get_density_level(occupancy: int) -> str:
    """Returns human-readable density tier name: Low, Medium, or High."""
    if occupancy <= 5:
        return "Low"
    elif occupancy <= 10:
        return "Medium"
    else:
        return "High"


def get_density_range_label(occupancy: int) -> str:
    """Returns descriptive range badge text."""
    if occupancy <= 5:
        return "LOW (1-5)" if occupancy > 0 else "LOW (0-5)"
    elif occupancy <= 10:
        return "MEDIUM (6-10)"
    else:
        return "HIGH (>10)"
