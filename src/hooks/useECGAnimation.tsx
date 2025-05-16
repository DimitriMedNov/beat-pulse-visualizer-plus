import { useState, useEffect, useRef } from "react";
import { generateECGPoint } from "@/utils/ecgGenerator";
import { getCycleDuration, getSpeedMultiplier } from "@/utils/ecgUtils";

export interface ECGDataPoint {
  time: number;
  value: number;
}

interface UseECGAnimationProps {
  rhythmType: string;
  isPlaying: boolean;
  onCycleComplete?: () => void;
}

export function useECGAnimation({
  rhythmType,
  isPlaying,
  onCycleComplete
}: UseECGAnimationProps) {
  const [data, setData] = useState<ECGDataPoint[]>([]);
  const animationRef = useRef<number | null>(null);
  const cyclesCompleted = useRef<number>(0);
  const lastPointTime = useRef<number>(0);
  const speedRef = useRef<number>(getSpeedMultiplier(rhythmType));

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

  return data;
}
