from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from backend.models.model_loader import generate_response

app = FastAPI()

# Enable CORS (Allows frontend to communicate with backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontend requests
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Define request format
class UserMessage(BaseModel):
    message: str

@app.post("/chat/")
async def chat_with_bot(user_message: UserMessage):
    """Chat endpoint for sending user messages to the bot."""
    response = generate_response(user_message.message)
    return {"reply": response}

# Root route for testing
@app.get("/")
async def root():
    return {"message": "Chatbot Backend Running!"}
