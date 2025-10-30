
import requests
import os
from dotenv import load_dotenv

# Cargar .env desde la raíz del proyecto
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
def generate_response(user_input: str) -> str:
    """Generates a response from the Google Gemini API."""
    if not user_input.strip():
        return "I'm here! How can I help you?"

    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    API_KEY = os.getenv("GEMINI_API_KEY", "")

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": user_input}
                ]
            }
        ]
    }

    try:
        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        # Ajusta el acceso según la estructura de la respuesta de Gemini
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"❌ Error connecting to Gemini API: {e}")
        return "Oops! Couldn't connect to Gemini API."

