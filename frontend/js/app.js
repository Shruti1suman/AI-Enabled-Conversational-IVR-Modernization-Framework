
// Main application: UI, TTS, typing, call lifecycle
                                                     // Partly milestone 2 and milstone 3 with supporting backend endpoints
                                                            // and text to speech conversion (integrated voice output)

const BASE_URL = "https://ai-enabled-conversational-ivr-b1zr.onrender.com";                                                            

import { sendDTMF } from "./dtmf.js";
import { startVoiceLoop, stopVoiceLoop } from "./voiceInput.js";

let currentCallId = null;
let callStartTime = null;
let callTimerInterval = null;
let typingSessionId = 0;
let currentUtterance = null;
let callActive = false;

window.speechSynthesis.onvoiceschanged = () => {
  console.log("Voices loaded");
};

const ivrDisplay = () => document.getElementById("ivr-display");
const waveformEl = () => document.getElementById("waveform");
const startBtn = () => document.getElementById("start-btn");
const endBtn = () => document.getElementById("end-btn");
const callStatusEl = () => document.getElementById("call-status");

function setCurrentCallId(id) {
  currentCallId = id;
  window.currentCallId = id;
}

export function stopTyping() {
  typingSessionId += 1;
}

export function stopVoice() {
  try {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
  } catch (e) { /* ignore */ }
  currentUtterance = null;
  waveformEl()?.classList.remove("active");
}

async function typeTextSync(text, cps = 12) {
  const mySession = ++typingSessionId;
  const el = ivrDisplay();
  if (!el) return { aborted: true };

  el.innerText = ""; 

  const delayMs = Math.max(1, Math.round(1000 / Math.max(1, cps)));

  for (let i = 1; i <= text.length; i++) {
    if (mySession !== typingSessionId) return { aborted: true };
    el.innerText = text.slice(0, i);
    await new Promise(r => setTimeout(r, delayMs));
  }
  return { aborted: false };
}

// choose a female sounding voice if available
function getFemaleVoice() {
  const voices = speechSynthesis.getVoices() || [];
  return voices.find(v => /female|woman|zira|aria|eva|susan|neural|en-in/i.test(v.name)) || null;
}

export function speak(text, { lang = "en-US", rate = 0.96, pitch = 1.32, volume = 1.0, interrupt = true } = {}) {
  if (interrupt) stopVoice();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;
  u.volume = volume;

  const female = getFemaleVoice();
  if (female) u.voice = female;

  currentUtterance = u;

  u.onstart = () => waveformEl()?.classList.add("active");
  u.onend = () => waveformEl()?.classList.remove("active");
  u.oncancel = () => waveformEl()?.classList.remove("active");

  try {
    speechSynthesis.speak(u);
  } catch (e) {
    console.warn("TTS speak error:", e);
  }
  return u;
}

// speak + type in sync
export async function speakAndTypeInSync(text) {
  stopTyping();
  stopVoice();

  speak(text, { interrupt: false });

  const cps = 14 * (currentUtterance?.rate || 1.0);
  return await typeTextSync(text, cps);
}

// enable/disable keypad buttons
export function enableKeypad(enable) {
  document.querySelectorAll(".digit").forEach(btn => btn.disabled = !enable);
}
enableKeypad(false);
export async function startCall() {
  try {
    const res = await fetch(`${BASE_URL}/ivr/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caller_number: "SIMULATED" })
    });

    const data = await res.json();

    setCurrentCallId(data.call_id || null);

    callStatusEl() && (callStatusEl().innerText = "Connected");
    enableKeypad(true);
    startBtn() && (startBtn().disabled = true);
    endBtn() && (endBtn().disabled = false);

    callStartTime = new Date();
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(updateCallDuration, 1000);

    callActive = true;
    //Start voice recognition immediately
    startVoiceLoop();
    await speakAndTypeInSync(data.prompt || data.message || "");

  } catch (err) {
    console.error("startCall error", err);
  }
}


function updateCallDuration() {
  if (!callStartTime) return;
  const s = Math.floor((Date.now() - callStartTime) / 1000);
  callStatusEl() && (callStatusEl().innerText = `Connected (${s}s)`);
}

export function endCall() {
  stopTyping();
  waveformEl()?.classList.remove("active");
  const el = ivrDisplay();
  if (el) el.innerText = "Thank you";

  stopVoice();

  callActive = false;
  stopVoiceLoop();

  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }

  callStatusEl() && (callStatusEl().innerText = "Call Ended");
  enableKeypad(false);
  endBtn() && (endBtn().disabled = true);
  startBtn() && (startBtn().disabled = false);

  setCurrentCallId(null);
}

window.stopTyping = stopTyping;
window.stopVoice = stopVoice;
window.speakAndTypeInSync = speakAndTypeInSync;
window.endCall = endCall;

document.addEventListener("DOMContentLoaded", () => {
  const s = startBtn();
  const e = endBtn();

  if (s) s.addEventListener("click", startCall);
  if (e) e.addEventListener("click", endCall);

  document.querySelectorAll(".digit").forEach(btn => {
    btn.addEventListener("click", () => {
      const digit = btn.getAttribute("data-digit") || btn.innerText.trim();
      if (typeof sendDTMF === "function") sendDTMF(digit);
    });
  });
});

window.addEventListener("beforeunload", () => {
  stopVoice();
  stopVoiceLoop();
});


