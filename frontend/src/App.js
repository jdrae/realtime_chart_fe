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

  return (
    <>
      {showOops && <OopsModal />}
      <NavBar />
      <div className="inner-container">
        <ChartCard symbol={selectedCoin} />
        <Sidebar selectedCoin={selectedCoin} setSelectedCoin={setSelectedCoin} />
      </div>
      <Footer />
    </>
  );
}

export default App;
