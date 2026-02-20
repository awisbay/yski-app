"""
Simple in-process rate limiter for sensitive endpoints.
"""

from collections import defaultdict, deque
from threading import Lock
import time

from fastapi import HTTPException, status

_RATE_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_RATE_LOCK = Lock()


def enforce_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """
    Enforce fixed-window sliding limit.

    Note:
        This is per-process limiter. For distributed enforcement use Redis-based limiter.
    """
    now = time.time()
    window_start = now - window_seconds

    with _RATE_LOCK:
        bucket = _RATE_BUCKETS[key]
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later",
            )
        bucket.append(now)
