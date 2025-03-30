import redis
import json
import logging
from typing import Dict, Optional, Tuple, List

logger = logging.getLogger(__name__)

class CacheManager:
    """Manages caching of queries and responses using Redis."""
    
    def __init__(self, redis_url="redis://localhost:6379", max_cached_items=6):
        """Initialize the cache manager with Redis connection."""
        try:
            self.redis_client = redis.from_url(redis_url)
            self.max_cached_items = max_cached_items
            self.cache_key_prefix = "odyssey:cache:"
            self.frequency_key = "odyssey:query_frequency"
            logger.info(f"Redis cache initialized successfully at {redis_url}")
            # Test Redis connection
            self.redis_client.ping()
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {str(e)}")
            self.redis_client = None
    
    def is_available(self) -> bool:
        """Check if Redis cache is available."""
        if not self.redis_client:
            return False
        try:
            return self.redis_client.ping()
        except:
            return False
    
    def get_cached_response(self, question: str) -> Optional[str]:
        """Retrieve cached response for a question if it exists."""
        if not self.is_available():
            return None
            
        try:
            # Normalize the question to use as a consistent key
            normalized_question = self._normalize_question(question)
            # Get cached response
            cache_key = f"{self.cache_key_prefix}{normalized_question}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                # Increment the frequency counter for this question
                self.redis_client.zincrby(self.frequency_key, 1, normalized_question)
                logger.info(f"Cache hit for question: {question[:30]}...")
                return json.loads(cached_data)
            return None
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None
    
    def cache_response(self, question: str, response: str) -> bool:
        """Cache a response for a question."""
        if not self.is_available():
            return False
            
        try:
            normalized_question = self._normalize_question(question)
            cache_key = f"{self.cache_key_prefix}{normalized_question}"
            
            # Store the response
            self.redis_client.set(cache_key, json.dumps(response))
            
            # Update the frequency counter
            self.redis_client.zincrby(self.frequency_key, 1, normalized_question)
            
            # Maintain only the top max_cached_items in cache
            self._prune_cache()
            
            logger.info(f"Cached response for question: {question[:30]}...")
            return True
        except Exception as e:
            logger.error(f"Error caching response: {str(e)}")
            return False
    
    def _prune_cache(self) -> None:
        """Remove least frequently asked questions if cache exceeds max size."""
        try:
            # Get all questions sorted by frequency
            all_questions = self.redis_client.zrange(self.frequency_key, 0, -1, desc=True, withscores=True)
            
            # If we have more than max_cached_items, remove the least frequent ones
            if len(all_questions) > self.max_cached_items:
                # Keep only top max_cached_items
                questions_to_keep = all_questions[:self.max_cached_items]
                questions_to_remove = all_questions[self.max_cached_items:]
                
                for question, _ in questions_to_remove:
                    cache_key = f"{self.cache_key_prefix}{question.decode('utf-8')}"
                    self.redis_client.delete(cache_key)
                    self.redis_client.zrem(self.frequency_key, question)
        except Exception as e:
            logger.error(f"Error pruning cache: {str(e)}")
    
    def clear_cache(self) -> bool:
        """Clear all cached items."""
        if not self.is_available():
            return False
            
        try:
            # Get all cache keys and delete them
            all_questions = self.redis_client.zrange(self.frequency_key, 0, -1)
            for question in all_questions:
                cache_key = f"{self.cache_key_prefix}{question.decode('utf-8')}"
                self.redis_client.delete(cache_key)
            
            # Clear the frequency counter
            self.redis_client.delete(self.frequency_key)
            logger.info("Cache cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False
    
    def get_top_questions(self, count: int = None) -> List[Tuple[str, int]]:
        """Get the most frequently asked questions with their frequencies."""
        if not self.is_available():
            return []
            
        try:
            max_count = count or self.max_cached_items
            questions = self.redis_client.zrange(
                self.frequency_key, 0, max_count-1, 
                desc=True, withscores=True
            )
            return [(q.decode('utf-8'), int(score)) for q, score in questions]
        except Exception as e:
            logger.error(f"Error getting top questions: {str(e)}")
            return []
    
    def _normalize_question(self, question: str) -> str:
        """Normalize question to create a consistent cache key."""
        # Simple normalization: lowercase and strip whitespace
        # In a more advanced implementation, you might use semantic similarity
        return question.lower().strip()
