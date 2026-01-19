from pydantic import BaseModel
from typing import List, Optional

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str
    full_name: str
    dietary_preferences: Optional[str] = None # "Vegan, Jain"
    regional_preferences: Optional[str] = None # "North Indian, Gujarati"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

# --- MEAL SCHEMAS ---
class MealBase(BaseModel):
    name: str
    ingredients: str
    recipe_instructions: str
    calories: int
    image_url: Optional[str] = None
    
    # The New Fields
    category: str         # "Veg", "Non-Veg"
    suitable_time: str    # "Lunch", "Dinner"
    course_type: str      # "Main Course", "Starter"
    mood_tag: str         # "Spicy Kick", "Comfort Craving"
    regional_tag: str     # "Punjabi", "Italian"

class MealCreate(MealBase):
    pass

class Meal(MealBase):
    id: int
    owner_id: int
    class Config:
        orm_mode = True

from datetime import datetime

# --- MEAL PLAN SCHEMAS ---
class MealPlanBase(BaseModel):
    date: datetime
    meal_type: str # "Lunch", "Dinner"

class MealPlanCreate(MealPlanBase):
    meal_id: int

class MealPlan(MealPlanBase):
    id: int
    user_id: int
    meal: Meal # Return the full meal details too
    class Config:
        orm_mode = True