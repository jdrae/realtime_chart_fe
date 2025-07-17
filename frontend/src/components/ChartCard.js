import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- 상수 ---
const DATA_LENGTH = 12;
const PRICE_MIN = 100;
const PRICE_RANGE = 100;
const TICK_COUNT = 5;
const UPDATE_INTERVAL_MS = 60 * 1000;

// --- 유틸 함수 ---
const pad2 = n => n.toString().padStart(2, '0');

const getTimeLabel = date => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const generateRandomPrice = () => Math.floor(Math.random() * PRICE_RANGE) + PRICE_MIN;

const generateInitialData = endTime => {
  return Array.from({ length: DATA_LENGTH }, (_, i) => {
    const d = new Date(endTime.getTime() - (DATA_LENGTH - 1 - i) * UPDATE_INTERVAL_MS);
    return {
      time: getTimeLabel(d),
      closePrice: generateRandomPrice(),
    };
  });
};

const generateNextDataPoint = lastTimeLabel => {
  const [hour, minute] = lastTimeLabel.split(":").map(Number);
  const nextDate = new Date();
  nextDate.setHours(hour, minute, 0, 0);
  nextDate.setTime(nextDate.getTime() + UPDATE_INTERVAL_MS);
  return {
    time: getTimeLabel(nextDate),
    closePrice: generateRandomPrice(),
  };
};

// --- 메인 컴포넌트 ---
const ChartCard = () => {
  const [data, setData] = useState(() => generateInitialData(new Date()));
  const intervalRef = useRef();
  const timeoutRef = useRef();

  // 데이터 업데이트 함수 (불변성 보장)
  const appendNextData = useCallback(() => {
    setData(prevData => {
      const nextData = generateNextDataPoint(prevData[prevData.length - 1].time);
      return [...prevData.slice(1), nextData];
    });
  }, []);

  // 분의 0초에 맞춰 타이머 세팅
  useEffect(() => {
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    timeoutRef.current = setTimeout(() => {
      appendNextData();
      intervalRef.current = setInterval(appendNextData, UPDATE_INTERVAL_MS);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [appendNextData]);

  // y축 계산 (useMemo로 최적화)
  const { minY, maxY, yTicks } = useMemo(() => {
    const allY = data.map(d => d.closePrice);
    const min = Math.floor((Math.min(...allY) - 5) / 5) * 5;
    const max = Math.ceil((Math.max(...allY) + 5) / 5) * 5;
    const ticks = Array.from({ length: TICK_COUNT }, (_, i) =>
      Math.round(min + ((max - min) * i) / (TICK_COUNT - 1))
    );
    return { minY: min, maxY: max, yTicks: ticks };
  }, [data]);

  return (
    <div className="chart-card default-card">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="time"
            ticks={data.map(d => d.time)}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            ticks={yTicks}
            domain={[minY, maxY]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="closePrice"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            opacity={0.9}
            name="close price"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard; 