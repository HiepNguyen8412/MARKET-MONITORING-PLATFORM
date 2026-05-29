import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  isPositive?: boolean;
}

export const Sparkline = ({ data, color = "#3b82f6", height = 40, isPositive = true }: SparklineProps) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 100;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ height, width: '100px' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline 
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={!isPositive ? "4,3" : "none"}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};
