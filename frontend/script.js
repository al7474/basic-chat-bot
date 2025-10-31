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
    body: JSON.stringify({ username, password })
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
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    const data = await res.json();
    // Guardar sesión y usuario en LocalStorage
    localStorage.setItem('userId', data.user_id);
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
  localStorage.removeItem('userId');
  localStorage.removeItem('sessionId');
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
  let sessionId = localStorage.getItem('sessionId');
  let userId = localStorage.getItem('userId') || clientId.value;
  // Enviar mensaje a FastAPI
  let response = await fetch("http://127.0.0.1:8000/chat/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userInput.value,
      model: modelSelect.value,
      cliente_id: userId,
      session_id: sessionId
    }),
  });

  let data = await response.json();

  // Guardar sessionId si el backend lo devuelve (primera vez)
  if (data.session_id) {
    localStorage.setItem('sessionId', data.session_id);
  }

  // Display bot response
  chatBox.innerHTML += `<p><strong>Bot:</strong> ${data.reply}</p>`;

  // Clear input field
  userInput.value = "";
}

// Al cargar la página, mantener sesión si existe
window.onload = function() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    document.getElementById("auth-forms").style.display = "none";
    document.getElementById("chat-ui").style.display = "block";
    document.getElementById("client-id").value = userId;
  } else {
    document.getElementById("auth-forms").style.display = "block";
    document.getElementById("chat-ui").style.display = "none";
  }
};

