import { useState, useEffect, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type WeatherEffect = "clear" | "snow" | "rain";

export type StickyColor = "yellow" | "mint" | "pink" | "blue" | "lavender";

export interface StickyTask {
  id: string;
  text: string;
  completed: boolean;
  author: string;
  color: StickyColor;
  createdAt: number;
}

export interface CozyRoomState {
  roomId: string;
  timerSeconds: number;
  isRunning: boolean;
  sharedEnergy: number;
  currentWeather: WeatherEffect;
  isDistracted: boolean;
  distractedUser: string | null;
  isConnected: boolean;
  // User & Partner Presence State
  myUserName: string;
  setMyUserName: (name: string) => void;
  partnerName: string | null;
  isPartnerOnline: boolean;
  partnerCount: number;
  // Sticky Notes & Shared Tasks
  tasks: StickyTask[];
  addTask: (text: string, author: string, color?: StickyColor) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  lastCompletedTaskNotice: { author: string; text: string } | null;
  // Mutators & Broadcast triggers
  updateTimer: (seconds: number, running?: boolean, shouldBroadcast?: boolean) => void;
  updateIsRunning: (running: boolean) => void;
  updateWeather: (weather: WeatherEffect) => void;
  updateEnergy: (energyOrUpdater: number | ((prev: number) => number)) => void;
  reportFocusLost: (userName?: string) => void;
  clearDistraction: () => void;
}

interface SyncPayloads {
  TIMER_SYNC: {
    timerSeconds: number;
    isRunning: boolean;
    senderId: string;
    timestamp: number;
  };
  WEATHER_SYNC: {
    weather: WeatherEffect;
    senderId: string;
    timestamp: number;
  };
  ENERGY_SYNC: {
    sharedEnergy: number;
    senderId: string;
    timestamp: number;
  };
  FOCUS_LOST: {
    userName: string;
    newEnergy: number;
    senderId: string;
    timestamp: number;
  };
  TASKS_SYNC: {
    tasks: StickyTask[];
    completedNotice?: { author: string; text: string } | null;
    senderId: string;
    timestamp: number;
  };
  USER_PRESENCE_ANNOUNCE: {
    clientId: string;
    userName: string;
    senderId: string;
    timestamp: number;
  };
  USER_PRESENCE_ANNOUNCE_REPLY: {
    clientId: string;
    userName: string;
    senderId: string;
    timestamp: number;
  };
}

/**
 * Custom React Hook to sync study room state across peers using Supabase Realtime Channels.
 * Synchronizes:
 * - timerSeconds & isRunning
 * - sharedEnergy
 * - currentWeather (Snow, Rain, Clear)
 * - Page Visibility & Tab-switching focus penalties (dimming & rumble effects)
 */
export function useCozyRoom(
  roomId: string = "cozy-study-loft",
  initialConfig?: {
    initialTimer?: number;
    initialEnergy?: number;
    initialWeather?: WeatherEffect;
    initialUserName?: string;
  }
): CozyRoomState {
  // Client identifier for sender exclusion
  const clientIdRef = useRef<string>(
    `user_${Math.random().toString(36).substring(2, 8)}`
  );

  // Local synchronized state
  const [timerSeconds, setTimerSeconds] = useState<number>(
    initialConfig?.initialTimer ?? 45 * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sharedEnergy, setSharedEnergy] = useState<number>(
    initialConfig?.initialEnergy ?? 84
  );
  const [currentWeather, setCurrentWeather] = useState<WeatherEffect>(
    initialConfig?.initialWeather ?? "snow"
  );
  const [isDistracted, setIsDistracted] = useState<boolean>(false);
  const [distractedUser, setDistractedUser] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Nickname & Presence state
  const [myUserName, setMyUserNameState] = useState<string>(() => {
    if (initialConfig?.initialUserName && initialConfig.initialUserName.trim()) {
      return initialConfig.initialUserName.trim();
    }
    if (typeof window !== "undefined") {
      try {
        const saved =
          localStorage.getItem("cozy_nickname") ||
          localStorage.getItem("cozy_user_name");
        if (saved && saved.trim()) return saved.trim();
      } catch (e) {
        console.error("Failed to read stored nickname", e);
      }
    }
    return "Alex";
  });

  const myUserNameRef = useRef<string>(myUserName);
  myUserNameRef.current = myUserName;

  // Partner presence state
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false);
  const [partnerCount, setPartnerCount] = useState<number>(0);

  // Channel reference
  const channelRef = useRef<RealtimeChannel | null>(null);
  const distractionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cross-tab broadcast channel for instant local dev & sandbox fallback
  const localBcRef = useRef<BroadcastChannel | null>(null);

  // Keep state in refs for async callbacks
  const sharedEnergyRef = useRef(sharedEnergy);
  sharedEnergyRef.current = sharedEnergy;

  const timerSecondsRef = useRef(timerSeconds);
  timerSecondsRef.current = timerSeconds;

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Broadcast Action Helpers
  const sendBroadcast = useCallback((event: string, payload: object) => {
    const enrichedPayload = {
      ...payload,
      senderId: clientIdRef.current,
      timestamp: Date.now(),
    };

    // Send via Supabase Realtime Channel
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event,
          payload: enrichedPayload,
        });
      } catch (e) {
        console.error("Supabase broadcast error:", e);
      }
    }

    // Send via local BroadcastChannel for multi-tab testing
    if (localBcRef.current) {
      try {
        localBcRef.current.postMessage({
          type: event,
          payload: enrichedPayload,
        });
      } catch {
        // ignore
      }
    }
  }, []);

  // Update nickname and sync via presence and broadcast
  const setMyUserName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setMyUserNameState(trimmed);
      myUserNameRef.current = trimmed;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("cozy_nickname", trimmed);
          localStorage.setItem("cozy_user_name", trimmed);
        } catch (e) {
          console.error("Failed to save nickname", e);
        }
      }

      // Track presence with new nickname in Supabase
      if (channelRef.current) {
        try {
          channelRef.current.track({
            clientId: clientIdRef.current,
            userName: trimmed,
            joinedAt: Date.now(),
          });
        } catch (err) {
          console.error("Presence track error on rename:", err);
        }
      }

      // Broadcast name change to peers
      sendBroadcast("USER_PRESENCE_ANNOUNCE", {
        clientId: clientIdRef.current,
        userName: trimmed,
      });
    },
    [sendBroadcast]
  );

  // Sticky Notes & Shared Tasks state
  const [tasks, setTasks] = useState<StickyTask[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`cozy_tasks_${roomId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Failed to load stored tasks", e);
      }
    }
    // Cozy default starting tasks with personalized author
    return [
      {
        id: "task_1",
        text: "Read 15 pages of textbook chapter",
        completed: false,
        author: myUserNameRef.current || "Alex",
        color: "yellow",
        createdAt: Date.now() - 3600000,
      },
      {
        id: "task_2",
        text: "Review 25 flashcards & formula sheet",
        completed: true,
        author: "Partner",
        color: "mint",
        createdAt: Date.now() - 2400000,
      },
      {
        id: "task_3",
        text: "Complete 1 uninterrupted Pomodoro cycle",
        completed: false,
        author: myUserNameRef.current || "Alex",
        color: "pink",
        createdAt: Date.now() - 1200000,
      },
    ];
  });

  const [lastCompletedTaskNotice, setLastCompletedTaskNotice] = useState<{
    author: string;
    text: string;
  } | null>(null);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Persist tasks locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`cozy_tasks_${roomId}`, JSON.stringify(tasks));
      } catch {
        // ignore quota errors
      }
    }
  }, [tasks, roomId]);

  // Helper to trigger distraction visual penalty
  const triggerPenaltyEffect = useCallback((userName: string) => {
    setIsDistracted(true);
    setDistractedUser(userName);

    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
    }

    distractionTimerRef.current = setTimeout(() => {
      setIsDistracted(false);
      setDistractedUser(null);
    }, 4200);
  }, []);

  // ----------------------------------------------------
  // Supabase Realtime Channel Subscription
  // ----------------------------------------------------
  useEffect(() => {
    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: clientIdRef.current },
      },
    });

    // Helper to evaluate presence state
    const evaluatePresence = () => {
      try {
        const state = channel.presenceState();
        let foundPartner: { clientId: string; userName: string } | null = null;
        let count = 0;

        Object.entries(state).forEach(([key, presences]) => {
          if (Array.isArray(presences)) {
            presences.forEach((p: any) => {
              if (p.clientId !== clientIdRef.current && key !== clientIdRef.current) {
                count++;
                if (!foundPartner && p.userName) {
                  foundPartner = { clientId: p.clientId || key, userName: p.userName };
                }
              }
            });
          }
        });

        if (foundPartner) {
          setPartnerName((foundPartner as any).userName);
          setIsPartnerOnline(true);
        } else {
          setIsPartnerOnline(false);
        }
        setPartnerCount(count);
      } catch (err) {
        console.error("Presence evaluate error:", err);
      }
    };

    // Initialize cross-tab BroadcastChannel for zero-latency local fallback
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        localBcRef.current = new BroadcastChannel(`supabase_${channelName}`);
        localBcRef.current.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (!payload || payload.senderId === clientIdRef.current) return;

          if (type === "TIMER_SYNC") {
            setTimerSeconds(payload.timerSeconds);
            setIsRunning(payload.isRunning);
          } else if (type === "WEATHER_SYNC") {
            setCurrentWeather(payload.weather);
          } else if (type === "ENERGY_SYNC") {
            setSharedEnergy(payload.sharedEnergy);
          } else if (type === "FOCUS_LOST") {
            setSharedEnergy(payload.newEnergy);
            triggerPenaltyEffect(payload.userName);
          } else if (type === "TASKS_SYNC") {
            if (Array.isArray(payload.tasks)) {
              setTasks(payload.tasks);
            }
            if (payload.completedNotice) {
              setLastCompletedTaskNotice(payload.completedNotice);
              if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
              noticeTimerRef.current = setTimeout(() => setLastCompletedTaskNotice(null), 4000);
            }
          } else if (type === "USER_PRESENCE_ANNOUNCE") {
            if (payload.userName) {
              setPartnerName(payload.userName);
              setIsPartnerOnline(true);
              // Reply back with our current nickname
              sendBroadcast("USER_PRESENCE_ANNOUNCE_REPLY", {
                clientId: clientIdRef.current,
                userName: myUserNameRef.current,
              });
            }
          } else if (type === "USER_PRESENCE_ANNOUNCE_REPLY") {
            if (payload.userName) {
              setPartnerName(payload.userName);
              setIsPartnerOnline(true);
            }
          }
        };
      }
    } catch {
      // fallback if BroadcastChannel is unsupported
    }

    // 1. Listen for Timer Synchronization
    channel.on(
      "broadcast",
      { event: "TIMER_SYNC" },
      ({ payload }: { payload: SyncPayloads["TIMER_SYNC"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        setTimerSeconds(payload.timerSeconds);
        setIsRunning(payload.isRunning);
      }
    );

    // 2. Listen for Weather Synchronization
    channel.on(
      "broadcast",
      { event: "WEATHER_SYNC" },
      ({ payload }: { payload: SyncPayloads["WEATHER_SYNC"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        setCurrentWeather(payload.weather);
      }
    );

    // 3. Listen for Energy Synchronization
    channel.on(
      "broadcast",
      { event: "ENERGY_SYNC" },
      ({ payload }: { payload: SyncPayloads["ENERGY_SYNC"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        setSharedEnergy(payload.sharedEnergy);
      }
    );

    // 4. Listen for Tab Switch / Focus Loss Event
    channel.on(
      "broadcast",
      { event: "FOCUS_LOST" },
      ({ payload }: { payload: SyncPayloads["FOCUS_LOST"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        setSharedEnergy(payload.newEnergy);
        triggerPenaltyEffect(payload.userName);
      }
    );

    // 5. Listen for Tasks / Sticky Notes Synchronization
    channel.on(
      "broadcast",
      { event: "TASKS_SYNC" },
      ({ payload }: { payload: SyncPayloads["TASKS_SYNC"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        if (Array.isArray(payload.tasks)) {
          setTasks(payload.tasks);
        }
        if (payload.completedNotice) {
          setLastCompletedTaskNotice(payload.completedNotice);
          if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = setTimeout(() => setLastCompletedTaskNotice(null), 4000);
        }
      }
    );

    // 6. Listen for Realtime Broadcast Presence Announcements
    channel.on(
      "broadcast",
      { event: "USER_PRESENCE_ANNOUNCE" },
      ({ payload }: { payload: SyncPayloads["USER_PRESENCE_ANNOUNCE"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        if (payload.userName) {
          setPartnerName(payload.userName);
          setIsPartnerOnline(true);
          sendBroadcast("USER_PRESENCE_ANNOUNCE_REPLY", {
            clientId: clientIdRef.current,
            userName: myUserNameRef.current,
          });
        }
      }
    );

    channel.on(
      "broadcast",
      { event: "USER_PRESENCE_ANNOUNCE_REPLY" },
      ({ payload }: { payload: SyncPayloads["USER_PRESENCE_ANNOUNCE_REPLY"] }) => {
        if (!payload || payload.senderId === clientIdRef.current) return;
        if (payload.userName) {
          setPartnerName(payload.userName);
          setIsPartnerOnline(true);
        }
      }
    );

    // 7. Supabase Presence Listeners
    channel.on("presence", { event: "sync" }, () => {
      evaluatePresence();
    });

    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      if (Array.isArray(newPresences)) {
        const peer = newPresences.find((p: any) => p.clientId !== clientIdRef.current);
        if (peer && peer.userName) {
          setPartnerName(peer.userName);
          setIsPartnerOnline(true);
        }
      }
      evaluatePresence();
    });

    channel.on("presence", { event: "leave" }, () => {
      evaluatePresence();
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        try {
          await channel.track({
            clientId: clientIdRef.current,
            userName: myUserNameRef.current,
            joinedAt: Date.now(),
          });
        } catch (err) {
          console.error("Presence track error:", err);
        }
        // Announce our presence via broadcast to peers
        sendBroadcast("USER_PRESENCE_ANNOUNCE", {
          clientId: clientIdRef.current,
          userName: myUserNameRef.current,
        });
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
      }
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
      if (localBcRef.current) {
        localBcRef.current.close();
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, triggerPenaltyEffect, sendBroadcast]);

  // Update timer and broadcast to room
  const updateTimer = useCallback(
    (seconds: number, running?: boolean, shouldBroadcast: boolean = true) => {
      const nextRunning = running !== undefined ? running : isRunningRef.current;
      setTimerSeconds(seconds);
      if (running !== undefined) setIsRunning(running);

      if (shouldBroadcast) {
        sendBroadcast("TIMER_SYNC", {
          timerSeconds: seconds,
          isRunning: nextRunning,
        });
      }
    },
    [sendBroadcast]
  );

  // Update running state and broadcast to room
  const updateIsRunning = useCallback(
    (running: boolean) => {
      setIsRunning(running);
      sendBroadcast("TIMER_SYNC", {
        timerSeconds: timerSecondsRef.current,
        isRunning: running,
      });
    },
    [sendBroadcast]
  );

  // Update weather and broadcast to room (e.g. snow, rain, clear)
  const updateWeather = useCallback(
    (newWeather: WeatherEffect) => {
      setCurrentWeather(newWeather);
      sendBroadcast("WEATHER_SYNC", {
        weather: newWeather,
      });
    },
    [sendBroadcast]
  );

  // Update energy and broadcast to room
  const updateEnergy = useCallback(
    (energyOrUpdater: number | ((prev: number) => number)) => {
      const nextEnergy =
        typeof energyOrUpdater === "function"
          ? energyOrUpdater(sharedEnergyRef.current)
          : energyOrUpdater;

      const clamped = Math.max(0, Math.min(100, Math.round(nextEnergy)));
      setSharedEnergy(clamped);

      sendBroadcast("ENERGY_SYNC", {
        sharedEnergy: clamped,
      });
    },
    [sendBroadcast]
  );

  // Report focus lost (e.g. when user switches tabs during active session)
  const reportFocusLost = useCallback(
    (userName?: string) => {
      const reportingName = userName || myUserNameRef.current || "Alex";
      const newEnergy = Math.max(0, Math.round(sharedEnergyRef.current - 25));
      setSharedEnergy(newEnergy);
      triggerPenaltyEffect(reportingName);

      // Broadcast to User B so their screen immediately shows dimming + rumble
      sendBroadcast("FOCUS_LOST", {
        userName: reportingName,
        newEnergy,
      });
    },
    [sendBroadcast, triggerPenaltyEffect]
  );

  // Tasks / Sticky Notes mutators
  const addTask = useCallback(
    (text: string, author: string, color: StickyColor = "yellow") => {
      if (!text.trim()) return;
      const newTask: StickyTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: text.trim(),
        completed: false,
        author: author || "Alex",
        color,
        createdAt: Date.now(),
      };
      const updated = [newTask, ...tasksRef.current];
      setTasks(updated);
      sendBroadcast("TASKS_SYNC", { tasks: updated });
    },
    [sendBroadcast]
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      let completedNotice: { author: string; text: string } | null = null;
      const updated = tasksRef.current.map((t) => {
        if (t.id === taskId) {
          const willBeCompleted = !t.completed;
          if (willBeCompleted) {
            completedNotice = { author: t.author, text: t.text };
          }
          return { ...t, completed: willBeCompleted };
        }
        return t;
      });

      setTasks(updated);

      if (completedNotice) {
        setLastCompletedTaskNotice(completedNotice);
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = setTimeout(() => {
          setLastCompletedTaskNotice(null);
        }, 4000);

        // Boost shared focus energy (+5%) as a reward for checking off tasks!
        const boosted = Math.min(100, Math.round(sharedEnergyRef.current + 5));
        setSharedEnergy(boosted);
        sendBroadcast("ENERGY_SYNC", { sharedEnergy: boosted });
      }

      sendBroadcast("TASKS_SYNC", {
        tasks: updated,
        completedNotice,
      });
    },
    [sendBroadcast]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const updated = tasksRef.current.filter((t) => t.id !== taskId);
      setTasks(updated);
      sendBroadcast("TASKS_SYNC", { tasks: updated });
    },
    [sendBroadcast]
  );

  const clearDistraction = useCallback(() => {
    setIsDistracted(false);
    setDistractedUser(null);
  }, []);

  return {
    roomId,
    timerSeconds,
    isRunning,
    sharedEnergy,
    currentWeather,
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
    clearDistraction,
  };
}
