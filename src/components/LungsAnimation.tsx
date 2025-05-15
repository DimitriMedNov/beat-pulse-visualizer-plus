
import { useEffect } from "react";

interface LungsAnimationProps {
  isPlaying: boolean;
}

export default function LungsAnimation({ isPlaying }: LungsAnimationProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg className="w-full h-full max-w-[300px] max-h-[300px]" viewBox="0 0 300 300">
        <defs>
          <linearGradient id="lungsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8a499" />
            <stop offset="100%" stopColor="#c27c6f" />
          </linearGradient>
          <linearGradient id="tracheaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cfbdb9" />
            <stop offset="100%" stopColor="#aa9895" />
          </linearGradient>
        </defs>

        {/* Trachea (windpipe) */}
        <rect 
          x="145" 
          y="40" 
          width="10" 
          height="80" 
          rx="5" 
          fill="url(#tracheaGradient)" 
        />

        {/* Left and right bronchi */}
        <path 
          d="M155,90 C170,100 190,115 200,130" 
          stroke="url(#tracheaGradient)" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
        />
        <path 
          d="M145,90 C130,100 110,115 100,130" 
          stroke="url(#tracheaGradient)" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
        />

        {/* Left lung */}
        <path 
          className={`lungs-gradient ${isPlaying ? 'animate-lungs-breathe' : ''}`}
          d="M60,100 C40,120 30,150 30,180 C30,220 50,250 90,260 C120,270 145,250 145,220 L145,120 C145,120 130,100 120,100 C100,100 80,80 60,100 Z" 
          fill="url(#lungsGradient)" 
          stroke="#c27c6f" 
          strokeWidth="1" 
          style={{ transformOrigin: 'center' }}
        />

        {/* Right lung */}
        <path 
          className={`lungs-gradient ${isPlaying ? 'animate-lungs-breathe' : ''}`}
          d="M240,100 C260,120 270,150 270,180 C270,220 250,250 210,260 C180,270 155,250 155,220 L155,120 C155,120 170,100 180,100 C200,100 220,80 240,100 Z" 
          fill="url(#lungsGradient)" 
          stroke="#c27c6f" 
          strokeWidth="1"
          style={{ transformOrigin: 'center' }}
        />

        {/* Lung details - bronchioles */}
        <g className={isPlaying ? 'animate-lungs-breathe' : ''} style={{ transformOrigin: 'center' }}>
          {/* Left lung details */}
          <path d="M100,130 C90,150 80,170 85,190" stroke="#c27c6f" strokeWidth="1" fill="none" />
          <path d="M100,130 C110,150 115,170 110,200" stroke="#c27c6f" strokeWidth="1" fill="none" />
          <path d="M85,190 C80,210 90,225 100,235" stroke="#c27c6f" strokeWidth="1" fill="none" />
          <path d="M110,200 C115,220 105,240 95,245" stroke="#c27c6f" strokeWidth="1" fill="none" />
          
          {/* Right lung details */}
          <path d="M200,130 C210,150 220,170 215,190" stroke="#c27c6f" strokeWidth="1" fill="none" />
          <path d="M200,130 C190,150 185,170 190,200" stroke="#c27c6f" strokeWidth="1" fill="none" />
          <path d="M215,190 C220,210 210,225 200,235" stroke="#c27c6f" strokeWidth="1" fill="none" />
          <path d="M190,200 C185,220 195,240 205,245" stroke="#c27c6f" strokeWidth="1" fill="none" />
        </g>
      </svg>
    </div>
  );
}
