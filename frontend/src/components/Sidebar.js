import React, { useEffect, useState } from 'react';
import bitcoin from '../assets/bitcoin.png';
import { io } from 'socket.io-client';

const PriceCard = ({ price }) => (
  <div className="price-card sidebar-card default-card">
    <div className="price-card-top">
      <div>
        <img src={bitcoin} alt="Bitcoin" style={{ width: 16, height: 16 }} />
        <span className="small-text">BTCUSDT</span>
      </div>
    </div>
    <span className="big-text price-value">{price}</span>
  </div>
);

const LatencyCard = ({ latency }) => (
  <div className="latency-card sidebar-card default-card">
    <span className="small-text" style={{ marginBottom: 8 }}>Latency</span>
    <span className="big-text latency-value">{latency}ms</span>
  </div>
);

const SmallBox = ({ label, className }) => (
  <a href="#" className={`small-box default-card ${className || ''}`.trim()}>
    <span className="medium-text">{label}</span>
  </a>
);

const Sidebar = () => {
  const [price, setPrice] = useState('');
  const [latency, setLatency] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:5555');
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit("subscribe", { topic: "btc" });
    });
    socket.on("message", (data) => {
      const price = Number(data['data']['k']['c']).toFixed(2);
      const latency = Date.now() - data["received_at"];
      setPrice(price);
      setLatency(latency);
    });
    return () => {
      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });
      socket.disconnect();
    };
  }, []);

  return (
    <aside className="sidebar">
      <PriceCard price={price} />
      <LatencyCard latency={latency} />
      <div className="small-box-container">
        <SmallBox label="BTC" className="btc-box" />
        <SmallBox label="ETH" />
        <SmallBox label="XRP" />
      </div>
    </aside>
  );
};

export default Sidebar;