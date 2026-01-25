import ai_service
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware # <--- NEW IMPORT
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import SessionLocal, engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- THE FIX STARTS HERE ---
# We explicitly allow the frontend to talk to us
# --- UPDATE THIS SECTION ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://next-meal-ai.vercel.app",  # <--- YOUR VERCEL DOMAIN HERE
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # Explicit list instead of ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- THE FIX ENDS HERE ---

# Dependency: Get the database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Next Meal AI API is running!"}

# --- USER ENDPOINTS ---
# --- USERS ---
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = crud.get_user(db, user_id=user.id)
    if db_user:
        return db_user
    # Create new user with the Supabase UUID
    return crud.create_user(db=db, user=user)

# --- MEAL ENDPOINTS ---
@app.post("/users/{user_id}/meals/", response_model=schemas.Meal)
def create_meal_for_user(user_id: int, meal: schemas.MealCreate, db: Session = Depends(get_db)):
    return crud.create_meal(db=db, meal=meal, user_id=user_id)

@app.get("/meals/", response_model=List[schemas.Meal])
def read_meals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    meals = crud.get_meals(db, skip=skip, limit=limit)
    return meals

# --- CALENDAR ENDPOINTS ---
@app.post("/users/{user_id}/plan/", response_model=schemas.MealPlan)
def add_meal_to_plan(user_id: int, plan: schemas.MealPlanCreate, db: Session = Depends(get_db)):
    return crud.create_meal_plan(db=db, plan=plan, user_id=user_id)

@app.get("/users/{user_id}/plan/", response_model=List[schemas.MealPlan])
def get_my_plan(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_meal_plans(db=db, user_id=user_id)

# --- AI RECOMMENDATION ENDPOINT ---
# In backend/main.py

@app.post("/recommend/", response_model=schemas.Meal)
def recommend_meal(
    user_id: str,  # <--- FIXED: Changed from int to str
    mood: str,
    time_of_day: str,
    db: Session = Depends(get_db)
):
    # 1. Check if User exists. If not, auto-create them (Lazy Registration)
    # This fixes the "Ghost User" problem since we wiped the DB
    user = crud.get_user(db, user_id=user_id)
    if not user:
        # Create a placeholder user so foreign keys don't break
        # We don't have the email here, but that's okay for now
        new_user = schemas.UserCreate(id=user_id, email="pending_sync@example.com") 
        crud.create_user(db=db, user=new_user)
    
    # 2. Proceed with AI Recommendation
    # (Keep your existing AI logic here. I am calling the service function)
    return ai_service.get_recommendation(mood, time_of_day, user_id, db)
    
    # 3. Construct the Preference String
    # "User is Vegetarian, North Indian. Wants Dinner. Mood is Spicy."
    user_context = f"""
    Diet: {user.dietary_preferences or 'Any'}
    Region Pref: {user.regional_preferences or 'Any'}
    Current Request: Time is {time_of_day}, Mood is {mood}.
    """
    
    # 4. Ask the AI
    recommendation = ai_service.get_meal_recommendation(user_context, meal_list)
    
    return recommendation