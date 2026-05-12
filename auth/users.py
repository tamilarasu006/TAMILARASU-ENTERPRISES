"""
User management for TAMILARASU ENTERPRISES admin portal.

Storage strategy:
- When MONGO_URI is set (Render / production): uses MongoDB 'users' collection.
- Otherwise (local dev without MongoDB): falls back to data/users.json.

Passwords are hashed with werkzeug's scrypt implementation.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from werkzeug.security import check_password_hash, generate_password_hash

USERS_FILE = Path(__file__).parent.parent / "data" / "users.json"

# ── User roles ─────────────────────────────────────────────────────────────────
ROLE_ADMIN = "admin"
ROLE_USER  = "user"

# ── Status ─────────────────────────────────────────────────────────────────────
STATUS_PENDING  = "pending"
STATUS_APPROVED = "approved"
STATUS_REJECTED = "rejected"


# ── Storage backend detection ──────────────────────────────────────────────────

def _use_mongo() -> bool:
    """Return True if MongoDB should be used as the user store."""
    return bool(os.environ.get("MONGO_URI", "").strip())


def _get_collection():
    """Return the MongoDB users collection."""
    from db import get_db
    return get_db()["users"]


# ── Internal load/save (JSON fallback) ────────────────────────────────────────

def _load() -> list[dict]:
    """Load users from JSON file (local dev fallback)."""
    if not USERS_FILE.exists():
        return []
    try:
        with open(USERS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save(users: list[dict]) -> None:
    """Save users to JSON file (local dev fallback)."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def _doc_to_user(doc: dict) -> dict:
    """Convert a MongoDB document to a plain user dict."""
    d = dict(doc)
    d.pop("_id", None)
    return d


# ── Public API ─────────────────────────────────────────────────────────────────

def get_all_users() -> list[dict]:
    if _use_mongo():
        return [_doc_to_user(d) for d in _get_collection().find()]
    return _load()


def get_user_by_id(user_id: str) -> Optional[dict]:
    if _use_mongo():
        doc = _get_collection().find_one({"id": user_id})
        return _doc_to_user(doc) if doc else None
    return next((u for u in _load() if u["id"] == user_id), None)


def get_user_by_email(email: str) -> Optional[dict]:
    email = email.strip().lower()
    if _use_mongo():
        doc = _get_collection().find_one({"email": email})
        return _doc_to_user(doc) if doc else None
    return next((u for u in _load() if u["email"].lower() == email), None)


def create_user(name: str, email: str, password: str, role: str = ROLE_USER) -> dict:
    """Create a new user. Status is 'pending' unless role is 'admin'."""
    user = {
        "id": str(uuid.uuid4()),
        "name": name.strip(),
        "email": email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "role": role,
        "status": STATUS_APPROVED if role == ROLE_ADMIN else STATUS_PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if _use_mongo():
        doc = dict(user)
        doc["_id"] = user["id"]
        _get_collection().insert_one(doc)
    else:
        users = _load()
        users.append(user)
        _save(users)
    return user


def verify_password(user: dict, password: str) -> bool:
    return check_password_hash(user["password_hash"], password)


def update_user_status(user_id: str, status: str) -> bool:
    if _use_mongo():
        result = _get_collection().update_one(
            {"id": user_id}, {"$set": {"status": status}}
        )
        return result.modified_count > 0
    users = _load()
    for u in users:
        if u["id"] == user_id:
            u["status"] = status
            _save(users)
            return True
    return False


def update_user_role(user_id: str, role: str) -> bool:
    if _use_mongo():
        result = _get_collection().update_one(
            {"id": user_id}, {"$set": {"role": role}}
        )
        return result.modified_count > 0
    users = _load()
    for u in users:
        if u["id"] == user_id:
            u["role"] = role
            _save(users)
            return True
    return False


def delete_user(user_id: str) -> bool:
    if _use_mongo():
        result = _get_collection().delete_one({"id": user_id})
        return result.deleted_count > 0
    users = _load()
    new_users = [u for u in users if u["id"] != user_id]
    if len(new_users) == len(users):
        return False
    _save(new_users)
    return True


def ensure_default_admin() -> None:
    """
    Ensure the default admin account exists with the correct password.

    - If ADMIN_DEFAULT_PASSWORD env var is set: always syncs the admin
      password to that value on startup. This guarantees Render deploys
      always use the configured password.
    - If no admin exists at all: creates one.
    """
    import secrets

    password = os.environ.get("ADMIN_DEFAULT_PASSWORD", "")

    if _use_mongo():
        col = _get_collection()
        admin = col.find_one({"role": ROLE_ADMIN})

        if admin:
            # Admin exists in MongoDB — sync password if env var is set
            if password:
                col.update_one(
                    {"role": ROLE_ADMIN},
                    {"$set": {"password_hash": generate_password_hash(password)}}
                )
            return

        # No admin in MongoDB — create one
        if not password:
            password = secrets.token_urlsafe(16)
            print("=" * 60)
            print("  NEW ADMIN ACCOUNT CREATED (MongoDB)")
            print(f"  Email:    admin@tamilarasuenterprises.com")
            print(f"  Password: {password}")
            print("  Set ADMIN_DEFAULT_PASSWORD env var to fix this.")
            print("=" * 60)

        create_user(
            name="Admin",
            email="admin@tamilarasuenterprises.com",
            password=password,
            role=ROLE_ADMIN,
        )

    else:
        # JSON fallback (local dev)
        users = _load()
        admin = next((u for u in users if u["role"] == ROLE_ADMIN), None)

        if admin:
            if password:
                admin["password_hash"] = generate_password_hash(password)
                _save(users)
            return

        if not password:
            password = secrets.token_urlsafe(16)
            print("=" * 60)
            print("  NEW ADMIN ACCOUNT CREATED (JSON)")
            print(f"  Email:    admin@tamilarasuenterprises.com")
            print(f"  Password: {password}")
            print("=" * 60)

        create_user(
            name="Admin",
            email="admin@tamilarasuenterprises.com",
            password=password,
            role=ROLE_ADMIN,
        )
