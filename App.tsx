
import React, { useState, useEffect } from 'react';
import { GameMode, Entity } from './types';
import { INITIAL_ENTITIES, INITIAL_COINS } from './constants';
import { Dashboard } from './components/Dashboard';
import { Aquarium } from './components/Aquarium';
import { Zoo } from './components/Zoo';
import { Farm } from './components/Farm';
import { Garden } from './components/Garden';
import { Restaurant } from './components/Restaurant';
import { generateRandomEvent } from './services/geminiService';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.DASHBOARD);
  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [coins, setCoins] = useState<number>(INITIAL_COINS);
  const [message, setMessage] = useState<string | null>(null);

  // Global "Event" ticker
  useEffect(() => {
    const eventInterval = setInterval(async () => {
      // 10% chance every minute to trigger an AI event
      if (Math.random() < 0.1) {
        const event = await generateRandomEvent();
        setCoins(prev => prev + event.coins);
        setMessage(`🎁 SỰ KIỆN: ${event.message} (+${event.coins} xu)`);
      }
    }, 60000); 

    return () => clearInterval(eventInterval);
  }, []);

  const handleShowMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const renderContent = () => {
    switch (mode) {
      case GameMode.AQUARIUM:
        return (
          <Aquarium 
            entities={entities} 
            setEntities={setEntities} 
            coins={coins} 
            setCoins={setCoins}
            onGoBack={() => setMode(GameMode.DASHBOARD)}
            onShowMessage={handleShowMessage}
          />
        );
      case GameMode.ZOO:
        return (
          <Zoo 
            entities={entities} 
            setEntities={setEntities} 
            coins={coins} 
            setCoins={setCoins}
            onGoBack={() => setMode(GameMode.DASHBOARD)}
            onShowMessage={handleShowMessage}
          />
        );
      case GameMode.FARM:
        return (
          <Farm
            entities={entities} 
            setEntities={setEntities} 
            coins={coins} 
            setCoins={setCoins}
            onGoBack={() => setMode(GameMode.DASHBOARD)}
            onShowMessage={handleShowMessage}
          />
        );
      case GameMode.GARDEN:
        return (
          <Garden
            entities={entities} 
            setEntities={setEntities} 
            coins={coins} 
            setCoins={setCoins}
            onGoBack={() => setMode(GameMode.DASHBOARD)}
            onShowMessage={handleShowMessage}
          />
        );
      case GameMode.RESTAURANT:
        return (
          <Restaurant
            entities={entities} 
            setEntities={setEntities} 
            coins={coins} 
            setCoins={setCoins}
            onGoBack={() => setMode(GameMode.DASHBOARD)}
            onShowMessage={handleShowMessage}
          />
        );
      case GameMode.DASHBOARD:
      default:
        return <Dashboard onSelectMode={setMode} coins={coins} />;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50 text-gray-800">
      {renderContent()}

      {/* Global Toast Message */}
      {message && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-bounce transition-all">
          {message}
        </div>
      )}
      
      {/* AI Event Trigger for testing (Hidden in corner, optional) */}
      <div className="fixed bottom-2 right-2 opacity-30 hover:opacity-100 z-50">
        <Button 
            className="text-xs py-1 px-2" 
            variant="secondary"
            onClick={async () => {
                handleShowMessage("Đang triệu hồi sự kiện...");
                const event = await generateRandomEvent();
                setCoins(prev => prev + event.coins);
                handleShowMessage(`🎁 ${event.message} (+${event.coins} xu)`);
            }}
        >
            🎲 Sự kiện ngẫu nhiên (AI)
        </Button>
      </div>
    </div>
  );
};

export default App;
