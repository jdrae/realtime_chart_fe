import React, { useEffect, useState } from 'react';
import btcImg from '../assets/btc.png';
import ethImg from '../assets/eth.png';
import xrpImg from '../assets/xrp.png';
import { io } from 'socket.io-client';

const PriceCard = ({ price, coinImg, coinName }) => (
  <div className="price-card sidebar-card default-card">
    <div className="price-card-top">
      <div>
        <img src={coinImg} style={{ width: 16, height: 16 }} />
        <span className="small-text">{coinName}</span>
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

const SmallBox = ({ label, className, onClick }) => (
  <a href="#" className={`small-box default-card ${className}`} onClick={onClick}>
    <span className="medium-text">{label}</span>
  </a>
);

const Sidebar = () => {
  const [price, setPrice] = useState('');
  const [latency, setLatency] = useState('');
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [coinImg, setCoinImg] = useState(btcImg);

  useEffect(() => {
    const topic = `${selectedCoin}USDT`;
    const socket = io('http://localhost:5555');

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit("subscribe", { topic });
    });
    
    socket.on("message", (data) => {
      const price = Number(data['data']['k']['c']).toFixed(2);
      const latency = Date.now() - data["received_at"];
      setPrice(price);
      setLatency(latency);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [selectedCoin]);

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin);
    if (coin === 'BTC') setCoinImg(btcImg);
    else if (coin === 'ETH') setCoinImg(ethImg);
    else if (coin === 'XRP') setCoinImg(xrpImg);
  };

  const coinName = `${selectedCoin}USDT`;

  return (
    <aside className="sidebar">
      <PriceCard price={price} coinImg={coinImg} coinName={coinName} />
      <LatencyCard latency={latency} />
      <div className="small-box-container">
        <SmallBox
          label="BTC"
          className={selectedCoin === 'BTC' ? 'btc-box' : ''}
          onClick={() => handleCoinClick('BTC')}
        />
        <SmallBox
          label="ETH"
          className={selectedCoin === 'ETH' ? 'eth-box' : ''}
          onClick={() => handleCoinClick('ETH')}
        />
        <SmallBox
          label="XRP"
          className={selectedCoin === 'XRP' ? 'xrp-box' : ''}
          onClick={() => handleCoinClick('XRP')}
        />
      </div>
    </aside>
  );
};

export default Sidebar;