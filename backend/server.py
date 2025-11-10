from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import random

app = FastAPI(title="IVR Simulator Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ MODELS ------------------
class CallStart(BaseModel):
    caller_number: Optional[str] = "SIMULATED_USER"

class CallLog(BaseModel):
    call_id: str
    caller_number: str
    start_time: str
    end_time: Optional[str] = None
    duration: Optional[int] = None
    menu_path: List[str] = []
    inputs: List[str] = []

class DTMFInput(BaseModel):
    call_id: str
    digit: str

# ------------------ IN MEMORY STATE ------------------
active_calls = {}
call_history = []

# ------------------ MENUS ------------------
MENU = {
    "lang": {
        "prompt": "Welcome to Flight Support.\nPress 1 for English.\nPress 2 for Hindi.\nPress 3 for Bengali.",
        "options": {
            "1": {"action": "goto", "target": "main", "msg": "Language set to English."},
            "2": {"action": "goto", "target": "main_hi", "msg": "भाषा हिंदी चुनी गई।"},
            "3": {"action": "goto", "target": "main_bn", "msg": "ভাষা বাংলায় সেট করা হয়েছে।"}
        }
    },

    # ------------------ MAIN MENU (English) ------------------
    "main": {
        "prompt": "Welcome to Flight Support.\nPress 1 for Booking.\nPress 2 for Flight Status.\nPress 3 for Ticket Cancellation.\nPress 4 for Baggage Services.\nPress 5 for Loyalty Program.\nPress 6 for Feedback.\nPress 8 to schedule a callback.\nPress 9 to speak to an agent.\nPress 0 for Emergency hotline.",
        "options": {
            "1": {"action": "goto", "target": "booking", "msg": "Booking menu selected."},
            "2": {"action": "goto", "target": "status", "msg": "Flight status selected."},
            "3": {"action": "goto", "target": "cancel", "msg": "Cancellation menu selected."},
            "4": {"action": "goto", "target": "baggage", "msg": "Baggage menu selected."},
            "5": {"action": "goto", "target": "loyalty", "msg": "Loyalty menu selected."},
            "6": {"action": "goto", "target": "feedback", "msg": "Feedback module."},
            "7": {"action": "goto", "target": "offers", "msg": "Special offers menu selected."},
            "8": {"action": "goto", "target": "callback", "msg": "Callback scheduling."},
            "9": {"action": "agent", "msg": "Connecting to a live agent..."},
            "0": {"action": "end", "msg": "Emergency hotline number sent via SMS."}
        }
    },

    # ------------------ BOOKING ------------------
    "booking": {
        "prompt": "Press 1 for Domestic.\nPress 2 for International.\nPress 3 to select meal preference.\nPress * to return.",
        "options": {
            "1": {"action": "end", "msg": "Domestic booking request received."},
            "2": {"action": "end", "msg": "International booking registered."},
            "3": {"action": "goto", "target": "meal", "msg": "Meal preference menu."},
            "*": {"action": "goto", "target": "main", "msg": "Returning to main menu."}
        }
    },

    # ------------------ MEAL ------------------
    "meal": {
        "prompt": "Press:\n1 for Veg.\n2 for Non-Veg.\n3 Jain Meal.\n* to return.",
        "options": {
            "1": {"action": "end", "msg": "Veg meal preference updated."},
            "2": {"action": "end", "msg": "Non-Veg meal preference updated."},
            "3": {"action": "end", "msg": "Jain meal preference updated."},
            "*": {"action": "goto", "target": "booking", "msg": "Returning to booking menu."}
        }
    },

    # ------------------ STATUS (PNR) ------------------
    "status": {
        "prompt": "Enter 6-digit PNR followed by #",
        "options": {
            "#": {"action": "lookup", "msg": "Checking PNR..."}
        }
    },

    # ------------------ CANCELLATION ------------------
    "cancel": {
        "prompt": "Enter ticket number followed by # for cancellation.\nPress * to return.",
        "options": {
            "#": {"action": "cancel_lookup", "msg": "Ticket cancellation request registered."},
            "*": {"action": "goto", "target": "main", "msg": "Returning to main menu."}
        }
    },

    # ------------------ BAGGAGE SERVICES ------------------
    "baggage": {
        "prompt": "Press 1 for Lost Baggage.\nPress 2 to Track Existing Complaint.\nPress 3 for Damaged Baggage.\nPress * to return.",
        "options": {
            "1": {"action": "goto", "target": "lost", "msg": "Lost baggage menu."},
            "2": {"action": "goto", "target": "track", "msg": "Track complaint."},
            "3": {"action": "end", "msg": "Complaint forwarded to baggage team."},
            "*": {"action": "goto", "target": "main", "msg": "Returning."}
        }
    },

    # ------------------ LOST BAGGAGE ------------------
    "lost": {
        "prompt": "Enter 5-digit bag tag number followed by #.\nPress * to return.",
        "options": {
            "#": {"action": "lost_lookup", "msg": "Lost baggage complaint logged."},
            "*": {"action": "goto", "target": "baggage", "msg": "Returning to baggage menu."}
        }
    },

    # ------------------ LOST BAGGAGE TRACKING ------------------
"track": {
    "prompt": "Enter Complaint ID (4 digits) followed by #.\nPress * to return.",
    "options": {
        "#": {"action": "track_lookup", "msg": "Checking status..."},
        "*": {"action": "goto", "target": "baggage", "msg": "Returning to baggage menu."}
    }
},

    # ------------------ LOYALTY ------------------
    "loyalty": {
        "prompt": "Press 1 to check reward points.\nPress 2 to redeem points.\nPress * to return.",
        "options": {
            "1": {"action": "end", "msg": "You have 14,200 reward points."},
            "2": {"action": "end", "msg": "Points redeemed successfully."},
            "*": {"action": "goto", "target": "main", "msg": "Returning."}
        }
    },

    # ------------------ CALLBACK ------------------
    "callback": {
        "prompt": "Press 1 to schedule callback in 15 minutes.\nPress 2 for 1 hour.\nPress * to return.",
        "options": {
            "1": {"action": "end", "msg": "Callback scheduled in 15 minutes."},
            "2": {"action": "end", "msg": "Callback scheduled in 1 hour."},
            "*": {"action": "goto", "target": "main", "msg": "Returning."}
        }
    },
    # -----------------------Offers -------------------------
    "offers": {
    "prompt": "Press 1 for Discount Coupons.\nPress 2 for Seasonal Sales.\nPress 3 for Partner Offers.\nPress * to return.",
    "options": {
        "1": {"action": "end", "msg": "Discount coupons have been sent via SMS."},
        "2": {"action": "end", "msg": "Seasonal sale details forwarded."},
        "3": {"action": "end", "msg": "Partner offer details shared."},
        "&": {"action": "goto", "target": "main", "msg": "Returning to main menu."}
    }
},


    # ------------------ FEEDBACK ------------------
    "feedback": {
        "prompt": "Rate your experience:\n1- Poor\n2- Average\n3- Good\n4- Excellent\n* to return",
        "options": {
            "1": {"action": "end", "msg": "We regret for your inconvenience. We will improve."},
            "2": {"action": "end", "msg": "Thanks for Average rating."},
            "3": {"action": "end", "msg": "Thanks for Good rating."},
            "4": {"action": "end", "msg": "Thanks for Excellent rating!"},
            "*": {"action": "goto", "target": "main", "msg": "Returning."}
        }
    },

    # ------------------ HIDDEN ADMIN MENU ------------------
    "admin": {
        "prompt": "Admin Diagnostics.\nPress 1 to view Active Calls.\nPress 2 to Fetch Logs.\nPress * return",
        "options": {
            "1": {"action": "end", "msg": "Active calls count sent to admin email."},
            "2": {"action": "end", "msg": "System logs forwarded."},
            "*": {"action": "goto", "target": "main", "msg": "Returning."}
        }
    }
}


# ------------------ ROOT ------------------
@app.get("/")
def health():
    return {"status": "running", "active_calls": len(active_calls)}

# ------------------ START CALL ------------------
@app.post("/ivr/start")
def start(call: CallStart):
    call_id = f"CALL_{random.randint(100000,999999)}"

    active_calls[call_id] = {
        "caller_number": call.caller_number,
        "start": datetime.now(),
        "menu": "main",
        "entered": "",
        "path": ["main"],
        "inputs": []
    }

    return {
        "call_id": call_id,
        "prompt": MENU["main"]["prompt"],
        "status": "connected"
    }

# ------------------ HANDLE DTMF ------------------
@app.post("/ivr/dtmf")
def dtmf(data: DTMFInput):
    if data.call_id not in active_calls:
        raise HTTPException(404, "Call not found")

    call = active_calls[data.call_id]
    menu = call["menu"]
    digit = data.digit
    call["inputs"].append(digit)

    menu_data = MENU.get(menu)

    # PNR mode input
     
     
    if menu in ["status", "cancel"] and digit != "#" and digit != "*":
        call["entered"] += digit
        if len(call["entered"]) <= 6:
            return {"prompt": f"PNR so far: {call['entered']}"}
    
        else:
            call["entered"] = ""
            return {"prompt": f"Invalid PNR length"}
        
    # For any baggage number entry
    if menu in ["lost", "track"] and digit != "#" and digit != "*":
        call["entered"] += digit
        return {"prompt": f"Entered: {call['entered']}"}    
        

    # Validate option
    if digit not in menu_data["options"]:
        return {"prompt": "Invalid option. Try again."}

    action = menu_data["options"][digit]["action"]
    msg = menu_data["options"][digit]["msg"]

    # ------------------ Actions ------------------
    if action == "goto":
        target = menu_data["options"][digit]["target"]
        call["menu"] = target
        call["path"].append(target)
        call["entered"] = ""
        return {
            "prompt": MENU[target]["prompt"],
            "status": "menu"
        }

    if action == "agent":
        return end_internal(data.call_id, "You are now connected to agent.")

    if action == "end":
        return end_internal(data.call_id, msg)

    if action == "lookup":
        if len(call["entered"]) == 6:
            info = f"PNR {call['entered']} confirmed. Flight AI102, Delhi → Mumbai."
            return end_internal(data.call_id, info)
        else:
            call["entered"] = ""
            return {"prompt": "Invalid PNR length. Try again."}
        
    if action == "cancel_lookup":
        if len(call["entered"]) == 6:
            info = f"Your ticket with PNR {call['entered']} has been successfully cancelled. Refund will be initiated within 3-5 business days."
            return end_internal(data.call_id, info)
        else:
            call["entered"] = ""
            return {"prompt": "Invalid PNR length. Please try again."}
        
    if action == "lost_lookup":
        if len(call["entered"]) == 5:
            return end_internal(
                data.call_id,
                f"Bag tag {call['entered']} reported lost. Tracking ID LBG{call['entered']}."
            )
        else:
            call["entered"] = ""
            return {"prompt": "Invalid bag tag length. Try again."}   

    if action == "track_lookup":
        if len(call["entered"]) == 4:
            return end_internal(
                data.call_id,
                f"Complaint TKT{call['entered']} located. Bag expected in next 24-48 hours."
            )
        else:
            call["entered"] = ""
            return {"prompt": "Invalid complaint ID. Try again."}     

      
        



# ------------------ INTERNAL END ------------------
def end_internal(call_id, msg):
    call = active_calls[call_id]
    end = datetime.now()
    dur = (end - call["start"]).seconds

    call_history.append({
        "call_id": call_id,
        "caller_number": call["caller_number"],
        "start": call["start"].isoformat(),
        "end": end.isoformat(),
        "duration": dur,
        "menu_path": call["path"],
        "inputs": call["inputs"]
    })

    del active_calls[call_id]

    return {
        "status": "ended",
        "message": msg,
        "duration": f"{dur} seconds"
    }

# ------------------ MANUAL END ------------------
class EndCall(BaseModel):
    call_id: str

@app.post("/ivr/end")
def end(payload: EndCall):
    call_id = payload.call_id
    if call_id not in active_calls:
        return {"message": "Already ended."}
    return end_internal(call_id, "Call terminated by user.")



#@app.post("/ivr/end")
#def end(call_id: str):
#    if call_id not in active_calls:
#        return {"message": "Already ended."}
#    return end_internal(call_id, "Call terminated by user.")
