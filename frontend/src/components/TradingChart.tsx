import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

interface Point {
  time: number;
  price: number;
}

interface TradingChartProps {
  data: Point[];
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

const generateCandles = (points: Point[]) => {
  if (!points || points.length === 0) return [];
  const candles: any[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const time = Math.floor(points[i].time / 1000);
    
    const open = i === 0 ? points[i].price * 0.999 : points[i - 1].price;
    const close = points[i].price;
    
    const max = Math.max(open, close);
    const min = Math.min(open, close);
    
    const volatility = close * 0.002;
    const rng = Math.abs(Math.sin(points[i].time)) * volatility;
    
    const high = max + rng;
    const low = min - rng;

    if (i > 0 && time <= candles[candles.length - 1].time) {
        continue;
    }
    
    candles.push({ time, open, high, low, close });
  }
  return candles;
};

export const TradingChart = ({ 
  data, 
  colors = { backgroundColor: 'transparent', textColor: '#6b7a99' } 
}: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(255,255,255,0.1)', style: 0 },
        horzLine: { color: 'rgba(255,255,255,0.1)', style: 0 },
      }
    });
    
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626'
    });
    
    seriesRef.current = candlestickSeries;

    // Subscribing to crosshair to update legend
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
        // Reset to last candle when mouse leaves
        const currentData = seriesRef.current?.data();
        if (currentData && currentData.length > 0) {
          setHoveredCandle(currentData[currentData.length - 1]);
        }
      } else {
        const data = param.seriesData.get(candlestickSeries) as any;
        if (data) setHoveredCandle(data);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth, 
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // Only run once on mount

  // Update Data and Colors when props change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: colors.backgroundColor },
          textColor: colors.textColor,
        }
      });
    }

    if (seriesRef.current && data.length > 0) {
      const candles = generateCandles(data);
      seriesRef.current.setData(candles);
      
      // Update legend to latest candle if not hovering
      setHoveredCandle((prev: any) => {
        // Optionally keep hover state if the user was actively hovering
        return candles[candles.length - 1];
      });
    }
  }, [data, colors]);

  return (
    <div className="relative w-full h-full">
      {hoveredCandle && (
        <div className="absolute top-2 left-4 z-10 flex items-center space-x-4 text-xs font-mono bg-[#0f1629]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 shadow-xl">
          <div className="flex items-center space-x-1"><span className="text-[var(--text-muted)]">O</span><span className="text-white font-bold">{hoveredCandle.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span></div>
          <div className="flex items-center space-x-1"><span className="text-[var(--text-muted)]">H</span><span className="text-white font-bold">{hoveredCandle.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span></div>
          <div className="flex items-center space-x-1"><span className="text-[var(--text-muted)]">L</span><span className="text-white font-bold">{hoveredCandle.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span></div>
          <div className="flex items-center space-x-1"><span className="text-[var(--text-muted)]">C</span><span className="text-white font-bold">{hoveredCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span></div>
          <div className={hoveredCandle.close >= hoveredCandle.open ? 'text-[var(--green)] font-black' : 'text-[var(--red)] font-black'}>
            {hoveredCandle.close >= hoveredCandle.open ? '▲' : '▼'} {Math.abs((hoveredCandle.close - hoveredCandle.open) / hoveredCandle.open * 100).toFixed(2)}%
          </div>
        </div>
      )}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
