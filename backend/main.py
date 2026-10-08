import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, insert, select, update
from sqlalchemy.orm import Session, selectinload

import models
from database import Base, engine, get_db
from models import Playlist, Song, User, favorites, playlist_songs
from schemas import AlbumView, LoginInput, PlaylistCreate, PlaylistView, SongInput, SongView, TokenView, UserCreate, UserView
from security import current_user, hash_password, make_access_token, verify_password


Base.metadata.create_all(bind=engine)
app = FastAPI(title="TuneIt API", version="0.1.0", description="Account and music-library metadata API. Audio stays on the user's device.")
origins = [origin.strip().rstrip("/") for origin in os.getenv("CORS_ORIGINS", "http://localhost:8081,http://localhost:8082,http://localhost:19006").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def playlist_view(db: Session, playlist: Playlist) -> PlaylistView:
    songs = db.scalars(
        select(Song).join(playlist_songs).where(playlist_songs.c.playlist_id == playlist.id).order_by(playlist_songs.c.position)
    ).all()
    return PlaylistView(id=playlist.id, name=playlist.name, created_at=playlist.created_at, songs=[SongView.model_validate(song) for song in songs])


def owned_song(db: Session, user: User, song_id: int) -> Song:
    song = db.scalar(select(Song).where(Song.id == song_id, Song.owner_id == user.id))
    if song is None:
        raise HTTPException(status_code=404, detail="Song not found")
    return song


def owned_playlist(db: Session, user: User, playlist_id: int) -> Playlist:
    playlist = db.scalar(select(Playlist).where(Playlist.id == playlist_id, Playlist.owner_id == user.id))
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist


@app.get("/health")
def health():
    return {"status": "ok", "service": "tuneit-api"}


@app.post("/auth/register", response_model=TokenView, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(email=email, username=payload.username.strip(), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenView(access_token=make_access_token(user.id), user=UserView.model_validate(user))


@app.post("/auth/login", response_model=TokenView)
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return TokenView(access_token=make_access_token(user.id), user=UserView.model_validate(user))


@app.get("/auth/me", response_model=UserView)
def me(user: User = Depends(current_user)):
    return user


@app.get("/songs", response_model=list[SongView])
def list_songs(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Song).where(Song.owner_id == user.id).order_by(Song.title)).all()


@app.get("/albums", response_model=list[AlbumView])
def list_albums(db: Session = Depends(get_db), user: User = Depends(current_user)):
    songs = db.scalars(select(Song).where(Song.owner_id == user.id)).all()
    grouped: dict[tuple[str, str], int] = {}
    for song in songs:
        if song.album:
            key = (song.album, song.artist)
            grouped[key] = grouped.get(key, 0) + 1
    return [AlbumView(title=title, artist=artist, song_count=count) for (title, artist), count in sorted(grouped.items())]


@app.post("/songs/sync", response_model=list[SongView])
def sync_songs(payload: list[SongInput], db: Session = Depends(get_db), user: User = Depends(current_user)):
    if len(payload) > 1000:
        raise HTTPException(status_code=413, detail="Sync at most 1,000 songs at a time")
    existing = {song.device_key: song for song in db.scalars(select(Song).where(Song.owner_id == user.id)).all()}
    for item in payload:
        values = item.model_dump()
        song = existing.get(item.device_key)
        if song is None:
            song = Song(owner_id=user.id, **values)
            db.add(song)
            existing[item.device_key] = song
        else:
            for key, value in values.items():
                setattr(song, key, value)
    db.commit()
    return db.scalars(select(Song).where(Song.owner_id == user.id).order_by(Song.title)).all()


@app.get("/favorites", response_model=list[SongView])
def list_favorites(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Song).join(favorites).where(favorites.c.user_id == user.id).order_by(Song.title)).all()


@app.post("/favorites/{song_id}", status_code=204)
def add_favorite(song_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    owned_song(db, user, song_id)
    exists = db.scalar(select(favorites.c.song_id).where(favorites.c.user_id == user.id, favorites.c.song_id == song_id))
    if exists is None:
        db.execute(insert(favorites).values(user_id=user.id, song_id=song_id))
    db.commit()


@app.delete("/favorites/{song_id}", status_code=204)
def remove_favorite(song_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    owned_song(db, user, song_id)
    db.execute(delete(favorites).where(favorites.c.user_id == user.id, favorites.c.song_id == song_id))
    db.commit()


@app.get("/playlists", response_model=list[PlaylistView])
def list_playlists(db: Session = Depends(get_db), user: User = Depends(current_user)):
    playlists = db.scalars(select(Playlist).where(Playlist.owner_id == user.id).order_by(Playlist.created_at.desc())).all()
    return [playlist_view(db, playlist) for playlist in playlists]


@app.post("/playlists", response_model=PlaylistView, status_code=201)
def create_playlist(payload: PlaylistCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Playlist name cannot be empty")
    playlist = Playlist(owner_id=user.id, name=name)
    db.add(playlist)
    db.commit()
    db.refresh(playlist)
    return playlist_view(db, playlist)


@app.get("/playlists/{playlist_id}", response_model=PlaylistView)
def get_playlist(playlist_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return playlist_view(db, owned_playlist(db, user, playlist_id))


@app.put("/playlists/{playlist_id}", response_model=PlaylistView)
def rename_playlist(playlist_id: int, payload: PlaylistCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    playlist = owned_playlist(db, user, playlist_id)
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Playlist name cannot be empty")
    playlist.name = name
    db.commit()
    db.refresh(playlist)
    return playlist_view(db, playlist)


@app.delete("/playlists/{playlist_id}", status_code=204)
def delete_playlist(playlist_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    playlist = owned_playlist(db, user, playlist_id)
    db.delete(playlist)
    db.commit()


@app.post("/playlists/{playlist_id}/songs/{song_id}", response_model=PlaylistView)
def add_playlist_song(playlist_id: int, song_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    playlist = owned_playlist(db, user, playlist_id)
    song = owned_song(db, user, song_id)
    if all(existing.id != song.id for existing in playlist.songs):
        playlist.songs.append(song)
        db.flush()
        db.execute(update(playlist_songs).where(playlist_songs.c.playlist_id == playlist.id, playlist_songs.c.song_id == song.id).values(position=len(playlist.songs) - 1))
        db.commit()
    return playlist_view(db, playlist)


@app.delete("/playlists/{playlist_id}/songs/{song_id}", response_model=PlaylistView)
def remove_playlist_song(playlist_id: int, song_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    playlist = owned_playlist(db, user, playlist_id)
    song = owned_song(db, user, song_id)
    playlist.songs = [existing for existing in playlist.songs if existing.id != song.id]
    db.commit()
    return playlist_view(db, playlist)
