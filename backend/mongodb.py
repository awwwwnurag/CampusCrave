"""
Campus Crave - MongoDB Atlas Cloud Integration Module
======================================================
Provides seamless connection to MongoDB Atlas cloud database with automatic
dual-sync from SQLite, collection initializers, and fail-safe offline fallback.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

try:
    from dotenv import load_dotenv
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        load_dotenv(env_file)
except ImportError:
    pass

logger = logging.getLogger("campus_crave.mongodb")

# Load environment variable
MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "campus_crave")

_mongo_client = None
_mongo_db = None
_is_connected = False


def init_mongodb(uri: Optional[str] = None) -> bool:
    """
    Initialize connection to MongoDB Atlas cluster.
    Returns True if connection and ping succeed, False otherwise.
    """
    global _mongo_client, _mongo_db, _is_connected, MODB_URI
    
    connection_uri = uri or os.getenv("MONGODB_URI") or MONGODB_URI
    if not connection_uri:
        logger.info("ℹ️ No MONGODB_URI provided. Running in local SQLite mode.")
        _is_connected = False
        return False
        
    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        
        logger.info(f"Connecting to MongoDB Atlas database '{MONGODB_DB_NAME}'...")
        _mongo_client = MongoClient(
            connection_uri,
            server_api=ServerApi('1'),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        
        # Ping database to verify authentication and connection
        _mongo_client.admin.command('ping')
        _mongo_db = _mongo_client[MONGODB_DB_NAME]
        _is_connected = True
        logger.info("✅ Successfully connected to MongoDB Atlas!")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Could not connect to MongoDB Atlas: {e}. Gracefully falling back to SQLite.")
        _is_connected = False
        return False


def get_db():
    """Return the active MongoDB database instance, or None if offline."""
    global _mongo_db, _is_connected
    if not _is_connected:
        init_mongodb()
    return _mongo_db if _is_connected else None


def is_connected() -> bool:
    """Check if MongoDB Atlas is currently active and reachable."""
    global _is_connected
    return _is_connected


def sync_order_to_mongo(order_dict: Dict[str, Any]) -> bool:
    """Persist an order document to MongoDB Atlas 'orders' collection."""
    db = get_db()
    if db is None:
        return False
    try:
        doc = dict(order_dict)
        doc["synced_at"] = datetime.utcnow()
        db.orders.update_one(
            {"id": doc.get("id")},
            {"$set": doc},
            upsert=True
        )
        logger.info(f"Synced order {doc.get('id')} to MongoDB Atlas.")
        return True
    except Exception as e:
        logger.error(f"Failed to sync order to MongoDB Atlas: {e}")
        return False


def sync_payment_to_mongo(payment_dict: Dict[str, Any]) -> bool:
    """Persist a payment document to MongoDB Atlas 'payments' collection."""
    db = get_db()
    if db is None:
        return False
    try:
        doc = dict(payment_dict)
        doc["synced_at"] = datetime.utcnow()
        db.payments.insert_one(doc)
        logger.info(f"Synced payment {doc.get('transaction_id')} to MongoDB Atlas.")
        return True
    except Exception as e:
        logger.error(f"Failed to sync payment to MongoDB Atlas: {e}")
        return False


def sync_notification_to_mongo(notif_dict: Dict[str, Any]) -> bool:
    """Persist a notification document to MongoDB Atlas 'notifications' collection."""
    db = get_db()
    if db is None:
        return False
    try:
        doc = dict(notif_dict)
        doc["synced_at"] = datetime.utcnow()
        db.notifications.insert_one(doc)
        return True
    except Exception as e:
        logger.error(f"Failed to sync notification to MongoDB Atlas: {e}")
        return False


def sync_all_from_sqlite() -> Dict[str, int]:
    """
    One-click sync: copies all existing records from local SQLite (users, restaurants,
    menu items, orders, coupons, transactions) directly to MongoDB Atlas.
    """
    db = get_db()
    if db is None:
        return {"error": "MongoDB Atlas not connected"}
        
    import sqlite3
    import json
    
    counts = {}
    sqlite_path = os.path.join(os.path.dirname(__file__), "campus_crave.db")
    if not os.path.exists(sqlite_path):
        return {"error": "SQLite database not found"}
        
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # 1. Sync restaurants
        cursor.execute("SELECT * FROM restaurants")
        rows = [dict(r) for r in cursor.fetchall()]
        if rows:
            for r in rows:
                db.restaurants.update_one({"id": r["id"]}, {"$set": r}, upsert=True)
            counts["restaurants"] = len(rows)
            
        # 2. Sync menu items
        cursor.execute("SELECT * FROM menu_items")
        rows = [dict(r) for r in cursor.fetchall()]
        if rows:
            for r in rows:
                db.menu_items.update_one({"id": r["id"]}, {"$set": r}, upsert=True)
            counts["menu_items"] = len(rows)
            
        # 3. Sync orders
        cursor.execute("SELECT * FROM orders")
        rows = [dict(r) for r in cursor.fetchall()]
        if rows:
            for r in rows:
                if "items_json" in r and isinstance(r["items_json"], str):
                    try:
                        r["items"] = json.loads(r["items_json"])
                    except Exception:
                        pass
                db.orders.update_one({"id": r["id"]}, {"$set": r}, upsert=True)
            counts["orders"] = len(rows)
            
        # 4. Sync users
        cursor.execute("SELECT * FROM users")
        rows = [dict(r) for r in cursor.fetchall()]
        if rows:
            for r in rows:
                db.users.update_one({"id": r["id"]}, {"$set": r}, upsert=True)
            counts["users"] = len(rows)
            
        # 5. Sync coupons
        cursor.execute("SELECT * FROM coupons")
        rows = [dict(r) for r in cursor.fetchall()]
        if rows:
            for r in rows:
                db.coupons.update_one({"code": r["code"]}, {"$set": r}, upsert=True)
            counts["coupons"] = len(rows)
            
        logger.info(f"Synced SQLite data to MongoDB Atlas: {counts}")
        return counts
    finally:
        conn.close()
