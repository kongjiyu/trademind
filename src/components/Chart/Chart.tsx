'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type CandlestickData,
  type Time,
} from 'lightweight-charts';
import { useChartStore } from '@/lib/store';
import { detectSMCLevels, type SMCDetectionResult } from '@/lib/smc/detector';

interface ChartSeriesRefs {
  candlestick: ISeriesApi<'Candlestick'> | null;
  swingHigh: ISeriesApi<'Line'> | null;
  swingLow: ISeriesApi<'Line'> | null;
  obLines: ISeriesApi<'Line'>[];
}

const COLORS = {
  swingHigh: '#f59e0b',
  swingLow: '#8b5cf6',
  bullishOB: '#22c55e',
  bearishOB: '#ef4444',
  bullishFVG: '#3b82f6',
  bearishFVG: '#ef4444',
  bosBullish: '#22c55e',
  bosBearish: '#ef4444',
  aiEntry: '#a855f7',
  aiTP: '#22c55e',
  aiSL: '#ef4444',
  userEntry: '#06b6d4',
};

interface SMCLevelMarkers {
  obBullish: { time: number; low: number; high: number }[];
  obBearish: { time: number; low: number; high: number }[];
  fvgBullish: { time: number; low: number; high: number }[];
  fvgBearish: { time: number; low: number; high: number }[];
  swingHighs: { time: number; price: number }[];
  swingLows: { time: number; price: number }[];
}

export default function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ChartSeriesRefs>({
    candlestick: null,
    swingHigh: null,
    swingLow: null,
    obLines: [],
  });
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const lastDetectedRef = useRef<string>('');
  const levelMarkersRef = useRef<SMCLevelMarkers>({
    obBullish: [],
    obBearish: [],
    fvgBullish: [],
    fvgBearish: [],
    swingHighs: [],
    swingLows: [],
  });

  const {
    ohlcvData,
    isLoading,
    setOHLCVData,
    setLoading,
    setSMCLevels,
    setSignals,
    userEntry,
    userTP,
    userSL,
    aiSuggestion,
  } = useChartStore();

  // Clear all price lines
  const clearPriceLines = useCallback(() => {
    priceLinesRef.current.forEach(line => {
      try {
        seriesRefs.current.candlestick?.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#2d2d2d' },
        horzLines: { color: '#2d2d2d' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
    });

    // Candlestick series
    const candlestick = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Swing high/low series (lines at each level)
    const swingHigh = chart.addSeries(LineSeries, {
      color: COLORS.swingHigh,
      lineStyle: 2,
      lineWidth: 1,
    });

    const swingLow = chart.addSeries(LineSeries, {
      color: COLORS.swingLow,
      lineStyle: 2,
      lineWidth: 1,
    });

    chartRef.current = chart;
    seriesRefs.current = {
      candlestick,
      swingHigh,
      swingLow,
      obLines: [],
    };

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { pair, timeframe } = useChartStore.getState();
        const symbol = pair.split('/')[0];
        const response = await fetch(`/api/coingecko/ohlc?symbol=${symbol}&timeframe=${timeframe}`);
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        setOHLCVData(result.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setOHLCVData, setLoading]);

  // Update chart data
  useEffect(() => {
    if (!seriesRefs.current.candlestick || ohlcvData.length === 0) return;

    const chartData: CandlestickData<Time>[] = ohlcvData.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    seriesRefs.current.candlestick.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [ohlcvData]);

  // Run SMC detection and update overlays
  useEffect(() => {
    if (ohlcvData.length < 20) return;

    const detection = detectSMCLevels(ohlcvData);
    const detectionKey = JSON.stringify(detection);

    // Skip if detection results haven't changed
    if (detectionKey === lastDetectedRef.current) return;
    lastDetectedRef.current = detectionKey;

    // Store level markers for rendering
    levelMarkersRef.current = {
      obBullish: detection.orderBlocks.bullish.map(ob => ({
        time: ob.time,
        low: ob.low,
        high: ob.high,
      })),
      obBearish: detection.orderBlocks.bearish.map(ob => ({
        time: ob.time,
        low: ob.low,
        high: ob.high,
      })),
      fvgBullish: detection.fvgs.filter(f => f.type === 'bullish').map(f => ({
        time: f.time,
        low: f.low,
        high: f.high,
      })),
      fvgBearish: detection.fvgs.filter(f => f.type === 'bearish').map(f => ({
        time: f.time,
        low: f.low,
        high: f.high,
      })),
      swingHighs: detection.swingPoints.filter(sp => sp.type === 'high').map(sp => ({
        time: sp.time,
        price: sp.price,
      })),
      swingLows: detection.swingPoints.filter(sp => sp.type === 'low').map(sp => ({
        time: sp.time,
        price: sp.price,
      })),
    };

    // Update store
    const orderBlocks = [
      ...detection.orderBlocks.bullish.map((ob, i) => ({
        id: `bullish-ob-${i}`,
        type: 'bullish' as const,
        startTime: ob.time,
        endTime: ob.time + 3600,
        high: ob.high,
        low: ob.low,
        strength: 1,
      })),
      ...detection.orderBlocks.bearish.map((ob, i) => ({
        id: `bearish-ob-${i}`,
        type: 'bearish' as const,
        startTime: ob.time,
        endTime: ob.time + 3600,
        high: ob.high,
        low: ob.low,
        strength: 1,
      })),
    ];

    const fvgs = detection.fvgs.map((fvg, i) => ({
      id: `fvg-${i}`,
      type: fvg.type as 'bullish' | 'bearish',
      startTime: fvg.time,
      endTime: fvg.time + 1800,
      high: fvg.high,
      low: fvg.low,
    }));

    const liquidityZones = detection.swingPoints.map((sp, i) => ({
      id: `swing-${i}`,
      type: sp.type === 'high' ? 'swing_high' as const : 'swing_low' as const,
      time: sp.time,
      price: sp.price,
      volume: sp.strength,
    }));

    setSMCLevels(
      orderBlocks.filter(ob => ob.type === 'bullish'),
      fvgs.filter(f => f.type === 'bullish'),
      liquidityZones
    );

    setSignals(detection.bosSignals.map((sig, i) => ({
      id: `bos-${i}`,
      type: sig.type,
      direction: sig.direction,
      time: sig.time,
      price: sig.price,
      description: `${sig.direction.toUpperCase()} ${sig.type} at $${sig.price.toFixed(2)}`,
    })));

    // Draw overlays
    drawSMCOverlays();
  }, [ohlcvData, setSMCLevels, setSignals]);

  // Draw all SMC overlays
  const drawSMCOverlays = useCallback(() => {
    const { candlestick, swingHigh, swingLow } = seriesRefs.current;
    if (!candlestick) return;

    // Clear previous data on line series (not used for price levels)
    if (swingHigh) swingHigh.setData([]);
    if (swingLow) swingLow.setData([]);

    // Clear old price lines
    clearPriceLines();

    const markers = levelMarkersRef.current;

    // Draw swing highs as price lines
    markers.swingHighs.forEach((sp, i) => {
      const line = candlestick.createPriceLine({
        price: sp.price,
        color: COLORS.swingHigh,
        lineStyle: 2,
        lineWidth: 1,
        axisLabelVisible: true,
        title: i === 0 ? 'Swing High' : '',
      });
      priceLinesRef.current.push(line);
    });

    // Draw swing lows
    markers.swingLows.forEach((sp, i) => {
      const line = candlestick.createPriceLine({
        price: sp.price,
        color: COLORS.swingLow,
        lineStyle: 2,
        lineWidth: 1,
        axisLabelVisible: true,
        title: i === 0 ? 'Swing Low' : '',
      });
      priceLinesRef.current.push(line);
    });

    // Draw Order Blocks as price lines
    markers.obBullish.forEach((ob, i) => {
      const line = candlestick.createPriceLine({
        price: ob.low,
        color: COLORS.bullishOB,
        lineStyle: 0,
        lineWidth: 1,
        axisLabelVisible: true,
        title: i === 0 ? 'Bull OB' : '',
      });
      priceLinesRef.current.push(line);
    });

    markers.obBearish.forEach((ob, i) => {
      const line = candlestick.createPriceLine({
        price: ob.high,
        color: COLORS.bearishOB,
        lineStyle: 0,
        lineWidth: 1,
        axisLabelVisible: true,
        title: i === 0 ? 'Bear OB' : '',
      });
      priceLinesRef.current.push(line);
    });

    // Draw FVGs
    markers.fvgBullish.forEach((fvg, i) => {
      const line = candlestick.createPriceLine({
        price: fvg.low,
        color: COLORS.bullishFVG,
        lineStyle: 1,
        lineWidth: 1,
        axisLabelVisible: true,
        title: i === 0 ? 'Bull FVG' : '',
      });
      priceLinesRef.current.push(line);
    });

    markers.fvgBearish.forEach((fvg, i) => {
      const line = candlestick.createPriceLine({
        price: fvg.high,
        color: COLORS.bearishFVG,
        lineStyle: 1,
        lineWidth: 1,
        axisLabelVisible: true,
        title: i === 0 ? 'Bear FVG' : '',
      });
      priceLinesRef.current.push(line);
    });
  }, [clearPriceLines]);

  // Draw user levels (entry/TP/SL)
  useEffect(() => {
    if (!seriesRefs.current.candlestick) return;

    const candle = seriesRefs.current.candlestick;

    // Remove old user level price lines
    priceLinesRef.current.forEach(line => {
      try {
        candle.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    const addUserLine = (price: number | null, color: string, title: string) => {
      if (price === null) return;
      const line = candle.createPriceLine({
        price,
        color,
        lineStyle: 0,
        lineWidth: 2,
        axisLabelVisible: true,
        title,
      });
      priceLinesRef.current.push(line);
    };

    addUserLine(userSL, COLORS.userEntry, 'SL');
    addUserLine(userTP, COLORS.userEntry, 'TP');
    addUserLine(userEntry, COLORS.userEntry, 'Entry');
  }, [userEntry, userTP, userSL]);

  // Draw AI suggested levels
  useEffect(() => {
    if (!aiSuggestion || !seriesRefs.current.candlestick) return;

    const candle = seriesRefs.current.candlestick;

    const addAIGuides = (price: number | null, color: string, title: string) => {
      if (!price) return;
      const line = candle.createPriceLine({
        price,
        color,
        lineStyle: 3,
        lineWidth: 1,
        axisLabelVisible: true,
        title: `AI ${title}`,
      });
      priceLinesRef.current.push(line);
    };

    addAIGuides(aiSuggestion.entry, COLORS.aiEntry, 'Entry');
    addAIGuides(aiSuggestion.takeProfit, COLORS.aiTP, 'TP');
    addAIGuides(aiSuggestion.stopLoss, COLORS.aiSL, 'SL');
  }, [aiSuggestion]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading chart data...</span>
          </div>
        </div>
      )}

      <div ref={chartContainerRef} className="w-full h-full" />

      {/* SMC Legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-3 text-xs bg-black/70 px-2 py-1 rounded">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-amber-500" /> Swing High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-purple-500" /> Swing Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500" /> Bull OB
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500" /> Bear OB
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 border-t border-dashed" /> FVG
        </span>
      </div>
    </div>
  );
}