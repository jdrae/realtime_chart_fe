import React, { useEffect, useState } from 'react';
import NavBar from './components/NavBar';
import ChartCard from './components/ChartCard';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import OopsModal from './components/OopsModal';

function App() {
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [showOops, setShowOops] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const serverUrl = process.env.REACT_APP_SERVER;
      const socketUrl = process.env.REACT_APP_SOCKET_URL;

      const endpoints = [
        serverUrl ? `${serverUrl}/health` : null,
        socketUrl ? `${socketUrl}/health` : null,
      ].filter(Boolean);

      try {
        const results = await Promise.all(
          endpoints.map((url) =>
            fetch(url, { method: "GET" }).then((res) => res.ok)
          )
        );
        if (results.some((ok) => !ok)) {
          setShowOops(true);
        }
      } catch (e) {
        setShowOops(true);
      }
    };

    checkHealth();
  }, []);

  if (showOops) {
    return <OopsModal />;
  }
  return (
    <div className="outer-container">
      <NavBar />
      <div className="inner-container">
        <ChartCard symbol={selectedCoin} />
        <Sidebar selectedCoin={selectedCoin} setSelectedCoin={setSelectedCoin} />
      </div>
      <div className="site-explanation">
        <p>
          *Data is retrieved from the Binance WebSocket every second. The chart may differ from the official Binance chart because the data is aggregated into 1-minute intervals in this project.
        </p>
        <p>
          **Latency refers to the time difference between when the data is first received by the backend server and when it is subsequently received by the frontend.
        </p>
      </div>
      <Footer />
    </div>
  );
  
}

export default App;
