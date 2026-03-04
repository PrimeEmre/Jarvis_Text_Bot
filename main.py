from flask import Flask, render_template, request, jsonify, session
import requests
import json
import os
from datetime import date

app = Flask(__name__)
app.secret_key = "emre_ai_secret_123"

# ── Config ────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Jarvis, a highly intelligent AI assistant. You:
- Give concise answers unless asked to elaborate
- Admit when you don't know something
- Ask clarifying questions when a request is ambiguous
- Format responses with markdown when helpful (lists, code blocks, etc.)
- Remember context from earlier in the conversation and refer back to it
- Be proactive: if you notice a better way to do something, mention it

Today's date is: {date}
"""

MAX_HISTORY = 20

# ── Save and Load History ─────────────────────────────────────
def load_history(user_id):
    path = f"histories/{user_id}.json"
    try:
        return json.load(open(path)) if os.path.exists(path) else []
    except (json.JSONDecodeError, IOError):
        return []

def save_history(user_id, history):
    os.makedirs("histories", exist_ok=True)
    with open(f"histories/{user_id}.json", "w") as f:
        json.dump(history, f)

# ── Routes ────────────────────────────────────────────────────
@app.route("/")
def home():
    session["history"] = []
    session.setdefault("user_id", os.urandom(8).hex())
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    user_id      = session.get("user_id", "default")
    history      = load_history(user_id)

    # Add user message to history
    history.append({
        "role": "user",
        "content": user_message
    })

    # Keep only last 20 messages
    history = history[-MAX_HISTORY:]

    # Build the payload for Ollama
    payload = {
        "model": "gemma3n",        # using gemma3n model
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT.format(date=date.today())
            }
        ] + history,
        "stream": False,
        "options": {
            "temperature": 0.7,    # creativity level
            "top_p": 0.9,          # probability threshold
            "repeat_penalty": 1.1  # prevents repetition
        }
    }

    try:
        # Send request to Ollama
        response = requests.post(
            "http://localhost:11434/api/chat",
            json=payload,
            timeout=120
        )

        result     = response.json()
        ai_message = result["message"]["content"]

        # Add AI response to history
        history.append({
            "role": "assistant",
            "content": ai_message
        })

        # Save updated history
        session["history"] = history
        save_history(user_id, history)

        return jsonify({"response": ai_message})

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500


# ── Text to Speech Route ──────────────────────────────────────
@app.route("/speak", methods=["POST"])
def speak():
    from gtts import gTTS
    import io

    text = request.json.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        # Convert text to speech using gTTS
        tts = gTTS(text=text, lang="en", slow=False)

        # Save to memory buffer instead of file
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        from flask import send_file
        return send_file(
            audio_buffer,
            mimetype="audio/mpeg",
            as_attachment=False
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Model info route ──────────────────────────────────────────
@app.route("/models", methods=["GET"])
def get_models():
    try:
        # Get list of installed Ollama models
        response = requests.get("http://localhost:11434/api/tags")
        models   = response.json().get("models", [])
        names    = [m["name"] for m in models]
        return jsonify({"models": names})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)