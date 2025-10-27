
from fastapi import APIRouter, Request

router = APIRouter()

# Routers 
@router.get("/")
def root():
    return {"status": "IVR Simulator Running"}

@router.post("/ivr/start")
async def start_call(request: Request):
    data = await request.json()
    phone_number = data.get("caller_number", "unknown")
    return {"message": f"Simulated call started for {phone_number}"}


# Handle route for DTMF input (keypad press)
@router.post("/ivr/dtmf")
async def handle_dtmf(request: Request):
    data = await request.json()
    digit = data.get("digit")

     # flight services
    if digit == "1":
        response = "You selected Flight Status. Please enter your flight number followed by #."
    elif digit == "2":
        response = "You selected New Booking. Please visit our website or press 9 to talk to an agent."
    elif digit == "3":
        response = "You selected Cancellation. Please enter your booking ID followed by #."
    elif digit == "4":
        response = "Connecting you to a representative. Please wait..."
    elif digit == "9":
        response = "Transferring to an agent now. Please hold."
    else:
        response = "Invalid input. Please press 1 for Flight Status, 2 for New Booking, 3 for Cancellation, or 4 to Speak to a Representative."


    return {"message": response}
