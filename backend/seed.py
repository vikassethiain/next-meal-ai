import requests
import json

API_URL = "http://127.0.0.1:8000"
USER_ID = 1 # We will seed these into a 'Master User' or User 1

# A rich dataset of 50 meals
meals_data = [
    # --- NORTH INDIAN (Dinner/Lunch) ---
    {"name": "Paneer Butter Masala", "category": "Veg", "suitable_time": "Dinner", "mood_tag": "Comfort Craving", "regional_tag": "North Indian", "course_type": "Main Course", "calories": 450, "ingredients": "Paneer, Butter, Tomato Puree, Cream, Cashews", "recipe_instructions": "Sauté spices, add tomato puree, cook paneer in gravy."},
    {"name": "Dal Makhani", "category": "Veg", "suitable_time": "Dinner", "mood_tag": "Warm & Cozy", "regional_tag": "North Indian", "course_type": "Main Course", "calories": 400, "ingredients": "Black Lentils, Kidney Beans, Butter, Cream", "recipe_instructions": "Slow cook lentils overnight, temper with butter."},
    {"name": "Rajma Chawal", "category": "Veg", "suitable_time": "Lunch", "mood_tag": "Comfort Craving", "regional_tag": "North Indian", "course_type": "Main Course", "calories": 500, "ingredients": "Kidney Beans, Rice, Onions, Tomatoes", "recipe_instructions": "Pressure cook beans, make spicy gravy, serve with rice."},
    {"name": "Aloo Gobi", "category": "Veg", "suitable_time": "Lunch", "mood_tag": "Quick & Easy", "regional_tag": "North Indian", "course_type": "Main Course", "calories": 250, "ingredients": "Potato, Cauliflower, Turmeric, Cumin", "recipe_instructions": "Stir fry potatoes and cauliflower with spices."},
    {"name": "Butter Chicken", "category": "Non-Veg", "suitable_time": "Dinner", "mood_tag": "Comfort Craving", "regional_tag": "North Indian", "course_type": "Main Course", "calories": 600, "ingredients": "Chicken, Butter, Tomato, Cream, Fenugreek", "recipe_instructions": "Marinate chicken, grill, add to buttery tomato gravy."},
    
    # --- SOUTH INDIAN (Breakfast/Lunch) ---
    {"name": "Masala Dosa", "category": "Veg", "suitable_time": "Breakfast", "mood_tag": "Crispy & Savory", "regional_tag": "South Indian", "course_type": "Main Course", "calories": 350, "ingredients": "Rice Batter, Potato Masala, Sambar, Chutney", "recipe_instructions": "Spread batter, fill with potato, roast till crisp."},
    {"name": "Idli Sambar", "category": "Veg", "suitable_time": "Breakfast", "mood_tag": "Healthy & Guilt Free", "regional_tag": "South Indian", "course_type": "Main Course", "calories": 200, "ingredients": "Rice cakes, Lentil soup, Tamarind", "recipe_instructions": "Steam rice cakes, boil lentils with veggies."},
    {"name": "Curd Rice", "category": "Veg", "suitable_time": "Lunch", "mood_tag": "Refreshing & Hydrating", "regional_tag": "South Indian", "course_type": "Main Course", "calories": 300, "ingredients": "Rice, Curd, Pomegranate, Mustard Seeds", "recipe_instructions": "Mix soft rice with curd, temper with spices."},
    {"name": "Chicken Chettinad", "category": "Non-Veg", "suitable_time": "Dinner", "mood_tag": "Spicy Kick", "regional_tag": "South Indian", "course_type": "Main Course", "calories": 500, "ingredients": "Chicken, Black Pepper, Coconut, Curry Leaves", "recipe_instructions": "Roast spices, cook chicken in spicy pepper gravy."},

    # --- GUJARATI / MAHARASHTRIAN (Snacks/Lunch) ---
    {"name": "Dhokla", "category": "Veg", "suitable_time": "Snacking", "mood_tag": "Healthy & Guilt Free", "regional_tag": "Gujarati", "course_type": "Starter", "calories": 160, "ingredients": "Gram Flour, Curd, Eno, Mustard Seeds", "recipe_instructions": "Steam batter, temper with mustard and chilies."},
    {"name": "Pav Bhaji", "category": "Veg", "suitable_time": "Dinner", "mood_tag": "Comfort Craving", "regional_tag": "Maharashtrian", "course_type": "Main Course", "calories": 550, "ingredients": "Mixed Veggies, Butter, Pav Bread, Spices", "recipe_instructions": "Mash veggies on tawa with butter and spices."},
    {"name": "Vada Pav", "category": "Veg", "suitable_time": "Snacking", "mood_tag": "Quick & Easy", "regional_tag": "Maharashtrian", "course_type": "Starter", "calories": 300, "ingredients": "Potato, Gram Flour, Bread, Garlic Chutney", "recipe_instructions": "Deep fry potato ball, serve in bun."},
    
    # --- CHINESE / ITALIAN ---
    {"name": "Veg Hakka Noodles", "category": "Veg", "suitable_time": "Dinner", "mood_tag": "Quick & Easy", "regional_tag": "Chinese", "course_type": "Main Course", "calories": 400, "ingredients": "Noodles, Cabbage, Carrot, Soy Sauce", "recipe_instructions": "Stir fry boiled noodles with veggies and sauces."},
    {"name": "Arrabiata Pasta", "category": "Veg", "suitable_time": "Dinner", "mood_tag": "Spicy Kick", "regional_tag": "Italian", "course_type": "Main Course", "calories": 450, "ingredients": "Penne, Tomato, Garlic, Chili Flakes", "recipe_instructions": "Cook pasta in spicy tomato garlic sauce."},
    
    # --- HEALTHY ---
    {"name": "Quinoa Salad", "category": "Veg", "suitable_time": "Lunch", "mood_tag": "Healthy & Guilt Free", "regional_tag": "Continental", "course_type": "Salad", "calories": 250, "ingredients": "Quinoa, Cucumber, Lemon, Olive Oil", "recipe_instructions": "Mix boiled quinoa with chopped veggies and dressing."}
]

print(f"--- Seeding {len(meals_data)} Meals ---")

# 1. Get existing meals to avoid duplicates
existing_meals = requests.get(f"{API_URL}/meals/").json()
existing_names = [m['name'] for m in existing_meals]

count = 0
for meal in meals_data:
    if meal['name'] in existing_names:
        print(f"Skipping {meal['name']} (Already exists)")
        continue
        
    try:
        # Create for User 1 (The Admin/System User)
        response = requests.post(f"{API_URL}/users/{USER_ID}/meals/", json=meal)
        if response.status_code == 200:
            print(f"✅ Added: {meal['name']}")
            count += 1
        else:
            print(f"❌ Failed: {meal['name']}")
    except Exception as e:
        print(f"❌ Error: {e}")

print(f"--- Finished. Added {count} new meals. ---")