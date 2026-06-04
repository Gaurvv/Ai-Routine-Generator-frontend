import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import RoutineForm from "./RoutineForm";

function Home() {
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const navigate = useNavigate();

  const GOOGLELOGIN_API = import.meta.env.VITE_GOOGLELOGIN;
  const USERME_API = import.meta.env.VITE_USERME;
  const BLACKLIST_API = import.meta.env.VITE_BLACKLIST;
  const REFRESHTOKEN_API = import.meta.env.VITE_REFRESHTOKEN;

  // Defined outside useEffect so logout button in Navbar can call it
  const logout = () => {
    const raw = localStorage.getItem("auth_token");
    localStorage.removeItem("auth_token");
    if (raw) {
      try {
        const token = JSON.parse(raw);
        fetch(BLACKLIST_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: token?.refresh }),
        }).catch((err) => console.error("Error blacklisting token:", err));
      } catch {}
    }
    navigate("/login");
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(USERME_API, {
        headers: { Authorization: `Bearer ${token?.access}` },
      });
      if (!response.ok) throw new Error("Unauthorized");
      const data = await response.json();
      setUser(data);
    } catch {
      localStorage.removeItem("auth_token");
      navigate("/login");
    }
  };

  const handleGoogleLogin = async (code) => {
    console.log("🔑 Code from Google:", code);
    try {
      console.log("📡 Calling backend API:", GOOGLELOGIN_API);
      const response = await fetch(GOOGLELOGIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirect_uri: "https://routiney-generator.netlify.app/",
        }),
      });
      console.log("📥 Response Status:", response.status);
      const data = await response.json();
      console.log("📦 Response Data:", data);

      if (data.refresh && data.access) {
        console.log("✅ Token received, saving to localStorage");
        localStorage.setItem("auth_token", JSON.stringify(data));
        window.history.replaceState(null, "", "/");
        fetchUserProfile(data);
      } else {
        console.error("❌ No refresh/access token in response:", data);
        navigate("/login");
      }
    } catch (error) {
      console.error("❌ Error during Google login:", error);
      navigate("/login");
    }
  };

  useEffect(() => {
    // ── 1. Read token once on mount ──
    const storedToken = localStorage.getItem("auth_token");
    let token = null;

    if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
      try {
        token = JSON.parse(storedToken);
      } catch {
        localStorage.removeItem("auth_token");
      }
    }

    // ── 2. Handle OAuth code redirect or normal load ──
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleGoogleLogin(code);
    } else if (token?.access) {
      fetchUserProfile(token);
    } else {
      navigate("/login");
    }

    // ── 3. Token refresh interval ──
    // All refresh logic is self-contained here to avoid stale closures.
    // We do NOT reference updateToken/logout from outer scope.
    const REFRESH_INTERVAL = 1000 * 60 * 4; // 4 minutes

    const intervalId = setInterval(async () => {
      const raw = localStorage.getItem("auth_token");

      if (!raw) {
        clearInterval(intervalId);
        navigate("/login");
        return;
      }

      let currentToken = null;
      try {
        currentToken = JSON.parse(raw);
      } catch {
        localStorage.removeItem("auth_token");
        clearInterval(intervalId);
        navigate("/login");
        return;
      }

      if (!currentToken?.refresh) {
        localStorage.removeItem("auth_token");
        clearInterval(intervalId);
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(REFRESHTOKEN_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: currentToken.refresh }),
        });

        if (response.status === 200) {
          const data = await response.json();
          const updatedToken = { ...currentToken, access: data.access };
          localStorage.setItem("auth_token", JSON.stringify(updatedToken));
          console.log("🔄 Token refreshed successfully");
        } else {
          // Refresh token expired or revoked
          console.warn("⚠️ Token refresh failed, status:", response.status);
          localStorage.removeItem("auth_token");
          clearInterval(intervalId);
          navigate("/login");
        }
      } catch (err) {
        console.error("❌ Token refresh network error:", err);
        // Don't log out on network errors — user might just be offline briefly
        // Only clear token on explicit auth failures (handled above)
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []); // ← empty deps: runs once on mount

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <Navbar user={user} onLogout={logout} />

      {showLanding ? (
        /* LANDING PAGE */
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-96 h-96 bg-purple-300/20 rounded-full blur-3xl -top-48 -left-48"></div>
            <div className="absolute w-96 h-96 bg-blue-300/20 rounded-full blur-3xl top-1/2 -right-48"></div>
            <div className="absolute w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl -bottom-48 left-1/2"></div>
          </div>

          {/* Hero Section */}
          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16">
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  ✨ AI-Powered Scheduling
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {user.username}
                </span>
                !
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Let AI optimize your daily routine. Create personalized
                schedules that maximize productivity and balance.
              </p>
              <button
                onClick={() => setShowLanding(false)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
              >
                Create Your Routine
                <svg
                  className="inline-block w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              {/* Feature 1 */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart AI Planning</h3>
                <p className="text-gray-600">
                  Our AI analyzes your schedule and creates optimized routines
                  that fit your lifestyle perfectly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Flexible Scheduling</h3>
                <p className="text-gray-600">
                  Set fixed commitments and flexible tasks. AI finds the
                  perfect time slots for everything.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Productivity Boost</h3>
                <p className="text-gray-600">
                  Maximize your efficiency with data-driven scheduling that
                  balances work and rest.
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-20 bg-white/50 backdrop-blur-lg rounded-3xl p-12 border border-white/50 shadow-xl">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    AI
                  </div>
                  <p className="text-gray-600 font-medium">Powered Intelligence</p>
                </div>
                <div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    24/7
                  </div>
                  <p className="text-gray-600 font-medium">Available Anytime</p>
                </div>
                <div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    ∞
                  </div>
                  <p className="text-gray-600 font-medium">Unlimited Routines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ROUTINE FORM PAGE */
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => setShowLanding(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
          <RoutineForm />
        </div>
      )}
    </div>
  );
}

export default Home;