// Global game state context
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { UserProfileView, Card } from "../backend.d";
import { useAuth } from "../auth";
import { useActor } from "../hooks/useActor";

export type WallpaperKey =
  | "shadow-void"
  | "crimson-inferno"
  | "ancient-ruins"
  | "cyber-grid"
  | "dragon-lair"
  | "celestial"
  | "custom";

export const WALLPAPER_CSS: Record<WallpaperKey, string> = {
  "shadow-void": "wallpaper-shadow-void",
  "crimson-inferno": "wallpaper-crimson-inferno",
  "ancient-ruins": "wallpaper-ancient-ruins",
  "cyber-grid": "wallpaper-cyber-grid",
  "dragon-lair": "wallpaper-dragon-lair",
  "celestial": "wallpaper-celestial",
  "custom": "",
};

export const WALLPAPER_NAMES: Record<WallpaperKey, string> = {
  "shadow-void": "Shadow Void",
  "crimson-inferno": "Crimson Inferno",
  "ancient-ruins": "Ancient Ruins",
  "cyber-grid": "Cyber Grid",
  "dragon-lair": "Dragon's Lair",
  "celestial": "Celestial",
  "custom": "Custom",
};

interface GameContextValue {
  userProfile: UserProfileView | null;
  cards: Card[];
  wallpaper: WallpaperKey;
  customWallpaperUrl: string | null;
  isMuted: boolean;
  isLoadingProfile: boolean;
  isLoadingCards: boolean;
  setWallpaper: (w: WallpaperKey) => void;
  setCustomWallpaperUrl: (url: string) => void;
  toggleMute: () => void;
  refreshProfile: () => Promise<void>;
  refreshCards: () => Promise<void>;
  setUserProfile: (p: UserProfileView | null) => void;
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

export function GameProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { actor, isFetching: actorFetching } = useActor();
  const [userProfile, setUserProfile] = useState<UserProfileView | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [wallpaper, setWallpaperState] = useState<WallpaperKey>(
    () => (localStorage.getItem("wallpaper") as WallpaperKey) ?? "shadow-void"
  );
  const [customWallpaperUrl, setCustomWallpaperUrlState] = useState<string | null>(
    () => localStorage.getItem("customWallpaperUrl")
  );
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("muted") === "true");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!actor || actorFetching) return;
    setIsLoadingProfile(true);
    try {
      const profile = await actor.getCallerUserProfile();
      setUserProfile(profile);
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [actor, actorFetching]);

  const refreshCards = useCallback(async () => {
    if (!actor || actorFetching) return;
    setIsLoadingCards(true);
    try {
      const allCards = await actor.getAllCards();
      setCards(allCards);
    } catch (e) {
      console.error("Failed to load cards:", e);
    } finally {
      setIsLoadingCards(false);
    }
  }, [actor, actorFetching]);

  useEffect(() => {
    if (isAuthenticated && actor && !actorFetching) {
      refreshProfile();
      refreshCards();
    } else if (!isAuthenticated) {
      setUserProfile(null);
      setCards([]);
    }
  }, [isAuthenticated, actor, actorFetching, refreshProfile, refreshCards]);

  const setWallpaper = (w: WallpaperKey) => {
    setWallpaperState(w);
    localStorage.setItem("wallpaper", w);
  };

  const setCustomWallpaperUrl = (url: string) => {
    setCustomWallpaperUrlState(url);
    localStorage.setItem("customWallpaperUrl", url);
    setWallpaper("custom");
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      localStorage.setItem("muted", String(!prev));
      return !prev;
    });
  };

  return (
    <GameContext.Provider value={{
      userProfile,
      cards,
      wallpaper,
      customWallpaperUrl,
      isMuted,
      isLoadingProfile,
      isLoadingCards,
      setWallpaper,
      setCustomWallpaperUrl,
      toggleMute,
      refreshProfile,
      refreshCards,
      setUserProfile,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
