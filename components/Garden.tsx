
import React, { useState, useEffect, useRef } from 'react';
import { Entity, EntityType, WeatherType, GardenZone } from '../types';
import { GARDEN_SPECIES, GARDEN_ITEMS } from '../constants';
import { Button } from './ui/Button';
import { generateName, generateAnimalFact } from '../services/geminiService';
import { soundService } from '../services/soundService';

interface GardenProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  onGoBack: () => void;
  onShowMessage: (msg: string) => void;
}

const MAX_PLANT_COUNT = 24;

const ZONES = [
  { id: GardenZone.VEGETABLES, name: 'Vườn Rau', emoji: '🥕', theme: 'soil' },
  { id: GardenZone.ORCHARD, name: 'Vườn Quả', emoji: '🍎', theme: 'grass' },
  { id: GardenZone.FLOWERS, name: 'Vườn Hoa', emoji: '🌷', theme: 'garden' },
];

export const Garden: React.FC<GardenProps> = ({ entities, setEntities, coins, setCoins, onGoBack, onShowMessage }) => {
  const [currentZone, setCurrentZone] = useState<GardenZone>(GardenZone.VEGETABLES);
  const [shopOpen, setShopOpen] = useState(false);
  const [careMenuOpen, setCareMenuOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [harvestEffects, setHarvestEffects] = useState<{id: number, x: number, y: number, emoji: string, amount: number}[]>([]);
  const [weather, setWeather] = useState<WeatherType>(WeatherType.CLEAR);

  const speedRef = useRef(1);
  const weatherRef = useRef(WeatherType.CLEAR);

  useEffect(() => { speedRef.current = gameSpeed; }, [gameSpeed]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { return () => { soundService.stopBGM(); }; }, []);

  const zoneEntities = entities.filter(e => e.type === EntityType.PLANT && (e.habitat === currentZone || (!e.habitat && currentZone === GardenZone.VEGETABLES)));
  const currentCount = zoneEntities.length;
  const isFull = currentCount >= MAX_PLANT_COUNT;

  const toggleWeather = () => {
    const types = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.STORM];
    const next = types[(types.indexOf(weather) + 1) % types.length];
    setWeather(next);
    onShowMessage(`Thời tiết: ${next === WeatherType.CLEAR ? 'Nắng' : next === WeatherType.RAIN ? 'Mưa' : 'Bão'}`);
  };

  const spawnHarvestEffect = (x: number, y: number, emoji: string, amount: number) => {
      const id = Date.now() + Math.random();
      setHarvestEffects(prev => [...prev, { id, x, y, emoji, amount }]);
      setTimeout(() => setHarvestEffects(prev => prev.filter(e => e.id !== id)), 1500);
  };

  const handleHarvest = (e: React.MouseEvent, plant: Entity) => {
      e.stopPropagation();
      const speciesData = GARDEN_SPECIES.find(s => s.name === plant.species);
      
      if (plant.growthStage === 3 && speciesData) {
          const producePrice = speciesData.producePrice || 10;
          setCoins(c => c + producePrice);
          soundService.playSFX('buy');
          spawnHarvestEffect(plant.x, plant.y, speciesData.stages[2], producePrice);
          onShowMessage(`Thu hoạch ${plant.species}! (+${producePrice} xu)`);

          if (speciesData.isPerennial) {
              // Reset trees to mature stage but not harvestable yet
              setEntities(prev => prev.map(en => en.id === plant.id ? { ...en, growthStage: 1, reproductionProgress: 30 } : en));
          } else {
              // Remove crops
              setEntities(prev => prev.filter(en => en.id !== plant.id));
              if (selectedEntity?.id === plant.id) setSelectedEntity(null);
          }
      }
  };

  // --- GAME LOOP ---
  useEffect(() => {
    const tick = setInterval(() => {
      const currentSpeed = speedRef.current;
      const currentWeather = weatherRef.current;
      
      setEntities(prev => {
        return prev.map(entity => {
           if (entity.type !== EntityType.PLANT) return entity;
           
           // Growth Logic
           let newGrowth = entity.reproductionProgress || 0; // Using reproductionProgress as detailed growth meter
           let currentStage = entity.growthStage || 0;
           
           // Plants grow if hydrated (hunger > 0)
           if (entity.hunger > 0 && currentStage < 3) {
               // Rain helps grow faster
               const weatherMod = currentWeather === WeatherType.RAIN ? 1.5 : currentWeather === WeatherType.STORM ? 0.8 : 1.0;
               const rate = 0.2 * currentSpeed * weatherMod;
               newGrowth += rate;
               
               // Consume water/nutrition
               const consumption = 0.05 * currentSpeed;
               entity.hunger = Math.max(0, entity.hunger - consumption);

               if (newGrowth >= 100) {
                   if (currentStage < 3) {
                       currentStage += 1;
                       // If not yet fully grown (stage 3), reset progress for next stage
                       if (currentStage < 3) newGrowth = 0;
                       else newGrowth = 100; // Cap at max
                   }
               }
           }

           return { ...entity, reproductionProgress: newGrowth, growthStage: currentStage };
        });
      });
    }, 200);
    return () => clearInterval(tick);
  }, []);

  const handlePlantClick = (e: React.MouseEvent, plant: Entity) => {
      e.stopPropagation();
      if (plant.growthStage === 3) {
          handleHarvest(e, plant);
      } else {
          setSelectedEntity(plant);
      }
  };

  const handleBuy = async (s: typeof GARDEN_SPECIES[0]) => {
      if (coins < s.price) return onShowMessage("Thiếu tiền!");
      setCoins(c => c - s.price);
      // Random position with grid-like snapping for gardens
      const gridSize = 15;
      const cols = 5;
      const index = currentCount;
      const row = Math.floor(index / cols);
      const col = index % cols;
      // Center slightly
      const x = 20 + col * gridSize + (Math.random() * 5);
      const y = 35 + row * gridSize + (Math.random() * 5);

      const name = await generateName(s.name);
      setEntities(prev => [...prev, { 
          id: Date.now().toString(), name, emoji: s.stages[0], type: EntityType.PLANT, 
          hunger: 50, happiness: 100, x, y, species: s.name, habitat: currentZone, 
          growthStage: 0, reproductionProgress: 0, rotation: 0
      }]);
      setShopOpen(false);
  };

  const handleCare = (item: typeof GARDEN_ITEMS[0]) => {
      if (coins < item.price) { onShowMessage("Thiếu tiền!"); return; }
      soundService.playSFX('feed');
      setCoins(c => c - item.price);
      setEntities(prev => prev.map(e => e.type === EntityType.PLANT && e.habitat === currentZone ? {
          ...e, 
          hunger: Math.min(100, e.hunger + item.hunger), 
          reproductionProgress: Math.min(100, (e.reproductionProgress||0) + (item.happiness || 0))
      } : e));
      setCareMenuOpen(false);
      onShowMessage(`Đã dùng ${item.name}!`);
  };

  const getZoneTheme = () => {
      switch(currentZone) {
          case GardenZone.ORCHARD: return { sky: 'from-blue-200 to-green-100', ground: '#558b2f', decor: '🌳', texture: 'bg-[url("https://www.transparenttextures.com/patterns/grass.png")]' };
          case GardenZone.FLOWERS: return { sky: 'from-pink-100 to-purple-100', ground: '#795548', decor: '🐝', texture: 'bg-[url("https://www.transparenttextures.com/patterns/flowers.png")]' };
          default: return { sky: 'from-cyan-100 to-blue-50', ground: '#5D4037', decor: '🥕', texture: 'bg-[url("https://www.transparenttextures.com/patterns/soil.png")]' };
      }
  };
  const theme = getZoneTheme();

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-sans" onClick={() => selectedEntity && setSelectedEntity(null)}>
      {/* 1. SKY */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.sky} transition-colors duration-1000`}></div>
      <div className="absolute top-10 left-10 text-yellow-300 text-[6rem] animate-[float-bob_15s_infinite]">🌤️</div>
      {weather === WeatherType.RAIN && <div className="weather-rain absolute inset-0 opacity-50 pointer-events-none"></div>}

      {/* 2. GROUND */}
      <div className="absolute bottom-0 left-0 right-0 h-[75%] transition-colors duration-1000 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]" style={{ backgroundColor: theme.ground }}>
          <div className={`absolute inset-0 opacity-20 mix-blend-overlay ${theme.texture}`}></div>
          <div className="absolute -top-12 left-0 w-full h-12 bg-gradient-to-t from-black/10 to-transparent"></div>
      </div>

      {/* 3. PLANTS */}
      {zoneEntities.map((plant) => {
          const s = GARDEN_SPECIES.find(sp => sp.name === plant.species);
          const currentEmoji = s?.stages[plant.growthStage || 0] || '🌱';
          const isHarvestable = plant.growthStage === 3;
          
          return (
             <div key={plant.id} onClick={(e) => handlePlantClick(e, plant)}
                className={`absolute flex flex-col items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-110 ${isHarvestable ? 'animate-bounce' : ''}`}
                style={{ left: `${plant.x}%`, top: `${plant.y}%`, zIndex: Math.floor(plant.y) }}
             >
                 {plant.hunger < 30 && <div className="absolute -top-10 text-xl animate-pulse">💧</div>}
                 <div className={`text-6xl drop-shadow-lg ${isHarvestable ? 'filter brightness-125' : ''}`}>{currentEmoji}</div>
                 {/* Shadow */}
                 <div className="w-12 h-3 bg-black/30 rounded-full blur-sm mt-[-5px]"></div>
             </div>
          );
      })}

      {/* 4. VISUAL EFFECTS */}
      {harvestEffects.map(e => (
          <div key={e.id} className="absolute pointer-events-none z-50 flex flex-col items-center animate-[rise_1.5s_ease-out]" style={{ left: `${e.x}%`, top: `${e.y - 15}%` }}>
              <div className="text-5xl drop-shadow-lg">{e.emoji}</div>
              <div className="text-yellow-400 font-black text-2xl drop-shadow-md">+{e.amount}</div>
          </div>
      ))}

      {/* 5. HUD */}
      <div className="absolute top-6 left-6 right-6 flex justify-between z-30 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3">
             <Button variant="wood" onClick={onGoBack} className="bg-emerald-600 border-emerald-800 text-white">🏡 Về Nhà</Button>
             <div className="bg-white/80 p-3 rounded-2xl border-4 border-emerald-600 shadow flex items-center gap-4">
                 <input type="range" min="0.5" max="3" step="0.5" value={gameSpeed} onChange={e=>setGameSpeed(parseFloat(e.target.value))} className="w-24 accent-emerald-600 h-2 bg-emerald-200 rounded-lg" />
                 <button onClick={toggleWeather} className="text-2xl hover:scale-110">{weather === WeatherType.CLEAR ? '☀️' : '🌧️'}</button>
             </div>
             <div className="flex flex-col gap-1 mt-2">
                 {ZONES.map(z => (
                     <button key={z.id} onClick={() => setCurrentZone(z.id)} className={`flex items-center gap-3 px-4 py-2 rounded-r-xl border-l-8 shadow-md transition-all font-bold ${currentZone === z.id ? 'bg-white border-emerald-600 text-emerald-800 translate-x-3 text-lg' : 'bg-white/80 border-transparent text-gray-500 hover:bg-white hover:translate-x-1'}`}>
                         <span className="text-2xl">{z.emoji}</span><span>{z.name}</span>
                     </button>
                 ))}
             </div>
          </div>
          <div className="pointer-events-auto flex gap-3">
             <div className="bg-emerald-100 text-emerald-900 px-6 py-2 rounded-2xl border-4 border-emerald-600 shadow-xl font-black text-lg flex items-center gap-2">🌱 {currentCount}/{MAX_PLANT_COUNT}</div>
             <div className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-2xl border-4 border-yellow-600 shadow-xl font-black text-lg flex items-center gap-2">💰 {coins}</div>
          </div>
      </div>

      {/* 6. DOCK */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-emerald-800 px-6 py-3 rounded-2xl border-b-8 border-emerald-950 shadow-2xl flex items-end gap-3 z-30">
          <Button variant="wood" onClick={()=>setCareMenuOpen(true)} className="bg-emerald-600 border-emerald-800 text-white">💦 Chăm Sóc</Button>
          <Button variant="wood" onClick={()=>setShopOpen(true)} className="bg-emerald-600 border-emerald-800 text-white">🛒 Mua Hạt</Button>
          <Button variant="wood" onClick={()=>setPriceListOpen(true)} className="bg-emerald-600 border-emerald-800 text-white">📜 Sổ Tay</Button>
      </div>

      {/* 7. INSPECTOR */}
      {selectedEntity && (
          <div className="absolute top-28 right-8 bg-white w-72 p-6 rounded-3xl shadow-2xl border-4 border-emerald-600 z-40 animate-slide-up" onClick={e=>e.stopPropagation()}>
              <h3 className="font-black text-2xl text-emerald-800 mb-2 text-center uppercase">{selectedEntity.name}</h3>
              <p className="text-center text-sm text-gray-500 italic mb-4">{selectedEntity.species}</p>
              
              <div className="space-y-3 mb-6 font-bold text-gray-700">
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span>NƯỚC/DINH DƯỠNG</span><span>{Math.round(selectedEntity.hunger)}%</span></div>
                      <div className="w-full bg-gray-200 h-3 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width:`${selectedEntity.hunger}%`}}></div></div>
                  </div>
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span>PHÁT TRIỂN</span><span>{Math.round(selectedEntity.reproductionProgress || 0)}%</span></div>
                      <div className="w-full bg-gray-200 h-3 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width:`${selectedEntity.reproductionProgress || 0}%`}}></div></div>
                  </div>
                  <div className="text-center mt-2 text-xs bg-emerald-100 py-1 rounded text-emerald-800">
                      Giai đoạn: {selectedEntity.growthStage === 0 ? 'Hạt giống 🌱' : selectedEntity.growthStage === 1 ? 'Nảy mầm 🌿' : selectedEntity.growthStage === 2 ? 'Trưởng thành 🌳' : 'Thu hoạch 🍎'}
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <Button variant="wood" className="w-full text-xs py-2 bg-blue-500 text-white" onClick={()=>generateAnimalFact(selectedEntity).then(onShowMessage)}>❓ Mẹo</Button>
                  <Button variant="danger" className="w-full text-xs py-2" onClick={()=>{ setEntities(p=>p.filter(e=>e.id!==selectedEntity.id)); setSelectedEntity(null); }}>🗑️ Phá Bỏ</Button>
              </div>
          </div>
      )}

      {/* MODALS */}
      {shopOpen && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={()=>setShopOpen(false)}>
             <div className="bg-emerald-50 border-[8px] border-emerald-800 rounded-3xl p-6 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
                 <h2 className="text-3xl font-black text-emerald-900 mb-6 text-center uppercase">Tiệm Hạt Giống</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto p-2 custom-scrollbar">
                     {GARDEN_SPECIES.filter(s=>s.habitat===currentZone).map(s => (
                         <div key={s.name} onClick={()=>handleBuy(s)} className={`bg-white p-4 rounded-xl border-b-4 border-emerald-200 hover:border-emerald-500 cursor-pointer shadow-sm hover:-translate-y-1 transition-all ${coins<s.price?'opacity-50':''}`}>
                             <div className="text-5xl text-center mb-2">{s.stages[2]}</div>
                             <div className="font-bold text-center text-gray-800">{s.name}</div>
                             <div className="text-center text-xs text-gray-500 mb-2">{s.isPerennial ? 'Lâu năm' : 'Ngắn ngày'}</div>
                             <div className="bg-yellow-400 text-center rounded-full font-bold text-yellow-900 py-1">{s.price} 💰</div>
                         </div>
                     ))}
                 </div>
             </div>
          </div>
      )}

      {careMenuOpen && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={()=>setCareMenuOpen(false)}>
              <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-pop-in" onClick={e=>e.stopPropagation()}>
                  <h2 className="text-2xl font-black text-center mb-4">Chăm Sóc Cây</h2>
                  <div className="grid grid-cols-2 gap-4">
                      {GARDEN_ITEMS.map(item => (
                          <div key={item.id} onClick={()=>handleCare(item)} className="border-2 border-gray-100 hover:border-blue-400 rounded-xl p-4 cursor-pointer text-center group">
                              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{item.emoji}</div>
                              <div className="font-bold">{item.name}</div>
                              <div className="text-xs text-gray-500 mb-2">{item.description}</div>
                              <div className="font-bold text-yellow-600">{item.price} 💰</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {priceListOpen && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={()=>setPriceListOpen(false)}>
              <div className="bg-white rounded-3xl p-8 w-full max-w-4xl h-[80vh] overflow-y-auto custom-scrollbar" onClick={e=>e.stopPropagation()}>
                  <h2 className="text-3xl font-black text-center mb-6 text-emerald-800">Bách Khoa Thực Vật</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {GARDEN_SPECIES.map(s => (
                          <div key={s.name} className="flex gap-4 border p-4 rounded-xl hover:bg-emerald-50">
                              <div className="text-5xl">{s.stages[2]}</div>
                              <div>
                                  <h3 className="font-bold text-xl">{s.name}</h3>
                                  <p className="text-sm text-gray-600 italic">"{s.description}"</p>
                                  <div className="mt-2 flex gap-2 text-xs font-bold">
                                      <span className="bg-gray-200 px-2 py-1 rounded">Giá: {s.price}</span>
                                      <span className="bg-yellow-200 px-2 py-1 rounded">Thu: {s.producePrice}</span>
                                      <span className="bg-blue-100 px-2 py-1 rounded">{s.isPerennial ? 'Thu hoạch nhiều lần' : 'Thu hoạch 1 lần'}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
