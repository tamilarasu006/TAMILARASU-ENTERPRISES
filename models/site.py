"""
Site configuration data models for TAMILARASU ENTERPRISES website.

These dataclasses represent the structure of data/site_config.json and
related site-wide configuration used across all pages.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class SocialLink:
    """
    A single social media profile link.

    Attributes:
        platform – e.g. "linkedin", "instagram", "whatsapp", "facebook"
        url      – full URL to the social media profile
    """

    platform: str
    url: str


@dataclass
class Service:
    """
    Describes one import/export service offered by the company.

    Attributes:
        title       – service name (e.g. "Export Services")
        description – short description, max 500 characters
        iconUrl     – path or URL to the service icon image
        highlights  – list of 1–5 short highlight bullet points
    """

    title: str
    description: str
    iconUrl: str
    highlights: List[str] = field(default_factory=list)


@dataclass
class TeamMember:
    """
    Represents a single team member shown on the About page.

    Attributes:
        name     – full name
        role     – job title or role
        photoUrl – path or URL to the member's photo
        bio      – short biography
    """

    name: str
    role: str
    photoUrl: str
    bio: str = ""


@dataclass
class CompanyInfo:
    """
    Company background and identity information for the About page.

    Attributes:
        foundedYear        – year the company was established
        mission            – mission statement
        vision             – vision statement
        values             – list of core value strings
        teamMembers        – list of TeamMember records
        certifications     – list of certification names/labels
        exportDestinations – list of countries/regions the company exports to
    """

    foundedYear: int
    mission: str
    vision: str
    values: List[str] = field(default_factory=list)
    teamMembers: List[TeamMember] = field(default_factory=list)
    certifications: List[str] = field(default_factory=list)
    exportDestinations: List[str] = field(default_factory=list)


@dataclass
class FooterData:
    """
    Data used to render the site-wide footer component.

    Attributes:
        address     – physical company address
        phone       – contact phone number
        email       – contact email address
        socialLinks – list of SocialLink records
        quickLinks  – list of (label, href) tuples for quick navigation
    """

    address: str
    phone: str
    email: str
    socialLinks: List[SocialLink] = field(default_factory=list)
    quickLinks: List[dict] = field(default_factory=list)


@dataclass
class SiteConfiguration:
    """
    Top-level site configuration loaded from data/site_config.json.

    Attributes:
        companyName        – official company name
        tagline            – marketing tagline
        logoUrl            – path or URL to the company logo
        contactEmail       – primary contact email
        contactPhone       – primary contact phone number
        whatsappNumber     – WhatsApp contact number (digits only, with country code)
        address            – physical address
        socialLinks        – list of SocialLink records
        featuredProductIds – list of product ids shown on the Home page (3–6)
        heroImages         – list of image paths/URLs for the hero banner carousel
    """

    companyName: str
    tagline: str
    logoUrl: str
    contactEmail: str
    contactPhone: str
    whatsappNumber: str
    address: str
    socialLinks: List[SocialLink] = field(default_factory=list)
    featuredProductIds: List[str] = field(default_factory=list)
    heroImages: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "SiteConfiguration":
        """Construct a SiteConfiguration from a plain dictionary (e.g. parsed JSON)."""
        social_links = [
            SocialLink(platform=s["platform"], url=s["url"])
            for s in data.get("socialLinks", [])
        ]
        return cls(
            companyName=data.get("companyName", ""),
            tagline=data.get("tagline", ""),
            logoUrl=data.get("logoUrl", ""),
            contactEmail=data.get("contactEmail", ""),
            contactPhone=data.get("contactPhone", ""),
            whatsappNumber=data.get("whatsappNumber", ""),
            address=data.get("address", ""),
            socialLinks=social_links,
            featuredProductIds=data.get("featuredProductIds", []),
            heroImages=data.get("heroImages", []),
        )
