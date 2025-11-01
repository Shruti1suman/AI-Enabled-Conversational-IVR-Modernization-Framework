// Responsible for sending DTMF events to backend and handling responses.
                                                          // Mainly milestone 2 supporting backend endpoints

export async function sendDTMF(digit) {
  const callId = window.currentCallId || null;
  if (!callId) {
    console.warn("sendDTMF: no active call");
    return;
  }

  if (typeof window.stopTyping === "function") window.stopTyping();
  if (typeof window.stopVoice === "function") window.stopVoice();

  try {
    const res = await fetch("http://127.0.0.1:8000/ivr/dtmf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: callId, digit })
    });

    if (!res.ok) {
      console.error("DTMF backend error", res.status);
      return;
    }

    const data = await res.json();
    const displayText = data.prompt || data.message || "";

    if (typeof window.speakAndTypeInSync === "function") {
      await window.speakAndTypeInSync(displayText);
    } else {
      const el = document.getElementById("ivr-display");
      if (el) el.innerText = displayText;
      if (typeof window.speak === "function") window.speak(displayText);
    }

    // If call ended per backend, ensure we wait for TTS to finish then end call
    if (data.status === "ended" || data.status === "call_ended") {
      await new Promise(resolve => {
        const check = () => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) return resolve();
          setTimeout(check, 120);
        };
        check();
      });

      if (typeof window.endCall === "function") window.endCall();
    }

    return data;
  } catch (err) {
    console.error("sendDTMF error", err);
  }
}

