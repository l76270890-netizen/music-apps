from datetime import datetime

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserCreate(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", cleaned):
            raise ValueError("Enter a valid email address")
        return cleaned

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Username cannot be empty")
        return cleaned


class UserView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str
    created_at: datetime


class LoginInput(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class TokenView(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserView


class SongInput(BaseModel):
    device_key: str = Field(min_length=1, max_length=500)
    title: str = Field(min_length=1, max_length=300)
    artist: str = Field(default="Unknown artist", max_length=300)
    album: str = Field(default="", max_length=300)
    duration_seconds: int = Field(default=0, ge=0)


class SongView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    device_key: str
    title: str
    artist: str
    album: str
    duration_seconds: int


class AlbumView(BaseModel):
    title: str
    artist: str
    song_count: int


class PlaylistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class PlaylistView(BaseModel):
    id: int
    name: str
    created_at: datetime
    songs: list[SongView] = Field(default_factory=list)
