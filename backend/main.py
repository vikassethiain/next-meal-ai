import ai_service
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import SessionLocal, engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS CONFIGURATION ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://next-meal-ai.vercel.app", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency: Get the database session
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
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user.id) # Use ID check for UUIDs
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")
    return crud.create_user(db=db, user=user)

# --- MEAL ENDPOINTS ---
# FIXED: Changed user_id from int to str
@app.post("/users/{user_id}/meals/", response_model=schemas.Meal)
def create_meal_for_user(user_id: str, meal: schemas.MealCreate, db: Session = Depends(get_db)):
    return crud.create_meal(db=db, meal=meal, user_id=user_id)

@app.get("/meals/", response_model=List[schemas.Meal])
def read_meals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    meals = crud.get_meals(db, skip=skip, limit=limit)
    return meals

# --- CALENDAR ENDPOINTS ---
# FIXED: Changed user_id from int to str
@app.post("/users/{user_id}/plan/", response_model=schemas.MealPlan)
def add_meal_to_plan(user_id: str, plan: schemas.MealPlanCreate, db: Session = Depends(get_db)):
    return crud.create_meal_plan(db=db, plan=plan, user_id=user_id)

# FIXED: Changed user_id from int to str
@app.get("/users/{user_id}/plan/", response_model=List[schemas.MealPlan])
def get_my_plan(user_id: str, db: Session = Depends(get_db)):
    return crud.get_user_meal_plans(db=db, user_id=user_id)

# --- AI RECOMMENDATION ENDPOINT ---
# FIXED: Changed user_id from int to str
@app.post("/recommend/")
def recommend_meal(user_id: str, mood: str, time_of_day: str, db: Session = Depends(get_db)):
    # 1. Lazy Registration: Check if user exists, if not, create them
    user = crud.get_user(db, user_id=user_id)
    if not user:
        # Create a placeholder user so they can save this recommendation later
        new_user = schemas.UserCreate(id=user_id, email="pending_sync@example.com")
        user = crud.create_user(db=db, user=new_user)
        
    # 2. Fetch meals for the AI to choose from
    meals = db.query(models.Meal).limit(50).all()
    
    # Convert DB objects to simple dictionaries
    meal_list = []
    for m in meals:
        meal_list.append({
            "name": m.name,
            "category": m.category,
            "mood": m.mood_tag,
            "time": m.suitable_time,
            "ingredients": m.ingredients
        })
    
    # 3. Build the Context String
    # Safely handle None values for preferences
    diet_pref = user.preferences[0].dietary_type if user.preferences else 'Any'
    
    user_context = f"""
    Diet Preference: {diet_pref}
    Current Request: Time is {time_of_day}, Mood is {mood}.
    """
    
    # 4. Call the AI
    # This matches the function name in your uploaded ai_service.py
    return ai_service.get_meal_recommendation(user_context, meal_list)