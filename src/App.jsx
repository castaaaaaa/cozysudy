/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Coffee,
  ArrowRight,
  Clock,
  Users,
  CloudSnow,
  Zap,
  LogIn,
  LogOut,
  PlusCircle,
  DoorOpen,
  User,
  Check
} from "lucide-react";
import RoomPage from "../app/room/[roomId]/page";

// Helper to extract any potential room ID from the URL (without auto-joining)
function getInitialDetectedRoomId() {
  if (typeof window === "undefined") return null;

  try {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // 1. Check path /room/[roomId] or /app/room/[roomId]
    const pathMatch = pathname.match(/(?:\/app)?\/room\/([^/?#]+)/);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    // 2. Check query param ?room=[roomId] or ?roomId=[roomId] or ?join=[roomId]
    const params = new URLSearchParams(search);
    const roomQuery = params.get("roomId") || params.get("room") || params.get("join");
    if (roomQuery) {
      return roomQuery;
    }

    // 3. Check hash #/room/[roomId]
    const hashMatch = hash.match(/#\/?room\/([^/?#]+)/);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1]);
    }
  } catch (e) {
    console.error("Error reading URL route:", e);
  }

  return null;
}

export default function App() {
  // Username state exactly as requested
  const [username, setUsername] = useState(
    (typeof window !== "undefined" && localStorage.getItem('username')) || ''
  );

  // useEffect to save username to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('username', username);
      // Keep cozy_study_username synchronized as well
      if (username) {
        localStorage.setItem('cozy_study_username', username);
      }
    }
  }, [username]);

  // View state: 'landing' or 'room'
  const [currentView, setCurrentView] = useState("landing");
  const [currentRoomId, setCurrentRoomId] = useState("cozy-loft");

  // Quick join input state (pre-filled if an invite link was opened)
  const detectedInviteId = getInitialDetectedRoomId();
  const [joinCodeInput, setJoinCodeInput] = useState(detectedInviteId || "");
  const [joinError, setJoinError] = useState("");
  const [detectedInvite, setDetectedInvite] = useState(detectedInviteId);

  // Temporary notification toast
  const [showCreatedToast, setShowCreatedToast] = useState(false);

  // Persistent coin balance for display
  const [savedCoins, setSavedCoins] = useState(() => {
    if (typeof window === "undefined") return 15;
    try {
      const val = localStorage.getItem("cozy_user_coins");
      return val !== null ? Math.max(0, parseInt(val, 10)) : 15;
    } catch {
      return 15;
    }
  });

  // Re-read coins when returning to landing page
  useEffect(() => {
    if (currentView === "landing") {
      try {
        const val = localStorage.getItem("cozy_user_coins");
        if (val !== null) setSavedCoins(Math.max(0, parseInt(val, 10)));
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentView]);

  // INSTANT: Create Room without blocking or modal
  const handleCreateRoom = useCallback(() => {
    const finalName = username.trim() || "Guest";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("username", finalName);
        localStorage.setItem("cozy_study_username", finalName);
      } catch (e) {
        console.error(e);
      }
    }

    const rawId = Math.random().toString(36).substring(2, 8);
    const newRoomId = `cozy-${rawId}`;

    try {
      if (typeof window !== "undefined" && window.history && window.history.pushState) {
        window.history.pushState(null, "", `/room/${encodeURIComponent(newRoomId)}`);
      }
    } catch {
      // Ignored for iframe sandbox
    }

    setCurrentRoomId(newRoomId);
    setCurrentView("room");
    setShowCreatedToast(true);
    setTimeout(() => {
      setShowCreatedToast(false);
    }, 4000);
  }, [username]);

  // INSTANT: Join existing or entered room without blocking
  const handleJoinExistingRoom = useCallback((e, customTarget) => {
    if (e) e.preventDefault();
    const finalName = username.trim() || "Guest";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("username", finalName);
        localStorage.setItem("cozy_study_username", finalName);
      } catch (e) {
        console.error(e);
      }
    }

    const rawInput = (customTarget || joinCodeInput).trim();
    let parsedId = rawInput;

    if (parsedId.includes("/room/")) {
      const parts = parsedId.split("/room/");
      parsedId = parts[parts.length - 1].split(/[?#]/)[0];
    } else if (parsedId.includes("room=")) {
      const match = parsedId.match(/room=([^&#]+)/);
      if (match && match[1]) parsedId = match[1];
    }

    // Default if user clicks join without typing anything
    if (!parsedId) {
      parsedId = `cozy-${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      if (typeof window !== "undefined" && window.history && window.history.pushState) {
        window.history.pushState(null, "", `/room/${encodeURIComponent(parsedId)}`);
      }
    } catch {
      // Ignored for iframe sandbox
    }

    setJoinError("");
    setCurrentRoomId(parsedId);
    setCurrentView("room");
  }, [joinCodeInput, username]);

  // Handler: "Leave Room"
  const handleLeaveRoom = useCallback(() => {
    try {
      if (typeof window !== "undefined" && window.history && window.history.pushState) {
        window.history.pushState(null, "", "/");
      }
    } catch {
      // Ignored for iframe sandbox
    }

    setCurrentRoomId("");
    setCurrentView("landing");
    setJoinCodeInput("");
    setJoinError("");
    setDetectedInvite(null);
    setShowCreatedToast(false);
  }, []);

  // ==========================================================
  // VIEW: ACTIVE STUDY ROOM (Only shown AFTER explicit action)
  // ==========================================================
  if (currentView === "room" && currentRoomId) {
    return (
      <div
        id="active-room-view"
        className="w-full h-screen relative"
      >
        {/* Subtle Top Left Corner: Leave Room Button next to Room ID */}
        <div className="absolute top-3.5 left-4 sm:left-6 z-40 flex items-center gap-2">
          <button
            id="leave-room-top-corner-btn"
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-rose-50 text-[#5D4E43] hover:text-rose-700 border border-[#E6D5C3] hover:border-rose-300 shadow-sm text-xs font-bold transition-all cursor-pointer active:scale-95 group backdrop-blur-xs"
            title="Leave room and return to main creation menu"
          >
            <LogOut className="w-3.5 h-3.5 text-[#5D4E43]/70 group-hover:text-rose-600 transition-colors" />
            <span>Leave Room</span>
          </button>

          <div
            id="top-corner-room-id-pill"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 border border-[#E6D5C3] text-xs font-bold text-[#5D4E43] shadow-xs backdrop-blur-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-[#5D4E43]/70">Room:</span>
            <span className="font-mono text-[#F27D26]">{currentRoomId}</span>
          </div>

          {/* Local user's avatar/desk indicator */}
          <div
            id="top-corner-user-desk-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 border border-[#E6D5C3] text-xs font-bold text-[#5D4E43] shadow-xs backdrop-blur-xs"
            title="Your current study desk"
          >
            <User className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="text-[11px] font-bold text-[#5D4E43]">
              {username ? username : 'Guest'}
            </span>
          </div>
        </div>

        {/* Welcome toast when room is freshly entered */}
        {showCreatedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#5D4E43] text-[#FDF8F1] px-5 py-2.5 rounded-full shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-[#FFB26B]" />
            <span>Room {currentRoomId} is ready! Click "Copy Invite Link" above to share with your partner.</span>
          </div>
        )}

        <RoomPage
          params={{ roomId: currentRoomId }}
          roomId={currentRoomId}
          initialUserName={username ? username : 'Guest'}
          onNavigateHome={handleLeaveRoom}
        />
      </div>
    );
  }

  // ==========================================================
  // VIEW: DEFAULT ROOM CREATION & JOINING MENU (FOCUSVAULT)
  // ==========================================================
  return (
    <div
      id="focusvault-default-landing"
      className="min-h-screen w-full bg-[#FDF8F1] text-[#5D4E43] font-['Nunito',sans-serif] flex flex-col justify-between relative overflow-x-hidden"
    >
      {/* Warm Ambient Gradients & Lamp Light Cones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-[#FFEAD9]/50 via-[#F7E5D3]/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ---------------------------------------------------- */}
      {/* 1. TOP BRANDING & NAVIGATION BAR                     */}
      {/* ---------------------------------------------------- */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5D4E43] text-white flex items-center justify-center shadow-md border-2 border-white transform -rotate-1 hover:rotate-0 transition-transform">
            <Coffee className="w-5 h-5 text-[#FFB26B]" />
          </div>
          <div>
            <span className="font-['Comfortaa',sans-serif] font-bold text-xl tracking-tight text-[#5D4E43] block leading-none">
              FocusVault
            </span>
            <span className="text-[11px] font-semibold text-[#F27D26] uppercase tracking-widest">
              Cozy Lo-Fi Study Room
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Persistent Coin Balance Badge */}
          <div
            id="landing-coin-balance-pill"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-200/90 border border-amber-300 text-amber-950 shadow-xs text-xs font-extrabold"
            title="Study coins earned from active Pomodoro sessions"
          >
            <div className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[10px] shadow-2xs">
              🪙
            </div>
            <span className="font-mono">{savedCoins}</span>
            <span className="text-[10px] uppercase font-bold opacity-80 hidden sm:inline">Coins</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E6D5C3] shadow-xs text-xs font-bold text-[#5D4E43]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multiplayer Ready</span>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN ENTRY & PROMINENT CREATE/JOIN MENU           */}
      {/* ---------------------------------------------------- */}
      <main className="w-full max-w-4xl mx-auto px-6 py-4 sm:py-6 flex-1 flex flex-col items-center justify-center text-center z-10">
        {/* Soft Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E6D5C3] shadow-xs mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-xs font-bold text-[#5D4E43]">
            Multiplayer Focus Sanctuary for Study Partners
          </span>
        </div>

        {/* Catchy Headline */}
        <h1 className="text-3xl sm:text-5xl font-black font-['Comfortaa',sans-serif] tracking-tight leading-[1.15] text-[#5D4E43] max-w-2xl mb-3">
          Study side-by-side in your private{" "}
          <span className="text-[#F27D26] underline decoration-4 decoration-[#F27D26]/30 underline-offset-4">
            cozy room
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#5D4E43]/75 max-w-xl leading-relaxed mb-6">
          Synchronize your Pomodoro timer with a friend, watch gentle falling snow, and keep each other motivated with shared focus energy levels.
        </p>

        {/* ==================================================== */}
        {/* INVITE BANNER (If loaded from an invite link)        */}
        {/* ==================================================== */}
        {detectedInvite && (
          <div className="w-full max-w-lg mb-6 p-4 rounded-2xl bg-amber-50/95 border-2 border-[#F27D26]/30 shadow-md flex items-center justify-between gap-3 text-left animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F27D26] text-white flex items-center justify-center shadow-xs">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#5D4E43]">Study Partner Invite Detected</p>
                <p className="text-xs text-[#5D4E43]/70 font-mono">Room: {detectedInvite}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setJoinCodeInput(detectedInvite);
                handleJoinExistingRoom(undefined, detectedInvite);
              }}
              className="bg-[#F27D26] hover:bg-[#E06C15] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Enter Room Now →
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* PROMINENT ROOM CREATION & JOINING CARD               */}
        {/* Rendered directly on the main entry screen           */}
        {/* ==================================================== */}
        <div
          id="room-creation-menu-card"
          className="w-full max-w-xl bg-white/95 rounded-3xl p-6 sm:p-8 border-2 border-[#E6D5C3] shadow-xl backdrop-blur-sm mb-8 text-left"
        >
          {/* USERNAME INPUT DIRECTLY ABOVE CREATE/JOIN BUTTONS */}
          <input
            type="text"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 p-3 rounded-xl bg-[#1e1b2e] border border-[#3a3356] text-white outline-none focus:ring-2 focus:ring-[#F27D26]/60"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* OPTION A: CREATE NEW ROOM */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6D5C3]">
              <div>
                <div className="flex items-center gap-2 mb-2 text-[#5D4E43]">
                  <PlusCircle className="w-4 h-4 text-[#F27D26]" />
                  <h2 className="text-sm font-black font-['Comfortaa',sans-serif]">Start New Room</h2>
                </div>
                <p className="text-xs text-[#5D4E43]/70 mb-4 leading-relaxed">
                  Generate a private room ID and jump into your cozy study session. Share the link with your buddy.
                </p>
              </div>

              <button
                id="create-room-btn"
                onClick={handleCreateRoom}
                className="w-full bg-[#5D4E43] hover:bg-[#483B32] active:scale-98 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-[#FFB26B] group-hover:rotate-12 transition-transform" />
                <span>Create Room</span>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* OPTION B: JOIN EXISTING ROOM */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6D5C3]">
              <div>
                <div className="flex items-center gap-2 mb-2 text-[#5D4E43]">
                  <LogIn className="w-4 h-4 text-[#F27D26]" />
                  <h2 className="text-sm font-black font-['Comfortaa',sans-serif]">Join Partner's Room</h2>
                </div>
                <p className="text-xs text-[#5D4E43]/70 mb-4 leading-relaxed">
                  Have a room code or invite link? Enter it below to join your study partner instantly.
                </p>
              </div>

              <form onSubmit={handleJoinExistingRoom} className="flex flex-col gap-2">
                <input
                  id="join-code-input"
                  type="text"
                  placeholder="e.g. cozy-a8b2"
                  value={joinCodeInput}
                  onChange={(e) => {
                    setJoinCodeInput(e.target.value);
                    setJoinError("");
                  }}
                  className="w-full bg-white px-3 py-2.5 rounded-xl border border-[#E6D5C3] text-xs font-semibold text-[#5D4E43] placeholder-[#5D4E43]/40 outline-none focus:ring-2 focus:ring-[#F27D26]/40"
                />
                <button
                  type="submit"
                  id="join-code-submit-btn"
                  className="w-full bg-[#F27D26] hover:bg-[#E06C15] active:scale-98 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Join Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {joinError && (
            <p className="text-xs font-bold text-rose-500 mt-4 text-center animate-shake">
              {joinError}
            </p>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* 3. SOFT DIGITAL TIMER & WORKSTATION PREVIEW          */}
        {/* ---------------------------------------------------- */}
        <div className="w-full max-w-xl rounded-[32px] bg-white/75 border-4 border-white shadow-xl p-5 relative overflow-hidden backdrop-blur-sm">
          {/* Soft Pomodoro Timer Display Card */}
          <div className="w-fit mx-auto px-5 py-1.5 rounded-full bg-[#F2E8DA]/80 border border-white flex items-center gap-2 mb-3 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="font-mono font-bold text-lg tracking-tight text-[#5D4E43]">
              25:00
            </span>
            <span className="text-[10px] font-bold text-[#5D4E43]/60 uppercase tracking-wider">
              Deep Focus
            </span>
          </div>

          {/* Arched Window with Gentle Snow */}
          <div className="w-32 h-16 mx-auto rounded-t-full rounded-b-lg border-4 border-white shadow-xs bg-gradient-to-b from-[#87A8BD] via-[#ADC2CE] to-[#D5E1E8] relative overflow-hidden mb-3 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-white/80 absolute top-2 right-4 blur-[0.5px]" />
            <div className="absolute inset-0 flex justify-around items-start pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-200" />
            </div>
            <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-white/70" />
            <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-white/70" />
          </div>

          {/* Miniature Dual Desks */}
          <div className="flex items-end justify-center gap-10 sm:gap-16 pb-1">
            {/* User Avatar Desk Preview */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-[#E6D5C3] border-4 border-white shadow-md flex items-center justify-center relative">
                <div className="w-6 h-6 rounded-full bg-[#FFD4B2] flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#5D4E43]" />
                    <span className="w-1 h-1 rounded-full bg-[#5D4E43]" />
                  </div>
                </div>
                <span className="absolute -top-2 bg-white px-1.5 py-0.5 rounded-full text-[8px] font-bold border border-[#F2E8DA]">
                  {username ? username : 'Guest'}
                </span>
              </div>
              <div className="w-18 h-7 bg-[#C9A683] rounded-t-xl border-t-4 border-[#B8926D] mt-1.5 relative flex items-center justify-center">
                <div className="w-7 h-4 bg-[#5D4E43] rounded-sm -mt-2 border border-[#3D342D]" />
              </div>
            </div>

            {/* Partner Avatar Desk Preview */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-[#D2E2E2] border-4 border-white shadow-md flex items-center justify-center relative">
                <div className="w-6 h-6 rounded-full bg-[#A8D1D1] flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full border border-[#5D4E43]" />
                    <span className="w-1.5 h-1.5 rounded-full border border-[#5D4E43]" />
                  </div>
                </div>
                <span className="absolute -top-2 bg-white px-1.5 py-0.5 rounded-full text-[8px] font-bold border border-[#F2E8DA]">
                  Partner
                </span>
              </div>
              <div className="w-18 h-7 bg-[#C9A683] rounded-t-xl border-t-4 border-[#B8926D] mt-1.5 relative flex items-center justify-center">
                <div className="w-7 h-4 bg-[#FDF8F1] rounded-sm -mt-1.5 border border-[#E6D5C3]" />
              </div>
            </div>
          </div>

          {/* Shared Energy Bar Preview */}
          <div className="w-full max-w-xs mx-auto mt-2">
            <div className="flex justify-between text-[10px] font-bold mb-1 px-1">
              <span>Shared Focus Energy</span>
              <span className="text-[#F27D26]">84%</span>
            </div>
            <div className="h-2.5 w-full bg-[#F2E8DA] rounded-full overflow-hidden p-0.5 border border-white">
              <div className="h-full bg-gradient-to-r from-[#F27D26] to-[#FFB26B] rounded-full w-[84%]" />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* 4. FEATURE CARDS                                     */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-3xl mt-6 text-left">
          <div className="bg-white/80 p-4 rounded-2xl border border-[#F2E8DA] shadow-xs flex flex-col gap-1">
            <div className="w-7 h-7 rounded-xl bg-[#F2E8DA] flex items-center justify-center text-[#5D4E43]">
              <Users className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs text-[#5D4E43]">Instant Room Link</h3>
            <p className="text-[11px] text-[#5D4E43]/70 leading-relaxed">
              Create a room with a click. Share your unique invite URL with your partner to jump straight in.
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-[#F2E8DA] shadow-xs flex flex-col gap-1">
            <div className="w-7 h-7 rounded-xl bg-[#FFD4B2] flex items-center justify-center text-[#F27D26]">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs text-[#5D4E43]">Tab-Switch Accountability</h3>
            <p className="text-[11px] text-[#5D4E43]/70 leading-relaxed">
              Leaving the active tab dims the room and drops shared energy, keeping both of you honest.
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-[#F2E8DA] shadow-xs flex flex-col gap-1">
            <div className="w-7 h-7 rounded-xl bg-[#D2E2E2] flex items-center justify-center text-[#4A7C7C]">
              <CloudSnow className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs text-[#5D4E43]">Synchronized Weather</h3>
            <p className="text-[11px] text-[#5D4E43]/70 leading-relaxed">
              Experience the same peaceful falling snow, rainy skies, and ambient rain audio together.
            </p>
          </div>
        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* 5. FOOTER                                            */}
      {/* ---------------------------------------------------- */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-4 text-center text-xs text-[#5D4E43]/50 font-medium">
        FocusVault • Cozy Study Room Pomodoro
      </footer>
    </div>
  );
}
