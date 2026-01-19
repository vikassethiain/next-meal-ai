from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
# IMPORT THE URL FROM YOUR NEW CONFIG FILE
from config import DATABASE_URL 

# 1. Create the connection engine
# We assume the URL is correct because it's hardcoded in config.py
engine = create_engine(DATABASE_URL)

# 2. Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base class for models
Base = declarative_base()

# TEST BLOCK
if __name__ == "__main__":
    try:
        with engine.connect() as connection:
            print("\n------------------------------------------------")
            print("SUCCESS: Connected to Supabase via config.py!")
            print("------------------------------------------------\n")
    except Exception as e:
        print("\n------------------------------------------------")
        print(f"ERROR: Could not connect.\nDetails: {e}")
        print("------------------------------------------------\n")