"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

// --- TYPES ---
interface MealRecommendation {
  recommended_meal_name: string;
  reason: string;
  meal_id?: number; 
}

interface PlannedMeal {
  id: number;
  date: string;
  meal_type: string;
  meal: { name: string; category: string };
}

export default function Home() {
  // --- USER STATE ---
  // If userId is null, we show the Login Screen
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  
  // Login Form States
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [diet, setDiet] = useState("Vegetarian");
  const [region, setRegion] = useState("North Indian");
  const [isRegistering, setIsRegistering] = useState(false);

  // Dashboard States
  const [mood, setMood] = useState<string>("Comfort Craving");
  const [time, setTime] = useState<string>("Dinner");
  const [recommendation, setRecommendation] = useState<MealRecommendation | null>(null);
  const [plan, setPlan] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LOGIN / REGISTER FUNCTIONS ---
  const handleLogin = async () => {
    // Ideally, you would have a separate login endpoint. 
    // For this prototype, we just try to create the user. 
    // If it fails (email exists), we assume they are logging in and fetch their ID.
    // NOTE: This is a "Hack" for the MVP. Real apps need password checks!
    
    try {
      const payload = {
        email: email,
        full_name: fullName || "Friend",
        password: "password123", // Default password for MVP
        dietary_preferences: diet,
        regional_preferences: region
      };

      // Try to create user
      try {
         await axios.post("http://127.0.0.1:8000/users/", payload);
         alert("Account Created! Please click Login now.");
         setIsRegistering(false);
      } catch (e: any) {
         if (e.response && e.response.status === 400) {
             // 400 means Email exists. In a real app, we would ask for password here.
             // We don't have a "Get ID by Email" endpoint exposed for security.
             // So for this test, we will assume User ID 1 if email is "test@example.com"
             // or alert the user to use a new email for testing.
             alert("Email already exists. For this test version, please use a unique email to create a new profile!");
         } else {
             alert("Connection Error");
         }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --- HARDCODED LOGIN FOR DEMO ---
  // Since we didn't build a "Login by Password" endpoint yet, 
  // we will use a workaround: When they register successfully, we assume they are the newest user.
  // BUT to make it easy for testing:
  
  // LET'S SIMPLIFY:
  // We will just ask the user to Register every time (or enter ID if they know it).
  // Actually, the best way for a 15-day MVP:
  // Show a "User ID" box. If they don't have one, they register and get one.
  
  const handleRegister = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/users/", {
        email: email,
        full_name: fullName,
        password: "testpassword",
        dietary_preferences: diet,
        regional_preferences: region
      });
      // If successful, log them in immediately
      setUserId(response.data.id);
      setUserName(response.data.full_name);
    } catch (error) {
      alert("Email already used! Try a different one.");
    }
  }

  // --- DASHBOARD FUNCTIONS ---
  const fetchPlan = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/users/${userId}/plan/`);
      setPlan(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (userId) fetchPlan();
  }, [userId]);

  const getMeal = async () => {
    setLoading(true);
    setRecommendation(null);
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/recommend/?user_id=${userId}&mood=${mood}&time_of_day=${time}`
      );
      setRecommendation(response.data);
    } catch (error) {
      alert("Error connecting to backend");
    }
    setLoading(false);
  };

  const saveToCalendar = async () => {
    if (!recommendation || !userId) return;
    try {
      // NOTE: Using Meal ID 1 for MVP demo, real app uses AI result ID
      await axios.post(`http://127.0.0.1:8000/users/${userId}/plan/`, {
        date: new Date().toISOString(),
        meal_type: time,
        meal_id: 1 
      });
      alert("Meal Saved!");
      fetchPlan(); 
    } catch (error) {
      alert("Could not save plan.");
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!userId) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          {/* LOGO GOES HERE */}
          <img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          
          <h1 className="text-3xl font-bold text-green-600 mb-2">Welcome</h1>
          <p className="text-gray-500 mb-6">Create your profile to start planning.</p>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-bold text-gray-700">Full Name</label>
              <input type="text" className="w-full p-2 border rounded" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Email</label>
              <input type="email" className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Diet Type</label>
              <select className="w-full p-2 border rounded" value={diet} onChange={e => setDiet(e.target.value)}>
                <option>Vegetarian</option>
                <option>Non-Vegetarian</option>
                <option>Vegan</option>
                <option>Jain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Preferred Region</label>
              <select className="w-full p-2 border rounded" value={region} onChange={e => setRegion(e.target.value)}>
                <option>North Indian</option>
                <option>South Indian</option>
                <option>Italian</option>
                <option>Chinese</option>
              </select>
            </div>

            <button onClick={handleRegister} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition">
              Start My Meal Plan
            </button>
          </div>
        </div>
      </main>
    )
  }

  // --- RENDER: DASHBOARD (LOGGED IN) ---
  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
             {/* SMALL LOGO IN HEADER */}
            <img src="/logo.png" alt="Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold text-green-600">Next Meal AI</h1>
              <p className="text-gray-600 text-sm">Welcome back, {userName}</p>
            </div>
          </div>
          <button onClick={() => setUserId(null)} className="text-red-500 text-sm hover:underline">Logout</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: AI GENERATOR */}
            <div className="bg-white p-6 rounded-xl shadow-lg h-fit">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Get a Suggestion</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                  <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 text-black">
                    <option>Comfort Craving</option>
                    <option>Spicy Kick</option>
                    <option>Sweet Tooth</option>
                    <option>Healthy & Guilt Free</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 text-black">
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Breakfast</option>
                  </select>
                </div>
              </div>

              <button onClick={getMeal} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all">
                {loading ? "AI is Thinking..." : "Suggest Meal"}
              </button>

              {recommendation && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-bold text-green-800">{recommendation.recommended_meal_name}</h3>
                  <p className="text-sm text-gray-600 italic mt-1">{recommendation.reason}</p>
                  
                  <button onClick={saveToCalendar} className="mt-4 w-full bg-white border border-green-600 text-green-600 font-semibold py-2 rounded hover:bg-green-50">
                    + Add to Today's Plan
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CALENDAR */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Weekly Plan</h2>
              {plan.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No meals planned yet.</p>
              ) : (
                <div className="space-y-3">
                  {plan.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div>
                        <div className="font-bold text-gray-800">{item.meal.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString()} • {item.meal_type}
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.meal.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}