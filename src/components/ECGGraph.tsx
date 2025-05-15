
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface ECGGraphProps {
  rhythmType: string;
  isPlaying: boolean;
  onCycleComplete?: () => void;
}

// Helper function to get cycle duration based on rhythm type
const getCycleDuration = (type: string): number => {
  switch (type) {
    case "bradycardia": return 1.5;
    case "tachycardia": return 0.6;
    case "arrhythmia": return 0.9;
    default: return 1;
  }
};

// Helper function to get animation speed multiplier - with consistent values
const getSpeedMultiplier = (type: string): number => {
  switch (type) {
    case "bradycardia": return 0.4; // Slower
    case "tachycardia": return 0.7; // Keep consistent with normal
    case "arrhythmia": return 0.6; // Keep consistent
    default: return 0.5; // Normal heart rate, slowed down
  }
};

export default function ECGGraph({ rhythmType, isPlaying, onCycleComplete }: ECGGraphProps) {
  const [data, setData] = useState<{ time: number; value: number }[]>([]);
  const animationRef = useRef<number | null>(null);
  const cyclesCompleted = useRef<number>(0);
  const lastPointTime = useRef<number>(0);
  const speedRef = useRef<number>(getSpeedMultiplier(rhythmType));

  // Generate ECG data points based on rhythm type
  const generateECGPoint = (time: number, rhythmType: string) => {
    // Base sine wave
    let value = Math.sin(time * Math.PI * 2);
    
    switch (rhythmType) {
      case "normal":
        // Normal heartbeat: standard P-QRS-T wave
        if (time % 1 > 0.1 && time % 1 < 0.2) {
          value = value * 0.5 + 0.5; // P-wave
        } else if (time % 1 > 0.3 && time % 1 < 0.4) {
          value = value * 2; // QRS complex
        } else if (time % 1 > 0.5 && time % 1 < 0.7) {
          value = value * 0.7 + 0.3; // T-wave
        } else {
          value = value * 0.1; // Baseline
        }
        break;
      
      case "bradycardia":
        // Slower rhythm
        const scaledTimeBrady = time * 0.7;
        if (scaledTimeBrady % 1 > 0.1 && scaledTimeBrady % 1 < 0.2) {
          value = value * 0.5 + 0.5;
        } else if (scaledTimeBrady % 1 > 0.3 && scaledTimeBrady % 1 < 0.4) {
          value = value * 1.8;
        } else if (scaledTimeBrady % 1 > 0.5 && scaledTimeBrady % 1 < 0.7) {
          value = value * 0.7 + 0.3;
        } else {
          value = value * 0.1;
        }
        break;
      
      case "tachycardia":
        // Faster rhythm
        const scaledTimeTachy = time * 1.5;
        if (scaledTimeTachy % 1 > 0.1 && scaledTimeTachy % 1 < 0.2) {
          value = value * 0.4 + 0.4;
        } else if (scaledTimeTachy % 1 > 0.3 && scaledTimeTachy % 1 < 0.4) {
          value = value * 2.2;
        } else if (scaledTimeTachy % 1 > 0.5 && scaledTimeTachy % 1 < 0.7) {
          value = value * 0.6 + 0.3;
        } else {
          value = value * 0.1;
        }
        break;
      
      case "arrhythmia":
        // Irregular rhythm
        const randomFactor = Math.sin(time * 10) * 0.4 + 0.6;
        if ((time * randomFactor) % 1 > 0.1 && (time * randomFactor) % 1 < 0.2) {
          value = value * 0.5 + Math.random() * 0.3;
        } else if ((time * randomFactor) % 1 > 0.3 && (time * randomFactor) % 1 < 0.4) {
          value = value * (1.5 + Math.random() * 0.8);
        } else if ((time * randomFactor) % 1 > 0.5 && (time * randomFactor) % 1 < 0.7) {
          value = value * 0.7 + Math.random() * 0.3;
        } else {
          value = value * 0.1 + (Math.random() - 0.5) * 0.1;
        }
        break;
      
      default:
        break;
    }

    return { time, value };
  };

  useEffect(() => {
    // Reset data when rhythm type changes
    setData([]);
    lastPointTime.current = 0;
    cyclesCompleted.current = 0;
    speedRef.current = getSpeedMultiplier(rhythmType);
  }, [rhythmType]);

  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      let accumulatedTime = lastPointTime.current;
      
      // Generate initial set of data points if starting from empty
      if (data.length === 0) {
        const initialData = [];
        const timeStep = 0.01;
        for (let t = 0; t < 2; t += timeStep) {
          initialData.push(generateECGPoint(t, rhythmType));
        }
        setData(initialData);
        accumulatedTime = 2;
        lastPointTime.current = accumulatedTime;
      }
      
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Add time based on animation speed - constant speed regardless of time passed
        const timeIncrement = deltaTime / 1000 * speedRef.current * 0.3; // Slowed down even more
        accumulatedTime += timeIncrement;
        lastPointTime.current = accumulatedTime;
        
        // Generate new data point
        const newPoint = generateECGPoint(accumulatedTime, rhythmType);
        
        // Update data, keeping only recent points for performance
        setData(prev => {
          // Add new point and limit to 200 points
          const newData = [...prev, newPoint].slice(-200);
          return newData;
        });
        
        // Check if we've completed a cycle based on rhythm type
        const cycleDuration = getCycleDuration(rhythmType);
        if (Math.floor(accumulatedTime / cycleDuration) > cyclesCompleted.current) {
          cyclesCompleted.current = Math.floor(accumulatedTime / cycleDuration);
          onCycleComplete?.();
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // When not playing, maintain a static line
      if (data.length === 0) {
        // Create a flat line when paused and no data exists
        const flatLineData = [];
        for (let i = 0; i < 50; i++) {
          flatLineData.push({ time: i * 0.05, value: 0 });
        }
        setData(flatLineData);
      }
    }
  }, [isPlaying, rhythmType, onCycleComplete, data.length]);
  
  // Get color based on rhythm type
  const getLineColor = (type: string): string => {
    switch (type) {
      case "normal": return "#2a9d8f";
      case "bradycardia": return "#457b9d";
      case "tachycardia": return "#e76f51";
      case "arrhythmia": return "#7209b7";
      default: return "#2a9d8f";
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-md border border-gray-200 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time"
            type="number"
            domain={[
              (dataMin: number) => Math.max(0, dataMin - 0.1),
              (dataMax: number) => dataMax + 0.1
            ]}
            tick={{ fontSize: 12 }}
            stroke="#888888"
          />
          <YAxis 
            domain={[-2.5, 2.5]} 
            tick={{ fontSize: 12 }}
            stroke="#888888"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={getLineColor(rhythmType)}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
