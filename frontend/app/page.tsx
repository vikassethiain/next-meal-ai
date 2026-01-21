"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { supabase } from './supabase'; // Import the file you just created

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
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState("suggest"); 
  const [mood, setMood] = useState("Comfort Craving");
  const [time, setTime] = useState("Dinner");
  const [recommendation, setRecommendation] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannedMeal[]>([]);

  // UI Feedback State
  const [isSaving, setIsSaving] = useState(false);

  // Calendar Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState("Dinner");

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setUserId(session.user.id);
    });

    // 2. Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setUserId(session.user.id);
      else setUserId(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) fetchPlan();
  }, [userId]);

  // --- ACTIONS ---
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRecommendation(null);
    setPlan([]);
  };

  const fetchPlan = async () => {
    if (!userId) return;
    try {
      // NOTE: backend URL must be your REAL Render URL
      const res = await axios.get(`https://next-meal-api.onrender.com/users/${userId}/plan/`);
      setPlan(res.data);
    } catch (e) { console.error("Plan fetch error", e); }
  };

  const getMeal = async () => {
    setLoading(true);
    setRecommendation(null);
    try {
      const res = await axios.post(
        `https://next-meal-api.onrender.com/recommend/?user_id=${userId}&mood=${mood}&time_of_day=${time}`
      );
      setRecommendation(res.data);
    } catch (error) { 
      alert("Wake up call! Server might be sleeping. Try again in 10s."); 
    }
    setLoading(false);
  };

  const openSaveModal = () => {
    setSelectedSlot(time);
    setShowSaveModal(true);
  };

  const saveToCalendar = async () => {
    if (!userId || !recommendation) return;
    setIsSaving(true);
    try {
      await axios.post(`https://next-meal-api.onrender.com/users/${userId}/plan/`, {
        date: selectedDate.toISOString(),
        meal_type: selectedSlot,
        meal_id: 1 // We will fix this ID in Sprint 2
      });
      setShowSaveModal(false);
      fetchPlan(); // Refresh calendar
      setActiveTab('calendar'); // Auto-switch to calendar to show success
    } catch (e) { alert("Could not save."); }
    setIsSaving(false);
  };

  // --- RENDER HELPERS ---
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 font-sans text-white">
        <div className="w-full max-w-sm text-center">
          {/* LOGO AREA */}
          <div className="bg-green-500 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg shadow-green-500/50">
            🥗
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Next Meal AI</h1>
          <p className="text-gray-400 mb-10 text-lg">Stop wondering. Start cooking.</p>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl mb-4 flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors active:scale-95"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6"/>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  // --- MAIN APP SCREEN ---
  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-24">
      
      {/* APP HEADER */}
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-sm">🥗</div>
          <h1 className="text-lg font-bold text-gray-800">Next Meal</h1>
        </div>
        <button onClick={handleLogout} className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Sign Out
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">

        {/* TAB: SUGGESTION */}
        {activeTab === 'suggest' && (
          <>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
              
              {/* Mood Selector */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Mood</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {["Comfort Craving", "Spicy Kick", "Healthy & Guilt Free", "Sweet Tooth", "Quick & Easy"].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setMood(m)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        mood === m 
                        ? 'bg-green-600 text-white border-green-600 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selector */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Meal Time</h2>
                <div className="flex gap-2">
                  {["Breakfast", "Lunch", "Dinner"].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTime(t)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                        time === t 
                        ? 'bg-green-50 text-green-700 border-green-500 ring-1 ring-green-500' 
                        : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={getMeal}
                disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-gray-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Thinking<span className="animate-pulse">...</span></>
                ) : (
                  <>✨ Suggest Meal</>
                )}
              </button>
            </div>

            {/* RESULT CARD */}
            {recommendation && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 animate-slide-up">
                <div className="h-32 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                  <span className="text-6xl drop-shadow-sm">🍲</span>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 leading-tight mb-2">
                    {recommendation.recommended_meal_name}
                  </h2>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {recommendation.reason}
                  </p>
                  
                  <button 
                    onClick={openSaveModal}
                    className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-transform"
                  >
                    📅 Add to Plan
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="bg-white p-5 rounded-3xl shadow-sm min-h-[60vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Meal Plan</h2>
              <button 
                onClick={() => setActiveTab('suggest')} 
                className="text-sm text-green-600 font-bold"
              >
                + Add New
              </button>
            </div>

            {plan.length === 0 ? (
               <div className="text-center py-20">
                 <div className="text-5xl mb-4 opacity-20">📅</div>
                 <p className="text-gray-400">Your calendar is empty.</p>
                 <button onClick={() => setActiveTab('suggest')} className="mt-4 text-green-600 font-bold underline">Plan a meal now</button>
               </div>
            ) : (
              <div className="space-y-4">
                {plan.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-center w-14 bg-white rounded-xl py-2 shadow-sm border border-gray-100">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">{format(new Date(item.date), 'MMM')}</div>
                      <div className="text-xl font-black text-gray-800">{format(new Date(item.date), 'd')}</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{item.meal.name}</div>
                      <div className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-md inline-block mt-1 uppercase tracking-wide">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('suggest')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'suggest' ? 'text-green-600 scale-105' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🍳</span>
          <span className="text-[10px] font-bold uppercase tracking-wide">Discover</span>
        </button>
        <button 
          onClick={() => setActiveTab('calendar')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calendar' ? 'text-green-600 scale-105' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📅</span>
          <span className="text-[10px] font-bold uppercase tracking-wide">Plan</span>
        </button>
      </div>

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="font-bold text-xl mb-6 text-center">Schedule this Meal</h3>
            
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Day</p>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {next7Days.map(date => (
                  <button 
                    key={date.toString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                      selectedDate.getDate() === date.getDate() 
                      ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' 
                      : 'bg-white text-gray-600 border-gray-100'
                    }`}
                  >
                    <span className="text-xs font-medium">{format(date, 'EEE')}</span>
                    <span className="text-xl font-bold">{format(date, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Time</p>
              <div className="flex gap-2">
                {["Breakfast", "Lunch", "Dinner"].map(s => (
                  <button 
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
                      selectedSlot === s 
                      ? 'bg-green-50 text-green-700 border-green-500' 
                      : 'bg-white text-gray-400 border-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={saveToCalendar} 
              disabled={isSaving}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-200 active:scale-95 transition-transform"
            >
              {isSaving ? "Saving..." : "Confirm Schedule"}
            </button>
            <button onClick={() => setShowSaveModal(false)} className="w-full py-4 text-gray-400 font-medium mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

    </main>
  );
}