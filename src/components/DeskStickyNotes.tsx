import React, { useState } from "react";
import {
  Check,
  Trash2,
  Plus,
  Pin,
  Sparkles,
  X,
  CheckCircle2,
  Circle,
  FileText,
  User,
  Zap,
} from "lucide-react";
import { StickyTask, StickyColor } from "../hooks/useCozyRoom";
export type { StickyTask, StickyColor };

// Pastel sticky note color mappings with authentic tape & shadow styles
export const STICKY_STYLES: Record<
  StickyColor,
  {
    bg: string;
    border: string;
    tape: string;
    accent: string;
    text: string;
    name: string;
  }
> = {
  yellow: {
    bg: "bg-[#FFF9C4]",
    border: "border-[#FDE047]",
    tape: "bg-[#FACC15]/40",
    accent: "#EAB308",
    text: "text-[#664D03]",
    name: "Butter Yellow",
  },
  mint: {
    bg: "bg-[#DCFCE7]",
    border: "border-[#86EFAC]",
    tape: "bg-[#4ADE80]/40",
    accent: "#16A34A",
    text: "text-[#14532D]",
    name: "Mint Tea",
  },
  pink: {
    bg: "bg-[#FCE7F3]",
    border: "border-[#F472B6]",
    tape: "bg-[#FB7185]/40",
    accent: "#E11D48",
    text: "text-[#831843]",
    name: "Sakura Blush",
  },
  blue: {
    bg: "bg-[#E0F2FE]",
    border: "border-[#7DD3FC]",
    tape: "bg-[#38BDF8]/40",
    accent: "#0284C7",
    text: "text-[#0C4A6E]",
    name: "Sky Lo-Fi",
  },
  lavender: {
    bg: "bg-[#F3E8FF]",
    border: "border-[#D8B4FE]",
    tape: "bg-[#C084FC]/40",
    accent: "#9333EA",
    text: "text-[#581C87]",
    name: "Lavender",
  },
};

// ============================================================================
// 1. MINI DESK STICKY NOTE PAD (Rendered directly on character's wooden desk)
// ============================================================================
interface DeskStickyNotePadProps {
  ownerName: string;
  tasks: StickyTask[];
  onOpen: () => void;
  isNight?: boolean;
}

export function DeskStickyNotePad({
  ownerName,
  tasks,
  onOpen,
  isNight = false,
}: DeskStickyNotePadProps) {
  const ownerTasks = tasks.filter(
    (t) => t.author.toLowerCase() === ownerName.toLowerCase()
  );
  const completedCount = ownerTasks.filter((t) => t.completed).length;
  const pendingTasks = ownerTasks.filter((t) => !t.completed);
  const topPending = pendingTasks[0];

  // Default color based on character
  const isAlex = ownerName.toLowerCase() === "alex";
  const noteColor: StickyColor = isAlex ? "yellow" : "mint";
  const styles = STICKY_STYLES[noteColor];

  return (
    <div
      id={`desk-sticky-pad-${ownerName.toLowerCase()}`}
      onClick={onOpen}
      title={`Click to view and edit ${ownerName}'s sticky note to-do list`}
      className={`relative cursor-pointer select-none transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group ${
        isAlex ? "-rotate-2" : "rotate-2"
      }`}
    >
      {/* Decorative Washi Tape strip on top */}
      <div
        className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-3.5 ${styles.tape} rounded-xs shadow-xs z-20 backdrop-blur-[1px] border-t border-white/40`}
      />

      {/* Realistic Mini Sticky Note Paper */}
      <div
        className={`w-24 sm:w-28 h-18 sm:h-20 ${styles.bg} ${styles.text} rounded-sm p-2 shadow-md border ${styles.border} flex flex-col justify-between overflow-hidden relative`}
      >
        {/* Paper top corner fold / peel shadow */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-black/5 rounded-bl-sm pointer-events-none" />

        {/* Header with Title and Check Pill */}
        <div className="flex items-center justify-between gap-1">
          <span className="font-['Comfortaa',sans-serif] font-bold text-[9px] truncate max-w-[58px]">
            {ownerName}'s Tasks
          </span>
          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/80 border border-black/5 shadow-2xs shrink-0 flex items-center gap-0.5">
            <Check className="w-2 h-2 text-emerald-600" />
            <span>
              {completedCount}/{ownerTasks.length}
            </span>
          </span>
        </div>

        {/* Preview of active task or empty state */}
        <div className="my-auto">
          {topPending ? (
            <p className="text-[9px] font-medium leading-tight line-clamp-2 italic opacity-90">
              "{topPending.text}"
            </p>
          ) : ownerTasks.length > 0 ? (
            <p className="text-[8px] font-bold text-emerald-700 leading-tight">
              All tasks completed! ✨
            </p>
          ) : (
            <p className="text-[8px] opacity-60 leading-tight">
              + Jot study goal...
            </p>
          )}
        </div>

        {/* Bottom micro footer */}
        <div className="flex items-center justify-between pt-0.5 border-t border-black/5">
          <span className="text-[7.5px] font-bold opacity-60 flex items-center gap-0.5">
            <Pin className="w-2 h-2 text-[#F27D26]" />
            <span>Sticky Note</span>
          </span>
          <span className="text-[7.5px] font-extrabold text-[#F27D26] group-hover:underline">
            Open ↗
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. FULL INTERACTIVE DESK STICKY NOTES & SHARED TO-DO BOARD (MODAL)
// ============================================================================
interface DeskStickyNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: StickyTask[];
  onAddTask: (text: string, author: string, color: StickyColor) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  activeRole: string;
  user1Name: string;
  user2Name: string;
  isNight?: boolean;
}

export function DeskStickyNotesModal({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  activeRole,
  user1Name,
  user2Name,
  isNight = false,
}: DeskStickyNotesModalProps) {
  const [filterRole, setFilterRole] = useState<"ALL" | string>("ALL");
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedColor, setSelectedColor] = useState<StickyColor>("yellow");
  const [selectedAuthor, setSelectedAuthor] = useState<string>(
    activeRole || "Alex"
  );
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) {
      setErrorMsg("Please write a goal or task first");
      return;
    }
    setErrorMsg("");
    onAddTask(newTaskText.trim(), selectedAuthor, selectedColor);
    setNewTaskText("");
  };

  // Filter tasks based on tab
  const displayedTasks = tasks.filter((t) => {
    if (filterRole === "ALL") return true;
    return t.author.toLowerCase() === filterRole.toLowerCase();
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const u1Count = tasks.filter(
    (t) => t.author.toLowerCase() === user1Name.toLowerCase()
  ).length;
  const u2Count = tasks.filter(
    (t) => t.author.toLowerCase() === user2Name.toLowerCase()
  ).length;

  return (
    <div
      id="sticky-notes-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="sticky-notes-board-card"
        className={`w-full max-w-3xl max-h-[90vh] rounded-[36px] border-4 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
          isNight
            ? "bg-[#251D19] border-white/20 text-[#FDF8F1]"
            : "bg-[#FAF6F0] border-white text-[#5D4E43]"
        }`}
      >
        {/* ---------------------------------------------------- */}
        {/* MODAL HEADER: Wood textured styling & Title           */}
        {/* ---------------------------------------------------- */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isNight
              ? "bg-[#1E1714] border-white/10"
              : "bg-[#F4ECE1] border-[#E6D5C3]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5D4E43] text-white flex items-center justify-center shadow-md border-2 border-white/80">
              <Pin className="w-5 h-5 text-[#FFB26B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Comfortaa',sans-serif] font-black text-lg tracking-tight">
                  Desk Sticky Notes & Shared Goals
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                  <Zap className="w-3 h-3 text-emerald-600 fill-current" />
                  +5% Energy per task
                </span>
              </div>
              <p className="text-xs opacity-75">
                Keep each other accountable in real-time. Checking off a task
                boosts shared focus energy!
              </p>
            </div>
          </div>

          <button
            id="close-sticky-notes-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-rose-50 text-[#5D4E43] hover:text-rose-600 border border-[#E6D5C3] shadow-xs flex items-center justify-center transition-all cursor-pointer"
            title="Close Sticky Notes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* FILTER TABS & PROGRESS STATS                         */}
        {/* ---------------------------------------------------- */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 border-b text-xs ${
            isNight
              ? "bg-[#211915] border-white/10"
              : "bg-white/60 border-[#E6D5C3]"
          }`}
        >
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5">
            <button
              id="filter-all-notes-btn"
              onClick={() => setFilterRole("ALL")}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterRole === "ALL"
                  ? "bg-[#5D4E43] text-white shadow-xs"
                  : "hover:text-[#5D4E43] opacity-70"
              }`}
            >
              All Goals ({totalTasks})
            </button>
            <button
              id="filter-alex-notes-btn"
              onClick={() => setFilterRole(user1Name)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterRole.toLowerCase() === user1Name.toLowerCase()
                  ? "bg-[#5D4E43] text-white shadow-xs"
                  : "hover:text-[#5D4E43] opacity-70"
              }`}
            >
              {user1Name}'s Desk ({u1Count})
            </button>
            <button
              id="filter-sam-notes-btn"
              onClick={() => setFilterRole(user2Name)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterRole.toLowerCase() === user2Name.toLowerCase()
                  ? "bg-[#5D4E43] text-white shadow-xs"
                  : "hover:text-[#5D4E43] opacity-70"
              }`}
            >
              {user2Name}'s Desk ({u2Count})
            </button>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold opacity-75">
              Completed:{" "}
              <strong className="text-[#F27D26]">
                {completedTasks}/{totalTasks}
              </strong>
            </span>
            <div className="w-20 h-2 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F27D26] rounded-full transition-all duration-300"
                style={{
                  width: `${
                    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* BODY: PIN NEW STICKY NOTE + STICKY NOTES GRID        */}
        {/* ---------------------------------------------------- */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* New Sticky Note Form */}
          <form
            onSubmit={handleCreate}
            id="add-sticky-note-form"
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isNight
                ? "bg-[#2D231E] border-white/10"
                : "bg-white border-[#E6D5C3]"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Task text input */}
              <input
                id="new-sticky-task-input"
                type="text"
                placeholder="Write a goal... (e.g. Finish chemistry notes, draft intro)"
                value={newTaskText}
                onChange={(e) => {
                  setNewTaskText(e.target.value);
                  setErrorMsg("");
                }}
                className={`w-full sm:flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-[#F27D26]/40 transition-all ${
                  isNight
                    ? "bg-[#1E1714] border-white/15 text-[#FDF8F1] placeholder-white/40"
                    : "bg-[#FAF6F0] border-[#E6D5C3] text-[#5D4E43] placeholder-[#5D4E43]/40"
                }`}
              />

              {/* Author selector */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-bold opacity-60 mr-1">
                  Desk:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAuthor(user1Name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedAuthor === user1Name
                      ? "bg-[#FFD4B2] text-[#5D4E43] border-[#F27D26]"
                      : "bg-black/5 border-transparent opacity-70"
                  }`}
                >
                  {user1Name}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAuthor(user2Name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedAuthor === user2Name
                      ? "bg-[#A8D1D1] text-[#5D4E43] border-[#4A7C7C]"
                      : "bg-black/5 border-transparent opacity-70"
                  }`}
                >
                  {user2Name}
                </button>
              </div>
            </div>

            {/* Color selection row & Submit Button */}
            <div className="mt-3 pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
              {/* Pastel color picker */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold opacity-60">Color:</span>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      "yellow",
                      "mint",
                      "pink",
                      "blue",
                      "lavender",
                    ] as StickyColor[]
                  ).map((c) => {
                    const cStyle = STICKY_STYLES[c];
                    const isSelected = selectedColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-full ${cStyle.bg} border-2 transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? "scale-115 border-[#5D4E43] ring-2 ring-[#F27D26]/40"
                            : `${cStyle.border} opacity-70 hover:opacity-100`
                        }`}
                        title={cStyle.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="submit-new-sticky-btn"
                className="bg-[#5D4E43] hover:bg-[#483B32] active:scale-98 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFB26B]" />
                <span>Pin Sticky Note</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] font-bold text-rose-500 mt-2">
                {errorMsg}
              </p>
            )}
          </form>

          {/* ---------------------------------------------------- */}
          {/* THE STICKY NOTES CORKBOARD GRID                      */}
          {/* ---------------------------------------------------- */}
          {displayedTasks.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-[#FAF6F0] border-2 border-dashed border-[#E6D5C3] flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-[#F27D26]/60" />
              </div>
              <h3 className="font-['Comfortaa',sans-serif] font-bold text-sm mb-1">
                No sticky notes pinned yet
              </h3>
              <p className="text-xs opacity-60 max-w-sm">
                Write down what you're tackling in this study session! Each
                completed goal awards +5% shared room energy.
              </p>
            </div>
          ) : (
            <div
              id="sticky-notes-masonry-grid"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              {displayedTasks.map((task, idx) => {
                const cStyle = STICKY_STYLES[task.color || "yellow"];
                // Subtle organic tilt alternating by index
                const tilts = [
                  "-rotate-1",
                  "rotate-1",
                  "-rotate-1.5",
                  "rotate-0.5",
                  "-rotate-0.5",
                ];
                const tilt = tilts[idx % tilts.length];

                return (
                  <div
                    key={task.id}
                    id={`sticky-task-card-${task.id}`}
                    className={`relative rounded-xl p-4 shadow-md border ${cStyle.bg} ${cStyle.border} ${cStyle.text} transition-all duration-200 hover:shadow-lg hover:scale-102 flex flex-col justify-between min-h-[140px] ${tilt} group`}
                  >
                    {/* Realistic Washi Tape at top */}
                    <div
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 ${cStyle.tape} rounded-xs shadow-2xs backdrop-blur-[1px] border-t border-white/50 pointer-events-none`}
                    />

                    {/* Card Top: Author Tag & Delete Action */}
                    <div className="flex items-center justify-between gap-2 pt-1 mb-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/75 border border-black/5 text-[10px] font-extrabold shadow-2xs">
                        <User className="w-2.5 h-2.5 opacity-60" />
                        <span>{task.author}'s Desk</span>
                      </div>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-40 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-1 rounded-md hover:bg-black/5 cursor-pointer"
                        title="Delete sticky note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Task Text & Checkbox */}
                    <div className="flex items-start gap-2.5 my-auto">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
                        title={
                          task.completed
                            ? "Mark as uncompleted"
                            : "Check off task (+5% focus energy reward)"
                        }
                      >
                        {task.completed ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-black/30 bg-white/60 hover:border-emerald-600 flex items-center justify-center transition-colors" />
                        )}
                      </button>

                      <p
                        className={`text-xs font-semibold leading-relaxed select-none ${
                          task.completed
                            ? "line-through opacity-60 italic"
                            : "opacity-95"
                        }`}
                      >
                        {task.text}
                      </p>
                    </div>

                    {/* Card Footer: Status & Reward */}
                    <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                      {task.completed ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Goal Completed! (+5% Energy)</span>
                        </span>
                      ) : (
                        <span className="opacity-60 text-[9.5px]">
                          Click box to complete
                        </span>
                      )}

                      <span className="font-mono text-[9px] opacity-40">
                        📌 Pinned
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* MODAL FOOTER                                         */}
        {/* ---------------------------------------------------- */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isNight
              ? "bg-[#1E1714] border-white/10"
              : "bg-[#F4ECE1] border-[#E6D5C3]"
          }`}
        >
          <span className="opacity-60 text-[11px]">
            Tip: Pinned sticky notes automatically appear right on Alex's and
            Sam's desks.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/90 text-[#5D4E43] font-bold border border-[#E6D5C3] shadow-xs hover:bg-white transition-all cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
