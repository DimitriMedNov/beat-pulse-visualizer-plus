
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { getLineColor } from "@/utils/ecgUtils";
import { ECGDataPoint } from "@/hooks/useECGAnimation";

interface ECGChartProps {
  data: ECGDataPoint[];
  rhythmType: string;
}

export default function ECGChart({ data, rhythmType }: ECGChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(107, 114, 128, 0.2)" 
          horizontal={true}
          vertical={true}
        />
        <XAxis 
          dataKey="time"
          type="number"
          domain={[
            (dataMin: number) => Math.max(0, dataMin - 0.1),
            (dataMax: number) => dataMax + 0.1
          ]}
          stroke="rgba(107, 114, 128, 0.5)"
          tick={{ fill: 'rgba(107, 114, 128, 0.7)' }}
        />
        <YAxis 
          domain={[-2.5, 2.5]} 
          stroke="rgba(107, 114, 128, 0.5)"
          tick={{ fill: 'rgba(107, 114, 128, 0.7)' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={getLineColor(rhythmType)}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
          className="ecg-line"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
