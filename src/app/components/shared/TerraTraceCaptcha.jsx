import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import logoSvg from '../../../assets/logo.svg';

/**
 * TerraTraceCaptcha - An ultra-premium, professional checkbox verification component.
 * Performs a simulated browser risk & signature analysis with high-end micro-animations.
 * Completely simplified to remove image grid matching as requested.
 *
 * Props:
 * @param {Function} onVerify - Callback triggered with true/false when verification passes.
 */
export default function TerraTraceCaptcha({ onVerify }) {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scanStatus, setScanStatus] = useState("Idle");

  // Simulated background scanning sequence for professional presentation
  const scanSequence = [
    "Analyzing cursor trajectory...",
    "Validating browser headers...",
    "Checking environment signature...",
    "Encrypting handshake token..."
  ];

  const handleCheckboxClick = () => {
    if (isChecked || isSuccess || isVerifying) return;

    setIsVerifying(true);
    setScanStatus(scanSequence[0]);

    // Step-by-step scanning simulation
    setTimeout(() => setScanStatus(scanSequence[1]), 400);
    setTimeout(() => setScanStatus(scanSequence[2]), 800);
    setTimeout(() => setScanStatus(scanSequence[3]), 1200);

    setTimeout(() => {
      setIsVerifying(false);
      setIsChecked(true);
      setIsSuccess(true);
      setScanStatus("Verification Passed");
      onVerify(true);
    }, 1600);
  };

  return (
    <div className="w-full max-w-md select-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/60 dark:border-white/10 overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              {/* Premium Circular/Square Custom Checkbox */}
              <motion.div
                onClick={handleCheckboxClick}
                whileHover={!isSuccess && !isVerifying ? { scale: 1.05 } : {}}
                whileTap={!isSuccess && !isVerifying ? { scale: 0.95 } : {}}
                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 relative ${
                  isSuccess
                    ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20'
                    : isVerifying
                    ? 'border-transparent bg-gray-50 dark:bg-white/5'
                    : 'border-gray-300 dark:border-white/20 hover:border-[#D4AF37] dark:hover:border-[#D4AF37]'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isVerifying ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                      transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                    >
                      {/* Gold rotating load indicator */}
                      <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#D4AF37]">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="30 10" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  ) : isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>

              {/* Text Area containing status info */}
              <div className="flex flex-col">
                <span className="text-[#002147] dark:text-gray-200 text-sm font-semibold tracking-wide">
                  {isSuccess ? "Verification Successful" : "I'm not a robot"}
                </span>
                
                {/* Scanning transitions showing advanced security */}
                <div className="h-4 mt-0.5 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {isVerifying ? (
                      <motion.span
                        key={scanStatus}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] text-gray-400 font-mono tracking-tight absolute block leading-none"
                      >
                        {scanStatus}
                      </motion.span>
                    ) : isSuccess ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider absolute block leading-none"
                      >
                        Portal Access Unlocked
                      </motion.span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium tracking-tight absolute block leading-none">
                        Securing Cameroon Land Registry (MINDCAF)
                      </span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* Branded Official Shield Icon */}
            <div className="flex flex-col items-end shrink-0 select-none">
              <img src={logoSvg} alt="TerraTrace Logo" className="h-7 w-auto mb-0.5" />
              <span className="text-[6px] text-gray-400 font-semibold tracking-wider mr-1">Security Verified</span>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
