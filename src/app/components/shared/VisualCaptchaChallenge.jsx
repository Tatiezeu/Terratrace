import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";

// 93 real downloaded images covering 31 categories (3 per category)
const CAPTCHA_IMAGES_DATA = [
  // 1. Cars
  { id: "car-1", category: "Cars", url: "/captcha/car-1.jpg" },
  { id: "car-2", category: "Cars", url: "/captcha/car-2.jpg" },
  { id: "car-3", category: "Cars", url: "/captcha/car-3.jpg" },

  // 2. Bridges
  { id: "bridge-1", category: "Bridges", url: "/captcha/bridge-1.jpg" },
  { id: "bridge-2", category: "Bridges", url: "/captcha/bridge-2.jpg" },
  { id: "bridge-3", category: "Bridges", url: "/captcha/bridge-3.jpg" },

  // 3. Stairs
  { id: "stairs-1", category: "Stairs", url: "/captcha/stairs-1.jpg" },
  { id: "stairs-2", category: "Stairs", url: "/captcha/stairs-2.jpg" },
  { id: "stairs-3", category: "Stairs", url: "/captcha/stairs-3.jpg" },

  // 4. Bicycles
  { id: "bike-1", category: "Bicycles", url: "/captcha/bike-1.jpg" },
  { id: "bike-2", category: "Bicycles", url: "/captcha/bike-2.jpg" },
  { id: "bike-3", category: "Bicycles", url: "/captcha/bike-3.jpg" },

  // 5. Traffic Lights
  { id: "light-1", category: "Traffic Lights", url: "/captcha/light-1.jpg" },
  { id: "light-2", category: "Traffic Lights", url: "/captcha/light-2.jpg" },
  { id: "light-3", category: "Traffic Lights", url: "/captcha/light-3.jpg" },

  // 6. Crosswalks
  { id: "walk-1", category: "Crosswalks", url: "/captcha/walk-1.jpg" },
  { id: "walk-2", category: "Crosswalks", url: "/captcha/walk-2.jpg" },
  { id: "walk-3", category: "Crosswalks", url: "/captcha/walk-3.jpg" },

  // 7. Fire Hydrants
  { id: "hydrant-1", category: "Fire Hydrants", url: "/captcha/hydrant-1.jpg" },
  { id: "hydrant-2", category: "Fire Hydrants", url: "/captcha/hydrant-2.jpg" },
  { id: "hydrant-3", category: "Fire Hydrants", url: "/captcha/hydrant-3.jpg" },

  // 8. Buses
  { id: "bus-1", category: "Buses", url: "/captcha/bus-1.jpg" },
  { id: "bus-2", category: "Buses", url: "/captcha/bus-2.jpg" },
  { id: "bus-3", category: "Buses", url: "/captcha/bus-3.jpg" },

  // 9. Mountains
  { id: "mountain-1", category: "Mountains", url: "/captcha/mountain-1.jpg" },
  { id: "mountain-2", category: "Mountains", url: "/captcha/mountain-2.jpg" },
  { id: "mountain-3", category: "Mountains", url: "/captcha/mountain-3.jpg" },

  // 10. Trees
  { id: "tree-1", category: "Trees", url: "/captcha/tree-1.jpg" },
  { id: "tree-2", category: "Trees", url: "/captcha/tree-2.jpg" },
  { id: "tree-3", category: "Trees", url: "/captcha/tree-3.jpg" },

  // 11. Motorcycles
  { id: "moto-1", category: "Motorcycles", url: "/captcha/moto-1.jpg" },
  { id: "moto-2", category: "Motorcycles", url: "/captcha/moto-2.jpg" },
  { id: "moto-3", category: "Motorcycles", url: "/captcha/moto-3.jpg" },

  // 12. Boats
  { id: "boat-1", category: "Boats", url: "/captcha/boat-1.jpg" },
  { id: "boat-2", category: "Boats", url: "/captcha/boat-2.jpg" },
  { id: "boat-3", category: "Boats", url: "/captcha/boat-3.jpg" },

  // 13. Airplanes
  { id: "plane-1", category: "Airplanes", url: "/captcha/plane-1.jpg" },
  { id: "plane-2", category: "Airplanes", url: "/captcha/plane-2.jpg" },
  { id: "plane-3", category: "Airplanes", url: "/captcha/plane-3.jpg" },

  // 14. Dogs
  { id: "dog-1", category: "Dogs", url: "/captcha/dog-1.jpg" },
  { id: "dog-2", category: "Dogs", url: "/captcha/dog-2.jpg" },
  { id: "dog-3", category: "Dogs", url: "/captcha/dog-3.jpg" },

  // 15. Cats
  { id: "cat-1", category: "Cats", url: "/captcha/cat-1.jpg" },
  { id: "cat-2", category: "Cats", url: "/captcha/cat-2.jpg" },
  { id: "cat-3", category: "Cats", url: "/captcha/cat-3.jpg" },

  // 16. Doors
  { id: "door-1", category: "Doors", url: "/captcha/door-1.jpg" },
  { id: "door-2", category: "Doors", url: "/captcha/door-2.jpg" },
  { id: "door-3", category: "Doors", url: "/captcha/door-3.jpg" },

  // 17. Benches
  { id: "bench-1", category: "Benches", url: "/captcha/bench-1.jpg" },
  { id: "bench-2", category: "Benches", url: "/captcha/bench-2.jpg" },
  { id: "bench-3", category: "Benches", url: "/captcha/bench-3.jpg" },

  // 18. Clocks
  { id: "clock-1", category: "Clocks", url: "/captcha/clock-1.jpg" },
  { id: "clock-2", category: "Clocks", url: "/captcha/clock-2.jpg" },
  { id: "clock-3", category: "Clocks", url: "/captcha/clock-3.jpg" },

  // 19. Flowers
  { id: "flower-1", category: "Flowers", url: "/captcha/flower-1.jpg" },
  { id: "flower-2", category: "Flowers", url: "/captcha/flower-2.jpg" },
  { id: "flower-3", category: "Flowers", url: "/captcha/flower-3.jpg" },

  // 20. Rivers
  { id: "river-1", category: "Rivers", url: "/captcha/river-1.jpg" },
  { id: "river-2", category: "Rivers", url: "/captcha/river-2.jpg" },
  { id: "river-3", category: "Rivers", url: "/captcha/river-3.jpg" },

  // 21. Chairs
  { id: "chair-1", category: "Chairs", url: "/captcha/chair-1.jpg" },
  { id: "chair-2", category: "Chairs", url: "/captcha/chair-2.jpg" },
  { id: "chair-3", category: "Chairs", url: "/captcha/chair-3.jpg" },

  // 22. Streetlamps
  { id: "lamp-1", category: "Streetlamps", url: "/captcha/lamp-1.jpg" },
  { id: "lamp-2", category: "Streetlamps", url: "/captcha/lamp-2.jpg" },
  { id: "lamp-3", category: "Streetlamps", url: "/captcha/lamp-3.jpg" },

  // 23. Fences
  { id: "fence-1", category: "Fences", url: "/captcha/fence-1.jpg" },
  { id: "fence-2", category: "Fences", url: "/captcha/fence-2.jpg" },
  { id: "fence-3", category: "Fences", url: "/captcha/fence-3.jpg" },

  // 24. Flags
  { id: "flag-1", category: "Flags", url: "/captcha/flag-1.jpg" },
  { id: "flag-2", category: "Flags", url: "/captcha/flag-2.jpg" },
  { id: "flag-3", category: "Flags", url: "/captcha/flag-3.jpg" },

  // 25. Tractors
  { id: "tractor-1", category: "Tractors", url: "/captcha/tractor-1.jpg" },
  { id: "tractor-2", category: "Tractors", url: "/captcha/tractor-2.jpg" },
  { id: "tractor-3", category: "Tractors", url: "/captcha/tractor-3.jpg" },

  // 26. Ambulances
  { id: "ambulance-1", category: "Ambulances", url: "/captcha/ambulance-1.jpg" },
  { id: "ambulance-2", category: "Ambulances", url: "/captcha/ambulance-2.jpg" },
  { id: "ambulance-3", category: "Ambulances", url: "/captcha/ambulance-3.jpg" },

  // 27. Laptops
  { id: "laptop-1", category: "Laptops", url: "/captcha/laptop-1.jpg" },
  { id: "laptop-2", category: "Laptops", url: "/captcha/laptop-2.jpg" },
  { id: "laptop-3", category: "Laptops", url: "/captcha/laptop-3.jpg" },

  // 28. Phones
  { id: "phone-1", category: "Phones", url: "/captcha/phone-1.jpg" },
  { id: "phone-2", category: "Phones", url: "/captcha/phone-2.jpg" },
  { id: "phone-3", category: "Phones", url: "/captcha/phone-3.jpg" },

  // 29. Buildings
  { id: "building-1", category: "Buildings", url: "/captcha/building-1.jpg" },
  { id: "building-2", category: "Buildings", url: "/captcha/building-2.jpg" },
  { id: "building-3", category: "Buildings", url: "/captcha/building-3.jpg" },

  // 30. Umbrellas
  { id: "umbrella-1", category: "Umbrellas", url: "/captcha/umbrella-1.jpg" },
  { id: "umbrella-2", category: "Umbrellas", url: "/captcha/umbrella-2.jpg" },
  { id: "umbrella-3", category: "Umbrellas", url: "/captcha/umbrella-3.jpg" },

  // 31. Ships
  { id: "ship-1", category: "Ships", url: "/captcha/ship-1.jpg" },
  { id: "ship-2", category: "Ships", url: "/captcha/ship-2.jpg" },
  { id: "ship-3", category: "Ships", url: "/captcha/ship-3.jpg" },
];

const CATEGORIES = [
  "Cars", "Bridges", "Stairs", "Bicycles", "Traffic Lights", "Crosswalks",
  "Fire Hydrants", "Buses", "Mountains", "Trees", "Motorcycles",
  "Boats", "Airplanes", "Dogs", "Cats", "Doors", "Benches", "Clocks",
  "Flowers", "Rivers", "Chairs", "Streetlamps", "Fences", "Flags",
  "Tractors", "Ambulances", "Laptops", "Phones", "Buildings", "Umbrellas", "Ships",
];

// Fallback tile renderer in case an image fails to load
const renderSvgTile = (category, isSelected) => {
  const baseClasses = `w-full h-full flex flex-col items-center justify-center p-2 text-white select-none transition-all duration-300 ${
    isSelected ? "scale-90 brightness-75 blur-[0.5px]" : "hover:scale-105"
  }`;

  return (
    <div className={`${baseClasses} bg-gradient-to-br from-slate-700 to-slate-900`}>
      <span className="text-[10px] font-black tracking-widest uppercase text-white/90">{category}</span>
    </div>
  );
};

export default function VisualCaptchaChallenge({ onSuccess, onCancel }) {
  const [targetCategory, setTargetCategory] = useState("");
  const [displayedImages, setDisplayedImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const generateChallenge = () => {
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setTargetCategory(randomCategory);
    setSelectedIds(new Set());
    setFailedImages(new Set());
    setErrorMsg("");

    const targets = CAPTCHA_IMAGES_DATA.filter((img) => img.category === randomCategory);
    const distractors = CAPTCHA_IMAGES_DATA.filter((img) => img.category !== randomCategory);
    const targetCount = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    const shuffledTargets = [...targets].sort(() => 0.5 - Math.random());
    const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffledTargets.slice(0, targetCount);
    const distractorCount = 9 - selectedTargets.length;
    const selectedDistractors = shuffledDistractors.slice(0, distractorCount);
    const finalNine = [...selectedTargets, ...selectedDistractors].sort(() => 0.5 - Math.random());
    setDisplayedImages(finalNine);
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleTileClick = (id) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(id)) nextSelected.delete(id);
    else nextSelected.add(id);
    setSelectedIds(nextSelected);
  };

  const handleVerify = () => {
    const targetIdsInGrid = displayedImages
      .filter((img) => img.category === targetCategory)
      .map((img) => img.id);
    const selectedArray = Array.from(selectedIds);
    const hasAllTargets = targetIdsInGrid.every((id) => selectedIds.has(id));
    const hasNoDistractors = selectedArray.every((id) => targetIdsInGrid.includes(id));

    if (hasAllTargets && hasNoDistractors && selectedArray.length > 0) {
      onSuccess();
    } else {
      setErrorMsg("Please try again. Your selection did not match correctly.");
      setTimeout(() => generateChallenge(), 1000);
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

      {/* Error Feedback */}
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

      {/* 3×3 Grid */}
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
                renderSvgTile(img.category, isSelected)
              ) : (
                <img
                  src={img.url}
                  alt={img.category}
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

              {/* Checkmark overlay */}
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

      {/* Bottom Toolbar */}
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
