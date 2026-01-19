from sqlalchemy.orm import Session
import models, schemas

# --- USER FUNCTIONS ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # In a real app, we would hash the password here. For now, we store plain text to keep it simple.
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(
        email=user.email, 
        hashed_password=fake_hashed_password,
        full_name=user.full_name,
        dietary_preferences=user.dietary_preferences,
        regional_preferences=user.regional_preferences
    )
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