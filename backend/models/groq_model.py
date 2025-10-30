
import requests
import os
from dotenv import load_dotenv
from pathlib import Path
# Cargar .env desde la raíz del proyecto
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# --- Menú y promociones de ejemplo (puedes personalizar o importar si lo deseas) ---
menu = [
    {"nombre": "Pizza Margarita", "descripcion": "Tomate, queso mozzarella, albahaca fresca"},
    {"nombre": "Hamburguesa BBQ", "descripcion": "Carne, salsa BBQ, cebolla caramelizada"},
    {"nombre": "Sushi de salmón", "descripcion": "Salmón fresco, arroz, algas"}
]

promociones = ["Combo Pizza + Bebida 10% OFF", "Ensalada César con 5% de descuento"]

# --- Historial y estado de ejemplo (puedes adaptar a tu lógica real) ---
chat_history = {}
estado_cliente = {}

def build_prompt(cliente_id, user_message):
    history = chat_history.get(cliente_id, [])
    estado = estado_cliente.get(cliente_id, {"pedido_confirmado": False, "oferta_pendiente": None})
    history.append(f"Cliente: {user_message}")
    menu_context = "\n".join([f"{item['nombre']}: {item['descripcion']}" for item in menu])
    promo_context = "\n".join(promociones)
    if user_message.lower().strip() in ["sí", "si", "ok", "claro", "vale"]:
        if estado.get("oferta_pendiente"):
            oferta = estado["oferta_pendiente"]
            estado["oferta_pendiente"] = None
            estado_cliente[cliente_id] = estado
            return "\n".join(history + [f"Mesero: ¡Genial! Solo para confirmar, ¿te refieres a la oferta '{oferta}'?"])
    if any(p in user_message.lower() for p in ["finalizar pedido", "confirmar", "eso es todo"]):
        estado["pedido_confirmado"] = True
        estado_cliente[cliente_id] = estado
        return "\n".join(history + ["Mesero: Pedido confirmado ✅. ¡Gracias por preferirnos!"])
    if "finalizar pedido" in user_message.lower() or "confirmar" in user_message.lower():
        prompt = "\n".join(
            history +
            ["Mesero: Gracias por su pedido. Lo hemos confirmado y estará listo en breve. Si necesita algo más, no dude en preguntar."]
        )
    elif "menu" in user_message.lower() or "carta" in user_message.lower():
        prompt = "\n".join(
            history +
            ["Mesero: Claro, aquí tienes nuestro menú. Responde únicamente con los elementos del menú proporcionado:", menu_context]
        )
    elif "promociones" in user_message.lower():
        prompt = "\n".join(
            history +
            ["Información relevante del restaurante:", promo_context, "Mesero: Soy Restaurante Inteligente, tu asistente del restaurante. Responde de manera breve, directa y sin inventar nombres ni pedir información personal."]
        )
    elif "cómo te llamas" in user_message.lower() or "tu nombre" in user_message.lower():
        prompt = "\n".join(
            history +
            ["Mesero: Soy Restaurante Inteligente, tu asistente del restaurante. Responde de manera breve, directa y sin inventar nombres ni pedir información personal."]
        )
    else:
        prompt = "\n".join(
            history +
            ["Información relevante del restaurante:", menu_context, promo_context, "Mesero: Soy Restaurante Inteligente, tu asistente del restaurante. Responde de manera breve, directa y sin inventar nombres ni pedir información personal."]
        )
    chat_history[cliente_id] = history
    estado_cliente[cliente_id] = estado
    return prompt

def query_llama(messages):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 100
    }
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def generate_response_groq(user_input: str, cliente_id: str = "cliente_demo", restaurant_name: str = "Restaurante Demo") -> str:
    prompt_text = build_prompt(cliente_id, user_input)
    messages = [
        {"role": "system", "content": f"Eres un asistente del restaurante {restaurant_name}. Responde amable y profesional."},
        {"role": "user", "content": prompt_text}
    ]
    ai_response = query_llama(messages)
    if "oferta" in ai_response.lower() or "descuento" in ai_response.lower():
        estado_cliente[cliente_id]["oferta_pendiente"] = ai_response
    chat_history.setdefault(cliente_id, []).append(f"Mesero: {ai_response}")
    return ai_response
