"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns'; // You'll need to install this

// --- TYPES ---
interface Meal {
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
  // Auth State
  const [userId, setUserId] = useState<number | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  
  // App State
  const [activeTab, setActiveTab] = useState("suggest"); // 'suggest' or 'calendar'
  const [mood, setMood] = useState("Comfort Craving");
  const [time, setTime] = useState("Dinner");
  const [recommendation, setRecommendation] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannedMeal[]>([]);

  // Calendar Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState("Dinner");

  // --- INITIALIZATION ---
  useEffect(() => {
    if (userId) fetchPlan();
  }, [userId]);

  // --- ACTIONS ---
  const handleGuestLogin = () => {
    // Hardcoded Guest ID for demo (Make sure User 1 exists!)
    setUserId(1); 
    setGuestMode(true);
  };

  const fetchPlan = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`https://next-meal-api.onrender.com/users/${userId}/plan/`);
      setPlan(res.data);
    } catch (e) { console.error(e); }
  };

  const getMeal = async () => {
    setLoading(true);
    setRecommendation(null);
    try {
      // Note: In Guest Mode, we use ID 1 preferences
      const res = await axios.post(
        `https://next-meal-api.onrender.com/recommend/?user_id=${userId}&mood=${mood}&time_of_day=${time}`
      );
      setRecommendation(res.data);
    } catch (error) { alert("Server sleeping. Try again in 10s."); }
    setLoading(false);
  };

  const openSaveModal = () => {
    setSelectedSlot(time); // Default to what they searched for
    setShowSaveModal(true);
  };

  const saveToCalendar = async () => {
    if (!userId || !recommendation) return;
    try {
      await axios.post(`https://next-meal-api.onrender.com/users/${userId}/plan/`, {
        date: selectedDate.toISOString(),
        meal_type: selectedSlot,
        meal_id: 1 // In real app, use recommendation.meal_id
      });
      alert(`Saved for ${format(selectedDate, 'EEEE')} ${selectedSlot}!`);
      setShowSaveModal(false);
      fetchPlan();
    } catch (e) { alert("Could not save."); }
  };

  // --- RENDER HELPERS ---
  // Generate next 7 days for the date picker
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // --- LOGIN SCREEN ---
  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 font-sans text-white">
        <div className="w-full max-w-sm text-center">
          <div className="bg-green-500 w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">🥗</div>
          <h1 className="text-4xl font-bold mb-2">Next Meal AI</h1>
          <p className="text-gray-400 mb-8">Stop wondering what to cook.</p>
          
          <button className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl mb-3 flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6"/>
            Continue with Google
          </button>
          
          <button onClick={handleGuestLogin} className="w-full bg-gray-800 text-gray-300 font-semibold py-4 rounded-xl hover:bg-gray-700">
            Try as Guest
          </button>
        </div>
      </main>
    );
  }

  // --- APP SCREEN ---
  return (
    <main className="min-h-screen bg-gray-100 font-sans pb-24"> {/* pb-24 for bottom nav */}
      
      {/* HEADER */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <h1 className="text-xl font-bold text-green-700">Next Meal AI</h1>
          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
             {/* Avatar Placeholder */}
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">

        {/* TAB: SUGGESTION */}
        {activeTab === 'suggest' && (
          <>
            {/* CONTROLS */}
            <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-700">I'm craving something...</h2>
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["Comfort Craving", "Spicy Kick", "Healthy & Guilt Free", "Sweet Tooth", "Quick & Easy"].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setMood(m)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${mood === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {["Breakfast", "Lunch", "Dinner", "Snacking"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setTime(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${time === t ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button 
                onClick={getMeal}
                disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                {loading ? "Chef is thinking..." : "✨ Suggest Meal"}
              </button>
            </div>

            {/* RESULT CARD */}
            {recommendation && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 animate-slide-up">
                <div className="h-32 bg-green-100 flex items-center justify-center">
                  <span className="text-6xl">🍲</span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                      {recommendation.recommended_meal_name}
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {recommendation.reason}
                  </p>
                  
                  <button 
                    onClick={openSaveModal}
                    className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-xl border border-green-200 hover:bg-green-100"
                  >
                    📅 Add to Meal Plan
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm min-h-[50vh]">
            <h2 className="font-bold text-gray-800 mb-4">Your Week</h2>
            {plan.length === 0 ? (
               <div className="text-center text-gray-400 mt-10">No meals planned.<br/>Go suggest some!</div>
            ) : (
              <div className="space-y-4">
                {plan.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0">
                    <div className="text-center w-12">
                      <div className="text-xs text-gray-400 uppercase font-bold">{format(new Date(item.date), 'MMM')}</div>
                      <div className="text-xl font-bold text-gray-800">{format(new Date(item.date), 'd')}</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{item.meal.name}</div>
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block mt-1">
                        {item.meal_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 flex justify-around">
        <button onClick={() => setActiveTab('suggest')} className={`text-2xl ${activeTab === 'suggest' ? 'opacity-100 scale-110' : 'opacity-40'}`}>🍳</button>
        <button onClick={() => setActiveTab('calendar')} className={`text-2xl ${activeTab === 'calendar' ? 'opacity-100 scale-110' : 'opacity-40'}`}>📅</button>
      </div>

      {/* SAVE TO CALENDAR MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
            <h3 className="font-bold text-xl mb-4">Schedule Meal</h3>
            
            {/* Date Selector */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Select Day</p>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {next7Days.map(date => (
                  <button 
                    key={date.toString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border ${
                      selectedDate.getDate() === date.getDate() 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <span className="text-xs">{format(date, 'EEE')}</span>
                    <span className="text-xl font-bold">{format(date, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Selector */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-2">Select Time</p>
              <div className="flex gap-2">
                {["Breakfast", "Lunch", "Dinner"].map(s => (
                  <button 
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    className={`flex-1 py-3 rounded-xl font-semibold ${selectedSlot === s ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-500'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveToCalendar} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg">
              Confirm Schedule
            </button>
            <button onClick={() => setShowSaveModal(false)} className="w-full py-4 text-gray-400 mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

    </main>
  );
}