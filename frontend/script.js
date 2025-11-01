// Globals
let currentCallId = null;
let callStartTime = null;
let callTimerInterval = null;
let typingSessionId = 0; 
let currentUtterance = null;

window.speechSynthesis.onvoiceschanged = () => {
  console.log("Voices loaded");
};


const ivrDisplay = () => document.getElementById("ivr-display");
const waveformEl = () => document.getElementById("waveform");

function stopTyping() {
  typingSessionId += 1; 
}

function stopVoice() {
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
  if (waveformEl()) waveformEl().classList.remove("active");
}

async function typeTextSync(text, charsPerSecond = 12) {
  // Create a local token for this session
  const mySession = ++typingSessionId;
  const el = ivrDisplay();
  if (!el) return;

  el.innerText = "";

  const cps = Math.max(1, charsPerSecond);
  const delayMs = Math.max(1, Math.round(1000 / cps));

  for (let i = 1; i <= text.length; i++) {
    if (mySession !== typingSessionId) {
      return { aborted: true };
    }
    el.innerText = text.slice(0, i);
    // give browser a tick (allow render)
    await new Promise(r => setTimeout(r, delayMs));
  }

  return { aborted: false };
}

// helper to pick a female voice
function getFemaleVoice() {
  const voices = speechSynthesis.getVoices();

  // look for female-sounding voice names
  return voices.find(v =>
    /female|woman|zira|aria|eva|susan|uk|en-us|neural/i.test(v.name)
  );
}


function speak(text, { lang = "en-US", rate = 0.96, pitch = 1.32, volume = 1.0, interrupt = true } = {}) {
  // stop previous utterance if requested
  if (interrupt) {
    stopVoice(); 
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;

    // apply female voice if found
  const femaleVoice = getFemaleVoice();
  if (femaleVoice) {
    u.voice = femaleVoice;
  }

  currentUtterance = u;

  // waveform start/stop
  u.onstart = () => {
    const w = waveformEl();
    if (w) w.classList.add("active");
  };
  u.onend = () => {
    const w = waveformEl();
    if (w) w.classList.remove("active");
  };
  u.oncancel = () => {
    const w = waveformEl();
    if (w) w.classList.remove("active");
  };

  speechSynthesis.speak(u);
  return u;
}

// This version runs the typewriter and TTS in sync as best-effort:

async function speakAndTypeInSync(text) {
  stopTyping();
  stopVoice();

  // start speaking 
  speak(text, { interrupt: false }); 

  // Start typing with a speed proportional to TTS rate (tweak cps constant if needed)
  // Use characters-per-second estimate: 14 * rate is reasonable (adjust to taste)
  const cps = 14 * (currentUtterance?.rate || 1.0);
  const result = await typeTextSync(text, cps);

  return result;
}

/* ----------------- Example integration: startCall and sendDTMF ----------------- */

async function startCall() {
  try {
    const res = await fetch("http://127.0.0.1:8000/ivr/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caller_number: "SIMULATED" })
    });
    const data = await res.json();

    currentCallId = data.call_id;

    document.getElementById("call-status").innerText = "Connected";
    enableKeypad(true);
    document.getElementById("end-btn").disabled = false;
    document.getElementById("start-btn").disabled = true;
    callStartTime = new Date();
    callTimerInterval = setInterval(updateCallDuration, 1000);

    await speakAndTypeInSync(data.prompt || data.message);

  } catch (err) {
    console.error("startCall error", err);
  }
}

async function sendDTMF(digit) {
  if (!currentCallId) return;

  stopTyping();
  stopVoice();

  try {
    const res = await fetch("http://127.0.0.1:8000/ivr/dtmf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: currentCallId, digit })
    });
    const data = await res.json();
    const displayText = data.prompt || data.message || "";

    if (data.status === "ended" || data.status === "call_ended") {
      await speakAndTypeInSync(displayText);
      // ensure TTS finishes before ending call
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        await new Promise(resolve => {
          const onEnd = () => {
            speechSynthesis.removeEventListener("end", onEnd);
            resolve();
          };
          // Note: use utterance.onend ideally; as a fallback, poll
          // we attach to currentUtterance for reliability:
          if (currentUtterance) currentUtterance.onend = resolve;
          else {
            // fallback poll
            const t = setInterval(() => {
              if (!speechSynthesis.speaking && !speechSynthesis.pending) {
                clearInterval(t);
                resolve();
              }
            }, 150);
          }
        });
      }
      endCall();
    } else {
      speakAndTypeInSync(displayText);
    }

  } catch (err) {
    console.error("sendDTMF error", err);
  }
}

/* ----------------- Utility functions used above (ensure they exist) ----------------- */

function enableKeypad(enable) {
  document.querySelectorAll(".digit").forEach(btn => btn.disabled = !enable);
}

function updateCallDuration() {
  if (!callStartTime) return;
  const s = Math.floor((Date.now() - callStartTime) / 1000);
  document.getElementById("call-status").innerText = `Connected (${s}s)`;
}

function endCall() {
  stopTyping();
  waveformEl().classList.remove("active");
  const el = ivrDisplay();
  if (!el) return;
  el.innerText = "Thank you";
  stopVoice();
  if (callTimerInterval) clearInterval(callTimerInterval);
  document.getElementById("call-status").innerText = "Call Ended";
  enableKeypad(false);
  document.getElementById("end-btn").disabled = true;
  document.getElementById("start-btn").disabled = false;
  currentCallId = null;
}



