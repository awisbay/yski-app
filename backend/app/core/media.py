"""
Media storage helpers for local filesystem uploads.
"""

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import settings


def ensure_media_dir(subdir: str) -> Path:
    """Ensure a writable directory under media root."""
    media_root = Path(settings.MEDIA_ROOT).resolve()
    target_dir = (media_root / subdir).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir


def _safe_extension(filename: str | None, fallback: str = "bin") -> str:
    if not filename or "." not in filename:
        return fallback
    ext = filename.rsplit(".", 1)[-1].lower()
    if not ext.isalnum():
        return fallback
    return ext


async def save_upload_file(
    file: UploadFile,
    subdir: str,
    allowed_types: set[str],
    max_size_bytes: int,
) -> str:
    """Save uploaded file in media directory and return relative URL path."""
    content_type = (file.content_type or "").lower()
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")

    contents = await file.read()
    if len(contents) > max_size_bytes:
        raise HTTPException(status_code=400, detail="File too large")

    ext = _safe_extension(file.filename)
    filename = f"{uuid4().hex}.{ext}"
    target_dir = ensure_media_dir(subdir)
    target_path = target_dir / filename
    target_path.write_bytes(contents)

    return f"{settings.MEDIA_URL_PREFIX}/{subdir}/{filename}"
