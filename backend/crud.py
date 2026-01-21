from sqlalchemy.orm import Session
import models, schemas

# --- USER FUNCTIONS ---
def get_user(db: Session, user_id: str): # CHANGED: int -> str
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    # We now use the ID passed from the frontend (Supabase UUID)
    db_user = models.User(id=user.id, email=user.email) 
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- MEAL FUNCTIONS ---
def get_meals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Meal).offset(skip).limit(limit).all()

def create_meal(db: Session, meal: schemas.MealCreate, user_id: int):
    db_meal = models.Meal(**meal.dict(), owner_id=user_id)
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal

# --- MEAL PLAN FUNCTIONS ---
def create_meal_plan(db: Session, plan: schemas.MealPlanCreate, user_id: int):
    db_plan = models.MealPlan(**plan.dict(), user_id=user_id, status="Planned")
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def get_user_meal_plans(db: Session, user_id: int):
    # Get all plans, ordered by date
    return db.query(models.MealPlan).filter(models.MealPlan.user_id == user_id).order_by(models.MealPlan.date).all()