import json
import logging

import redis

logger = logging.getLogger(__name__)


class CacheManager:
    """Redis-backed cache for question -> response pairs, with frequency-based eviction.

    The cache is keyed on the lowercased / trimmed question. A Redis sorted set
    tracks how often each question has been asked; once the cache exceeds
    `max_cached_items` entries, the least-frequent ones are evicted.
    """

    CACHE_KEY_PREFIX = "odyssey:cache:"
    FREQUENCY_KEY = "odyssey:query_frequency"

    def __init__(self, redis_url: str = "redis://localhost:6379", max_cached_items: int = 6):
        self.max_cached_items = max_cached_items
        try:
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()
            logger.info(f"Redis cache initialized at {redis_url}")
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {e}")
            self.redis_client = None

    # ----------------------------------------------------------------- queries

    def is_available(self) -> bool:
        if not self.redis_client:
            return False
        try:
            return bool(self.redis_client.ping())
        except Exception:
            return False

    def get_cached_response(self, question: str) -> str | None:
        if not self.is_available():
            return None
        try:
            key = self._normalize_question(question)
            cached = self.redis_client.get(self.CACHE_KEY_PREFIX + key)
            if cached is None:
                return None
            self.redis_client.zincrby(self.FREQUENCY_KEY, 1, key)
            logger.info(f"Cache hit for question: {question[:30]}...")
            return json.loads(cached)
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            return None

    def cache_response(self, question: str, response: str) -> bool:
        if not self.is_available():
            return False
        try:
            key = self._normalize_question(question)
            self.redis_client.set(self.CACHE_KEY_PREFIX + key, json.dumps(response))
            self.redis_client.zincrby(self.FREQUENCY_KEY, 1, key)
            self._prune_cache()
            logger.info(f"Cached response for question: {question[:30]}...")
            return True
        except Exception as e:
            logger.error(f"Error caching response: {e}")
            return False

    def clear_cache(self) -> bool:
        if not self.is_available():
            return False
        try:
            for question in self.redis_client.zrange(self.FREQUENCY_KEY, 0, -1):
                self.redis_client.delete(self.CACHE_KEY_PREFIX + question.decode("utf-8"))
            self.redis_client.delete(self.FREQUENCY_KEY)
            logger.info("Cache cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False

    def get_top_questions(self, count: int | None = None) -> list[tuple[str, int]]:
        if not self.is_available():
            return []
        try:
            limit = count or self.max_cached_items
            entries = self.redis_client.zrange(
                self.FREQUENCY_KEY,
                0,
                limit - 1,
                desc=True,
                withscores=True,
            )
            return [(q.decode("utf-8"), int(score)) for q, score in entries]
        except Exception as e:
            logger.error(f"Error getting top questions: {e}")
            return []

    # ----------------------------------------------------------------- internals

    def _prune_cache(self) -> None:
        if not self.is_available():
            return
        try:
            all_questions = self.redis_client.zrange(
                self.FREQUENCY_KEY,
                0,
                -1,
                desc=True,
                withscores=True,
            )
            if len(all_questions) <= self.max_cached_items:
                return
            for question, _ in all_questions[self.max_cached_items :]:
                key = question.decode("utf-8")
                self.redis_client.delete(self.CACHE_KEY_PREFIX + key)
                self.redis_client.zrem(self.FREQUENCY_KEY, question)
        except Exception as e:
            logger.error(f"Error pruning cache: {e}")

    @staticmethod
    def _normalize_question(question: str) -> str:
        return question.lower().strip()
