"""
User management for TAMILARASU ENTERPRISES admin portal.

Uses a simple JSON file (data/users.json) as the user store.
Passwords are hashed with werkzeug's pbkdf2 implementation.
"""

from __future__ import annotations

import json
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


def _load() -> list[dict]:
    """Load users from JSON file."""
    if not USERS_FILE.exists():
        return []
    try:
        with open(USERS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save(users: list[dict]) -> None:
    """Save users to JSON file."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def get_all_users() -> list[dict]:
    return _load()


def get_user_by_id(user_id: str) -> Optional[dict]:
    return next((u for u in _load() if u["id"] == user_id), None)


def get_user_by_email(email: str) -> Optional[dict]:
    email = email.strip().lower()
    return next((u for u in _load() if u["email"].lower() == email), None)


def create_user(name: str, email: str, password: str, role: str = ROLE_USER) -> dict:
    """Create a new user. Status is 'pending' unless role is 'admin'."""
    users = _load()
    user = {
        "id": str(uuid.uuid4()),
        "name": name.strip(),
        "email": email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "role": role,
        "status": STATUS_APPROVED if role == ROLE_ADMIN else STATUS_PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users.append(user)
    _save(users)
    return user


def verify_password(user: dict, password: str) -> bool:
    return check_password_hash(user["password_hash"], password)


def update_user_status(user_id: str, status: str) -> bool:
    users = _load()
    for u in users:
        if u["id"] == user_id:
            u["status"] = status
            _save(users)
            return True
    return False


def update_user_role(user_id: str, role: str) -> bool:
    users = _load()
    for u in users:
        if u["id"] == user_id:
            u["role"] = role
            _save(users)
            return True
    return False


def delete_user(user_id: str) -> bool:
    users = _load()
    new_users = [u for u in users if u["id"] != user_id]
    if len(new_users) == len(users):
        return False
    _save(new_users)
    return True


def ensure_default_admin() -> None:
    """Create a default admin account if no admin exists."""
    users = _load()
    if not any(u["role"] == ROLE_ADMIN for u in users):
        create_user(
            name="Admin",
            email="admin@tamilarasuenterprises.com",
            password="Admin@1234",
            role=ROLE_ADMIN,
        )
