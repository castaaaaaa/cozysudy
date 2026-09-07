import React, { useState } from "react";
import {
  X,
  Coins,
  Check,
  Lock,
  Sparkles,
  Trees,
  Flower2,
  Mountain,
  Sunset,
  Waves,
  Moon,
  Leaf,
  Sun,
  Palette,
  Compass,
} from "lucide-react";

export type RoomThemeId =
  | "emerald-forest"
  | "sakura-garden"
  | "mountain-lake"
  | "sunset-meadow"
  | "bamboo-waterfall"
  | "starry-wilderness"
  | "autumn-woods"
  | "warm-loft";

export type NatureCategory = "all" | "forest" | "water" | "sky" | "classic";

export interface RoomTheme {
  id: RoomThemeId;
  name: string;
  subtitle: string;
  category: "forest" | "water" | "sky" | "classic";
  cost: number;
  icon: React.ElementType;
  previewGradient: string;
  tag: string;
  description: string;
  containerBg: string;
  textColor: string;
  accentColor: string;
  windowBackdrop: string;
}

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: "emerald-forest",
    name: "Lush Emerald Forest",
    subtitle: "Sunbeams & Mossy Pines",
    category: "forest",
    cost: 0,
    icon: Trees,
    previewGradient: "from-[#0F281E] via-[#1B3E2F] to-[#2B5742]",
    tag: "Lush Woodland • Free",
    description: "Golden sunlight filtering through ancient pine and mossy oak trees with gentle floating leaves.",
    containerBg: "bg-gradient-to-b from-[#0A1A14] via-[#122B20] to-[#1C3D2F]",
    textColor: "text-[#E6F4EA]",
    accentColor: "#34D399",
    windowBackdrop: "from-[#1B3E2F] via-[#2D5A45] to-[#477C62]",
  },
  {
    id: "sakura-garden",
    name: "Cherry Blossom Garden",
    subtitle: "Fluttering Sakura & Dawn Mist",
    category: "water",
    cost: 10,
    icon: Flower2,
    previewGradient: "from-[#2A1620] via-[#4A2638] to-[#6A3950]",
    tag: "Spring Flora",
    description: "Soft pink cherry blossoms swaying in a gentle spring breeze with petals drifting across the study window.",
    containerBg: "bg-gradient-to-b from-[#1F1018] via-[#2E1824] to-[#3D2232]",
    textColor: "text-[#FCE7F3]",
    accentColor: "#F472B6",
    windowBackdrop: "from-[#4A2638] via-[#703B55] to-[#A05D7C]",
  },
  {
    id: "mountain-lake",
    name: "Misty Mountain Lake",
    subtitle: "Alpine Peaks & Crystal Reflections",
    category: "water",
    cost: 15,
    icon: Mountain,
    previewGradient: "from-[#0C1A29] via-[#162D45] to-[#244566]",
    tag: "Alpine Vista",
    description: "Snow-capped mountain silhouettes reflected across serene alpine waters with cool morning mist.",
    containerBg: "bg-gradient-to-b from-[#08131E] via-[#0F2233] to-[#1A344C]",
    textColor: "text-[#E0F2FE]",
    accentColor: "#38BDF8",
    windowBackdrop: "from-[#162D45] via-[#24476B] to-[#3B6A96]",
  },
  {
    id: "sunset-meadow",
    name: "Golden Sunset Meadow",
    subtitle: "Wildflowers & Amber Sunbeams",
    category: "sky",
    cost: 25,
    icon: Sunset,
    previewGradient: "from-[#2B1705] via-[#4D2B0C] to-[#754415]",
    tag: "Golden Hour",
    description: "Warm golden sunlight bathing rolling wildflower hills with dancing sun motes and a tranquil dusk breeze.",
    containerBg: "bg-gradient-to-b from-[#1C0F05] via-[#2F1B0B] to-[#452712]",
    textColor: "text-[#FEF3C7]",
    accentColor: "#F59E0B",
    windowBackdrop: "from-[#4D2B0C] via-[#754415] to-[#A36323]",
  },
  {
    id: "bamboo-waterfall",
    name: "Bamboo Grove & Stream",
    subtitle: "Zen Waterfall & Jade Leaves",
    category: "forest",
    cost: 30,
    icon: Waves,
    previewGradient: "from-[#0A1F18] via-[#13382C] to-[#1F5443]",
    tag: "Zen Sanctuary",
    description: "Slender jade bamboo stalks swaying beside a crystal cascading waterfall and soothing river stones.",
    containerBg: "bg-gradient-to-b from-[#071712] via-[#0D281E] to-[#153B2D]",
    textColor: "text-[#D1FAE5]",
    accentColor: "#10B981",
    windowBackdrop: "from-[#13382C] via-[#1E4E3E] to-[#2E705A]",
  },
  {
    id: "starry-wilderness",
    name: "Starlit Midnight Forest",
    subtitle: "Constellations & Fireflies",
    category: "sky",
    cost: 40,
    icon: Moon,
    previewGradient: "from-[#070A14] via-[#0E1528] to-[#182342]",
    tag: "Starlit Night",
    description: "Deep midnight pine woods beneath brilliant glowing stars, a silver crescent moon, and bioluminescent fireflies.",
    containerBg: "bg-gradient-to-b from-[#050811] via-[#0A1020] to-[#111A30]",
    textColor: "text-[#E2E8F0]",
    accentColor: "#818CF8",
    windowBackdrop: "from-[#0E1528] via-[#182442] to-[#263761]",
  },
  {
    id: "autumn-woods",
    name: "Autumn Maple Woods",
    subtitle: "Falling Crimson Foliage",
    category: "forest",
    cost: 20,
    icon: Leaf,
    previewGradient: "from-[#2A1005] via-[#481E0D] to-[#6E2F16]",
    tag: "Autumn Forest",
    description: "Vibrant scarlet and golden maple canopy with falling autumn leaves and crisp woodland tranquility.",
    containerBg: "bg-gradient-to-b from-[#1C0D05] via-[#2E160A] to-[#432010]",
    textColor: "text-[#FFEDD5]",
    accentColor: "#EA580C",
    windowBackdrop: "from-[#481E0D] via-[#6E2F16] to-[#994523]",
  },
  {
    id: "warm-loft",
    name: "Warm Loft Study",
    subtitle: "Classic Timber & Afternoon Light",
    category: "classic",
    cost: 0,
    icon: Sun,
    previewGradient: "from-[#FDF8F1] via-[#FCEAD8] to-[#F5D8BF]",
    tag: "Classic Loft • Free",
    description: "The classic cozy study room with natural honey-toned oak desks, indoor plants, and warm sunlight.",
    containerBg: "bg-gradient-to-b from-[#FDF8F1] via-[#FAF3EA] to-[#F5EAD9]",
    textColor: "text-[#5D4E43]",
    accentColor: "#F27D26",
    windowBackdrop: "from-[#87A8BD] via-[#ADC2CE] to-[#D5E1E8]",
  },
];

interface BackgroundShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  unlockedThemes: RoomThemeId[];
  activeTheme: RoomThemeId;
  onUnlockTheme: (theme: RoomTheme) => void;
  onSelectTheme: (themeId: RoomThemeId) => void;
  isNight?: boolean;
}

export function BackgroundShopModal({
  isOpen,
  onClose,
  coins,
  unlockedThemes,
  activeTheme,
  onUnlockTheme,
  onSelectTheme,
  isNight = false,
}: BackgroundShopModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<NatureCategory>("all");

  if (!isOpen) return null;

  const filteredThemes = ROOM_THEMES.filter((theme) => {
    if (selectedCategory === "all") return true;
    return theme.category === selectedCategory;
  });

  return (
    <div
      id="background-shop-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="background-shop-card"
        className={`w-full max-w-3xl max-h-[92vh] rounded-[36px] border-4 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
          isNight
            ? "bg-[#1E251E] border-white/20 text-[#F1F7F3]"
            : "bg-[#F7FAF7] border-white text-[#2D3E35]"
        }`}
      >
        {/* Header with Coin Counter and Nature Theme */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isNight ? "bg-[#151D16] border-white/10" : "bg-[#EDF4EE] border-[#D1E0D4]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md border-2 border-white/80">
              <Trees className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Comfortaa',sans-serif] font-black text-lg tracking-tight text-emerald-950 dark:text-emerald-100">
                  Nature Backgrounds Shop
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 border border-emerald-600/25">
                  <Compass className="w-3 h-3 text-emerald-700" />
                  Scenic Nature Escapes
                </span>
              </div>
              <p className="text-xs opacity-75 text-[#3D5246]">
                Earn Study Coins with focused Pomodoros to unlock peaceful nature vistas and window scenery!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Coin Balance in Modal Header */}
            <div
              id="modal-coin-balance-pill"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 shadow-sm"
            >
              <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                🪙
              </div>
              <span className="font-mono font-extrabold text-sm text-[#382818]">{coins}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#382818]/75">
                Coins
              </span>
            </div>

            <button
              id="close-background-shop-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-rose-50 text-[#3D5246] hover:text-rose-600 border border-[#D1E0D4] shadow-xs flex items-center justify-center transition-all cursor-pointer"
              title="Close shop"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto ${
            isNight ? "bg-[#182119] border-white/10" : "bg-[#E6F0E8]/70 border-[#D1E0D4]"
          }`}
        >
          {[
            { id: "all", label: "All Nature", icon: Sparkles },
            { id: "forest", label: "Forests & Woods", icon: Trees },
            { id: "water", label: "Lakes & Blossoms", icon: Mountain },
            { id: "sky", label: "Sunset & Stars", icon: Sunset },
            { id: "classic", label: "Classic Loft", icon: Sun },
          ].map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id as NatureCategory)}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-xs"
                    : isNight
                    ? "bg-white/10 text-emerald-100 hover:bg-white/20"
                    : "bg-white/80 text-emerald-900 border border-emerald-200 hover:bg-white"
                }`}
              >
                <CatIcon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Earning Tip Banner */}
        <div
          className={`px-6 py-2 border-b flex items-center justify-between text-xs font-semibold ${
            isNight ? "bg-[#1D271E] border-white/10 text-emerald-200/90" : "bg-emerald-50/90 border-[#D1E0D4] text-emerald-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Study earnings: <strong>+1 coin</strong> per minute of focus, <strong>+5 bonus coins</strong> on session completion, and <strong>+1 coin</strong> per finished to-do!
            </span>
          </div>
        </div>

        {/* Grid of Nature Background Themes */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 content-start items-start auto-rows-max">
          {filteredThemes.map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isActive = activeTheme === theme.id;
            const canAfford = coins >= theme.cost;
            const Icon = theme.icon;

            return (
              <div
                key={theme.id}
                id={`theme-card-${theme.id}`}
                className={`relative h-24 rounded-2xl border-2 p-2.5 flex flex-row items-center gap-3 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md shrink-0 ${
                  isActive
                    ? "border-emerald-600 ring-2 ring-emerald-500/30 bg-white/95"
                    : isUnlocked
                    ? "border-[#D1E0D4] bg-white/85 hover:border-emerald-500/50"
                    : "border-dashed border-[#C2D4C6] bg-white/60 opacity-95"
                } ${isNight ? "bg-[#253127]" : ""}`}
              >
                {/* Visual Thumbnail Preview Box */}
                <div
                  className={`w-20 h-full rounded-xl bg-gradient-to-br ${theme.previewGradient} p-2 relative overflow-hidden flex flex-col justify-between shrink-0 shadow-inner border border-white/20`}
                >
                  <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full bg-white/10 blur-xs pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-black/40 text-white backdrop-blur-xs border border-white/20 truncate max-w-[64px]">
                      {theme.category}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="w-5 h-5 rounded-md bg-white/25 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs">
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Center Content Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <h3 className="font-['Comfortaa',sans-serif] font-bold text-xs text-[#2D3E35] dark:text-[#E6F4EA] truncate">
                    {theme.name}
                  </h3>

                  <p className="text-[10px] text-[#3D5246] dark:text-[#C5D9CB] opacity-80 truncate">
                    {theme.subtitle}
                  </p>

                  <div className="text-[10px] font-bold flex items-center gap-1.5 mt-0.5">
                    {theme.cost === 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Free Starter</span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Unlocked</span>
                    ) : (
                      <span className="flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-400">
                        <span>🪙</span>
                        <span>{theme.cost} Coins</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 flex items-center pl-1">
                  {isActive ? (
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-default">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="hidden xs:inline">Active</span>
                    </span>
                  ) : isUnlocked ? (
                    <button
                      id={`apply-theme-${theme.id}`}
                      onClick={() => onSelectTheme(theme.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  ) : canAfford ? (
                    <button
                      id={`unlock-theme-${theme.id}`}
                      onClick={() => onUnlockTheme(theme)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Unlock</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-2.5 py-1.5 rounded-xl bg-black/10 text-[#3D5246]/50 font-bold text-[11px] flex items-center gap-1 cursor-not-allowed"
                      title={`You need ${theme.cost - coins} more coins`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{theme.cost}🪙</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isNight ? "bg-[#151D16] border-white/10" : "bg-[#EDF4EE] border-[#D1E0D4]"
          }`}
        >
          <span className="opacity-75 text-[11px] text-[#3D5246] dark:text-[#C5D9CB] flex items-center gap-1">
            <Trees className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nature themes update the window scenery, room lighting, and ambient particle effects.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white text-emerald-900 font-bold border border-[#D1E0D4] shadow-xs hover:bg-emerald-50 transition-all cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
