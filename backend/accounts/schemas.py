from datetime import datetime
from typing import Optional
from pydantic import EmailStr
from shared import BaseSchema


class UserOut(BaseSchema):
    id: int
    name: str
    email: str
    role: str
    initials: str
    avatarBg: str
    avatarColor: str
    locked: bool
    createdAt: datetime
    telegramChatId: Optional[str] = ''


class LoginIn(BaseSchema):
    email: str
    password: str


class LoginOut(BaseSchema):
    accessToken: str
    refreshToken: str
    user: UserOut


class TokenRefreshIn(BaseSchema):
    refresh: str


class TokenRefreshOut(BaseSchema):
    access: str
    refresh: str


class LogoutIn(BaseSchema):
    refreshToken: str


class MeUpdateIn(BaseSchema):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserCreateIn(BaseSchema):
    name: str
    email: EmailStr
    role: str = 'btv'
    password: str = 'Encycam@2026'


class UserUpdateIn(BaseSchema):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    telegramChatId: Optional[str] = None
