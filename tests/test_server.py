
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

# -----------------Test IVR start flow--------
def test_ivr_start():
    payload = {"caller_number": "SIMULATED"}
    resp = client.post("/ivr/start", json=payload)

    assert resp.status_code == 200
    data = resp.json()

    assert "call_id" in data
    assert "message" in data or "prompt" in data

# ---------------Test IVR DTMF input-------------
def test_ivr_dtmf():
    # First start a call
    start_resp = client.post("/ivr/start", json={"caller_number": "SIMULATED"})
    call_id = start_resp.json().get("call_id")

    resp = client.post("/ivr/dtmf", json={"call_id": call_id, "digit": "1"})
    
    assert resp.status_code == 200
    data = resp.json()

    assert "message" in data or "prompt" in data

# --------------Test invalid DTMF------------------
def test_invalid_dtmf():
    resp = client.post("/ivr/dtmf", json={"call_id": "fake_id", "digit": "@"})

    # backend may return 400 or 404 based on logic
    assert resp.status_code in (400, 404)


#--------------------- Test ending a call---------------
def test_ivr_end():
    start = client.post("/ivr/start", json={"caller_number": "SIMULATED"})
    cid = start.json().get("call_id")

    resp = client.post("/ivr/end", json={"call_id": cid})
    assert resp.status_code == 200 or resp.status_code == 404

# --------------Test invalid call_id-------------
def test_invalid_call():
    resp = client.post("/ivr/dtmf", json={"call_id": "FAKE", "digit": "2"})
    assert resp.status_code in (400, 404)    
