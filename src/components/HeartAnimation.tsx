
import { Heart } from "lucide-react";

interface HeartAnimationProps {
  rhythmType: string;
  isPlaying: boolean;
}

export default function HeartAnimation({ rhythmType, isPlaying }: HeartAnimationProps) {
  // Determine which animation class to use based on the rhythm type
  const getHeartAnimationClass = () => {
    if (!isPlaying) return "animate-none";
    
    switch(rhythmType) {
      case "normal": return "animate-heart-beat-normal";
      case "bradycardia": return "animate-heart-beat-bradycardia";
      case "tachycardia": return "animate-heart-beat-tachycardia";
      case "arrhythmia": return "animate-heart-beat-arrhythmia";
      default: return "animate-heart-beat-normal";
    }
  };

  // Use a softer color when not playing
  const getGradientColors = () => {
    if (!isPlaying) {
      return {
        start: "#F8C4CB",
        end: "#e66b7d"
      };
    }
    return {
      start: "#FFDEE2",
      end: "#e63946"
    };
  };

  const colors = getGradientColors();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* SVG Heart with softer gradient */}
      <svg className="w-full h-full max-w-[300px] max-h-[300px]" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        
        <path 
          className={`heart-gradient ${getHeartAnimationClass()}`}
          transform="translate(12, 12) scale(0.9)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartGradient)"
        />
        
        {/* Inner details with lighter color */}
        <path 
          className={`${getHeartAnimationClass()}`}
          fill="none" 
          stroke="rgba(255,255,255,0.8)" 
          strokeWidth="0.4" 
          transform="translate(12, 12) scale(0.7)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
        
        {/* Aorta and main blood vessels with softer colors */}
        <path 
          className={`${getHeartAnimationClass()}`}
          fill="none" 
          stroke={colors.end} 
          strokeWidth="0.4" 
          d="M12,5 C12,5 13,3 16,3 C19,3 20.5,5 20.5,5 C20.5,5 21,6 21,7"
        />
        <path 
          className={`${getHeartAnimationClass()}`}
          fill="none" 
          stroke={colors.end}
          strokeWidth="0.4" 
          d="M12,5 C12,5 11,3 8,3 C5,3 3.5,5 3.5,5 C3.5,5 3,6 3,7"
        />
      </svg>

      {/* Pulse effect only when playing */}
      {isPlaying && (
        <div className={`absolute inset-0 flex items-center justify-center ${getHeartAnimationClass()}`}>
          <div className="w-[70%] h-[70%] rounded-full bg-pink-200/50 opacity-0 animate-pulse" />
        </div>
      )}
    </div>
  );
}
