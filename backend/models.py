from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

# 1. The User Table (Updated with Preferences)
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    # New Fields
    # "Jain, Vegan, Gluten Free"
    dietary_preferences = Column(String, nullable=True, default="") 
    # "North Indian, Italian, Chinese"
    regional_preferences = Column(String, nullable=True, default="") 
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    plans = relationship("MealPlan", back_populates="owner")

# 2. The Meal Table (Updated with Moods, Courses, Time)
class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # Basic Info
    ingredients = Column(Text)
    recipe_instructions = Column(Text)
    calories = Column(Integer)
    image_url = Column(String, nullable=True)

    # Classification Fields
    # "Veg" or "Non-Veg"
    category = Column(String, index=True, nullable=True, default="Veg") 
    # "Breakfast, Lunch, Dinner, Snacking"
    suitable_time = Column(String, index=True, nullable=True, default="Lunch") 
    # "Soup, Salad, Main Course, Dessert, Sides, Drink"
    course_type = Column(String, index=True, nullable=True, default="Main Course") 
    # "Warm & Cozy, Spicy Kick, Sweet Tooth, Healthy..."
    mood_tag = Column(String, index=True, nullable=True) 
    # "North Indian, Italian..."
    regional_tag = Column(String, index=True, nullable=True)

    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User")
    plans = relationship("MealPlan", back_populates="meal")

# 3. The Meal Plan Table (Calendar)
class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, index=True)
    
    meal_type = Column(String)
    
    # E.g., "Planned", "Eaten", "Skipped"
    status = Column(String, default="Planned") 
    
    # Links to User and Meal
    user_id = Column(Integer, ForeignKey("users.id"))
    meal_id = Column(Integer, ForeignKey("meals.id"))

    owner = relationship("User", back_populates="plans")
    meal = relationship("Meal", back_populates="plans")