import asyncio
import websockets
import json
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatClient:
    def __init__(self, websocket_url: str = "ws://localhost:8000/chat"):
        self.websocket_url = websocket_url
        self.websocket = None

    async def connect(self):
        """Establish WebSocket connection to the server."""
        try:
            self.websocket = await websockets.connect(self.websocket_url)
            logger.info("Connected to WebSocket server")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket server: {str(e)}")
            return False

    async def send_query(self, 
                        question: str, 
                        vector_store: str = "KG", 
                        query_transformation: Optional[str] = None):
        """Send a query to the server and receive streaming responses."""
        if not self.websocket:
            logger.error("Not connected to server")
            return

        try:
            # Prepare the query message
            message = {
                "question": question,
                "vector_store": vector_store,
                "query_transformation": query_transformation
            }
            
            # Send the query
            await self.websocket.send(json.dumps(message))
            logger.info(f"Sent query: {question}")

            # Receive and process streaming responses
            while True:
                response = await self.websocket.recv()
                data = json.loads(response)

                if "error" in data:
                    logger.error(f"Server error: {data['error']}")
                    break

                if data["type"] == "chunk":
                    print(data["content"], end="", flush=True)
                elif data["type"] == "complete":
                    print("\nResponse complete")
                    break

        except websockets.exceptions.ConnectionClosed:
            logger.error("Connection closed unexpectedly")
        except Exception as e:
            logger.error(f"Error during query: {str(e)}")

    async def close(self):
        """Close the WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            logger.info("Connection closed")

async def main():
    # Create client instance
    client = ChatClient()

    # Connect to server
    if not await client.connect():
        return

    try:
        while True:
            # Get user input
            print("\nEnter your question (or 'quit' to exit):")
            question = input().strip()
            
            if question.lower() == 'quit':
                break

            print("\nSelect vector store (1: KG, 2: vector):")
            vector_store_choice = input().strip()
            vector_store = "KG" if vector_store_choice == "1" else "vector"

            print("\nUse query transformation? (1: None, 2: HyDE):")
            transform_choice = input().strip()
            query_transformation = "HyDE" if transform_choice == "2" else None

            print("\nResponse:")
            await client.send_query(
                question=question,
                vector_store=vector_store,
                query_transformation=query_transformation
            )

    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main()) 