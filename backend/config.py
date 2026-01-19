import os

# Instead of hardcoding secrets, we read them from the Cloud Environment
# If running locally, you must set these in your terminal or use a .env file
# But for now, this prevents GitHub from blocking you.

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")