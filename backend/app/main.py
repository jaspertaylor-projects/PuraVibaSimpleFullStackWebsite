from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime

app = FastAPI()

# Allow requests from our frontend development server
origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/hello")
def read_root():
    """Provides a simple JSON response."""
    return {
        "message": "Hello from the FastAPI & Docker Coming in Hot!",
        "timestamp": datetime.datetime.now().isoformat()
    }
