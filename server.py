# server.py
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from livekit import api

load_dotenv()

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://siri-6srhlg0f.livekit.cloud")  # e.g. wss://your.livekit.cloud

if not (LIVEKIT_API_KEY and LIVEKIT_API_SECRET):
    raise RuntimeError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_INDEX = os.path.join(os.path.dirname(__file__), "index.html")


@app.get("/")
async def root():
    return FileResponse(STATIC_INDEX)

@app.get("/token")
async def token(identity: str = "web-client", name: str = None, room: str = "my-room"):
    try:
        grants = api.VideoGrants(room_join=True, room=room)
        at = api.AccessToken(
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET,
        ).with_identity(identity)

        if name:
            at = at.with_name(name)

        jwt = at.with_grants(grants).to_jwt()
        return JSONResponse({"token": jwt, "livekit_url": LIVEKIT_URL or ""})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
