"""
Admin services store — CRUD operations on data/services.json.
"""

from __future__ import annotations

import json
import re
import uuid
from pathlib import Path
from typing import Optional

SERVICES_FILE = Path(__file__).parent.parent / "data" / "services.json"
ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def _load() -> list[dict]:
    if not SERVICES_FILE.exists():
        return []
    try:
        with open(SERVICES_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save(services: list[dict]) -> None:
    SERVICES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SERVICES_FILE, "w", encoding="utf-8") as f:
        json.dump(services, f, indent=2, ensure_ascii=False)


def get_all() -> list[dict]:
    return _load()


def get_by_id(service_id: str) -> Optional[dict]:
    return next((s for s in _load() if s["id"] == service_id), None)


def validate(data: dict) -> dict[str, str]:
    errors: dict[str, str] = {}
    if not data.get("title", "").strip():
        errors["title"] = "Title is required."
    desc = data.get("description", "").strip()
    if not desc:
        errors["description"] = "Description is required."
    elif len(desc) > 500:
        errors["description"] = "Description must be 500 characters or fewer."
    if not data.get("icon", "").strip():
        errors["icon"] = "Icon class is required (e.g. fas fa-ship)."
    return errors


def create(data: dict) -> tuple[Optional[dict], dict[str, str]]:
    errors = validate(data)
    if errors:
        return None, errors
    services = _load()
    service_id = re.sub(r"[^a-z0-9]+", "-", data["title"].strip().lower()).strip("-")
    if any(s["id"] == service_id for s in services):
        service_id = service_id + "-" + str(uuid.uuid4())[:8]
    highlights = data.get("highlights", [])
    if isinstance(highlights, str):
        highlights = [h.strip() for h in highlights.split("\n") if h.strip()]
    service = {
        "id": service_id,
        "title": data["title"].strip(),
        "description": data["description"].strip(),
        "icon": data["icon"].strip(),
        "highlights": highlights[:5],
    }
    services.append(service)
    _save(services)
    return service, {}


def update(service_id: str, data: dict) -> tuple[Optional[dict], dict[str, str]]:
    errors = validate(data)
    if errors:
        return None, errors
    services = _load()
    highlights = data.get("highlights", [])
    if isinstance(highlights, str):
        highlights = [h.strip() for h in highlights.split("\n") if h.strip()]
    for i, s in enumerate(services):
        if s["id"] == service_id:
            services[i] = {
                "id": service_id,
                "title": data["title"].strip(),
                "description": data["description"].strip(),
                "icon": data["icon"].strip(),
                "highlights": highlights[:5],
            }
            _save(services)
            return services[i], {}
    return None, {"id": "Service not found."}


def delete(service_id: str) -> bool:
    services = _load()
    new_services = [s for s in services if s["id"] != service_id]
    if len(new_services) == len(services):
        return False
    _save(new_services)
    return True
