"""
One-time script to change the admin account password.

Usage:
    python scripts/change_admin_password.py
"""

import sys
import getpass
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from werkzeug.security import generate_password_hash
from auth.users import _load, _save, ROLE_ADMIN


def main():
    users = _load()
    admins = [u for u in users if u.get("role") == ROLE_ADMIN]

    if not admins:
        print("No admin account found.")
        return

    # Show available admin accounts
    print("\nAdmin accounts:")
    for i, u in enumerate(admins):
        print(f"  [{i}] {u['name']} — {u['email']}")

    # Pick admin if multiple
    if len(admins) == 1:
        admin = admins[0]
    else:
        idx = int(input("\nSelect admin number: ").strip())
        admin = admins[idx]

    print(f"\nChanging password for: {admin['email']}")

    # Get new password
    while True:
        new_password = getpass.getpass("New password (min 8 chars, letters + numbers): ")
        if len(new_password) < 8:
            print("  Too short. Must be at least 8 characters.")
            continue
        if not any(c.isdigit() for c in new_password) or not any(c.isalpha() for c in new_password):
            print("  Must contain at least one letter and one number.")
            continue
        confirm = getpass.getpass("Confirm new password: ")
        if new_password != confirm:
            print("  Passwords do not match. Try again.")
            continue
        break

    # Update password hash
    for u in users:
        if u["id"] == admin["id"]:
            u["password_hash"] = generate_password_hash(new_password)
            break

    _save(users)
    print(f"\n✓ Password updated for {admin['email']}")
    print("  You can now log in with the new password.")


if __name__ == "__main__":
    main()
