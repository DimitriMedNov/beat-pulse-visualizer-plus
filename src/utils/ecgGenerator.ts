
// Generate ECG data points based on rhythm type
export const generateECGPoint = (time: number, rhythmType: string) => {
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
