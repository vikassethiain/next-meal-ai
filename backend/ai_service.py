from openai import OpenAI
from config import OPENAI_API_KEY
import json

# Initialize the AI Client
client = OpenAI(api_key=OPENAI_API_KEY)

def get_meal_recommendation(user_preferences, available_meals):
    # Convert meals to text for the AI
    meals_text = json.dumps(available_meals, indent=2)

    system_prompt = """
    You are the "Chef AI". 
    1. Analyze the User Profile and the Menu.
    2. Pick the SINGLE best meal from the Menu.
    3. You must return JSON in this format:
       {
         "recommended_meal_name": "Exact Name From Menu",
         "reason": "One short sentence explaining why."
       }
    """

    user_prompt = f"""
    User Profile: {user_preferences}
    
    Menu:
    {meals_text}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # <--- WE ARE USING THE CHEAP & SMART MODEL
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "recommended_meal_name": "Error", 
            "reason": "The AI is currently unavailable. Please try again."
        }