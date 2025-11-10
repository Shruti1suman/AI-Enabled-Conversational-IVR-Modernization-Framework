import time
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_performance_root():
    start = time.time()
    resp = client.get("/")
    end = time.time()
    assert resp.status_code == 200
    assert (end - start) < 0.5
