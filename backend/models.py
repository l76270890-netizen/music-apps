from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Table, Column, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


playlist_songs = Table(
    "playlist_songs",
    Base.metadata,
    Column("playlist_id", ForeignKey("playlists.id", ondelete="CASCADE"), primary_key=True),
    Column("song_id", ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True),
    Column("position", Integer, nullable=False, default=0),
)

favorites = Table(
    "favorites",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("song_id", ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(60))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    songs: Mapped[list["Song"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    playlists: Mapped[list["Playlist"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Song(Base):
    __tablename__ = "songs"
    __table_args__ = (UniqueConstraint("owner_id", "device_key", name="uq_song_owner_device_key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    device_key: Mapped[str] = mapped_column(String(500))
    title: Mapped[str] = mapped_column(String(300))
    artist: Mapped[str] = mapped_column(String(300), default="Unknown artist")
    album: Mapped[str] = mapped_column(String(300), default="")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    owner: Mapped[User] = relationship(back_populates="songs")


class Playlist(Base):
    __tablename__ = "playlists"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    owner: Mapped[User] = relationship(back_populates="playlists")
    songs: Mapped[list[Song]] = relationship(secondary=playlist_songs, order_by=playlist_songs.c.position)
