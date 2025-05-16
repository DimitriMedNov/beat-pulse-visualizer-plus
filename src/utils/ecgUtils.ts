
// Helper function to get cycle duration based on rhythm type
export const getCycleDuration = (type: string): number => {
  switch (type) {
    case "bradycardia": return 1.5;
    case "tachycardia": return 0.6;
    case "arrhythmia": return 0.9;
    default: return 1;
  }
};

// Helper function to get animation speed multiplier - with consistent values
export const getSpeedMultiplier = (type: string): number => {
  switch (type) {
    case "bradycardia": return 0.4; // Slower
    case "tachycardia": return 0.7; // Keep consistent with normal
    case "arrhythmia": return 0.6; // Keep consistent
    default: return 0.5; // Normal heart rate, slowed down
  }
};

// Get color based on rhythm type
export const getLineColor = (type: string): string => {
  switch (type) {
    case "normal": return "#2a9d8f"; // medical-normal
    case "bradycardia": return "#457b9d"; // medical-bradycardia
    case "tachycardia": return "#e76f51"; // medical-tachycardia
    case "arrhythmia": return "#7209b7"; // medical-arrhythmia
    default: return "#2a9d8f"; // medical-normal
  }
};
