class Chat:
    """Manages chat history with a fixed size buffer."""
    def __init__(self, size: int):
        self.size = size
        self.buffer = []

    def append(self, item: dict):
        self.buffer.append(item)
        if len(self.buffer) > 2 * self.size:
            self.buffer = self.buffer[-2 * self.size:]

    def to_list(self) -> list:
        return self.buffer