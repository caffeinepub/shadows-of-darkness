import React, { useState } from "react";
import { useAuth } from "../auth";
import { useGame } from "../context/GameContext";
import {
  Home,
  Swords,
  BookOpen,
  Package,
  Layers,
  Wand2,
  User,
  Trophy,
  LogOut,
  LogIn,
  Menu,
  X,
  Volume2,
  VolumeX,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" />, requiresAuth: false },
  { id: "duel", label: "Duel", icon: <Swords className="w-5 h-5" />, requiresAuth: true },
  { id: "collection", label: "Collection", icon: <BookOpen className="w-5 h-5" />, requiresAuth: true },
  { id: "packs", label: "Open Packs", icon: <Package className="w-5 h-5" />, requiresAuth: true },
  { id: "decks", label: "Deck Builder", icon: <Layers className="w-5 h-5" />, requiresAuth: true },
  { id: "creator", label: "Card Creator", icon: <Wand2 className="w-5 h-5" />, requiresAuth: true },
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" />, requiresAuth: true },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5" />, requiresAuth: false },
];

interface NavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export default function Navigation({ activeScreen, onNavigate }: NavigationProps) {
  const { isAuthenticated, login, logout, isLoggingIn } = useAuth();
  const { userProfile, isMuted, toggleMute } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (screen: string) => {
    onNavigate(screen);
    setIsOpen(false);
  };

  const availableItems = NAV_ITEMS.filter(item => !item.requiresAuth || isAuthenticated);

  const sidebarContent = (
    <div
      className="h-full flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0d0018 0%, #080010 50%, #050008 100%)",
        borderRight: "1px solid rgba(255,215,0,0.12)",
        boxShadow: "inset -1px 0 40px rgba(0,0,0,0.8), 4px 0 30px rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Decorative rune strip at top */}
      <div
        className="w-full flex items-center justify-center gap-3 py-1"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.07), rgba(255,215,0,0.12), rgba(255,215,0,0.07), transparent)",
          borderBottom: "1px solid rgba(255,215,0,0.08)",
          fontSize: "8px",
          color: "rgba(255,215,0,0.25)",
          letterSpacing: "0.4em",
          fontFamily: "Cinzel, serif",
        }}
      >
        ✦ SHADOWS OF DARKNESS ✦
      </div>

      {/* Logo area */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}
      >
        <img
          src="/assets/generated/logo.dim_800x300.png"
          alt="Shadows of Darkness"
          className="h-8 object-contain"
          style={{ filter: "drop-shadow(0 0 10px rgba(255,50,0,0.6)) drop-shadow(0 0 20px rgba(255,100,0,0.3))" }}
        />
      </div>

      {/* User mini-profile */}
      {isAuthenticated && userProfile && (
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              border: "1px solid rgba(255,215,0,0.3)",
              background: "rgba(255,215,0,0.1)",
            }}
          >
            {userProfile.profile_picture ? (
              <img
                src={userProfile.profile_picture.getDirectURL()}
                alt={userProfile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm">⚔️</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#ffd700", fontFamily: "Cinzel, serif" }}>
              {userProfile.username}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-ui" style={{ color: "rgba(255,255,255,0.4)" }}>
                LVL {Number(userProfile.level)}
              </span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(Number(userProfile.xp) % 1000) / 10}%`,
                    background: "linear-gradient(90deg, #8b0000, #ffd700)",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            className="shrink-0 px-2 py-1 rounded text-xs font-ui"
            style={{
              background: "rgba(150,50,255,0.2)",
              border: "1px solid rgba(150,50,255,0.3)",
              color: "#a855f7",
            }}
          >
            {Number(userProfile.pack_count)} 📦
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {availableItems.map(item => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 relative ${isActive ? "nav-item-active" : "hover:bg-white/5"}`}
              style={{
                color: isActive ? "#ffd700" : "rgba(255,255,255,0.55)",
                fontFamily: "Cinzel, serif",
                fontSize: "13px",
                letterSpacing: "0.05em",
                textShadow: isActive ? "0 0 12px rgba(255,215,0,0.5)" : "none",
              }}
            >
              {/* Glowing left indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{
                    width: "3px",
                    height: "60%",
                    borderRadius: "0 2px 2px 0",
                    background: "linear-gradient(to bottom, rgba(255,165,0,0.6), #ffd700, rgba(255,165,0,0.6))",
                    boxShadow: "0 0 8px rgba(255,215,0,0.9), 0 0 16px rgba(255,215,0,0.5)",
                  }}
                />
              )}
              <span
                style={{
                  color: isActive ? "#ffd700" : "rgba(255,255,255,0.35)",
                  filter: isActive ? "drop-shadow(0 0 4px rgba(255,215,0,0.6))" : "none",
                  transition: "all 0.2s",
                }}
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "rgba(255,215,0,0.6)" }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div
        className="p-4 space-y-2"
        style={{ borderTop: "1px solid rgba(255,215,0,0.1)" }}
      >
        {/* Mute toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Cinzel, serif",
            fontSize: "12px",
          }}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {isMuted ? "Sound Off" : "Sound On"}
        </button>

        {/* Auth button */}
        <button
          type="button"
          onClick={isAuthenticated ? logout : login}
          disabled={isLoggingIn}
          className="w-full btn-game flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
          style={{
            background: isAuthenticated ? "rgba(220,20,60,0.15)" : "rgba(255,215,0,0.1)",
            border: isAuthenticated ? "1px solid rgba(220,20,60,0.3)" : "1px solid rgba(255,215,0,0.3)",
            color: isAuthenticated ? "#dc143c" : "#ffd700",
            fontFamily: "Cinzel, serif",
            fontSize: "12px",
          }}
        >
          {isAuthenticated ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {isLoggingIn ? "Connecting..." : isAuthenticated ? "Logout" : "Login"}
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "Rajdhani, sans-serif" }}>
          © 2026. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
            style={{ color: "rgba(255,215,0,0.4)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg lg:hidden"
        style={{
          background: "rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,215,0,0.3)",
          color: "#ffd700",
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 lg:hidden bg-transparent border-0 w-full h-full"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: "240px" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
