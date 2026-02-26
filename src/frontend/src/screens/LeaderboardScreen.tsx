import React, { useState, useEffect, useCallback } from "react";
import { useActor } from "../hooks/useActor";
import { DuelHistory } from "../backend.d";
import { useAuth } from "../auth";
import { Trophy, Star, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  rank: number;
  principal: string;
  username: string;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
}

export default function LeaderboardScreen() {
  const { principal } = useAuth();
  const { actor } = useActor();
  const [topWins, setTopWins] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = actor ? await actor.getCompletedDuelHistory() : [];

      // Aggregate wins/losses per player
      const stats = new Map<string, { wins: number; losses: number }>();
      history.forEach((duel: DuelHistory) => {
        const winner = duel.winner.toString();
        const loser = [duel.player1, duel.player2]
          .find(p => p.toString() !== winner)
          ?.toString();

        const ws = stats.get(winner) ?? { wins: 0, losses: 0 };
        stats.set(winner, { ...ws, wins: ws.wins + 1 });

        if (loser) {
          const ls = stats.get(loser) ?? { wins: 0, losses: 0 };
          stats.set(loser, { ...ls, losses: ls.losses + 1 });
        }
      });

      // Generate leaderboard entries
      const entries: LeaderboardEntry[] = [];
      let rank = 1;
      for (const [princ, s] of Array.from(stats.entries()).sort((a, b) => b[1].wins - a[1].wins).slice(0, 20)) {
        const total = s.wins + s.losses;
        entries.push({
          rank: rank++,
          principal: princ,
          username: `Duelist #${princ.slice(-6)}`,
          level: Math.floor(s.wins * 1.5) + 1,
          wins: s.wins,
          losses: s.losses,
          winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0,
        });
      }

      // Pad with placeholder entries if empty
      if (entries.length === 0) {
        const placeholders = [
          { name: "Shadow Master", wins: 99, losses: 12 },
          { name: "Void Knight", wins: 87, losses: 18 },
          { name: "Dark Sorceress", wins: 76, losses: 22 },
          { name: "Abyss Dragon", wins: 65, losses: 25 },
          { name: "Crimson Emperor", wins: 54, losses: 30 },
          { name: "Phantom Duelist", wins: 43, losses: 28 },
          { name: "Star Weaver", wins: 38, losses: 20 },
          { name: "Cursed One", wins: 31, losses: 35 },
        ];
        placeholders.forEach(({ name, wins, losses }, i) => {
          const total = wins + losses;
          entries.push({
            rank: i + 1,
            principal: `placeholder-${i}`,
            username: name,
            level: Math.floor(wins * 1.5) + 1,
            wins,
            losses,
            winRate: Math.round((wins / total) * 100),
          });
        });
      }

      setTopWins(entries);
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", glow: "0 0 20px rgba(255,215,0,0.3)" };
    if (rank === 2) return { bg: "rgba(192,192,192,0.1)", border: "1px solid rgba(192,192,192,0.3)", glow: "0 0 15px rgba(192,192,192,0.2)" };
    if (rank === 3) return { bg: "rgba(205,127,50,0.1)", border: "1px solid rgba(205,127,50,0.3)", glow: "0 0 15px rgba(205,127,50,0.2)" };
    return { bg: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", glow: "none" };
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: "👑", color: "#ffd700" };
    if (rank === 2) return { icon: "🥈", color: "#c0c0c0" };
    if (rank === 3) return { icon: "🥉", color: "#cd7f32" };
    return { icon: `#${rank}`, color: "rgba(255,255,255,0.4)" };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <h2
          className="text-3xl font-bold glow-gold"
          style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
        >
          <Trophy className="inline-block w-8 h-8 mr-3 mb-1" />
          Leaderboard
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="wins" className="w-full">
          <TabsList
            className="mb-6"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,215,0,0.2)" }}
          >
            <TabsTrigger
              value="wins"
              className="data-[state=active]:text-yellow-400"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Top Wins
            </TabsTrigger>
            <TabsTrigger
              value="level"
              className="data-[state=active]:text-yellow-400"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              <Star className="w-4 h-4 mr-2" />
              Top Level
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wins">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-w-3xl mx-auto">
                {topWins.map(entry => {
                  const rankStyle = getRankStyle(entry.rank);
                  const rankBadge = getRankBadge(entry.rank);
                  const isMe = entry.principal === principal;

                  return (
                    <div
                      key={entry.principal}
                      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
                      style={{
                        background: isMe ? "rgba(150,50,255,0.15)" : rankStyle.bg,
                        border: isMe ? "1px solid rgba(150,50,255,0.5)" : rankStyle.border,
                        boxShadow: rankStyle.glow,
                      }}
                    >
                      {/* Rank */}
                      <div
                        className="w-10 text-center text-lg shrink-0"
                        style={{ color: rankBadge.color, fontFamily: "Orbitron, sans-serif" }}
                      >
                        {rankBadge.icon}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: `hsl(${(entry.rank * 50) % 360}, 60%, 20%)`,
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        ⚔️
                      </div>

                      {/* Name + level */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold truncate"
                          style={{
                            fontFamily: "Cinzel, serif",
                            color: isMe ? "#a855f7" : rankBadge.color,
                          }}
                        >
                          {entry.username}
                          {isMe && <span className="ml-2 text-xs text-purple-400">(you)</span>}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "Orbitron, sans-serif",
                          }}
                        >
                          LVL {entry.level}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-center shrink-0">
                        <div>
                          <p className="text-lg font-bold font-ui" style={{ color: "#00ff88" }}>
                            {entry.wins}
                          </p>
                          <p className="text-xs text-white/30">WINS</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold font-ui" style={{ color: "#dc143c" }}>
                            {entry.losses}
                          </p>
                          <p className="text-xs text-white/30">LOSSES</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold font-ui" style={{ color: "#ffd700" }}>
                            {entry.winRate}%
                          </p>
                          <p className="text-xs text-white/30">WIN %</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="level">
            <div className="space-y-2 max-w-3xl mx-auto">
              {[...topWins].sort((a, b) => b.level - a.level).map((entry, idx) => {
                const rank = idx + 1;
                const rankStyle = getRankStyle(rank);
                const rankBadge = getRankBadge(rank);
                const isMe = entry.principal === principal;

                return (
                  <div
                    key={entry.principal}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{
                      background: isMe ? "rgba(150,50,255,0.15)" : rankStyle.bg,
                      border: isMe ? "1px solid rgba(150,50,255,0.5)" : rankStyle.border,
                      boxShadow: rankStyle.glow,
                    }}
                  >
                    <div className="w-10 text-center text-lg" style={{ color: rankBadge.color, fontFamily: "Orbitron, sans-serif" }}>
                      {rankBadge.icon}
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: `hsl(${(rank * 50) % 360}, 60%, 20%)`, border: "1px solid rgba(255,255,255,0.1)" }}>
                      ⚔️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ fontFamily: "Cinzel, serif", color: rankBadge.color }}>
                        {entry.username}
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Orbitron, sans-serif" }}>
                        {entry.wins} wins total
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" style={{ color: "#ffd700" }} />
                      <p className="text-2xl font-bold font-ui" style={{ color: "#ffd700" }}>
                        {entry.level}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
