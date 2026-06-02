import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RefreshCw, HelpCircle, Eye } from "lucide-react";
import { Button } from "../ui/button";

// 30 images covering 10 categories
const CAPTCHA_IMAGES_DATA = [
  // Cars
  { id: "car-1", category: "Cars", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop" },
  { id: "car-2", category: "Cars", url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop" },
  { id: "car-3", category: "Cars", url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=200&fit=crop" },
  
  // Bridges
  { id: "bridge-1", category: "Bridges", url: "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=200&h=200&fit=crop" },
  { id: "bridge-2", category: "Bridges", url: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=200&h=200&fit=crop" },
  { id: "bridge-3", category: "Bridges", url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=200&fit=crop" },
  
  // Stairs
  { id: "stairs-1", category: "Stairs", url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=200&h=200&fit=crop" },
  { id: "stairs-2", category: "Stairs", url: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=200&h=200&fit=crop" },
  { id: "stairs-3", category: "Stairs", url: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=200&h=200&fit=crop" },
  
  // Bicycles
  { id: "bike-1", category: "Bicycles", url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&h=200&fit=crop" },
  { id: "bike-2", category: "Bicycles", url: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=200&h=200&fit=crop" },
  { id: "bike-3", category: "Bicycles", url: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=200&h=200&fit=crop" },
  
  // Traffic Lights
  { id: "light-1", category: "Traffic Lights", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop" },
  { id: "light-2", category: "Traffic Lights", url: "https://images.unsplash.com/photo-1518364538800-6bcb3f25da49?w=200&h=200&fit=crop" },
  { id: "light-3", category: "Traffic Lights", url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=200&h=200&fit=crop" },
  
  // Crosswalks
  { id: "walk-1", category: "Crosswalks", url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=200&h=200&fit=crop" },
  { id: "walk-2", category: "Crosswalks", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=200&fit=crop" },
  { id: "walk-3", category: "Crosswalks", url: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=200&h=200&fit=crop" },
  
  // Fire Hydrants
  { id: "hydrant-1", category: "Fire Hydrants", url: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=200&h=200&fit=crop" },
  { id: "hydrant-2", category: "Fire Hydrants", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&h=200&fit=crop" },
  { id: "hydrant-3", category: "Fire Hydrants", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&h=200&fit=crop" },
  
  // Buses
  { id: "bus-1", category: "Buses", url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&h=200&fit=crop" },
  { id: "bus-2", category: "Buses", url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&h=200&fit=crop" },
  { id: "bus-3", category: "Buses", url: "https://images.unsplash.com/photo-1494516268441-2b7c595cd6f4?w=200&h=200&fit=crop" },
  
  // Mountains
  { id: "mountain-1", category: "Mountains", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop" },
  { id: "mountain-2", category: "Mountains", url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=200&h=200&fit=crop" },
  { id: "mountain-3", category: "Mountains", url: "https://images.unsplash.com/photo-1486873249359-2731bd6dafc7?w=200&h=200&fit=crop" },
  
  // Trees
  { id: "tree-1", category: "Trees", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200&h=200&fit=crop" },
  { id: "tree-2", category: "Trees", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&h=200&fit=crop" },
  { id: "tree-3", category: "Trees", url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=200&h=200&fit=crop" }
];

const CATEGORIES = ["Cars", "Bridges", "Stairs", "Bicycles", "Traffic Lights", "Crosswalks", "Fire Hydrants", "Buses", "Mountains", "Trees"];

// Modern offline vector fallbacks for ultimate network resilience
const renderFallbackIcon = (category, isSelected) => {
  const baseClasses = `w-full h-full flex flex-col items-center justify-center p-2 text-white select-none transition-all duration-300 ${
    isSelected ? "scale-90 brightness-75 blur-[0.5px]" : "hover:scale-105"
  }`;

  switch (category) {
    case "Cars":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-orange-400 to-red-600`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Car</span>
        </div>
      );
    case "Bridges":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-indigo-500 to-purple-700`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M12 3v9M6 12v6M18 12v6" />
            <path d="M6 18c0-3 3-3 6-3s6 0 6 3" />
            <path d="M3 12c3-4 6-4 9-4s6 0 9 4" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Bridge</span>
        </div>
      );
    case "Stairs":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-teal-400 to-emerald-600`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M3 21v-4h4v-4h4v-4h4v-4h4V5" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Stairs</span>
        </div>
      );
    case "Bicycles":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-emerald-400 to-cyan-500`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5.5" cy="17.5" r="2.5" />
            <circle cx="18.5" cy="17.5" r="2.5" />
            <path d="M15 6h5.5M12 12h3.5l2.5-6M5.5 17.5L9.5 9h6M12 12v5.5" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Bicycle</span>
        </div>
      );
    case "Traffic Lights":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-slate-700 to-slate-900`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="3" />
            <circle cx="12" cy="7" r="1.5" className="fill-red-500 stroke-red-500" />
            <circle cx="12" cy="12" r="1.5" className="fill-yellow-500 stroke-yellow-500" />
            <circle cx="12" cy="17" r="1.5" className="fill-green-500 stroke-green-500" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Light</span>
        </div>
      );
    case "Crosswalks":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-blue-500 to-indigo-700`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M3 10h18M3 14h18M3 18h18" strokeDasharray="3 3" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Walkway</span>
        </div>
      );
    case "Fire Hydrants":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-rose-500 to-red-700`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 14h14M9 5c0-1.7 1.3-3 3-3s3 1.3 3 3v14c0 1.7-1.3 3-3 3s-3-1.3-3-3V5ZM5 9h14M12 9v10" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Hydrant</span>
        </div>
      );
    case "Buses":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-yellow-400 to-amber-600`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="12" rx="2" />
            <circle cx="7.5" cy="18" r="1.5" />
            <circle cx="16.5" cy="18" r="1.5" />
            <path d="M4 14h16M10 8h4" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Bus</span>
        </div>
      );
    case "Mountains":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-cyan-600 to-blue-800`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m8 3 4 8 5-5 5 15H2L8 3Z" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Mountain</span>
        </div>
      );
    case "Trees":
    default:
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-green-500 to-emerald-800`}>
          <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7h14l-7 7ZM12 13-5-5h10l-5 5ZM12 7-3-3h6l-3 3ZM12 19v3" />
          </svg>
          <span className="text-[8px] font-black tracking-widest uppercase mt-1 text-white/90">Tree</span>
        </div>
      );
  }
};

export default function VisualCaptchaChallenge({ onSuccess, onCancel }) {
  const [targetCategory, setTargetCategory] = useState("");
  const [displayedImages, setDisplayedImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const generateChallenge = () => {
    // 1. Choose a random target category
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setTargetCategory(randomCategory);
    setSelectedIds(new Set());
    setFailedImages(new Set());
    setErrorMsg("");

    // 2. Fetch all matching target images and all distractors
    const targets = CAPTCHA_IMAGES_DATA.filter((img) => img.category === randomCategory);
    const distractors = CAPTCHA_IMAGES_DATA.filter((img) => img.category !== randomCategory);

    // 3. Determine target count (between 3 and 5)
    const targetCount = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    const distractorCount = 9 - targetCount;

    // Shuffle both sets
    const shuffledTargets = [...targets].sort(() => 0.5 - Math.random());
    const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random());

    // Select the required amounts
    const selectedTargets = shuffledTargets.slice(0, targetCount);
    const selectedDistractors = shuffledDistractors.slice(0, distractorCount);

    // Combine and shuffle the final 9 images
    const finalNine = [...selectedTargets, ...selectedDistractors].sort(() => 0.5 - Math.random());
    setDisplayedImages(finalNine);
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleTileClick = (id) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedIds(nextSelected);
  };

  const handleVerify = () => {
    // Find all target IDs currently shown in the grid
    const targetIdsInGrid = displayedImages
      .filter((img) => img.category === targetCategory)
      .map((img) => img.id);

    // Get selected array
    const selectedArray = Array.from(selectedIds);

    // Verify 100% match
    const hasAllTargets = targetIdsInGrid.every((id) => selectedIds.has(id));
    const hasNoDistractors = selectedArray.every((id) =>
      targetIdsInGrid.includes(id)
    );

    if (hasAllTargets && hasNoDistractors && selectedArray.length > 0) {
      onSuccess();
    } else {
      setErrorMsg("Please try again. Your selection did not match correctly.");
      setTimeout(() => {
        generateChallenge();
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-[380px] bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 select-none text-left">
      {/* Target Category Header Block */}
      <div className="bg-[#002147] rounded-xl p-5 text-white mb-4 relative overflow-hidden">
        <p className="text-xs uppercase tracking-wider text-[#D4AF37] font-black opacity-80">
          Visual Verification
        </p>
        <h4 className="text-xl font-extrabold font-['Syne'] leading-tight mt-1">
          Select all squares with <br />
          <span className="text-[#D4AF37] font-black text-2xl uppercase tracking-wide underline decoration-dashed decoration-2 mt-0.5 inline-block">
            {targetCategory}
          </span>
        </h4>
        <p className="text-[10px] text-white/50 mt-2 font-medium italic">
          If none, click refresh to generate a new verification grid.
        </p>
      </div>

      {/* Error Feedback Message Overlay */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3x3 CSS Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
        {displayedImages.map((img) => {
          const isSelected = selectedIds.has(img.id);
          const hasFailed = failedImages.has(img.id);
          return (
            <div
              key={img.id}
              onClick={() => handleTileClick(img.id)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-inner border border-gray-100/50 group bg-gray-100 flex items-center justify-center"
            >
              {hasFailed ? (
                renderFallbackIcon(img.category, isSelected)
              ) : (
                <img
                  src={img.url}
                  alt="captcha element"
                  onError={() => {
                    setFailedImages((prev) => {
                      const next = new Set(prev);
                      next.add(img.id);
                      return next;
                    });
                  }}
                  className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${
                    isSelected ? "scale-90 brightness-75 blur-[1px]" : "group-hover:scale-105"
                  }`}
                />
              )}

              {/* Dynamic checkmark overlay with smooth zoom-in spring motion */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute inset-0 bg-blue-500/30 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white stroke-[4px]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Interactive Bottom Control Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={generateChallenge}
            className="p-2.5 text-gray-500 hover:text-[#002147] hover:bg-gray-50 rounded-xl transition-all"
            title="Refresh Challenge"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
            title="Registry Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="h-10 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleVerify}
            className="h-10 px-6 rounded-xl text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] to-[#F4C430] hover:from-[#e2ba34] hover:to-[#ffd544] text-[#002147] shadow-lg shadow-[#D4AF37]/10"
          >
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
