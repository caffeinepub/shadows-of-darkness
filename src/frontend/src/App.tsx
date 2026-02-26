import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./auth";
import { GameProvider, useGame, WALLPAPER_CSS, WALLPAPER_NAMES } from "./context/GameContext";
import Navigation from "./components/Navigation";
import HomeScreen from "./screens/HomeScreen";
import CollectionScreen from "./screens/CollectionScreen";
import PackOpeningScreen from "./screens/PackOpeningScreen";
import DeckBuilderScreen from "./screens/DeckBuilderScreen";
import DuelScreen from "./screens/DuelScreen";
import CustomCardCreatorScreen from "./screens/CustomCardCreatorScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";

type Screen = "home" | "duel" | "collection" | "packs" | "decks" | "creator" | "profile" | "leaderboard";

function ProfileSetupModal({ onComplete }: { onComplete: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsSubmitting(true);
    try {
      const { createActorWithConfig } = await import("./config");
      const actor = await createActorWithConfig();
      await actor.saveCallerUserProfile(username.trim(), "normal");
      onComplete(username.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)" }}
    >
      <div
        className="p-8 rounded-2xl max-w-md w-full mx-4 animate-scale-in"
        style={{
          background: "linear-gradient(135deg, #0a0010, #1a0028)",
          border: "1px solid rgba(255,215,0,0.4)",
          boxShadow: "0 0 60px rgba(255,215,0,0.2)",
        }}
      >
        <div className="text-center mb-8">
          <img
            src="/assets/generated/logo.dim_800x300.png"
            alt="Shadows of Darkness"
            className="h-16 mx-auto object-contain mb-4"
          />
          <h2
            className="text-2xl font-bold glow-gold"
            style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
          >
            Welcome, Duelist
          </h2>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            Choose your duelist name to begin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your duelist name..."
              maxLength={30}
              className="w-full px-4 py-3 rounded-lg text-white placeholder:text-white/30 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,215,0,0.3)",
                fontFamily: "Cinzel, serif",
                fontSize: "16px",
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full btn-game py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #8b0000, #dc143c)",
              color: "#ffd700",
              border: "2px solid rgba(255,215,0,0.4)",
              boxShadow: "0 0 30px rgba(220,20,60,0.4)",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.2em",
            }}
          >
            {isSubmitting ? "ENTERING..." : "ENTER THE SHADOWS"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const { isAuthenticated } = useAuth();
  const { userProfile, isLoadingProfile, wallpaper, customWallpaperUrl, refreshProfile } = useGame();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Check if new user needs profile setup
  useEffect(() => {
    if (isAuthenticated && !isLoadingProfile && userProfile === null) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, isLoadingProfile, userProfile]);

  const handleNavigate = (screen: string) => {
    if (!isAuthenticated && ["duel", "collection", "packs", "decks", "creator", "profile"].includes(screen)) {
      return;
    }
    setActiveScreen(screen as Screen);
  };

  const handleProfileSetupComplete = async () => {
    await refreshProfile();
    setShowProfileSetup(false);
  };

  const getWallpaperStyle = (): React.CSSProperties => {
    if (wallpaper === "custom" && customWallpaperUrl) {
      return {
        backgroundImage: `url(${customWallpaperUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }
    return {};
  };

  const wallpaperClass = wallpaper !== "custom" ? WALLPAPER_CSS[wallpaper] : "";

  return (
    <div
      className={`min-h-screen flex ${wallpaperClass}`}
      style={{
        ...getWallpaperStyle(),
        background: wallpaper === "custom" && customWallpaperUrl ? undefined : undefined,
      }}
    >
      {/* Profile setup modal */}
      {showProfileSetup && (
        <ProfileSetupModal onComplete={handleProfileSetupComplete} />
      )}

      {/* Navigation sidebar */}
      <Navigation activeScreen={activeScreen} onNavigate={handleNavigate} />

      {/* Main content area */}
      <main
        className="flex-1 flex flex-col min-h-screen overflow-hidden"
        style={{ marginLeft: "240px" }}
      >
        {/* Screen content — key forces remount + CSS enter animation on every navigation */}
        <div key={activeScreen} className="flex-1 overflow-hidden screen-enter">
          {activeScreen === "home" && (
            <HomeScreen onNavigate={handleNavigate} />
          )}
          {activeScreen === "collection" && isAuthenticated && (
            <CollectionScreen />
          )}
          {activeScreen === "packs" && isAuthenticated && (
            <PackOpeningScreen />
          )}
          {activeScreen === "decks" && isAuthenticated && (
            <DeckBuilderScreen />
          )}
          {activeScreen === "duel" && isAuthenticated && (
            <DuelScreen onExit={() => setActiveScreen("home")} />
          )}
          {activeScreen === "creator" && isAuthenticated && (
            <CustomCardCreatorScreen />
          )}
          {activeScreen === "profile" && isAuthenticated && (
            <ProfileScreen />
          )}
          {activeScreen === "leaderboard" && (
            <LeaderboardScreen />
          )}
        </div>
      </main>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(10,0,20,0.95)",
            border: "1px solid rgba(255,215,0,0.3)",
            color: "rgba(255,255,255,0.9)",
            fontFamily: "Rajdhani, sans-serif",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </AuthProvider>
  );
}
