"""Simple in-memory token-bucket rate limiter dependency to prevent spamming endpoints."""

import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException, status

logger = logging.getLogger(__name__)


class TokenBucketRateLimiter:
    """In-memory rate limiter using the Token Bucket algorithm."""

    def __init__(self, rate_limit: int = 15, period: int = 60):
        """Initializes bucket limits.

        Args:
            rate_limit: Maximum number of tokens/requests allowed.
            period: Duration in seconds for token replenishment.
        """
        self.rate_limit = rate_limit
        self.period = period
        # Map of client_ip -> (tokens, last_update_time)
        self.buckets = defaultdict(lambda: (float(rate_limit), time.monotonic()))

    def check_limit(self, client_ip: str) -> None:
        """Verifies if the client IP has enough tokens remaining.

        Raises HTTPException 429 if the rate limit is exceeded.
        """
        now = time.monotonic()
        tokens, last_update = self.buckets[client_ip]

        # Calculate replenished tokens based on time elapsed
        elapsed = now - last_update
        replenish_rate = self.rate_limit / self.period
        new_tokens = tokens + (elapsed * replenish_rate)
        # Cap at maximum capacity
        tokens = min(float(self.rate_limit), new_tokens)

        if tokens >= 1.0:
            tokens -= 1.0
            self.buckets[client_ip] = (tokens, now)
            logger.debug("RateLimit bucket for client_ip=%s value=%.2f", client_ip, tokens)
        else:
            logger.warning("Rate limit exceeded for client_ip=%s", client_ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down.",
            )


# Global rate limiter instance: 20 requests per minute
rate_limiter = TokenBucketRateLimiter(rate_limit=20, period=60)


def rate_limit_dependency(request: Request) -> None:
    """FastAPI Dependency checking Client IP rate limits."""
    client_ip = request.client.host if request.client else "unknown"
    rate_limiter.check_limit(client_ip)
