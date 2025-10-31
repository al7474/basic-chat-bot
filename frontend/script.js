// Cargar historial de la sesión actual
async function loadSessionHistory() {
  let chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  let userId =
    localStorage.getItem("userId") ||
    document.getElementById("client-id").value;
  // Obtener todas las sesiones del usuario
  let sessionsRes = await fetch(
    `http://127.0.0.1:8000/user/${userId}/sessions`
  );
  if (!sessionsRes.ok) return;
  let sessions = await sessionsRes.json();
  for (let session of sessions) {
    let res = await fetch(
      `http://127.0.0.1:8000/session/${session.id}/history?cliente_id=${userId}`
    );
    if (res.ok) {
      let data = await res.json();
      if (data.history.length > 0) {
        if (!localStorage.getItem("sessionId")) {
          localStorage.setItem("sessionId", session.id);
        }
        data.history.forEach((msg) => {
          if (msg.sender === "user") {
            chatBox.innerHTML += `<p><strong>You:</strong> ${msg.message}</p>`;
          } else {
            chatBox.innerHTML += `<p><strong>Bot:</strong> ${msg.message}</p>`;
          }
        });
        break;
      }
    }
  }
}
// --- Manejo de expiración automática de sesión ---
const SESSION_TIMEOUT_MINUTES = 1;
let sessionTimeoutHandle = null;

function resetSessionTimeout() {
  if (sessionTimeoutHandle) clearTimeout(sessionTimeoutHandle);
  sessionTimeoutHandle = setTimeout(() => {
    // Guardar el sessionId anterior
    let currentSessionId = localStorage.getItem("sessionId");
    if (currentSessionId) {
      localStorage.setItem("lastSessionId", currentSessionId);
    }
    // Solo borra el sessionId, NO limpies el chat
    localStorage.removeItem("sessionId");
    // Notifica al usuario pero NO limpies el historial
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.innerHTML +=
        '<p style="color:gray;"><em>La sesión ha expirado, tus próximos mensajes se guardarán como una nueva conversación, pero puedes seguir escribiendo aquí.</em></p>';
    }
  }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
}
function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
}

function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}

async function registerUser() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  if (!username || !password) {
    alert("Usuario y contraseña requeridos");
    return;
  }
  // Llama a tu endpoint de registro (ajusta la URL si es necesario)
  const res = await fetch("http://127.0.0.1:8000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.ok) {
    alert("Registro exitoso, ahora inicia sesión");
    showLogin();
  } else {
    alert("Error en el registro");
  }
}

async function loginUser() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  if (!username || !password) {
    alert("Usuario y contraseña requeridos");
    return;
  }
  const res = await fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.ok) {
    const data = await res.json();
    // Guardar sesión y usuario en LocalStorage
    localStorage.setItem("userId", data.user_id);
    document.getElementById("auth-forms").style.display = "none";
    document.getElementById("chat-ui").style.display = "block";
    document.getElementById("client-id").value = data.user_id;
    // Mantener sessionId si existe, si no, se creará al enviar mensaje
  } else {
    alert("Credenciales incorrectas");
  }
}

function logoutUser() {
  // Borrar datos de sesión y usuario
  localStorage.removeItem("userId");
  localStorage.removeItem("sessionId");
  document.getElementById("chat-ui").style.display = "none";
  document.getElementById("auth-forms").style.display = "block";
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("register-username").value = "";
  document.getElementById("register-password").value = "";
}
async function sendMessage() {
  let userInput = document.getElementById("user-input");
  let chatBox = document.getElementById("chat-box");
  let modelSelect = document.getElementById("model-select");
  let clientId = document.getElementById("client-id");

  if (userInput.value.trim() === "") return;

  // Display user message
  chatBox.innerHTML += `<p><strong>You:</strong> ${userInput.value}</p>`;

  // Obtener o generar sessionId y userId
  let sessionId = localStorage.getItem("sessionId");
  let userId = localStorage.getItem("userId") || clientId.value;
  // Enviar mensaje a FastAPI, asegurando que nunca se envíe undefined
  let response = await fetch("http://127.0.0.1:8000/chat/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userInput.value,
      model: modelSelect.value,
      cliente_id: userId ?? null,
      session_id: sessionId ?? null,
    }),
  });

  if (!response.ok) {
    chatBox.innerHTML += `<p style="color:red;"><strong>Bot:</strong> Error: No se pudo procesar el mensaje. (Código ${response.status})</p>`;
    return;
  }

  let data = await response.json();

  // Guardar sessionId si el backend lo devuelve (primera vez)
  if (data.session_id) {
    // Antes de cambiar el sessionId, guardar el anterior
    let currentSessionId = localStorage.getItem("sessionId");
    if (currentSessionId && currentSessionId !== data.session_id) {
      localStorage.setItem("lastSessionId", currentSessionId);
    }
    localStorage.setItem("sessionId", data.session_id);
  }

  // Display bot response
  if (data.reply !== undefined) {
    chatBox.innerHTML += `<p><strong>Bot:</strong> ${data.reply}</p>`;
  } else {
    chatBox.innerHTML += `<p style="color:red;"><strong>Bot:</strong> Error: No se pudo obtener respuesta del bot.</p>`;
  }

  // Clear input field
  userInput.value = "";

  // Reiniciar temporizador de expiración de sesión
  resetSessionTimeout();
}

// Al cargar la página, mantener sesión si existe
window.onload = function () {
  const userId = localStorage.getItem("userId");
  if (userId) {
    document.getElementById("auth-forms").style.display = "none";
    document.getElementById("chat-ui").style.display = "block";
    document.getElementById("client-id").value = userId;
    resetSessionTimeout();
    loadSessionHistory();
  } else {
    document.getElementById("auth-forms").style.display = "block";
    document.getElementById("chat-ui").style.display = "none";
  }
};
