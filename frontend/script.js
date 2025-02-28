async function sendMessage() {
  let userInput = document.getElementById("user-input");
  let chatBox = document.getElementById("chat-box");

  if (userInput.value.trim() === "") return;

  // Display user message
  chatBox.innerHTML += `<p><strong>You:</strong> ${userInput.value}</p>`;

  // Send message to FastAPI
  let response = await fetch("http://127.0.0.1:8000/chat/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userInput.value }),
  });

  let data = await response.json();

  // Display bot response
  chatBox.innerHTML += `<p><strong>Bot:</strong> ${data.reply}</p>`;

  // Clear input field
  userInput.value = "";
}
