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
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
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
@app.post("/recommend/")
def recommend_meal(user_id: int, mood: str, time_of_day: str, db: Session = Depends(get_db)):
    # 1. Fetch the User (to get dietary prefs)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Fetch ALL meals (In a real app, we would filter this first to save tokens)
    # We fetch up to 50 meals to give the AI choices
    meals = db.query(models.Meal).limit(50).all()
    
    # Convert DB objects to simple dictionaries so AI can read them
    meal_list = []
    for m in meals:
        meal_list.append({
            "name": m.name,
            "category": m.category,
            "mood": m.mood_tag,
            "time": m.suitable_time,
            "ingredients": m.ingredients
        })
    
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