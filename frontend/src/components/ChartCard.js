import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar
} from 'recharts';
import { Y_TICK_COUNT, UPDATE_INTERVAL_MS, DATA_LENGTH, FETCH_WAIT_MS } from './ChartCard/constants';
import { getInitialNow } from './ChartCard/utils';
import { fetchInitialDataFromAPI, fetchNextDataPointFromAPI, updateLastVolume } from './ChartCard/api';

const ChartCard = ({ symbol }) => {
  const [data, setData] = useState([]);
  const intervalRef = useRef();
  const timeoutRef = useRef();
  const initialNowRef = useRef(getInitialNow());

  useEffect(() => {
    initialNowRef.current = getInitialNow();
  }, [symbol]);

  const appendNextData = useCallback(() => {
    const now = new Date();
    fetchNextDataPointFromAPI(symbol, now).then(nextData => {
      if (!nextData) return;
      setData(prevData => {
        if (prevData.length < DATA_LENGTH) {
          return [...prevData, nextData];
        } else {
          return [...prevData.slice(1), nextData];
        }
      });
    });
  }, [symbol]);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const now = initialNowRef.current;
        const initialData = await fetchInitialDataFromAPI(symbol, now);
        const nextData = await fetchNextDataPointFromAPI(symbol, now);
        if (isMounted) {
          if (initialData && nextData) {
            setData([...initialData, nextData]);
          } else if (initialData) {
            setData([...initialData])
          } else {
            setData([]);
          }
        }
      } catch (e) {
        if (isMounted) setData([]);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [symbol]);

  useEffect(() => {
    const now = initialNowRef.current;
    let msToNextMinute5 = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + FETCH_WAIT_MS;
    if (now.getSeconds() < 5) {
      msToNextMinute5 -= 60000;
    }
    if (msToNextMinute5 < 0) msToNextMinute5 += 60000;

    timeoutRef.current = setTimeout(async () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - 1);
      await updateLastVolume(symbol, now, setData);
      appendNextData();
      intervalRef.current = setInterval(async () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - 1);
        await updateLastVolume(symbol, now, setData);
        appendNextData();
      }, UPDATE_INTERVAL_MS);
    }, msToNextMinute5);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [appendNextData, symbol]);

  const { minY, maxY, yTicks } = useMemo(() => {
    const allY = data.map(d => d.openPrice);
    const min = Math.floor((Math.min(...allY) - 10) / 5) * 5;
    const max = Math.ceil((Math.max(...allY) + 10) / 5) * 5;
    const ticks = Array.from({ length: Y_TICK_COUNT }, (_, i) =>
      Math.round(min + ((max - min) * i) / (Y_TICK_COUNT - 1))
    );
    return { minY: min, maxY: max, yTicks: ticks };
  }, [data]);

  return (
    <div className="chart-card default-card">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <Bar
            dataKey="volume"
            fill="#b0c4de"
            barSize={20}
            yAxisId="volume"
            isAnimationActive={false}
            opacity={0.5}
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
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
            dataKey="openPrice"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            opacity={0.9}
            name="open price"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard; 