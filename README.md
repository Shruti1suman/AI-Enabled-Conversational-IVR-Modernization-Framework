# AI-Enabled Conversational IVR Modernization System

A fully interactive, browser-based IVR simulation that supports DTMF keypad navigation, speech-to-DTMF mapping, text-to-speech output, and dynamic state-machine-driven menu flows. It mimics enterprise IVR systems used by airlines, telecom, and banking industries.

---

 ## Demo Link

[Click me to see the app!](https://ai-enabled-conversational-ivr-jsyo.onrender.com)

## ✅ Key Features

### 🎤 Voice Input (ASR)

* Continuous speech recognition
* Keyword-to-digit mapping
* Works without pressing voice buttons repeatedly

### 🔊 Voice Output (TTS)

* Speaks backend prompts
* Synchronous on-screen text + audio

### 📞 DTMF Keypad Support

* Clickable keypad buttons
* Sends tone inputs to backend engine

### 🔁 State Machine Menu Engine

* Backend Python logic determines prompts
* Supports nested flows
* Handles lookup, cancellation, and tracking

### 🔀 Return & Exit Logic

* Star (*) to return to previous menus
* Menu endings terminate call session properly

---

## 📂 Project Structure

```
/frontend
  index.html
  styles.css
  app.js
  voiceInput.js
  dtmf.js

/backend
  server.py

README.md
```

---

## 🚀 How It Works

1. User clicks Start Call
2. Backend serves first menu prompt
3. Text is displayed + spoken aloud
4. User provides input via:

   * keypad
   * voice
5. Digit(s) are sent to `/ivr/dtmf`
6. Backend updates context and returns next prompt
7. Loop continues until the flow completes

---

## 🎙️ Supported Voice Commands

Examples:

```
booking → 1
lost baggage → 1
connect agent → 9
cancel ticket → 8
main menu → *
```

Digits spoken as English words are also supported.

---

## 🧠 Menu Highlights

Includes flows for:

* Flight booking
* Meal preferences
* Flight status (PNR lookup)
* Lost/damaged baggage reporting
* Complaint tracking
* Ticket cancellation
* Loyalty rewards
* Feedback collection
* Callback scheduling
* Live agent
* Emergency hotline
* Admin diagnostics
* Promotional offers

---

## 🖥️ Tech Stack

* HTML, CSS, JavaScript
* Web Speech API (ASR)
* SpeechSynthesis TTS
* Python FastAPI/Flask backend
* Dictionary-driven state machine

---

## 🏗️ Architectural Flow

```
[Speech] → voiceInput.js
[DTMF Click] → dtmf.js
                  ↓
              app.js → /ivr/dtmf
                  ↓
       Python State Machine → JSON Prompt
                  ↓
          TTS + UI Text Display
```

---

## 🛂 Error Handling

* Auto restart on silent gaps
* Stops gracefully on call end
* Friendly retry prompts

---

## 🧪 Sample Flow

```
Start → 1 (Booking) → 3 (Meal) → 3 (Jain Meal)
```

Lost baggage tracking:

```
Start → 4 → 1 → 12345#
```

---

## 🔧 Setup

Install backend dependencies:

```
pip install -r requirements.txt
```

Run backend server:

```
uvicorn backend.server:app --reload
```

Open frontend using Live Server and start call.



## 🏁 Completion Status

* Legacy IVR Analysis ✅
* Middleware/API Layer ✅
* Conversational AI Interface ✅
* Voice Input/Output ✅
* Lookup/Tracking/Cancellation ✅
* Additional offers menu ✅

---

## 👤 Author

Developed by **Shruti Suman** as a Conversational AI modernization prototype.

---
