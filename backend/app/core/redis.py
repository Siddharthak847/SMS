import time
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger


class RedisManager:
    def __init__(self):
        self._client: Optional[aioredis.Redis] = None
        self._in_memory_store = {}

    async def get_client(self) -> Optional[aioredis.Redis]:
        if self._client is None:
            try:
                self._client = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                await self._client.ping()
            except Exception as e:
                logger.warning("Redis connection unavailable, using fallback in-memory store", error=str(e))
                self._client = None
        return self._client

    async def set(self, key: str, value: str, expire_seconds: Optional[int] = None) -> bool:
        client = await self.get_client()
        if client:
            try:
                if expire_seconds:
                    await client.setex(key, expire_seconds, value)
                else:
                    await client.set(key, value)
                return True
            except Exception as e:
                logger.warning("Redis set failed, writing to in-memory store", error=str(e))

        exp = (time.time() + expire_seconds) if expire_seconds else None
        self._in_memory_store[key] = (value, exp)
        return True

    async def get(self, key: str) -> Optional[str]:
        client = await self.get_client()
        if client:
            try:
                return await client.get(key)
            except Exception as e:
                logger.warning("Redis get failed, checking in-memory store", error=str(e))

        if key in self._in_memory_store:
            val, exp = self._in_memory_store[key]
            if exp and time.time() > exp:
                del self._in_memory_store[key]
                return None
            return val
        return None

    async def delete(self, key: str) -> bool:
        client = await self.get_client()
        if client:
            try:
                await client.delete(key)
            except Exception:
                pass
        self._in_memory_store.pop(key, None)
        return True

    async def is_token_blacklisted(self, token: str) -> bool:
        val = await self.get(f"blacklist:{token}")
        return val is not None

    async def blacklist_token(self, token: str, expire_seconds: int = 86400) -> bool:
        return await self.set(f"blacklist:{token}", "true", expire_seconds=expire_seconds)


redis_client = RedisManager()
