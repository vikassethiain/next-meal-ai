from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    # CHANGED: Integer -> String to support Supabase UUIDs
    id = Column(String, primary_key=True, index=True) 
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)

    preferences = relationship("UserPreferences", back_populates="user")
    meal_plans = relationship("MealPlan", back_populates="user")
    custom_meals = relationship("Meal", back_populates="owner")

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    # CHANGED: Integer -> String
    user_id = Column(String, ForeignKey("users.id")) 
    
    dietary_type = Column(String)  # e.g., "Veg", "Non-Veg", "Vegan"
    allergies = Column(String, nullable=True)
    spice_tolerance = Column(String, default="Medium")
    favorite_cuisines = Column(String, nullable=True)

    user = relationship("User", back_populates="preferences")

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)  # Veg/Non-Veg
    suitable_time = Column(String) # Breakfast/Lunch/Dinner
    mood_tag = Column(String) # Comfort, Healthy, etc.
    regional_tag = Column(String)
    course_type = Column(String)
    calories = Column(Integer)
    ingredients = Column(Text)
    recipe_instructions = Column(Text)
    
    # CHANGED: Integer -> String (Nullable because system meals have no owner)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    owner = relationship("User", back_populates="custom_meals")
    plan_entries = relationship("MealPlan", back_populates="meal")

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    # CHANGED: Integer -> String
    user_id = Column(String, ForeignKey("users.id")) 
    meal_id = Column(Integer, ForeignKey("meals.id"))
    
    date = Column(DateTime, default=datetime.datetime.utcnow)
    meal_type = Column(String) # Breakfast, Lunch, Dinner
    is_cooked = Column(Boolean, default=False)

    user = relationship("User", back_populates="meal_plans")
    meal = relationship("Meal", back_populates="plan_entries")