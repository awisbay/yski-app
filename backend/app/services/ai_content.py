"""
AI content generation service (Gemini).
"""

from typing import Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class AIContentService:
    """Service for generating long-form content from short user input."""

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GEMINI_API_KEY belum dikonfigurasi di server.",
            )

    async def generate_news_content(self, title: str, brief: str) -> dict:
        prompt = (
            "Anda adalah editor berita yayasan sosial kemanusiaan di Indonesia.\n"
            "Tulis konten berita yang rapi, informatif, dan mudah dipahami.\n"
            "Gunakan bahasa Indonesia formal yang hangat.\n\n"
            f"Judul: {title}\n"
            f"Poin singkat dari user: {brief}\n\n"
            "Output wajib:\n"
            "1) Paragraf pembuka\n"
            "2) Detail kegiatan/program\n"
            "3) Dampak/manfaat\n"
            "4) Ajakan kebaikan di penutup\n\n"
            "Batasi 300-500 kata."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
        params = {"key": settings.GEMINI_API_KEY}
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.6,
                "topK": 32,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(url, params=params, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:300] if exc.response is not None else "Gemini request gagal."
            raise HTTPException(status_code=502, detail=f"Gagal generate konten AI: {detail}")
        except Exception:
            raise HTTPException(status_code=502, detail="Gagal terhubung ke layanan AI.")

        candidates = data.get("candidates") or []
        if not candidates:
            raise HTTPException(status_code=502, detail="AI tidak mengembalikan konten.")

        parts = candidates[0].get("content", {}).get("parts", [])
        generated_text = ""
        for part in parts:
            generated_text += part.get("text", "")
        generated_text = generated_text.strip()

        if not generated_text:
            raise HTTPException(status_code=502, detail="Konten AI kosong.")

        excerpt = generated_text[:200].strip()
        if excerpt and not excerpt.endswith("..."):
            excerpt = f"{excerpt}..."

        return {
            "generated_content": generated_text,
            "suggested_excerpt": excerpt,
        }
