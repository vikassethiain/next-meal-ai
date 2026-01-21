from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- MEAL SCHEMAS ---
class MealBase(BaseModel):
    name: str  # <--- CHANGED from 'string' to 'str'
    category: str
    suitable_time: str
    mood_tag: str
    regional_tag: str
    course_type: str
    calories: int
    ingredients: str
    recipe_instructions: str

class MealCreate(MealBase):
    pass

class Meal(MealBase):
    id: int
    owner_id: Optional[str] = None 

    class Config:
        orm_mode = True

# --- PLAN SCHEMAS ---
class MealPlanBase(BaseModel):
    date: datetime
    meal_type: str

class MealPlanCreate(MealPlanBase):
    meal_id: int

class MealPlan(MealPlanBase):
    id: int
    user_id: str 
    meal: Meal

    class Config:
        orm_mode = True

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    id: str 

class User(UserBase):
    id: str 
    is_active: bool
    meal_plans: List[MealPlan] = []

    class Config:
        orm_mode = True