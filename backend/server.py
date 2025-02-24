from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
import os
from dotenv import load_dotenv
from chat.ChatManager import ChatManager
from settings import PropertyGraphSettings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChatManager
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables")

settings = PropertyGraphSettings(
    pdf_directory="./documents",  # Adjust path as needed
    groq_api_key=groq_api_key
)

chat_manager = ChatManager(settings=settings)
if not chat_manager.initialize_system():
    raise RuntimeError("Failed to initialize ChatManager system")

@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive and parse the message from client
            data = await websocket.receive_text()
            request = json.loads(data)
            
            # Extract parameters from request
            question = request.get('question')
            vector_store = request.get('vector_store', 'KG')  # Default to KG if not specified
            query_transformation = request.get('query_transformation', None)
            
            if not question:
                await websocket.send_text(json.dumps({
                    "error": "Question is required"
                }))
                continue
            
            # Process the query and stream responses
            try:
                for response_chunk in chat_manager.query(
                    question=question,
                    query_transformation=query_transformation,
                    choice_of_vector_store=vector_store
                ):
                    await websocket.send_text(json.dumps({
                        "type": "chunk",
                        "content": response_chunk
                    }))
                
                # Send completion message
                await websocket.send_text(json.dumps({
                    "type": "complete"
                }))
                
            except Exception as e:
                logger.error(f"Error processing query: {str(e)}")
                await websocket.send_text(json.dumps({
                    "error": f"Error processing query: {str(e)}"
                }))
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()

@app.on_event("shutdown")
def shutdown_event():
    chat_manager.cleanup()

if __name__ == "__main__":
    import uvicorn
    import ssl

    # SSL configuration
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    try:
        ssl_context.load_cert_chain(
            '/etc/ssl/yatharthk.com.crt',
            '/etc/ssl/yatharthk.com.key',
            '/etc/ssl/ca_bundle.crt'
        )
    except Exception as e:
        logger.error(f"Failed to load SSL certificates: {e}")
        raise

    # Run with SSL
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        ssl_keyfile='/etc/ssl/yatharthk.com.key',
        ssl_certfile='/etc/ssl/yatharthk.com.crt'
    )