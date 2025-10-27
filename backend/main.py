
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.backend import router  # importing router from backend.py

app = FastAPI(
    title="AI-Enabled Conversational IVR Modernization System",
    description="Middleware layer connecting legacy IVR.",
    version="1.0.0"
)

# Frontend Live Server to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. Later restrict to your frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# router from backend.py
app.include_router(router)

@app.get("/")
def root():
    return {"message": "AI-Enabled Conversational IVR Middleware is running successfully!"}

@app.get("/test")
def test_route():
    return {"message": "Backend route is working!"}

@app.get("/favicon.ico")
def favicon():
    return {"detail": "No favicon set"}


