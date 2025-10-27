let callId = null;
const apiBase = "http://127.0.0.1:8000";

async function startCall() {
  const number = document.getElementById("caller").value;
  const response = await fetch(`${apiBase}/ivr/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caller_number: number })
  });

  const data = await response.json();
  callId = data.call_id || null;
  document.getElementById("ivr-display").innerText = data.prompt || data.message;
  
  // show keypad
  renderKeypad(true);
}

function renderKeypad(enable = true) {
  const keypadDiv = document.getElementById("keypad");
  const buttons = keypadDiv.querySelectorAll(".digit");

  buttons.forEach(btn => {
    const num = btn.textContent.trim();

    if (enable) {
      btn.disabled = false;
      btn.classList.remove("disabled");

      // Re-bind the click event dynamically
      btn.onclick = () => sendDTMF(num);
     
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");

      // Remove the click event when disabled
      btn.onclick = null;
    }
  });
}



function sendDTMF(digit) {
    fetch("http://127.0.0.1:8000/ivr/dtmf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ digit: digit })
    })
    .then(response => response.json())
    .then(data => {
        console.log("DTMF Response:", data);
         document.getElementById("ivr-display").innerText = data.prompt || data.message;
    })
    .catch(error => console.error("Error:", error));
}

function endCall() {
  renderKeypad(false); // 🚫 Disable keypad
  document.getElementById("ivr-display").innerText = "Call ended.";
}



