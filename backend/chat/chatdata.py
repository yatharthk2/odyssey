from collections import deque

class Chat:
    """Manages chat history with a fixed size buffer."""
    def __init__(self, size: int):
        self.size = size
        self.buffer = deque(maxlen=2 * size)  # Use deque with maxlen

    def append(self, item: dict):
        self.buffer.append(item)  # No need for manual truncation

    def to_list(self) -> list:
        return list(self.buffer)