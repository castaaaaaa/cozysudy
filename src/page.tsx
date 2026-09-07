"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Coffee,
  CloudSnow,
  CloudRain,
  Sun,
  Users,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Zap,
  Check
} from "lucide-react";

interface HomePageProps {
  onNavigateToRoom?: (roomId: string) => void;
}

export default function HomePage({ onNavigateToRoom }: HomePageProps = {}) {
  const [joinCode, setJoinCode] = useState<string>("");
  const [joinError, setJoinError] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Generate a random short alphanumeric ID (e.g., cozy-a8b2)
  const generateRandomRoomId = (): string => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `cozy-${code}`;
  };

  const navigateTo = (roomId: string) => {
    const cleanId = roomId.trim().toLowerCase();
    if (onNavigateToRoom) {
      onNavigateToRoom(cleanId);
    } else if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/room/${encodeURIComponent(cleanId)}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleCreateRoom = () => {
    setIsCreating(true);
    const newRoomId = generateRandomRoomId();
    setTimeout(() => {
      navigateTo(newRoomId);
    }, 150);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError("Please enter a room code or link");
      return;
    }

    let parsedId = joinCode.trim();
    // Handle full URL pasted (e.g. https://domain.com/room/cozy-a8b2)
    if (parsedId.includes("/room/")) {
      const parts = parsedId.split("/room/");
      parsedId = parts[parts.length - 1].split(/[?#]/)[0];
    } else if (parsedId.includes("room=")) {
      const match = parsedId.match(/room=([^&#]+)/);
      if (match && match[1]) parsedId = match[1];
    }

    if (!parsedId) {
      setJoinError("Invalid room link or ID");
      return;
    }

    setJoinError("");
    navigateTo(parsedId);
  };

  return (
    <div
      id="home-landing-page"
      className="min-h-screen w-full bg-[#FDF8F1] text-[#5D4E43] font-['Nunito',sans-serif] flex flex-col justify-between overflow-x-hidden"
    >
      {/* ---------------------------------------------------- */}
      {/* 1. TOP NAVIGATION HEADER                             */}
      {/* ---------------------------------------------------- */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#5D4E43] text-[#FDF8F1] flex items-center justify-center shadow-md border-2 border-white">
            <Coffee className="w-5 h-5 text-[#FFB26B]" />
          </div>
          <div>
            <span className="font-['Comfortaa',sans-serif] font-bold text-lg tracking-tight text-[#5D4E43] block leading-none">
              Cozy Study
            </span>
            <span className="text-[11px] font-semibold text-[#F27D26] uppercase tracking-widest">
              Lo-Fi Pomodoro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#F2E8DA] shadow-xs text-[#5D4E43]/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Realtime Ready</span>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. HERO SECTION WITH PRIMARY ACTION                  */}
      {/* ---------------------------------------------------- */}
      <main className="w-full max-w-5xl mx-auto px-6 py-6 sm:py-10 flex-1 flex flex-col items-center justify-center text-center z-10">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E6D5C3] shadow-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-xs font-bold tracking-wide text-[#5D4E43]">
            Multiplayer Focus Sanctuary for Study Partners
          </span>
        </div>

        {/* Catchy headline */}
        <h1 className="text-4xl sm:text-6xl font-black font-['Comfortaa',sans-serif] tracking-tight leading-[1.15] text-[#5D4E43] max-w-3xl mb-4">
          Study side-by-side in your private{" "}
          <span className="text-[#F27D26] underline decoration-4 decoration-[#F27D26]/30 underline-offset-4">
            cozy room
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#5D4E43]/75 max-w-2xl leading-relaxed mb-8">
          Synchronize your Pomodoro timer with a friend anywhere in the world. Watch falling snow, listen to procedural lo-fi rain, and keep each other focused with shared energy levels.
        </p>

        {/* ==================================================== */}
        {/* PRIMARY CALL TO ACTION: "Create Cozy Room"           */}
        {/* ==================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-8">
          <button
            id="create-cozy-room-btn"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full sm:w-auto flex-1 bg-[#5D4E43] hover:bg-[#483B32] text-white px-8 py-4 rounded-full font-bold text-base shadow-xl hover:shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-[#FFB26B] group-hover:rotate-12 transition-transform" />
            <span>{isCreating ? "Preparing your room..." : "Create Cozy Room"}</span>
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Join Existing Room */}
        <form
          onSubmit={handleJoinRoom}
          className="w-full max-w-md bg-white/80 p-2 pl-4 rounded-full border border-[#E6D5C3] shadow-sm flex items-center gap-2 mb-10 focus-within:ring-2 focus-within:ring-[#F27D26]/40"
        >
          <input
            id="join-room-input"
            type="text"
            placeholder="Or enter room code (e.g. cozy-a8b2)"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError("");
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-[#5D4E43] placeholder-[#5D4E43]/40 outline-none"
          />
          <button
            type="submit"
            id="join-room-submit-btn"
            className="bg-[#F2E8DA] hover:bg-[#E6D5C3] text-[#5D4E43] px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            Join Room
          </button>
        </form>

        {joinError && (
          <p className="text-xs font-bold text-rose-500 -mt-6 mb-8 animate-shake">
            {joinError}
          </p>
        )}

        {/* ---------------------------------------------------- */}
        {/* 3. VISUAL PREVIEW OF DUAL-DESK ROOM                  */}
        {/* ---------------------------------------------------- */}
        <div className="w-full max-w-3xl rounded-[36px] bg-white/70 border-4 border-white shadow-2xl p-6 relative overflow-hidden backdrop-blur-sm">
          {/* Arched Window with Snow */}
          <div className="w-40 h-20 mx-auto rounded-t-full rounded-b-lg border-4 border-white shadow-xs bg-gradient-to-b from-[#87A8BD] via-[#ADC2CE] to-[#D5E1E8] relative overflow-hidden mb-4 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-white/80 absolute top-2 right-4 blur-[0.5px]" />
            <div className="absolute inset-0 flex justify-around items-start pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-200" />
            </div>
            <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-white/70" />
            <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-white/70" />
          </div>

          {/* Miniature Dual Desks */}
          <div className="flex items-end justify-center gap-10 sm:gap-20 pb-2">
            {/* User 1 Mini Desk */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#E6D5C3] border-4 border-white shadow-md flex items-center justify-center relative">
                <div className="w-8 h-8 rounded-full bg-[#FFD4B2] flex items-center justify-center">
                  <div className="flex gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#5D4E43]" />
                    <span className="w-1 h-1 rounded-full bg-[#5D4E43]" />
                  </div>
                </div>
                <span className="absolute -top-2 bg-white px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-[#F2E8DA]">
                  Alex
                </span>
              </div>
              <div className="w-24 h-10 bg-[#C9A683] rounded-t-xl border-t-4 border-[#B8926D] mt-2 relative flex items-center justify-center">
                <div className="w-10 h-6 bg-[#5D4E43] rounded-sm -mt-3 border border-[#3D342D]" />
              </div>
            </div>

            {/* User 2 Mini Desk */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#D2E2E2] border-4 border-white shadow-md flex items-center justify-center relative">
                <div className="w-8 h-8 rounded-full bg-[#A8D1D1] flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full border border-[#5D4E43]" />
                    <span className="w-2 h-2 rounded-full border border-[#5D4E43]" />
                  </div>
                </div>
                <span className="absolute -top-2 bg-white px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-[#F2E8DA]">
                  Sam
                </span>
              </div>
              <div className="w-24 h-10 bg-[#C9A683] rounded-t-xl border-t-4 border-[#B8926D] mt-2 relative flex items-center justify-center">
                <div className="w-10 h-6 bg-[#FDF8F1] rounded-sm -mt-2 border border-[#E6D5C3]" />
              </div>
            </div>
          </div>

          {/* Mini Shared Energy Bar */}
          <div className="w-full max-w-xs mx-auto mt-3">
            <div className="flex justify-between text-[11px] font-bold mb-1 px-1">
              <span>Shared Focus Energy</span>
              <span className="text-[#F27D26]">84%</span>
            </div>
            <div className="h-3 w-full bg-[#F2E8DA] rounded-full overflow-hidden p-0.5 border border-white">
              <div className="h-full bg-gradient-to-r from-[#F27D26] to-[#FFB26B] rounded-full w-[84%]" />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* 4. FEATURE PILLARS                                   */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl mt-12 text-left">
          <div className="bg-white/80 p-6 rounded-3xl border border-[#F2E8DA] shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#F2E8DA] flex items-center justify-center text-[#5D4E43] mb-1">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#5D4E43]">Instant Room Link</h3>
            <p className="text-xs text-[#5D4E43]/70 leading-relaxed">
              Create a private room with one click. Send your partner the link, and you're instantly in sync.
            </p>
          </div>

          <div className="bg-white/80 p-6 rounded-3xl border border-[#F2E8DA] shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#FFD4B2] flex items-center justify-center text-[#F27D26] mb-1">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#5D4E43]">Shared Accountability</h3>
            <p className="text-xs text-[#5D4E43]/70 leading-relaxed">
              Leaving the tab triggers a focus loss penalty and dims the room. Keep each other motivated to the finish line.
            </p>
          </div>

          <div className="bg-white/80 p-6 rounded-3xl border border-[#F2E8DA] shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#D2E2E2] flex items-center justify-center text-[#4A7C7C] mb-1">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#5D4E43]">Synchronized Ambience</h3>
            <p className="text-xs text-[#5D4E43]/70 leading-relaxed">
              Experience identical falling snow, rainy skies, and soothing procedural rain noise simultaneously.
            </p>
          </div>
        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* 5. FOOTER                                            */}
      {/* ---------------------------------------------------- */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-[#5D4E43]/50 font-medium">
        Cozy Study Room Pomodoro • Powered by Supabase Realtime Channels
      </footer>
    </div>
  );
}
