"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Heart,
  Coffee,
  CloudRain,
  CloudSnow,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  Check,
  X,
  Image as ImageIcon,
  Share2,
  ArrowLeft,
  LogOut,
  Copy,
  Sparkles,
  Pin,
  Coins,
  Palette,
  Flame,
  Trees,
  Mountain,
  Waves,
  Flower2,
  Leaf,
  User,
  Edit2,
} from "lucide-react";
import { useCozyRoom, type WeatherEffect } from "../../../src/hooks/useCozyRoom";
import {
  DeskStickyNotePad,
  DeskStickyNotesModal,
  type StickyColor,
} from "../../../src/components/DeskStickyNotes";
import {
  BackgroundShopModal,
  ROOM_THEMES,
  type RoomThemeId,
  type RoomTheme,
} from "../../../src/components/BackgroundShopModal";

// ==========================================
// Types
// ==========================================
type PomodoroMode = "work25" | "work45" | "work50" | "shortBreak" | "longBreak";

interface ModeConfig {
  label: string;
  duration: number; // in seconds
  type: "focus" | "break";
}

const MODES: Record<PomodoroMode, ModeConfig> = {
  work45: { label: "45m Deep Focus", duration: 45 * 60, type: "focus" },
  work25: { label: "25m Classic", duration: 25 * 60, type: "focus" },
  work50: { label: "50m Intensive", duration: 50 * 60, type: "focus" },
  shortBreak: { label: "5m Tea Break", duration: 5 * 60, type: "break" },
  longBreak: { label: "15m Rest", duration: 15 * 60, type: "break" },
};

// Static Snowflake definitions for gentle falling snow effect
const SNOWFLAKES = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  left: (i * 3.1 + (i % 7) * 2.7) % 100,
  size: 3 + ((i * 3) % 5),
  duration: 4.5 + ((i * 1.6) % 5.5),
  delay: ((i * 0.45) % 5),
  opacity: 0.45 + ((i * 0.12) % 0.5),
  drift: ((i % 3) - 1) * 16,
}));

// Static Raindrop definitions for rain weather effect
const RAINDROPS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: (i * 3.6 + (i % 5) * 2.1) % 100,
  height: 12 + ((i * 4) % 14),
  duration: 0.9 + ((i * 0.25) % 0.7),
  delay: (i * 0.14) % 1.8,
  opacity: 0.35 + ((i * 0.1) % 0.45),
}));

export interface RoomPageProps {
  params?: { roomId?: string } | Promise<{ roomId?: string }>;
  roomId?: string;
  initialUserName?: string;
  onNavigateHome?: () => void;
}

export default function RoomPage({ params, roomId: propRoomId, initialUserName, onNavigateHome }: RoomPageProps = {}) {
  // Resolve roomId from Next.js params, props, or current URL
  const [roomId, setRoomId] = useState<string>(() => {
    if (propRoomId) return propRoomId;
    if (params && typeof (params as any).then !== "function" && (params as { roomId?: string }).roomId) {
      return (params as { roomId?: string }).roomId!;
    }
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/room\/([^/?#]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
      const queryParam = new URLSearchParams(window.location.search).get("roomId") || new URLSearchParams(window.location.search).get("room");
      if (queryParam) return queryParam;
    }
    return "cozy-loft";
  });

  // Handle async Next.js 15 App Router params
  useEffect(() => {
    if (params) {
      if (typeof (params as any).then === "function") {
        (params as Promise<{ roomId?: string }>).then((resolved) => {
          if (resolved?.roomId) setRoomId(resolved.roomId);
        });
      } else if ((params as { roomId?: string }).roomId) {
        setRoomId((params as { roomId?: string }).roomId!);
      }
    } else if (propRoomId) {
      setRoomId(propRoomId);
    }
  }, [params, propRoomId]);

  // Copy Invite Link state
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize Room State via Supabase Realtime Channels
  const {
    timerSeconds: timeLeft,
    isRunning,
    sharedEnergy: focusEnergy,
    currentWeather: weather,
    isDistracted,
    distractedUser,
    isConnected,
    myUserName,
    setMyUserName,
    partnerName,
    isPartnerOnline,
    partnerCount,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    lastCompletedTaskNotice,
    updateTimer,
    updateIsRunning,
    updateWeather,
    updateEnergy,
    reportFocusLost,
  } = useCozyRoom(roomId, {
    initialTimer: MODES["work45"].duration,
    initialEnergy: 84,
    initialWeather: "snow",
    initialUserName: initialUserName,
  });

  const username = myUserName || (typeof window !== "undefined" ? localStorage.getItem("username") : "") || "Guest";

  // Sticky Notes Modal State
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);

  // Coin Economy & Background Shop State
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("cozy_user_coins");
      return saved !== null ? Math.max(0, parseInt(saved, 10)) : 15;
    } catch {
      return 15;
    }
  });

  const [unlockedThemes, setUnlockedThemes] = useState<RoomThemeId[]>(() => {
    try {
      const saved = localStorage.getItem("cozy_unlocked_themes");
      const list = saved ? JSON.parse(saved) : [];
      const merged = Array.from(
        new Set(["emerald-forest", "warm-loft", ...(Array.isArray(list) ? list : [])])
      );
      return merged as RoomThemeId[];
    } catch {
      return ["emerald-forest", "warm-loft"];
    }
  });

  const [activeTheme, setActiveTheme] = useState<RoomThemeId>(() => {
    try {
      const saved = (localStorage.getItem("cozy_active_theme") as RoomThemeId) || "emerald-forest";
      const validThemes: RoomThemeId[] = [
        "emerald-forest",
        "sakura-garden",
        "mountain-lake",
        "sunset-meadow",
        "bamboo-waterfall",
        "starry-wilderness",
        "autumn-woods",
        "warm-loft",
      ];
      return validThemes.includes(saved) ? saved : "emerald-forest";
    } catch {
      return "emerald-forest";
    }
  });

  const [isThemeShopOpen, setIsThemeShopOpen] = useState<boolean>(false);
  const [coinNotice, setCoinNotice] = useState<{ amount: number; message: string; id: number } | null>(null);
  const coinNoticeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const focusedSecondsRef = useRef<number>(0);

  const awardCoins = (amount: number, message: string) => {
    if (amount > 0) {
      setCoins((prev) => {
        const next = prev + amount;
        try {
          localStorage.setItem("cozy_user_coins", next.toString());
        } catch (e) {
          console.error("Failed saving coins:", e);
        }
        return next;
      });
    }

    const id = Date.now() + Math.random();
    setCoinNotice({ amount, message, id });
    if (coinNoticeTimeoutRef.current) clearTimeout(coinNoticeTimeoutRef.current);
    coinNoticeTimeoutRef.current = setTimeout(() => {
      setCoinNotice((curr) => (curr?.id === id ? null : curr));
    }, 3200);
  };

  const handleUnlockTheme = (theme: RoomTheme) => {
    if (coins < theme.cost) return;
    const nextCoins = coins - theme.cost;
    const nextUnlocked = [...unlockedThemes, theme.id];
    setCoins(nextCoins);
    setUnlockedThemes(nextUnlocked);
    setActiveTheme(theme.id);

    try {
      localStorage.setItem("cozy_user_coins", nextCoins.toString());
      localStorage.setItem("cozy_unlocked_themes", JSON.stringify(nextUnlocked));
      localStorage.setItem("cozy_active_theme", theme.id);
    } catch (e) {
      console.error("Failed saving theme purchase:", e);
    }

    awardCoins(0, `Unlocked & Applied "${theme.name}"! ✨`);
  };

  const handleSelectTheme = (themeId: RoomThemeId) => {
    setActiveTheme(themeId);
    try {
      localStorage.setItem("cozy_active_theme", themeId);
    } catch (e) {
      console.error("Failed saving active theme:", e);
    }
  };

  const handleToggleTaskWithReward = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      awardCoins(1, "+1 Study Coin (Goal checked off!) 🪙");
    }
    toggleTask(taskId);
  };

  // Local Preset Mode State
  const [selectedMode, setSelectedMode] = useState<PomodoroMode>("work45");
  const [completedSessions, setCompletedSessions] = useState<number>(3);

  // Weather & Atmosphere State
  const [isWeatherMenuOpen, setIsWeatherMenuOpen] = useState<boolean>(false);
  const [ambience, setAmbience] = useState<"sunset" | "rainy" | "night">("sunset");
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [audioVolume, setAudioVolume] = useState<number>(0.35);

  // Character Customization & Nickname Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameInput, setRenameInput] = useState<string>("");
  const [user1CustomImage, setUser1CustomImage] = useState<string | null>(null);
  const [user2CustomImage, setUser2CustomImage] = useState<string | null>(null);

  // Floating reaction animations between users
  const [activeReactions, setActiveReactions] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);

  // Audio Context Ref for cozy procedural lo-fi rain/ambient noise
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // ------------------------------------------
  // Copy Invite Link Handler
  // ------------------------------------------
  const handleCopyInviteLink = async () => {
    try {
      let inviteUrl = "";
      if (typeof window !== "undefined") {
        inviteUrl = window.location.href;
        // If current url does not include /room/, format standard url
        if (!inviteUrl.includes("/room/")) {
          inviteUrl = `${window.location.origin}/room/${encodeURIComponent(roomId)}`;
        }
      } else {
        inviteUrl = `https://cozy-study.app/room/${roomId}`;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = inviteUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setIsCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 3200);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  // ------------------------------------------
  // Page Visibility API Tab Switching Detection
  // Synchronized via Supabase Realtime Channels
  // ------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isRunning) {
          // Subtract 25 from shared energy and broadcast to partner via Supabase Realtime
          reportFocusLost(myUserName);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [isRunning, myUserName, reportFocusLost]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWeatherMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------------------
  // Pomodoro Countdown Logic & Peer Broadcast
  // ------------------------------------------
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        const nextTime = timeLeft - 1;
        if (nextTime <= 0) {
          updateTimer(0, false, true);
          if (MODES[selectedMode].type === "focus") {
            setCompletedSessions((c) => c + 1);
            updateEnergy((e) => Math.min(100, e + 12));
            awardCoins(5, "+5 Study Coins (Pomodoro round completed!) 🪙");
          }
        } else {
          // Periodic sync broadcast every 5s, otherwise local decrement
          const shouldBroadcast = nextTime % 5 === 0;
          updateTimer(nextTime, undefined, shouldBroadcast);
          if (MODES[selectedMode].type === "focus") {
            focusedSecondsRef.current += 1;
            // +1 coin every minute of focused study (60 seconds)
            if (focusedSecondsRef.current % 60 === 0) {
              awardCoins(1, "+1 Study Coin (1 min focused study) 🪙");
            }
            if (nextTime % 15 === 0) {
              updateEnergy((e) => Math.min(100, Number((e + 0.4).toFixed(1))));
            }
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, selectedMode, updateTimer, updateEnergy]);

  const handleModeChange = (mode: PomodoroMode) => {
    setSelectedMode(mode);
    updateTimer(MODES[mode].duration, false, true);
  };

  const handleReset = () => {
    updateTimer(MODES[selectedMode].duration, false, true);
  };

  const handleToggleRunning = () => {
    updateIsRunning(!isRunning);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ------------------------------------------
  // Floating Reactions
  // ------------------------------------------
  const triggerReaction = (text: string) => {
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40;
    const y = 35 + Math.random() * 30;
    setActiveReactions((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  // ------------------------------------------
  // Procedural Lo-Fi Rain / Pink Noise Audio
  // ------------------------------------------
  const toggleAmbientSound = () => {
    if (!isAudioMuted) {
      if (audioCtxRef.current && audioCtxRef.current.state === "running") {
        audioCtxRef.current.suspend();
      }
      setIsAudioMuted(true);
      return;
    }

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (!noiseNodeRef.current) {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1000;

        const gainNode = ctx.createGain();
        gainNode.gain.value = audioVolume;
        gainNodeRef.current = gainNode;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start(0);
        noiseNodeRef.current = whiteNoise;
      } else if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(audioVolume, ctx.currentTime);
      }

      setIsAudioMuted(false);
    } catch (e) {
      console.warn("Audio Context autoplay restriction or error:", e);
      setIsAudioMuted(true);
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(audioVolume, audioCtxRef.current.currentTime);
    }
  }, [audioVolume]);

  const isNight = ambience === "night";

  const handleReturnHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Dynamic background styling and ambient effects according to active nature theme
  const getThemeStyles = () => {
    switch (activeTheme) {
      case "emerald-forest":
        return {
          containerClass: "bg-gradient-to-b from-[#071912] via-[#0F2E22] to-[#194030] text-[#E8F5E9]",
          frameClass: "bg-[#11291E]/75 border-emerald-400/30 text-[#E8F5E9] shadow-2xl",
          rugClass: "bg-[#163829]/70 border-emerald-300/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-24 -left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-1/4 w-[500px] h-64 bg-gradient-to-b from-amber-300/10 via-emerald-300/5 to-transparent blur-2xl pointer-events-none transform -rotate-12" />
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-emerald-300/60 text-sm select-none animate-pulse"
                  style={{
                    top: `${10 + ((i * 11) % 75)}%`,
                    left: `${5 + ((i * 13) % 90)}%`,
                    transform: `rotate(${(i * 47) % 360}deg) scale(${0.7 + ((i % 3) * 0.25)})`,
                    animationDuration: `${3 + (i % 4)}s`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                >
                  🍃
                </div>
              ))}
            </div>
          ),
        };

      case "sakura-garden":
        return {
          containerClass: "bg-gradient-to-b from-[#1F0F18] via-[#2F1825] to-[#422234] text-[#FDF2F8]",
          frameClass: "bg-[#331C2A]/75 border-pink-400/30 text-[#FDF2F8] shadow-2xl",
          rugClass: "bg-[#422136]/70 border-pink-300/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-pink-400/15 via-rose-300/5 to-transparent blur-2xl" />
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-pink-300/75 text-xs select-none animate-bounce"
                  style={{
                    top: `${5 + ((i * 9) % 80)}%`,
                    left: `${8 + ((i * 11) % 84)}%`,
                    transform: `rotate(${(i * 35) % 360}deg) scale(${0.8 + ((i % 3) * 0.2)})`,
                    animationDuration: `${4 + (i % 3)}s`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  🌸
                </div>
              ))}
            </div>
          ),
        };

      case "mountain-lake":
        return {
          containerClass: "bg-gradient-to-b from-[#06121E] via-[#0D2336] to-[#15344E] text-[#F0F9FF]",
          frameClass: "bg-[#0E253A]/80 border-sky-400/30 text-[#F0F9FF] shadow-2xl",
          rugClass: "bg-[#14324D]/70 border-sky-300/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-sky-400/10 via-cyan-300/5 to-transparent blur-2xl" />
              <div className="absolute top-10 right-10 w-80 h-80 bg-sky-300/10 rounded-full blur-3xl" />
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-sky-200/40 blur-xs"
                  style={{
                    bottom: `${10 + ((i * 8) % 30)}%`,
                    left: `${15 + ((i * 14) % 70)}%`,
                    width: `${24 + (i * 8)}px`,
                    height: `${6 + (i * 2)}px`,
                    opacity: 0.4 + ((i % 3) * 0.2),
                  }}
                />
              ))}
            </div>
          ),
        };

      case "sunset-meadow":
        return {
          containerClass: "bg-gradient-to-b from-[#1C0D05] via-[#2F180A] to-[#452310] text-[#FEF3C7]",
          frameClass: "bg-[#331A0B]/80 border-amber-500/30 text-[#FEF3C7] shadow-2xl",
          rugClass: "bg-[#472510]/70 border-amber-400/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-radial from-amber-400/20 via-orange-500/10 to-transparent blur-3xl animate-pulse" />
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-amber-300/70 shadow-[0_0_8px_#F59E0B] animate-ping"
                  style={{
                    top: `${15 + ((i * 8) % 70)}%`,
                    left: `${10 + ((i * 12) % 80)}%`,
                    width: `${3 + (i % 3)}px`,
                    height: `${3 + (i % 3)}px`,
                    animationDuration: `${2.5 + (i % 3)}s`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            </div>
          ),
        };

      case "bamboo-waterfall":
        return {
          containerClass: "bg-gradient-to-b from-[#061811] via-[#0C2B1F] to-[#143E2E] text-[#D1FAE5]",
          frameClass: "bg-[#0F3124]/80 border-emerald-500/30 text-[#D1FAE5] shadow-2xl",
          rugClass: "bg-[#144230]/70 border-emerald-400/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute bottom-0 left-1/3 w-96 h-60 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-emerald-200/50 text-xs select-none animate-pulse"
                  style={{
                    top: `${10 + ((i * 11) % 80)}%`,
                    left: `${12 + ((i * 10) % 76)}%`,
                    transform: `rotate(${(i * 60) % 360}deg)`,
                    animationDuration: `${3.5 + (i % 3)}s`,
                  }}
                >
                  🎋
                </div>
              ))}
            </div>
          ),
        };

      case "starry-wilderness":
        return {
          containerClass: "bg-gradient-to-b from-[#040610] via-[#090F22] to-[#101936] text-[#E2E8F0]",
          frameClass: "bg-[#0C142E]/80 border-indigo-500/30 text-[#E2E8F0] shadow-2xl",
          rugClass: "bg-[#111C3D]/70 border-indigo-400/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent" />
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-emerald-300 shadow-[0_0_10px_#34D399] animate-pulse"
                  style={{
                    top: `${15 + ((i * 9) % 70)}%`,
                    left: `${8 + ((i * 11) % 84)}%`,
                    width: `${3 + (i % 2)}px`,
                    height: `${3 + (i % 2)}px`,
                    animationDuration: `${2 + (i % 3)}s`,
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
              ))}
            </div>
          ),
        };

      case "autumn-woods":
        return {
          containerClass: "bg-gradient-to-b from-[#1C0D05] via-[#2F1709] to-[#462310] text-[#FFEDD5]",
          frameClass: "bg-[#33190B]/80 border-amber-600/30 text-[#FFEDD5] shadow-2xl",
          rugClass: "bg-[#452210]/70 border-amber-500/30",
          ambientOverlay: (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent blur-2xl" />
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-orange-400/80 text-sm select-none animate-bounce"
                  style={{
                    top: `${10 + ((i * 10) % 75)}%`,
                    left: `${6 + ((i * 12) % 88)}%`,
                    transform: `rotate(${(i * 45) % 360}deg) scale(${0.8 + ((i % 3) * 0.2)})`,
                    animationDuration: `${4 + (i % 3)}s`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {i % 2 === 0 ? "🍁" : "🍂"}
                </div>
              ))}
            </div>
          ),
        };

      case "warm-loft":
      default:
        return {
          containerClass: isNight
            ? "bg-[#1E1714] text-[#FDF8F1]"
            : ambience === "rainy"
            ? "bg-[#EDE6DD] text-[#5D4E43]"
            : "bg-[#FDF8F1] text-[#5D4E43]",
          frameClass: isNight
            ? "bg-[#2A201C]/80 shadow-black/40"
            : "bg-white/45 backdrop-blur-xs shadow-[0_15px_35px_-10px_rgba(93,78,67,0.12)]",
          rugClass: isNight ? "bg-[#251D19]/70" : "bg-[#F2E8DA]/65",
          ambientOverlay: null,
        };
    }
  };

  // Dedicated Nature Window Landscape Renderer
  const renderWindowNatureView = () => {
    switch (activeTheme) {
      case "emerald-forest":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#18392B] via-[#24523E] to-[#346F54]">
            {/* Filtered Golden Sunbeams */}
            <div className="absolute -top-10 -left-6 w-48 h-40 bg-gradient-to-b from-amber-200/35 to-transparent transform rotate-25 blur-xs pointer-events-none" />
            <div className="absolute -top-6 left-16 w-32 h-36 bg-gradient-to-b from-amber-200/25 to-transparent transform rotate-18 blur-xs pointer-events-none" />

            {/* Distant mountain ridge */}
            <svg className="absolute bottom-0 inset-x-0 w-full h-16 text-[#122E22] opacity-70" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 40 L0 25 Q25 15 50 22 T100 18 L100 40 Z" fill="currentColor" />
            </svg>

            {/* Pine forest silhouettes */}
            <svg className="absolute bottom-0 inset-x-0 w-full h-14 text-[#0B1E16]" viewBox="0 0 100 35" preserveAspectRatio="none">
              <polygon points="5,35 12,12 19,35" fill="currentColor" />
              <polygon points="15,35 23,8 31,35" fill="currentColor" />
              <polygon points="28,35 37,15 46,35" fill="currentColor" />
              <polygon points="42,35 52,6 62,35" fill="currentColor" />
              <polygon points="58,35 68,14 78,35" fill="currentColor" />
              <polygon points="74,35 84,10 94,35" fill="currentColor" />
              <polygon points="86,35 93,18 100,35" fill="currentColor" />
            </svg>

            {/* Gentle fluttering leaves in window */}
            <div className="absolute inset-0 pointer-events-none">
              <span className="absolute top-4 left-10 text-[10px] opacity-75 animate-pulse">🍃</span>
              <span className="absolute top-8 right-12 text-[9px] opacity-60 animate-pulse delay-200">🍃</span>
            </div>
          </div>
        );

      case "sakura-garden":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#FCE7F3] via-[#FBCFE8] to-[#F472B6]/40">
            {/* Distant Mt. Fuji silhouette with snow cap */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16">
              <svg viewBox="0 0 100 45" preserveAspectRatio="none" className="w-full h-full text-[#4A2638]/60">
                <polygon points="10,45 50,8 90,45" fill="currentColor" />
                <polygon points="40,18 50,8 60,18 55,21 50,19 45,22" fill="#FFFFFF" opacity="0.95" />
              </svg>
            </div>

            {/* Blooming Cherry Blossom Branch */}
            <svg className="absolute top-0 right-0 w-32 h-20 text-[#3D1E2D]" viewBox="0 0 100 60">
              <path d="M100 0 Q70 15 50 10 Q35 25 20 20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M60 12 Q50 30 35 32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            <div className="absolute top-2 right-12 w-3.5 h-3.5 rounded-full bg-pink-300 shadow-xs border border-pink-100" />
            <div className="absolute top-5 right-20 w-3 h-3 rounded-full bg-pink-300 shadow-xs border border-pink-100" />
            <div className="absolute top-8 right-16 w-3 h-3 rounded-full bg-pink-200 shadow-xs border border-pink-100" />
            <div className="absolute top-3 right-6 w-3 h-3 rounded-full bg-rose-200 shadow-xs border border-pink-100" />

            <span className="absolute top-10 left-12 text-[10px] animate-bounce">🌸</span>
            <span className="absolute top-6 left-24 text-[8px] animate-pulse">🌸</span>
          </div>
        );

      case "mountain-lake":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#1C364F] via-[#2D5377] to-[#4374A0]">
            <div className="absolute top-2 left-6 w-16 h-4 rounded-full bg-white/30 blur-xs" />
            <div className="absolute top-4 right-10 w-20 h-5 rounded-full bg-white/25 blur-xs" />

            {/* Sharp Alpine Snow Peaks */}
            <svg className="absolute bottom-6 inset-x-0 w-full h-14 text-[#0E2133]" viewBox="0 0 100 40" preserveAspectRatio="none">
              <polygon points="5,40 30,8 55,40" fill="currentColor" />
              <polygon points="25,15 30,8 35,15 32,18 30,16 28,18" fill="#FFFFFF" opacity="0.9" />
              <polygon points="45,40 70,12 95,40" fill="currentColor" />
              <polygon points="65,18 70,12 75,18 72,21 70,19 68,21" fill="#FFFFFF" opacity="0.9" />
            </svg>

            {/* Still Lake Waters with Ripples */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-b from-[#1A3854] to-[#0D1F30] border-t border-sky-300/30">
              <div className="w-20 h-[1px] bg-sky-200/50 mx-auto mt-1" />
              <div className="w-32 h-[1px] bg-sky-200/30 mx-auto mt-1.5" />
            </div>

            {/* Shoreline Pines */}
            <svg className="absolute bottom-5 inset-x-0 w-full h-8 text-[#07131D]" viewBox="0 0 100 25" preserveAspectRatio="none">
              <polygon points="0,25 6,10 12,25" fill="currentColor" />
              <polygon points="10,25 15,12 20,25" fill="currentColor" />
              <polygon points="80,25 86,10 92,25" fill="currentColor" />
              <polygon points="90,25 95,13 100,25" fill="currentColor" />
            </svg>
          </div>
        );

      case "sunset-meadow":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#5C2B14] via-[#8A421D] to-[#C96B2E]">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-gradient-to-b from-amber-200 to-amber-400 shadow-[0_0_18px_#F59E0B]" />

            <svg className="absolute bottom-0 inset-x-0 w-full h-14 text-[#2E150A]" viewBox="0 0 100 35" preserveAspectRatio="none">
              <path d="M0 35 Q30 18 60 25 T100 15 L100 35 Z" fill="currentColor" />
            </svg>
            <svg className="absolute bottom-0 inset-x-0 w-full h-10 text-[#1A0C06]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 30 Q40 10 70 20 T100 25 L100 30 Z" fill="currentColor" />
            </svg>

            <div className="absolute bottom-1 left-8 w-1 h-4 bg-amber-600/70 rounded-full" />
            <div className="absolute bottom-4 left-7 w-2 h-2 rounded-full bg-amber-300" />
            <div className="absolute bottom-1 right-12 w-1 h-5 bg-amber-600/70 rounded-full" />
            <div className="absolute bottom-5 right-11 w-2 h-2 rounded-full bg-orange-300" />
          </div>
        );

      case "bamboo-waterfall":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#11382A] via-[#1B4D3B] to-[#2B6D55]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-full bg-gradient-to-b from-emerald-100/70 via-cyan-100/60 to-emerald-200/80 blur-xs">
              <div className="w-[2px] h-full bg-white mx-auto animate-pulse" />
            </div>

            <div className="absolute bottom-0 inset-x-0 h-5 bg-[#091F17] border-t border-emerald-300/40">
              <div className="w-16 h-[1px] bg-emerald-200/60 mx-auto mt-1" />
            </div>

            <div className="absolute top-0 left-3 w-2 h-full bg-emerald-700 border-r border-emerald-900 flex flex-col justify-between py-2">
              <div className="w-full h-[2px] bg-emerald-900" />
              <div className="w-full h-[2px] bg-emerald-900" />
              <div className="w-full h-[2px] bg-emerald-900" />
            </div>
            <div className="absolute top-0 right-4 w-2.5 h-full bg-emerald-700 border-l border-emerald-900 flex flex-col justify-between py-1">
              <div className="w-full h-[2px] bg-emerald-900" />
              <div className="w-full h-[2px] bg-emerald-900" />
              <div className="w-full h-[2px] bg-emerald-900" />
            </div>

            <span className="absolute top-3 left-6 text-[10px] text-emerald-200">🎋</span>
            <span className="absolute top-8 right-8 text-[10px] text-emerald-200">🍃</span>
          </div>
        );

      case "starry-wilderness":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#090E1D] via-[#121B35] to-[#1D2B52]">
            <div className="absolute top-2.5 right-8 w-5 h-5 rounded-full bg-amber-100 shadow-[0_0_12px_#FFF] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#121B35] ml-1.5 -mt-1" />
            </div>

            {[...Array(14)].map((_, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                  top: `${10 + ((i * 13) % 45)}%`,
                  left: `${5 + ((i * 17) % 90)}%`,
                  width: `${1 + (i % 3)}px`,
                  height: `${1 + (i % 3)}px`,
                  animationDuration: `${1.5 + (i % 3)}s`,
                }}
              />
            ))}

            <svg className="absolute bottom-0 inset-x-0 w-full h-12 text-[#04070F]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polygon points="5,30 12,8 19,30" fill="currentColor" />
              <polygon points="18,30 26,5 34,30" fill="currentColor" />
              <polygon points="32,30 40,12 48,30" fill="currentColor" />
              <polygon points="46,30 55,7 64,30" fill="currentColor" />
              <polygon points="62,30 70,14 78,30" fill="currentColor" />
              <polygon points="76,30 84,6 92,30" fill="currentColor" />
              <polygon points="90,30 96,15 100,30" fill="currentColor" />
            </svg>
          </div>
        );

      case "autumn-woods":
        return (
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#4A220F] via-[#75371A] to-[#A85025]">
            <div className="absolute -top-4 inset-x-0 h-10 bg-[#3B1A0B] rounded-b-full flex justify-around px-4">
              <div className="w-8 h-6 bg-red-700/80 rounded-full -mt-2" />
              <div className="w-12 h-8 bg-amber-600/80 rounded-full -mt-2" />
              <div className="w-10 h-6 bg-orange-600/80 rounded-full -mt-2" />
            </div>

            <svg className="absolute bottom-0 inset-x-0 w-full h-12 text-[#240D05]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polygon points="0,30 15,12 30,30" fill="currentColor" />
              <polygon points="25,30 40,8 55,30" fill="currentColor" />
              <polygon points="50,30 65,14 80,30" fill="currentColor" />
              <polygon points="75,30 88,10 100,30" fill="currentColor" />
            </svg>

            <span className="absolute top-5 left-10 text-[10px] animate-bounce">🍁</span>
            <span className="absolute top-7 right-14 text-[9px] animate-pulse">🍂</span>
          </div>
        );

      case "warm-loft":
      default:
        return (
          <div
            className={`w-full h-full transition-colors duration-700 relative ${
              weather === "snow"
                ? isNight
                  ? "bg-gradient-to-b from-[#162038] via-[#213054] to-[#2E4268]"
                  : "bg-gradient-to-b from-[#87A8BD] via-[#ADC2CE] to-[#D5E1E8]"
                : weather === "rain"
                ? isNight
                  ? "bg-gradient-to-b from-[#181F28] via-[#232D3A] to-[#344254]"
                  : "bg-gradient-to-b from-[#7A8E99] via-[#94A5AE] to-[#B3C3CB]"
                : isNight
                ? "bg-gradient-to-b from-[#1E2749] to-[#273469]"
                : ambience === "sunset"
                ? "bg-gradient-to-b from-[#FFAE73] to-[#A8D1D1]"
                : "bg-[#A8D1D1]"
            }`}
          >
            {isNight ? (
              <div className="absolute top-3 right-8 w-6 h-6 rounded-full bg-[#FFF8E7] shadow-[0_0_10px_#FFEBA0]" />
            ) : ambience === "sunset" && weather === "clear" ? (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#FF8E53] blur-[1px] shadow-[0_0_12px_#FFA07A]" />
            ) : weather === "snow" ? (
              <div className="absolute top-3 right-8 w-5 h-5 rounded-full bg-white/70 blur-[1px] shadow-[0_0_8px_#FFF]" />
            ) : null}

            {weather === "snow" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <span
                    key={i}
                    className="absolute rounded-full bg-white/90 animate-snowfall"
                    style={{
                      left: `${(i * 12.5) % 95}%`,
                      top: "-5px",
                      width: `${3 + (i % 3)}px`,
                      height: `${3 + (i % 3)}px`,
                      animationDuration: `${3.5 + (i % 3)}s`,
                      animationDelay: `${(i * 0.4) % 2.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {weather === "rain" && (
              <div className="absolute inset-0 opacity-40 flex justify-around">
                <span className="w-[1px] h-full bg-cyan-200 rotate-12 animate-pulse" />
                <span className="w-[1px] h-full bg-cyan-200 rotate-12 animate-pulse delay-100" />
                <span className="w-[1px] h-full bg-cyan-200 rotate-12 animate-pulse delay-200" />
              </div>
            )}
          </div>
        );
    }
  };

  const currentThemeStyles = getThemeStyles();

  return (
    <main
      id="cozy-study-app"
      className={`relative w-full h-screen flex flex-col justify-between items-center transition-colors duration-1000 font-['Nunito',sans-serif] ${currentThemeStyles.containerClass}`}
    >
      {currentThemeStyles.ambientOverlay}

      {/* Floating Coin Reward Toast */}
      {coinNotice && (
        <div
          id="coin-reward-toast"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-amber-200 text-xs font-black flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
            🪙
          </div>
          <span>{coinNotice.message}</span>
        </div>
      )}
      {/* ---------------------------------------------------- */}
      {/* 1. TOP RIGHT SETTINGS & ATMOSPHERE DROPDOWN          */}
      {/* ---------------------------------------------------- */}
      <div ref={dropdownRef} className="absolute top-4 right-5 sm:right-7 z-50">
        <button
          id="atmosphere-settings-btn"
          onClick={() => setIsWeatherMenuOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-sm backdrop-blur-md transition-all cursor-pointer ${
            isNight
              ? "bg-[#332722]/90 border-white/20 text-[#FDF8F1] hover:bg-[#42332c]"
              : "bg-white/90 border-white text-[#5D4E43] hover:bg-[#FDF8F1]"
          }`}
          title="Change room atmosphere & weather"
        >
          <Settings className="w-4 h-4 text-[#F27D26]" />
          <span className="text-xs font-bold hidden sm:inline">Atmosphere</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isWeatherMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isWeatherMenuOpen && (
          <div
            id="atmosphere-dropdown-menu"
            className={`absolute right-0 mt-2 w-64 p-4 rounded-3xl border shadow-xl backdrop-blur-lg flex flex-col gap-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isNight
                ? "bg-[#2D231E]/95 border-white/15 text-[#FDF8F1]"
                : "bg-white/95 border-white text-[#5D4E43]"
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#F2E8DA]/60">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">Room Atmosphere</span>
              <button
                onClick={() => setIsWeatherMenuOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Weather Selection */}
            <div>
              <label className="text-xs font-semibold block mb-1.5 opacity-80">Window Weather</label>
              <div className="grid grid-cols-3 gap-1.5">
                {/* Clear Option */}
                <button
                  id="weather-option-clear"
                  onClick={() => updateWeather("clear")}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    weather === "clear"
                      ? "bg-[#5D4E43] text-white shadow-sm scale-102"
                      : "bg-[#F2E8DA]/60 hover:bg-[#F2E8DA] opacity-80"
                  }`}
                >
                  <Sun className="w-4 h-4 mb-1 text-amber-400" />
                  <span>Clear</span>
                </button>

                {/* Snow Option */}
                <button
                  id="weather-option-snow"
                  onClick={() => updateWeather("snow")}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    weather === "snow"
                      ? "bg-[#5D4E43] text-white shadow-sm scale-102"
                      : "bg-[#F2E8DA]/60 hover:bg-[#F2E8DA] opacity-80"
                  }`}
                >
                  <CloudSnow className="w-4 h-4 mb-1 text-sky-300" />
                  <span>Snow</span>
                </button>

                {/* Rain Option */}
                <button
                  id="weather-option-rain"
                  onClick={() => updateWeather("rain")}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    weather === "rain"
                      ? "bg-[#5D4E43] text-white shadow-sm scale-102"
                      : "bg-[#F2E8DA]/60 hover:bg-[#F2E8DA] opacity-80"
                  }`}
                >
                  <CloudRain className="w-4 h-4 mb-1 text-blue-400" />
                  <span>Rain</span>
                </button>
              </div>
            </div>

            {/* Lighting / Time of Day */}
            <div>
              <label className="text-xs font-semibold block mb-1.5 opacity-80">Lighting & Tone</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  id="ambience-sunset-btn"
                  onClick={() => setAmbience("sunset")}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ambience === "sunset"
                      ? "bg-[#F27D26] text-white shadow-sm"
                      : "bg-[#F2E8DA]/60 hover:bg-[#F2E8DA] opacity-80"
                  }`}
                >
                  Warm Sunset
                </button>
                <button
                  id="ambience-rainy-btn"
                  onClick={() => setAmbience("rainy")}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ambience === "rainy"
                      ? "bg-[#5D4E43] text-white shadow-sm"
                      : "bg-[#F2E8DA]/60 hover:bg-[#F2E8DA] opacity-80"
                  }`}
                >
                  Muted Gray
                </button>
                <button
                  id="ambience-night-btn"
                  onClick={() => setAmbience("night")}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    ambience === "night"
                      ? "bg-[#1E1714] text-amber-200 border border-amber-300/40 shadow-sm"
                      : "bg-[#F2E8DA]/60 hover:bg-[#F2E8DA] opacity-80"
                  }`}
                >
                  <Moon className="w-3 h-3 text-amber-200" />
                  <span>Night</span>
                </button>
              </div>
            </div>

            {/* Background Themes Quick Shop Trigger */}
            <div className="pt-2 border-t border-[#F2E8DA]/60">
              <button
                id="atmosphere-dropdown-theme-shop-btn"
                onClick={() => {
                  setIsWeatherMenuOpen(false);
                  setIsThemeShopOpen(true);
                }}
                className="w-full text-left py-2 px-3 rounded-xl border border-amber-300 bg-amber-50/85 hover:bg-amber-100 text-xs font-bold text-amber-950 flex items-center justify-between transition-colors cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Backgrounds Shop</span>
                </span>
                <span className="flex items-center gap-1 font-mono font-black text-amber-800 text-[11px] bg-amber-200/80 px-2 py-0.5 rounded-full">
                  <span>🪙</span>
                  <span>{coins}</span>
                </span>
              </button>
            </div>

            {/* Tab-Switch Detection Test Option */}
            <div className="pt-2 border-t border-[#F2E8DA]/60 flex flex-col gap-1.5">
              <button
                id="test-tab-switch-penalty-btn"
                onClick={() => reportFocusLost(myUserName)}
                className="w-full text-left py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-xs font-bold text-rose-800 flex items-center justify-between transition-colors cursor-pointer"
                title="Test tab-switching penalty & broadcast to partner"
              >
                <span className="flex items-center gap-1.5">
                  <span>🥺</span>
                  <span>Test Focus Loss</span>
                </span>
                <span className="bg-rose-200 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  -25 Energy
                </span>
              </button>
              <span className="text-[10px] opacity-60 px-1">
                Broadcasts to all connected peers via Supabase Realtime
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Reactions overlay */}
      {activeReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-bounce text-4xl filter drop-shadow-md"
          style={{ left: `${reaction.x}%`, top: `${reaction.y}%` }}
        >
          {reaction.text}
        </div>
      ))}

      {/* Realtime Task Completion Celebration Toast */}
      {lastCompletedTaskNotice && (
        <div
          id="task-completed-celebration-toast"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#16A34A] text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-white text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <Sparkles className="w-4 h-4 text-[#FACC15] animate-spin" />
          <span>
            <strong className="underline decoration-white/60 decoration-2 underline-offset-2">
              {lastCompletedTaskNotice.author}
            </strong>{" "}
            finished: "{lastCompletedTaskNotice.text}"
          </span>
          <span className="bg-white/25 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white border border-white/30">
            +5% Focus Energy! ⚡
          </span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. TOP HEADER & MINIMALIST DIGITAL POMODORO TIMER    */}
      {/* ---------------------------------------------------- */}
      <header id="pomodoro-header" className="w-full max-w-5xl pt-3 px-6 z-20 flex flex-col items-center gap-2">
        {/* Top bar with quick room sync badge, Copy Link, and audio controls */}
        <div className="w-full flex items-center justify-between text-xs sm:text-sm pr-36 sm:pr-48 gap-2 flex-wrap sm:flex-nowrap">
          {/* Left Actions: Home Link & Room status badge with Supabase Realtime indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="back-to-home-btn"
              onClick={handleReturnHome}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-xs transition-all cursor-pointer ${
                isNight
                  ? "bg-[#332722]/80 border-white/20 text-[#FDF8F1] hover:bg-rose-950/70 hover:text-rose-200 hover:border-rose-800"
                  : "bg-white/90 border-white text-[#5D4E43] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
              }`}
              title="Leave Room and return to main creation menu"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-bold text-xs">Leave Room</span>
            </button>

            <div
              id="room-status-badge"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm transition-all text-xs ${
                isNight
                  ? "bg-[#332722]/80 border-white/20 text-[#FDF8F1]"
                  : "bg-white/80 border-white text-[#5D4E43]"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"
                    : "bg-[#F27D26]"
                }`}
                title={isConnected ? "Supabase Realtime Channel Connected" : "Connecting..."}
              />
              <span className="font-bold tracking-wide">
                Room: <span className="font-mono text-xs font-black text-[#F27D26]">{roomId}</span>
              </span>
              <span className="opacity-40">•</span>
              
              {/* My Nickname Badge with Edit trigger */}
              <button
                id="header-my-nickname-btn"
                onClick={() => {
                  setRenameInput(myUserName);
                  setIsRenameModalOpen(true);
                }}
                className="group flex items-center gap-1.5 hover:text-[#F27D26] cursor-pointer transition-colors"
                title="Click to change your nickname"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  You
                </span>
                <span className="font-bold max-w-[110px] truncate">{myUserName}</span>
                <Edit2 className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-[#F27D26]" />
              </button>

              <span className="opacity-40">•</span>

              {/* Partner presence badge */}
              <div
                id="header-partner-presence-badge"
                className="flex items-center gap-1.5"
                title={isPartnerOnline ? `Partner: ${partnerName}` : "Waiting for a partner to join"}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="opacity-90 font-medium max-w-[110px] truncate">
                  {partnerName || "Waiting for buddy..."}
                </span>
                {isPartnerOnline ? (
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Online
                  </span>
                ) : (
                  <button
                    onClick={handleCopyInviteLink}
                    className="text-[9px] font-bold text-[#F27D26] hover:underline cursor-pointer"
                  >
                    +Invite
                  </button>
                )}
              </div>
            </div>

            {/* Copy Invite Link Button & Tooltip */}
            <div className="relative flex items-center">
              <button
                id="copy-invite-link-btn"
                onClick={handleCopyInviteLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs transition-all cursor-pointer ${
                  isCopied
                    ? "bg-emerald-500 text-white border-emerald-600 scale-105 shadow-md"
                    : isNight
                    ? "bg-[#332722]/90 border-white/20 text-[#FDF8F1] hover:bg-[#42332c]"
                    : "bg-white/90 border-white text-[#5D4E43] hover:bg-[#FDF8F1] hover:border-[#F27D26]/40"
                }`}
                title="Copy shareable room URL to clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#F27D26]" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>

              {/* Temporary Tooltip floating banner */}
              {isCopied && (
                <div
                  id="copied-invite-tooltip"
                  className="absolute top-9 left-0 z-50 bg-[#5D4E43] text-white px-3 py-1.5 rounded-xl shadow-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Invite link copied! Share with your study buddy ✨</span>
                </div>
              )}
            </div>

            {/* Desk Sticky Notes / To-Do Trigger Button */}
            <button
              id="open-sticky-notes-header-btn"
              onClick={() => setIsNotesModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isNight || activeTheme !== "warm-loft"
                  ? "bg-[#332722]/90 border-white/20 text-[#FDF8F1] hover:bg-[#42332c]"
                  : "bg-white/90 border-white text-[#5D4E43] hover:bg-[#FDF8F1] hover:border-[#F27D26]/40"
              }`}
              title="Open Desk Sticky Notes and Shared Goals"
            >
              <Pin className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Sticky Notes</span>
              {tasks.filter((t) => !t.completed).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#F27D26] text-white text-[9.5px] font-extrabold flex items-center justify-center shadow-2xs">
                  {tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </button>

            {/* Study Coins Balance Display & Shop Button */}
            <button
              id="top-panel-coin-balance-btn"
              onClick={() => setIsThemeShopOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs transition-all cursor-pointer bg-gradient-to-r from-amber-100 to-amber-200/90 border-amber-300/80 text-amber-950 hover:shadow-md hover:scale-102 active:scale-95"
              title="Click to view Study Coins and open Backgrounds Shop"
            >
              <div className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[10px] shadow-2xs">
                🪙
              </div>
              <span className="font-mono font-extrabold text-xs">{coins}</span>
              <span className="text-[10px] uppercase font-bold opacity-80 hidden sm:inline">Coins</span>
            </button>

            {/* Nature Background Store / Theme Selector Trigger Button */}
            <button
              id="open-theme-shop-header-btn"
              onClick={() => setIsThemeShopOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isNight || activeTheme !== "warm-loft"
                  ? "bg-[#1E2E24]/90 border-emerald-500/30 text-emerald-100 hover:bg-[#2A3E31]"
                  : "bg-white/90 border-white text-[#2B4034] hover:bg-[#F2F8F4] hover:border-emerald-500/40"
              }`}
              title="Open Nature Backgrounds & Themes Store"
            >
              <Trees className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nature Themes</span>
            </button>
          </div>

          {/* Ambient Rain Audio Toggle */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${
              isNight ? "bg-[#332722]/80 border-white/20" : "bg-white/80 border-white"
            }`}
          >
            <button
              id="toggle-ambient-audio"
              onClick={toggleAmbientSound}
              className="flex items-center gap-1.5 cursor-pointer text-xs font-bold hover:opacity-80 transition-opacity"
            >
              {isAudioMuted ? (
                <VolumeX className="w-4 h-4 opacity-50" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#F27D26] animate-pulse" />
              )}
              <span>{isAudioMuted ? "Rain Ambient (Off)" : "Rain Ambient (On)"}</span>
            </button>
            {!isAudioMuted && (
              <input
                id="ambient-volume-slider"
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-14 h-1 accent-[#F27D26] bg-[#D9C5B2] rounded-lg cursor-pointer"
                title="Volume"
              />
            )}
          </div>
        </div>

        {/* Minimalist Digital Pomodoro Timer Card (Vibrant Palette style) */}
        <div
          id="digital-pomodoro-timer"
          className={`flex flex-col items-center px-8 sm:px-12 py-3 rounded-[36px] backdrop-blur-md border shadow-[0_10px_30px_-10px_rgba(93,78,67,0.12)] transition-all ${
            isNight
              ? "bg-[#2D231E]/85 border-white/20 shadow-black/30"
              : "bg-white/70 border-white"
          }`}
        >
          {/* Preset mode pills */}
          <div
            id="timer-mode-pills"
            className={`flex items-center gap-1.5 p-1 rounded-full mb-1 border ${
              isNight ? "bg-[#231A17] border-white/10" : "bg-[#F2E8DA]/80 border-white"
            }`}
          >
            {(["work45", "work25", "shortBreak", "longBreak"] as PomodoroMode[]).map((modeKey) => (
              <button
                key={modeKey}
                id={`mode-pill-${modeKey}`}
                onClick={() => handleModeChange(modeKey)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  selectedMode === modeKey
                    ? "bg-[#5D4E43] text-white shadow-sm transform scale-102"
                    : isNight
                    ? "text-[#C9B5A6] hover:text-white"
                    : "text-[#5D4E43]/70 hover:text-[#5D4E43]"
                }`}
              >
                {MODES[modeKey].label}
              </button>
            ))}
          </div>

          {/* Large Bold Digital Display */}
          <h1
            id="timer-display-clock"
            className="text-6xl sm:text-7xl font-black tracking-tight leading-none text-[#5D4E43] select-none my-0.5"
            style={{ color: isNight ? "#FDF8F1" : "#5D4E43" }}
          >
            {formatTime(timeLeft)}
          </h1>

          {/* Clean Uppercase Subtitle */}
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] opacity-60 mt-0.5 mb-2">
            {MODES[selectedMode].type === "focus" ? "Focus Session" : "Rest & Recharge"} • #{completedSessions + 1}
          </p>

          {/* Timer Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              id="timer-play-pause-btn"
              onClick={handleToggleRunning}
              className="bg-[#5D4E43] text-white px-7 py-2.5 rounded-full font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              id="timer-reset-btn"
              onClick={handleReset}
              title="Reset Timer"
              className={`p-2.5 rounded-full border-2 border-[#5D4E43] font-bold shadow-sm transition-all cursor-pointer ${
                isNight
                  ? "bg-[#382C26] text-[#FDF8F1] hover:bg-[#473831]"
                  : "bg-white text-[#5D4E43] hover:bg-[#FDF8F1]"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Quick Cheer Interactions */}
            <button
              id="send-tea-btn"
              onClick={() => triggerReaction("🍵")}
              title="Send warm tea to study buddy"
              className={`flex items-center gap-1 px-3 py-2 rounded-full border border-[#F2E8DA] shadow-xs text-xs font-bold transition-all cursor-pointer hover:border-[#5D4E43] ${
                isNight
                  ? "bg-[#332722] text-[#FDF8F1]"
                  : "bg-white text-[#5D4E43]"
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Send Tea</span>
            </button>
            <button
              id="send-highfive-btn"
              onClick={() => triggerReaction("✋")}
              title="Send high five"
              className={`flex items-center gap-1 px-3 py-2 rounded-full border border-[#F2E8DA] shadow-xs text-xs font-bold transition-all cursor-pointer hover:border-[#5D4E43] ${
                isNight
                  ? "bg-[#332722] text-[#FDF8F1]"
                  : "bg-white text-[#5D4E43]"
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-[#FF8A80]" />
              <span>High Five</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 3. CENTER: VISUAL "ROOM" WITH TWO CHARACTER DESKS    */}
      {/* ---------------------------------------------------- */}
      <section
        id="cozy-study-room"
        className="w-full max-w-5xl flex-1 flex flex-col justify-center items-center px-4 sm:px-8 relative z-10 my-auto"
      >
        {/* Room Architectural Frame Container */}
        <div
          id="room-architectural-frame"
          className={`w-full max-h-[560px] h-[50vh] min-h-[390px] rounded-[44px] p-6 sm:p-8 relative flex flex-col justify-between overflow-hidden border-4 border-white shadow-xl transition-all duration-700 ${
            isDistracted ? "animate-soft-rumble ring-4 ring-rose-300/60" : ""
          } ${
            currentThemeStyles.frameClass ||
            (isNight
              ? "bg-[#2A201C]/80 shadow-black/40"
              : "bg-white/45 backdrop-blur-xs shadow-[0_15px_35px_-10px_rgba(93,78,67,0.12)]")
          }`}
        >
          {/* Nature Scenic Window in the Room Background */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-24 rounded-t-full rounded-b-xl border-4 border-white overflow-hidden shadow-md bg-[#F2E8DA] flex items-center justify-center pointer-events-none z-0">
            {renderWindowNatureView()}

            {/* Window crossbars */}
            <div className="absolute inset-x-0 top-1/2 h-[2px] bg-white/75 pointer-events-none z-10" />
            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/75 pointer-events-none z-10" />
          </div>

          {/* Cozy Floor Rug */}
          <div
            className={`absolute bottom-3 inset-x-12 sm:inset-x-20 h-36 sm:h-44 rounded-[50px] border-4 border-white/60 pointer-events-none z-0 shadow-inner transition-colors duration-700 ${
              currentThemeStyles.rugClass || (isNight ? "bg-[#251D19]/70" : "bg-[#F2E8DA]/65")
            }`}
          />

          {/* ==================================================== */}
          {/* BACKGROUND WEATHER LAYER (SNOW / RAIN / CLEAR)       */}
          {/* ==================================================== */}
          {weather === "snow" && (
            <div
              id="room-snow-background-layer"
              className="absolute inset-0 pointer-events-none overflow-hidden z-[2]"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-sky-100/10 via-transparent to-white/5" />
              {SNOWFLAKES.map((flake) => (
                <div
                  key={flake.id}
                  className="absolute rounded-full bg-white animate-snowfall pointer-events-none"
                  style={{
                    left: `${flake.left}%`,
                    top: "-15px",
                    width: `${flake.size}px`,
                    height: `${flake.size}px`,
                    opacity: flake.opacity,
                    animationDuration: `${flake.duration}s`,
                    animationDelay: `${flake.delay}s`,
                    boxShadow: "0 0 4px rgba(255, 255, 255, 0.85)",
                    ["--drift" as string]: `${flake.drift}px`,
                  }}
                />
              ))}
            </div>
          )}

          {weather === "rain" && (
            <div
              id="room-rain-background-layer"
              className="absolute inset-0 pointer-events-none overflow-hidden z-[2]"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-slate-400/5" />
              {RAINDROPS.map((drop) => (
                <div
                  key={drop.id}
                  className="absolute w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-cyan-300 to-cyan-500 animate-rainfall-streak pointer-events-none"
                  style={{
                    left: `${drop.left}%`,
                    top: "-20px",
                    height: `${drop.height}px`,
                    opacity: drop.opacity,
                    animationDuration: `${drop.duration}s`,
                    animationDelay: `${drop.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {weather === "clear" && (
            <div
              id="room-clear-background-layer"
              className="absolute inset-0 pointer-events-none overflow-hidden z-[2]"
              aria-hidden="true"
            >
              <div className="absolute top-0 left-1/3 -translate-x-1/2 w-80 h-64 bg-amber-100/20 blur-3xl rounded-full" />
            </div>
          )}

          {/* Cozy Tab-Switch Dimming Overlay */}
          <div
            id="tab-switch-dimming-overlay"
            className={`absolute inset-0 pointer-events-none transition-opacity duration-700 z-[8] ${
              isDistracted
                ? "opacity-100 bg-stone-950/40 backdrop-blur-[0.5px]"
                : "opacity-0"
            }`}
            aria-hidden="true"
          />

          {/* TWO DISTINCT STUDY WORKSTATIONS */}
          <div className="w-full h-full flex items-end justify-around gap-6 sm:gap-16 z-10 pb-1">
            {/* CHARACTER 1: ALEX */}
            <div id="user-1-workstation" className="flex flex-col items-center relative">
              <div className="relative flex flex-col items-center">
                {isDistracted &&
                  (!distractedUser ||
                    distractedUser === myUserName) && (
                    <div
                      id="focus-lost-tooltip-alex"
                      className="absolute -top-12 z-40 bg-white/95 px-3 py-1.5 rounded-2xl shadow-xl border-2 border-rose-300 flex items-center gap-1.5 text-xs font-bold text-[#5D4E43] animate-bounce whitespace-nowrap"
                    >
                      <span className="text-sm">🥺</span>
                      <span>{myUserName} lost focus...</span>
                      <span className="text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                        -25 Energy
                      </span>
                    </div>
                  )}

                <div
                  id="user-1-name-badge"
                  className="absolute -top-3 -right-3 z-30 bg-white px-3 py-1 rounded-full shadow-md border border-[#F2E8DA] flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform group"
                  onClick={() => {
                    setRenameInput(myUserName);
                    setIsRenameModalOpen(true);
                  }}
                  title="Click to rename your character"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#5D4E43] max-w-[120px] truncate">{myUserName}</span>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    {username ? username : 'Guest'}
                  </span>
                  <Edit2 className="w-2.5 h-2.5 text-[#5D4E43]/40 group-hover:text-[#F27D26] transition-colors" />
                </div>

                <div
                  id="user-1-character-area"
                  className="w-40 sm:w-48 h-40 sm:h-48 bg-[#E6D5C3] rounded-full flex items-center justify-center border-8 border-white shadow-xl overflow-hidden relative cursor-pointer group transition-transform hover:scale-102"
                  onClick={() => {
                    const newUrl = window.prompt(
                      `Enter image URL for ${myUserName} or leave empty for default 2D vector:`,
                      user1CustomImage || ""
                    );
                    if (newUrl !== null) setUser1CustomImage(newUrl.trim() || null);
                  }}
                  title="Click to insert custom character avatar"
                >
                  {user1CustomImage ? (
                    <img
                      src={user1CustomImage}
                      alt={myUserName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute top-4 w-24 h-16 rounded-t-full border-4 border-[#5D4E43] -z-0" />
                      <div className="absolute top-12 left-5 w-3 h-6 rounded-full bg-[#F27D26] shadow-xs" />
                      <div className="absolute top-12 right-5 w-3 h-6 rounded-full bg-[#F27D26] shadow-xs" />
                      <div className="w-24 h-24 bg-[#FFD4B2] rounded-full relative top-3 flex flex-col items-center justify-center shadow-xs">
                        <div className="flex items-center gap-6 mt-2">
                          <div className="w-3.5 h-3.5 bg-[#5D4E43] rounded-full" />
                          <div className="w-3.5 h-3.5 bg-[#5D4E43] rounded-full" />
                        </div>
                        <div className="flex items-center gap-8 -mt-0.5">
                          <span className="w-2 h-1 rounded-full bg-[#FFAB91]" />
                          <span className="w-2 h-1 rounded-full bg-[#FFAB91]" />
                        </div>
                        <div className="w-2 h-1 border-b-2 border-[#5D4E43] rounded-full mt-1" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[#5D4E43]/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold p-3 text-center transition-opacity z-20">
                    <ImageIcon className="w-4 h-4 mr-1 inline" /> Click to add custom image
                  </div>
                </div>
              </div>

              {/* STUDY DESK 1 */}
              <div
                id="desk-1"
                className="mt-4 sm:mt-6 w-56 sm:w-64 h-28 sm:h-32 bg-[#C9A683] rounded-t-3xl shadow-lg border-x-8 border-t-8 border-[#B8926D] relative flex items-start justify-center pt-2"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-16 sm:h-20 bg-[#5D4E43] rounded-lg border-4 border-[#3D342D] shadow-inner flex flex-col items-center justify-center">
                  <div className="w-full h-[1px] bg-[#FFFFFF22]" />
                  <div className="flex gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFB26B]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8D1D1]" />
                  </div>
                </div>

                {/* Desk Sticky Note Pad on User's Desk */}
                <div className="absolute bottom-2 left-2 z-20">
                  <DeskStickyNotePad
                    ownerName={myUserName}
                    tasks={tasks}
                    onOpen={() => setIsNotesModalOpen(true)}
                    isNight={isNight || activeTheme !== "warm-loft"}
                  />
                </div>

                <div className="absolute bottom-3 right-4 flex flex-col items-center">
                  <span className="w-1 h-2 bg-white/60 rounded-full animate-steam" />
                  <div className="w-3.5 h-4 bg-[#FDF8F1] rounded-b-sm border border-[#D9C5B2] relative shadow-xs">
                    <span className="absolute top-0.5 -right-1 w-1.5 h-2 rounded-r-full border border-[#D9C5B2]" />
                  </div>
                </div>
              </div>
            </div>

            {/* CHARACTER 2: PARTNER */}
            <div id="user-2-workstation" className="flex flex-col items-center relative">
              <div className="relative flex flex-col items-center">
                {isDistracted &&
                  distractedUser &&
                  distractedUser !== myUserName && (
                    <div
                      id="focus-lost-tooltip-sam"
                      className="absolute -top-12 z-40 bg-white/95 px-3 py-1.5 rounded-2xl shadow-xl border-2 border-rose-300 flex items-center gap-1.5 text-xs font-bold text-[#5D4E43] animate-bounce whitespace-nowrap"
                    >
                      <span className="text-sm">🥺</span>
                      <span>{distractedUser || partnerName || "Partner"} lost focus...</span>
                      <span className="text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                        -25 Energy
                      </span>
                    </div>
                  )}

                <div
                  id="user-2-name-badge"
                  className={`absolute -top-3 -left-3 z-30 bg-white px-3 py-1 rounded-full shadow-md border flex items-center gap-1.5 transition-all ${
                    isPartnerOnline
                      ? "border-emerald-300 ring-2 ring-emerald-400/20"
                      : "border-[#F2E8DA] hover:border-[#F27D26]/40 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isPartnerOnline) {
                      handleCopyInviteLink();
                    }
                  }}
                  title={isPartnerOnline ? `Partner: ${partnerName}` : "Click to copy invite link"}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span className="text-xs font-bold text-[#5D4E43] max-w-[130px] truncate">
                    {partnerName || "Waiting for partner..."}
                  </span>
                  {isPartnerOnline ? (
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Partner
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      Invite
                    </span>
                  )}
                </div>

                <div
                  id="user-2-character-area"
                  className="w-40 sm:w-48 h-40 sm:h-48 bg-[#D2E2E2] rounded-full flex items-center justify-center border-8 border-white shadow-xl overflow-hidden relative cursor-pointer group transition-transform hover:scale-102"
                  onClick={() => {
                    const newUrl = window.prompt(
                      `Enter image URL for ${partnerName || "Partner"} or leave empty for default 2D vector:`,
                      user2CustomImage || ""
                    );
                    if (newUrl !== null) setUser2CustomImage(newUrl.trim() || null);
                  }}
                  title="Click to insert custom character avatar"
                >
                  {user2CustomImage ? (
                    <img
                      src={user2CustomImage}
                      alt={partnerName || "Partner"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[#5D4E43] absolute top-3" />
                      <div className="w-24 h-24 bg-[#A8D1D1] rounded-full relative top-3 flex flex-col items-center justify-center shadow-xs">
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-5 h-5 rounded-full border-2 border-[#5D4E43] bg-white/30 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#5D4E43] rounded-full" />
                          </div>
                          <div className="w-1.5 h-[2px] bg-[#5D4E43]" />
                          <div className="w-5 h-5 rounded-full border-2 border-[#5D4E43] bg-white/30 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#5D4E43] rounded-full" />
                          </div>
                        </div>
                        <div className="w-2.5 h-1 border-b-2 border-[#5D4E43] rounded-full mt-1" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[#5D4E43]/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold p-3 text-center transition-opacity z-20">
                    <ImageIcon className="w-4 h-4 mr-1 inline" /> Click to add custom image
                  </div>
                </div>
              </div>

              {/* STUDY DESK 2 */}
              <div
                id="desk-2"
                className="mt-4 sm:mt-6 w-56 sm:w-64 h-28 sm:h-32 bg-[#C9A683] rounded-t-3xl shadow-lg border-x-8 border-t-8 border-[#B8926D] relative flex items-start justify-center"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-36 h-2 bg-[#5D4E43] rounded-full rotate-2 shadow-xs" />
                <div className="absolute top-1 left-2 w-24 h-16 bg-[#FDF8F1] rounded-sm shadow-sm border border-[#E6D5C3] p-1.5 overflow-hidden">
                  <div className="space-y-1.5">
                    <div className="w-full h-1 bg-[#E6D5C3] rounded-full" />
                    <div className="w-3/4 h-1 bg-[#E6D5C3] rounded-full" />
                    <div className="w-5/6 h-1 bg-[#F27D26]/60 rounded-full" />
                  </div>
                </div>

                {/* Desk Sticky Note Pad on Partner's Desk */}
                <div className="absolute bottom-2 right-2 z-20">
                  <DeskStickyNotePad
                    ownerName={partnerName || "Partner"}
                    tasks={tasks}
                    onOpen={() => setIsNotesModalOpen(true)}
                    isNight={isNight || activeTheme !== "warm-loft"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. BOTTOM CENTER: VIBRANT SHARED FOCUS ENERGY BAR    */}
      {/* ---------------------------------------------------- */}
      <footer
        id="shared-energy-container"
        className="w-full max-w-2xl pb-6 px-6 z-20 flex flex-col items-center"
      >
        <div className="w-full flex justify-between items-end mb-2.5 px-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60 block">
              Collective Focus
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Shared Energy Level</h2>
          </div>
          <div className="text-right flex items-baseline gap-1.5">
            {isDistracted && (
              <span className="text-xs font-bold text-rose-500 animate-pulse bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                -25 Focus Lost
              </span>
            )}
            <span
              id="shared-energy-percentage"
              className={`text-2xl sm:text-3xl font-black transition-colors ${
                isDistracted ? "text-rose-500" : "text-[#F27D26]"
              }`}
            >
              {Math.round(focusEnergy)}%
            </span>
          </div>
        </div>

        <div
          id="energy-progress-track"
          className="h-6 w-full bg-[#F2E8DA] rounded-full p-1 shadow-inner border border-white relative overflow-hidden"
        >
          <div
            id="energy-progress-fill"
            className="h-full bg-gradient-to-r from-[#F27D26] to-[#FFB26B] rounded-full shadow-[0_0_15px_rgba(242,125,38,0.35)] transition-all duration-700 relative"
            style={{ width: `${Math.max(6, focusEnergy)}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xs" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            id="footer-pause-btn"
            onClick={handleToggleRunning}
            className="bg-[#5D4E43] text-white px-8 py-2.5 rounded-full font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            {isRunning ? "Pause Session" : "Resume Session"}
          </button>
          <button
            id="footer-settings-btn"
            onClick={() => setIsWeatherMenuOpen((prev) => !prev)}
            className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-md border-2 border-[#5D4E43] transition-all cursor-pointer ${
              isNight
                ? "bg-[#382C26] text-[#FDF8F1] hover:bg-[#473831]"
                : "bg-white text-[#5D4E43] hover:bg-[#FDF8F1]"
            }`}
          >
            Atmosphere & Weather
          </button>
        </div>
      </footer>

      {/* Interactive Desk Sticky Notes & Shared Goals Modal */}
      <DeskStickyNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        tasks={tasks}
        onAddTask={addTask}
        onToggleTask={handleToggleTaskWithReward}
        onDeleteTask={deleteTask}
        activeRole={myUserName}
        user1Name={myUserName}
        user2Name={partnerName || "Partner"}
        isNight={isNight || activeTheme !== "warm-loft"}
      />

      {/* Backgrounds & Atmosphere Shop Modal */}
      <BackgroundShopModal
        isOpen={isThemeShopOpen}
        onClose={() => setIsThemeShopOpen(false)}
        coins={coins}
        unlockedThemes={unlockedThemes}
        activeTheme={activeTheme}
        onUnlockTheme={handleUnlockTheme}
        onSelectTheme={handleSelectTheme}
        isNight={isNight || activeTheme !== "warm-loft"}
      />

      {/* Custom Study Nickname Update Modal */}
      {isRenameModalOpen && (
        <div
          id="rename-nickname-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRenameModalOpen(false);
          }}
        >
          <div
            id="rename-nickname-modal-card"
            className="w-full max-w-sm bg-[#FAF6F0] rounded-3xl p-6 border-4 border-white shadow-2xl text-[#5D4E43] flex flex-col gap-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F27D26] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Update Study Nickname</h3>
                  <p className="text-[11px] text-[#5D4E43]/60">Syncs immediately with peers</p>
                </div>
              </div>
              <button
                id="rename-modal-close-btn"
                onClick={() => setIsRenameModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white border border-[#E6D5C3] flex items-center justify-center text-[#5D4E43]/60 hover:text-[#5D4E43] hover:bg-[#F2E8DA] cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#5D4E43]/80 leading-relaxed">
              Your partner will immediately see this updated nickname next to your workstation and in shared sticky notes.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (renameInput.trim()) {
                  setMyUserName(renameInput.trim());
                  setIsRenameModalOpen(false);
                }
              }}
              className="flex flex-col gap-3.5"
            >
              <input
                id="rename-nickname-input"
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="Enter your nickname..."
                maxLength={20}
                autoFocus
                className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] text-sm font-bold text-[#5D4E43] placeholder-[#5D4E43]/40 outline-none focus:ring-2 focus:ring-[#F27D26]/40 focus:border-[#F27D26]"
              />

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  id="rename-cancel-btn"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#5D4E43]/70 hover:bg-white/60 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="rename-save-btn"
                  className="px-4 py-2 rounded-xl bg-[#F27D26] hover:bg-[#E06C15] text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  Save Nickname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
