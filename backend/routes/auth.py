import hashlib
import hmac
import json
import base64
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from backend.database.session import get_db
from backend.database.models import User
from backend.app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = settings.SECRET_KEY.encode()

def hash_password(password: str) -> str:
    """PBKDF2 HMAC SHA-256 password hashing with salt."""
    salt = "univ_research_salt_2025".encode()
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return base64.b64encode(pwd_hash).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

def create_access_token(user: User) -> str:
    """Generates an HMAC-signed token containing user payload and expiration."""
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "exp": int(time.time()) + (86400 * 7)  # 7 days
    }
    raw = json.dumps(payload).encode()
    b64_payload = base64.urlsafe_b64encode(raw).decode()
    signature = hmac.new(SECRET_KEY, b64_payload.encode(), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{signature}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, signature = parts
        expected_sig = hmac.new(SECRET_KEY, b64_payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(b64_payload.encode()).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "Research Officer"
    department: Optional[str] = "Research & Innovation Council"
    institution: Optional[str] = "University Research & Innovation Office"

class LoginRequest(BaseModel):
    email: str
    password: str

def format_user_response(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "department": user.department,
        "institution": user.institution,
        "avatar_url": user.avatar_url or f"https://ui-avatars.com/api/?name={user.full_name}&background=4f46e5&color=fff",
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

def ensure_seed_users(db: Session):
    """Seed default demo accounts if no users exist."""
    if db.query(User).count() == 0:
        demo_users = [
            {
                "full_name": "Dr. Elena Rostova",
                "email": "director@university.edu",
                "password": "password123",
                "role": "Research Director",
                "department": "Office of Academic Research & Grants",
                "institution": "University Research Council"
            },
            {
                "full_name": "Dr. Aarav Mehta",
                "email": "faculty@university.edu",
                "password": "password123",
                "role": "Faculty Researcher",
                "department": "School of Computer Science & Engineering",
                "institution": "University Research Council"
            },
            {
                "full_name": "Dr. Vikram Sethi",
                "email": "dean@university.edu",
                "password": "password123",
                "role": "Dean of Engineering",
                "department": "School of Mechanical Engineering",
                "institution": "University Research Council"
            }
        ]
        for u in demo_users:
            user = User(
                full_name=u["full_name"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                department=u["department"],
                institution=u["institution"]
            )
            db.add(user)
        db.commit()

@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role or "Research Officer",
        department=payload.department or "Research & Innovation Office",
        institution=payload.institution or "University Research Council",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user)
    return {
        "token": token,
        "user": format_user_response(new_user)
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ensure_seed_users(db)
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token(user)
    return {
        "token": token,
        "user": format_user_response(user)
    }

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user)):
    return format_user_response(user)

@router.get("/demo-accounts")
def get_demo_accounts(db: Session = Depends(get_db)):
    ensure_seed_users(db)
    return [
        {
            "name": "Dr. Elena Rostova",
            "email": "director@university.edu",
            "password": "password123",
            "role": "Research Director",
            "department": "Office of Academic Research & Grants"
        },
        {
            "name": "Dr. Aarav Mehta",
            "email": "faculty@university.edu",
            "password": "password123",
            "role": "Faculty Researcher",
            "department": "Computer Science & Engineering"
        },
        {
            "name": "Dr. Vikram Sethi",
            "email": "dean@university.edu",
            "password": "password123",
            "role": "Dean of Engineering",
            "department": "Mechanical Engineering"
        }
    ]
