                                                    //Completed milestone 3, integrating endpoints with 
                                                    // enabling voice input feature

//speech recognition that maps keywords to digits.
import { sendDTMF } from "./dtmf.js";

const voiceMap = {
  //main menu
  booking: "1", book: "1", reservation: "1", book_ticket: "1",
  flight: "2", status: "2", pnr: "2", schedule: "2",
  cancel: "3", cancellation: "3", refund: "3", cancel_ticket: "3",
  baggage: "4", bag: "4", luggage: "4",
  loyalty: "5", rewards: "5", points: "5", miles: "5",
  feedback: "6", review: "6", rating: "6",
  offers: "7", offer: "7", 
  callback: "8", call_back: "8", schedule: "8", ringback: "8",
  agent: "9", representative: "9", executive: "9", support: "9", human: "9",
  emergency: "0", help: "0",
  return: "*", return_back: "*", go_home: "*",

  //booking submenu
  domestic: "1", india: "1", local: "1",
  international: "2", abroad: "2", foreign: "2",
  meal: "3",
  back: "0", return: "0", previous: "0", go_back: "0",

  // meal preferences
  veg: "1", vegetarian: "1", vegan: "1",
  nonveg: "2", non_veg: "2", chicken: "2",
  jain: "3",

  //baggage submenu
  lost: "1", missing: "1", misplaced: "1",
  track: "2", tracking: "2", complaint: "2",
  damaged: "3", broken: "3", dented: "3",

  //callback durations
  fifteen: "1", quarter: "1",
  hour: "2", "1hour": "2",

  //loyalty
  redeem: "2", redeem_points: "2", points: "1",

  //Offers
  discount: "1", sale: "2", partner: "3",

  //admin
  admin: "0", diagnostic: "0", diagnostics: "0", diagnostic_menu: "0",

  //fallback numeric mapping
  zero: "0", jiro: "0",
  one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8",
  nine: "9", zero: "0", star: "*", asterix: "*",
  hash: "#", hashtag: "#",

  //extra speech
  won: "1", too: "2", to: "2", free: "3", for: "4", ate: "8",
};


let recognition = null;
let isVoiceActive = false;
let listening = false;  
let callActive = false;  

function mapVoiceToDigit(text) {
  if (!text) return null;
  const cleaned = text.toLowerCase();
  const parts = cleaned.split(/\s+/);
  for (const p of parts) {
    if (voiceMap[p]) return voiceMap[p];
  }
  
  for (const key in voiceMap) {
    if (cleaned.includes(key)) return voiceMap[key];
  }
  // try numeric digit capture
  const m = cleaned.match(/\b([0-9])\b/);
  if (m) return m[1];
  return null;
}

export function startVoiceLoop() {
  callActive = true;

  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    console.warn("SpeechRecognition API not supported in this browser.");
    return;
  }

  if (isVoiceActive) return;
  isVoiceActive = true;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-IN";

  recognition.onstart = () => {
    listening = true;
    console.log("Voice recognition started");
  };

  recognition.onresult = (event) => {
    if (!callActive) return;

    try {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript.trim();
      console.log("Voice:", transcript);

      // BARge-IN: interrupt speech if user speaks
      if (speechSynthesis.speaking) speechSynthesis.cancel();

      const digit = mapVoiceToDigit(transcript);
      if (digit) {
        sendDTMF(digit);
      } else {
        if (typeof window.speak === "function") {
          window.speak(
            "Sorry, I didn't understand. Please say booking, domestic, or international.",
            { interrupt: true }
          );
        }
      }
    } catch (e) {
      console.warn("onresult error", e);
    }
  };

  recognition.onerror = (err) => {
    console.warn("Recognition error:", err);
    if (!callActive) return;

    setTimeout(() => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Restart error:", e);
      }
    }, 300);
  };

  recognition.onend = () => {
    listening = false;
    console.log("Recognition ended");

    if (callActive) {
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.warn("Restart failed:", e);
        }
      }, 300);
    }
  };

  try {
    recognition.start();
  } catch (e) {
    console.warn("Recognition start error", e);
    isVoiceActive = false;
  }
}

export function stopVoiceLoop() {
  isVoiceActive = false;
  callActive = false;
  listening = false;

  try {
    recognition?.stop();
  } catch (e) {
    /* ignore */
  }

  console.log("Voice stopped");
}





