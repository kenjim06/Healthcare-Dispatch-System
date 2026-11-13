import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import Column, Integer, MetaData, String, Table, select

import database

metadata = MetaData()
users = Table(
    "app_user",
    metadata,
    Column("user_id", Integer, primary_key=True, autoincrement=True),
    Column("email", String(254), nullable=False, unique=True),
    Column("name", String(120), nullable=False),
    Column("role", String(40), nullable=False),
    Column("badge", String(40), nullable=False, unique=True),
    Column("password_hash", String(256), nullable=False),
    Column("is_active", Integer, nullable=False, default=1),
)

bearer_scheme = HTTPBearer(auto_error=False)
PASSWORD_ITERATIONS = 310_000
TOKEN_LIFETIME_SECONDS = 8 * 60 * 60
VALID_ROLES = {"Dispatcher", "Lead Paramedic", "Hospital Admin"}


def initialize_auth_table() -> None:
    metadata.create_all(bind=database.engine)


def _auth_secret() -> bytes:
    secret = os.getenv("AUTH_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=503,
            detail="Authentication is not configured. Set AUTH_SECRET to a random value of at least 32 characters.",
        )
    return secret.encode("utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_ITERATIONS,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(derived).decode("ascii"),
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded_hash.split("$", maxsplit=3)
        if algorithm != "pbkdf2_sha256":
            return False
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            base64.urlsafe_b64decode(salt),
            int(iterations),
        )
        return hmac.compare_digest(
            derived, base64.urlsafe_b64decode(expected)
        )
    except (ValueError, TypeError):
        return False


def create_token(email: str) -> str:
    payload = json.dumps(
        {"sub": email, "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(_auth_secret(), encoded_payload, hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=")
    return encoded_payload.decode("ascii") + "." + encoded_signature.decode("ascii")


def _decode_token(token: str) -> str:
    try:
        encoded_payload, encoded_signature = token.encode("ascii").split(b".", 1)
        provided_signature = base64.urlsafe_b64decode(
            encoded_signature + b"=" * (-len(encoded_signature) % 4)
        )
        expected_signature = hmac.new(
            _auth_secret(), encoded_payload, hashlib.sha256
        ).digest()
        if not hmac.compare_digest(provided_signature, expected_signature):
            raise ValueError("Invalid token signature.")
        payload = json.loads(
            base64.urlsafe_b64decode(
                encoded_payload + b"=" * (-len(encoded_payload) % 4)
            )
        )
        email = payload["sub"]
        if not isinstance(email, str) or payload["exp"] <= time.time():
            raise ValueError("Expired or invalid token.")
        return email
    except HTTPException:
        raise
    except (ValueError, KeyError, TypeError, UnicodeError, json.JSONDecodeError):
        raise HTTPException(
            status_code=401,
            detail="Your session is invalid or has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


def public_user(row) -> dict:
    return {
        "id": row.user_id,
        "name": row.name,
        "email": row.email,
        "role": row.role,
        "badge": row.badge,
    }


def list_paramedic_accounts(connection) -> list[dict]:
    records = connection.execute(
        select(
            users.c.user_id,
            users.c.name,
            users.c.badge,
        )
        .where(
            users.c.role == "Lead Paramedic",
            users.c.is_active == 1,
        )
        .order_by(users.c.name, users.c.user_id)
    )
    return [
        {
            "id": row.user_id,
            "name": row.name,
            "badge": row.badge,
        }
        for row in records
    ]


def authenticate(email: str, password: str) -> dict | None:
    normalized_email = email.strip().lower()
    with database.engine.connect() as connection:
        row = connection.execute(
            select(users).where(users.c.email == normalized_email)
        ).first()
    if row is None:
        verify_password(password, _DUMMY_PASSWORD_HASH)
        return None
    if not row.is_active or not verify_password(password, row.password_hash):
        return None
    return public_user(row)


def get_user_for_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = _decode_token(credentials.credentials)
    with database.engine.connect() as connection:
        row = connection.execute(
            select(users).where(
                users.c.email == email,
                users.c.is_active == 1,
            )
        ).first()
    if row is None:
        raise HTTPException(
            status_code=401,
            detail="Your account is unavailable. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return public_user(row)


def require_roles(*roles: str) -> Callable:
    def role_guard(user: dict = Depends(get_user_for_token)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail="Your account does not have permission to perform this action.",
            )
        return user

    return role_guard


_DUMMY_PASSWORD_HASH = hash_password("invalid-password-used-for-timing-only")
