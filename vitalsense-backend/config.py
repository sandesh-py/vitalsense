import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

PORT = int(os.getenv("PORT", 8000))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'vitalsense.db'}")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
MODEL_DIR = BASE_DIR / os.getenv("MODEL_DIR", "ml/saved_models")

# Ensure directories exist
(BASE_DIR / "data").mkdir(exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)
