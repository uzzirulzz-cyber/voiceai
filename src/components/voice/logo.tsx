"use client";

import { motion } from "framer-motion";

interface VoiceLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function VoiceLogo({ size = 40, animated = false, className = "" }: VoiceLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Outer hexagon */}
        <path
          d="M24 2L42 12V36L24 46L6 36V12L24 2Z"
          stroke="url(#voice-grad)"
          strokeWidth="1.5"
          fill="url(#voice-bg)"
        />
        {/* Five-pointed star representing 5 engines */}
        <path
          d="M24 12L26.5 19.5L34.5 19.5L28 24L30.5 31.5L24 27L17.5 31.5L20 24L13.5 19.5L21.5 19.5L24 12Z"
          fill="url(#voice-grad)"
          opacity="0.95"
        />
        {/* Center spark */}
        <circle cx="24" cy="24" r="2" fill="white" opacity="0.9" />

        <defs>
          <linearGradient id="voice-grad" x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(0.75 0.13 200)" />
            <stop offset="0.5" stopColor="oklch(0.65 0.2 250)" />
            <stop offset="1" stopColor="oklch(0.65 0.22 290)" />
          </linearGradient>
          <linearGradient id="voice-bg" x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(0.22 0.028 260)" />
            <stop offset="1" stopColor="oklch(0.18 0.025 260)" />
          </linearGradient>
        </defs>
      </svg>

      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full blur-xl -z-0"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.2 250 / 0.4) 0%, oklch(0.65 0.22 290 / 0.2) 50%, transparent 70%)",
          }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

export function VoiceWordmark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <VoiceLogo size={size} animated />
      <div className="flex flex-col leading-none">
        <span
          className="font-semibold tracking-tight text-gradient-voice"
          style={{ fontSize: size * 0.45 }}
        >
          Voice AI
        </span>
        <span
          className="text-muted-foreground font-medium tracking-wider uppercase"
          style={{ fontSize: size * 0.22 }}
        >
          Five-Engine Workspace
        </span>
      </div>
    </div>
  );
}
