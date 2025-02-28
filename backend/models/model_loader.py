from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Model Name (Using DialoGPT-medium)
MODEL_NAME = "microsoft/DialoGPT-medium"

# Load Tokenizer & Model
print("Loading DialoGPT model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME).to("cuda" if torch.cuda.is_available() else "cpu")

print("✅ DialoGPT model loaded successfully!")

def generate_response(user_input: str) -> str:
    """Generates a response from the chatbot model."""

    if not user_input.strip():
        return "I'm here! How can I help you?"  # Handle empty input

    try:
        # Tokenize input
        inputs = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")

        # Generate response
        output = model.generate(inputs, max_new_tokens=50, pad_token_id=tokenizer.eos_token_id)

        # Decode response
        response = tokenizer.decode(output[:, inputs.shape[-1]:][0], skip_special_tokens=True)
        return response

    except Exception as e:
        print(f"❌ Error generating response: {e}")
        return "Oops! Something went wrong."
