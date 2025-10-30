
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from backend.models.model_loader import generate_response
from backend.models.groq_model import generate_response_groq
from passlib.hash import bcrypt
from prisma import Prisma


app = FastAPI()
db = Prisma()

# Enable CORS (Allows frontend to communicate with backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


# Auth models
class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserMessage(BaseModel):
    message: str
    model: str = "gemini"  # Por defecto usa Gemini
    cliente_id: str = None
    session_id: str = None

# Registro
@app.post("/register")
async def register(data: RegisterRequest):
    print(f"[DEBUG] Contraseña recibida: {repr(data.password)} (longitud: {len(data.password)})")
    if len(data.password) > 72:
        raise HTTPException(status_code=400, detail="La contraseña no puede tener más de 72 caracteres.")
    exists = await db.user.find_unique(where={"username": data.username})
    if exists:
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    # Guardar la contraseña en texto plano (solo para pruebas, NO recomendado en producción)
    user = await db.user.create({"username": data.username, "password": data.password})
    return {"user_id": user.id, "username": user.username}

# Login
@app.post("/login")
async def login(data: LoginRequest):
    user = await db.user.find_unique(where={"username": data.username})
    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"user_id": user.id, "username": user.username}

@app.post("/chat/")
async def chat_with_bot(user_message: UserMessage):
    """Chat endpoint for sending user messages to the bot and saving conversation."""
    # Buscar o crear sesión
    session = None
    if hasattr(user_message, 'session_id') and user_message.session_id:
        session = await db.session.find_unique(where={"id": user_message.session_id})
    if not session:
        session = await db.session.create({
            "userId": user_message.cliente_id,
            "clientId": None
        })
    # Guardar mensaje del usuario
    await db.conversation.create({
        "message": user_message.message,
        "sender": "user",
        "sessionId": session.id,
        "userId": user_message.cliente_id,
        "clientId": None
    })
    # Obtener respuesta del bot
    if user_message.model == "groq":
        response = generate_response_groq(user_message.message)
    else:
        response = generate_response(user_message.message)
    # Guardar respuesta del bot
    await db.conversation.create({
        "message": response,
        "sender": "bot",
        "sessionId": session.id,
        "userId": user_message.cliente_id,
        "clientId": None
    })
    return {"reply": response, "session_id": session.id}

# Root route for testing
@app.get("/")
async def root():
    return {"message": "Chatbot Backend Running!"}
