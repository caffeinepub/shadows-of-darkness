import React, { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { useGame } from "../context/GameContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, Package, BookOpen, Trophy, Star, Zap, Shield } from "lucide-react";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

function generateParticles(count: number): Particle[] {
  const colors = ["#ffd700", "#dc143c", "#8b44ff", "#00c8ff", "#ff4500"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

const PARTICLES = generateParticles(30);

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const { userProfile, isLoadingProfile } = useGame();
  const [logoVisible, setLogoVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 100);
    const t2 = setTimeout(() => setButtonsVisible(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const xpForNextLevel = 1000;
  const xpProgress = userProfile
    ? (Number(userProfile.xp) % xpForNextLevel) / xpForNextLevel * 100
    : 0;

  const quickActions = [
    {
      label: "DUEL NOW",
      icon: <Swords className="w-6 h-6" />,
      screen: "duel",
      color: "from-red-900 to-red-700",
      glow: "rgba(220,20,60,0.5)",
      description: "Enter the arena",
    },
    {
      label: "COLLECTION",
      icon: <BookOpen className="w-6 h-6" />,
      screen: "collection",
      color: "from-amber-900 to-amber-700",
      glow: "rgba(255,140,0,0.5)",
      description: "View your cards",
    },
    {
      label: "OPEN PACKS",
      icon: <Package className="w-6 h-6" />,
      screen: "packs",
      color: "from-purple-900 to-purple-700",
      glow: "rgba(150,50,255,0.5)",
      description: `${Number(userProfile?.pack_count ?? 0)} packs available`,
    },
    {
      label: "LEADERBOARD",
      icon: <Trophy className="w-6 h-6" />,
      screen: "leaderboard",
      color: "from-yellow-900 to-yellow-700",
      glow: "rgba(255,215,0,0.5)",
      description: "Top duelists",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/generated/bg-wallpaper.dim_1920x1080.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Dark energy swirls in corners */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full animate-spin-slow opacity-30"
        style={{ background: "radial-gradient(circle, rgba(150,0,255,0.6) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full animate-spin-slow opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(220,20,60,0.6) 0%, transparent 70%)",
          animationDirection: "reverse",
        }}
      />
      <div
        className="absolute top-1/2 -right-24 w-64 h-64 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)",
          animation: "energy-wave 5s ease-in-out infinite",
        }}
      />

      {/* Particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            bottom: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo */}
        <div
          className="mb-8 transition-all duration-700"
          style={{
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.9)",
          }}
        >
          <img
            src="/assets/generated/logo.dim_800x300.png"
            alt="Shadows of Darkness"
            className="max-w-lg w-full mx-auto"
            style={{
              filter: "drop-shadow(0 0 30px rgba(255,0,50,0.5)) drop-shadow(0 0 60px rgba(150,0,255,0.3))",
            }}
          />
          <p
            className="text-center text-xl tracking-[0.4em] uppercase mt-2"
            style={{
              fontFamily: "Cinzel, serif",
              color: "rgba(255,215,0,0.8)",
              textShadow: "0 0 20px rgba(255,215,0,0.5)",
            }}
          >
            The Card Game of Legend
          </p>
        </div>

        {/* Auth state */}
        {!isAuthenticated ? (
          <div
            className="text-center mb-10 transition-all duration-700"
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transform: buttonsVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <p
              className="mb-6 text-lg"
              style={{ fontFamily: "Rajdhani, sans-serif", color: "rgba(255,255,255,0.8)" }}
            >
              Enter the shadows. Begin your legend.
            </p>
            <button
              type="button"
              onClick={login}
              disabled={isLoggingIn}
              className="btn-game px-12 py-4 text-lg font-heading rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #8b0000, #dc143c, #8b0000)",
                backgroundSize: "200% 100%",
                color: "#ffd700",
                border: "2px solid rgba(255,215,0,0.5)",
                boxShadow: "0 0 30px rgba(220,20,60,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.2em",
              }}
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  CONNECTING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  ENTER THE GAME
                </span>
              )}
            </button>
            <p className="mt-4 text-sm text-white/40" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Secured by Internet Identity
            </p>
          </div>
        ) : (
          <div
            className="w-full max-w-4xl transition-all duration-700"
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transform: buttonsVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            {/* Player info bar */}
            {!isLoadingProfile && userProfile && (
              <div
                className="mb-8 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  border: "1px solid rgba(255,215,0,0.3)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 30px rgba(255,215,0,0.1)",
                }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      border: "2px solid rgba(255,215,0,0.5)",
                      boxShadow: "0 0 15px rgba(255,215,0,0.3)",
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
                      <span className="text-2xl">⚔️</span>
                    )}
                  </div>
                  <div>
                    <p
                      className="text-xl font-bold glow-gold"
                      style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
                    >
                      {userProfile.username}
                    </p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Orbitron, sans-serif" }}>
                      LEVEL {Number(userProfile.level)} DUELIST
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-white/60 font-ui">XP</span>
                    <span className="text-xs text-white/60 font-ui">
                      {Number(userProfile.xp) % xpForNextLevel} / {xpForNextLevel}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${xpProgress}%`,
                        background: "linear-gradient(90deg, #8b0000, #dc143c, #ffd700)",
                        boxShadow: "0 0 10px rgba(255,215,0,0.5)",
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "#ffd700", fontFamily: "Orbitron, sans-serif" }}>
                      {Number(userProfile.wins)}
                    </p>
                    <p className="text-xs text-white/50">WINS</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "#dc143c", fontFamily: "Orbitron, sans-serif" }}>
                      {Number(userProfile.losses)}
                    </p>
                    <p className="text-xs text-white/50">LOSSES</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "#8b44ff", fontFamily: "Orbitron, sans-serif" }}>
                      {Number(userProfile.pack_count)}
                    </p>
                    <p className="text-xs text-white/50">PACKS</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick action grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.screen}
                  type="button"
                  onClick={() => onNavigate(action.screen)}
                  className="group relative flex flex-col items-center gap-3 p-6 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))`,
                    border: "1px solid rgba(255,215,0,0.2)",
                    boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 30px ${action.glow}, 0 0 60px ${action.glow}`;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,215,0,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,215,0,0.2)";
                  }}
                >
                  <div
                    className="p-3 rounded-full transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${action.glow}, transparent)`,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span style={{ color: "#ffd700" }}>{action.icon}</span>
                  </div>
                  <div className="text-center">
                    <p
                      className="font-bold text-sm tracking-wider"
                      style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
                    >
                      {action.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Rajdhani, sans-serif" }}>
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* News ticker */}
            <div
              className="mt-8 p-3 rounded-lg flex items-center gap-3 overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,215,0,0.15)",
              }}
            >
              <Star className="w-4 h-4 shrink-0" style={{ color: "#ffd700" }} />
              <div className="overflow-hidden flex-1">
                <p className="text-sm whitespace-nowrap" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Rajdhani, sans-serif" }}>
                  ✦ Welcome to Shadows of Darkness — earn packs by winning duels and leveling up! ✦ New cards generate every session ✦ Rare holographic cards await in every pack ✦
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
