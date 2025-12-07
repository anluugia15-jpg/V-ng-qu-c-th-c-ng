
import React, { useState, useEffect, useRef } from 'react';
import { Entity, EntityType, WeatherType, FarmZone } from '../types';
import { FARM_SPECIES, FARM_FOODS } from '../constants';
import { Button } from './ui/Button';
import { generateAnimalFact, generateName } from '../services/geminiService';
import { soundService } from '../services/soundService';

interface FarmProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  onGoBack: () => void;
  onShowMessage: (msg: string) => void;
}

const MAX_FARM_COUNT = 30;

const ZONES = [
  { id: FarmZone.BARN, name: 'Chuồng Trại', emoji: '🏚️', theme: 'wood' },
  { id: FarmZone.FIELD, name: 'Cánh Đồng', emoji: '🌻', theme: 'field' },
  { id: FarmZone.POND, name: 'Ao Hồ', emoji: '🪷', theme: 'water' },
];

export const Farm: React.FC<FarmProps> = ({ entities, setEntities, coins, setCoins, onGoBack, onShowMessage }) => {
  const [currentZone, setCurrentZone] = useState<FarmZone>(FarmZone.BARN);
  const [shopOpen, setShopOpen] = useState(false);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [sellMode, setSellMode] = useState(false);
  const [petMode, setPetMode] = useState(false);
  const [hearts, setHearts] = useState<{id: number, x: number, y: number}[]>([]);
  const [weather, setWeather] = useState<WeatherType>(WeatherType.CLEAR);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [harvestEffects, setHarvestEffects] = useState<{id: number, x: number, y: number, emoji: string, amount: number}[]>([]);

  const animalMovementState = useRef<Record<string, { nextMoveTime: number }>>({});
  const speedRef = useRef(1);
  const weatherRef = useRef<WeatherType>(WeatherType.CLEAR);
  const herdTargetsRef = useRef([{ x: 30, y: 60, vx: 0.3, vy: 0.2 }, { x: 70, y: 70, vx: -0.2, vy: 0.1 }]);

  useEffect(() => { speedRef.current = gameSpeed; }, [gameSpeed]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { return () => { soundService.stopBGM(); }; }, []);

  const zoneEntities = entities.filter(e => e.type === EntityType.ANIMAL && (e.habitat === currentZone || (!e.habitat && currentZone === FarmZone.BARN)));
  const currentCount = zoneEntities.length;
  const isFull = currentCount >= MAX_FARM_COUNT;

  const toggleWeather = () => {
    const types = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.STORM];
    const next = types[(types.indexOf(weather) + 1) % types.length];
    setWeather(next);
    onShowMessage(`Thời tiết: ${next === WeatherType.CLEAR ? 'Nắng đẹp' : next === WeatherType.RAIN ? 'Mưa rào' : 'Bão to'}`);
  };

  const toggleSellMode = () => {
      const newVal = !sellMode;
      setSellMode(newVal);
      if (newVal) setPetMode(false);
  };

  const togglePetMode = () => {
      const newVal = !petMode;
      setPetMode(newVal);
      if (newVal) setSellMode(false);
      if (newVal) onShowMessage("Chạm vào vật nuôi để chăm sóc! 👋");
  };

  const spawnHeart = (x: number, y: number) => {
      const id = Date.now() + Math.random();
      setHearts(prev => [...prev, { id, x, y }]);
      setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 800);
  };

  const spawnHarvestEffect = (x: number, y: number, emoji: string, amount: number) => {
      const id = Date.now() + Math.random();
      setHarvestEffects(prev => [...prev, { id, x, y, emoji, amount }]);
      setTimeout(() => setHarvestEffects(prev => prev.filter(e => e.id !== id)), 1500);
  };

  const handleHarvest = (e: React.MouseEvent, animal: Entity) => {
      e.stopPropagation();
      if (!animal.isProductReady) return;

      const speciesData = FARM_SPECIES.find(s => s.name === animal.species);
      if (speciesData?.produce) {
          setCoins(c => c + speciesData.produce!.price);
          setEntities(prev => prev.map(en => en.id === animal.id ? { ...en, isProductReady: false, productionProgress: 0 } : en));
          soundService.playSFX('buy');
          spawnHarvestEffect(animal.x, animal.y, speciesData.produce.emoji, speciesData.produce.price);
          onShowMessage(`Đã thu hoạch ${speciesData.produce.name}! (+${speciesData.produce.price} xu)`);
      }
  };

  const handleAnimalClick = (e: React.MouseEvent, animal: Entity) => {
      e.stopPropagation();

      // Priority: Sell -> Harvest -> Pet -> Select
      if (sellMode) {
          const price = Math.floor((FARM_SPECIES.find(s => s.name === animal.species)?.price || 10) * 0.6);
          setEntities(prev => prev.filter(x => x.id !== animal.id));
          setCoins(c => c + price);
          soundService.playSFX('buy');
          onShowMessage(`Đã bán ${animal.name} (+${price} xu)`);
          if (selectedEntity?.id === animal.id) setSelectedEntity(null);
          return;
      }

      // If product is ready, harvest it first!
      if (animal.isProductReady) {
          handleHarvest(e, animal);
          return;
      }

      if (petMode) {
          setCoins(c => c + 2); 
          setEntities(prev => prev.map(en => en.id === animal.id ? { ...en, happiness: Math.min(100, en.happiness + 15) } : en));
          spawnHeart(animal.x, animal.y);
          soundService.playSFX('buy'); 
          return;
      }

      setSelectedEntity(animal);
  };

  // --- GAME LOOP ---
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      const currentSpeed = speedRef.current;
      const currentWeather = weatherRef.current;

      herdTargetsRef.current.forEach(t => {
          t.x += t.vx * currentSpeed; t.y += t.vy * currentSpeed;
          if (t.x < 10 || t.x > 90) t.vx *= -1; 
          if (t.y < 45 || t.y > 90) t.vy *= -1;
      });

      setEntities(prev => {
        let hasUpdates = false;
        const newBabies: Entity[] = [];
        const alertMessages: string[] = [];

        const updated = prev.map(entity => {
          if (entity.type !== EntityType.ANIMAL) return entity;
          if (!animalMovementState.current[entity.id]) animalMovementState.current[entity.id] = { nextMoveTime: 0 };
          
          // Production Logic
          let newProdProgress = entity.productionProgress || 0;
          let newProductReady = entity.isProductReady || false;
          
          if (!newProductReady) {
              const speciesInfo = FARM_SPECIES.find(s => s.name === entity.species);
              if (speciesInfo?.produce) {
                  // Production rate increases with happiness and hunger status
                  const rate = 0.5 * currentSpeed * (entity.happiness / 100) * (entity.hunger / 100);
                  newProdProgress += rate;
                  if (newProdProgress >= 100) {
                      newProdProgress = 100;
                      newProductReady = true;
                  }
                  hasUpdates = true;
              }
          }

          if (now < animalMovementState.current[entity.id].nextMoveTime) {
             // Just update production/stats even if not moving
             if (hasUpdates) return { ...entity, productionProgress: newProdProgress, isProductReady: newProductReady };
             return entity;
          }

          hasUpdates = true;
          const speedMod = currentWeather === WeatherType.STORM ? 0.5 : 1.0;
          const finalSpeed = currentSpeed * speedMod;
          
          let targetX, targetY, moveDuration = 3000 / finalSpeed;
          let newHunger = Math.max(0, entity.hunger - 0.4 * finalSpeed); 

          if (!targetX) {
             const behavior = Math.random();
             if (behavior < 0.25) { targetX = entity.x; targetY = entity.y; } 
             else if (behavior < 0.5 && herdTargetsRef.current.length > 0) {
                 const leader = herdTargetsRef.current[0];
                 targetX = leader.x + (Math.random()*15 - 7.5); targetY = leader.y + (Math.random()*15 - 7.5);
             } else {
                 targetX = entity.x + (Math.random()*20 - 10); targetY = entity.y + (Math.random()*20 - 10);
             }
          }
          
          if (targetX !== undefined) { 
              targetX = Math.max(5, Math.min(95, targetX)); 
              targetY = Math.max(45, Math.min(95, targetY || 0)); 
          }
          
          animalMovementState.current[entity.id].nextMoveTime = now + moveDuration;
          return { 
              ...entity, x: targetX, y: targetY, hunger: newHunger, 
              facingRight: (targetX || entity.x) > entity.x, transitionDuration: moveDuration, isColliding: false,
              productionProgress: newProdProgress, isProductReady: newProductReady
          };
        });

        if (alertMessages.length) onShowMessage(alertMessages[0]);
        if (selectedEntity) { const up = updated.find(e => e.id === selectedEntity.id); if (up) setSelectedEntity(up); else setSelectedEntity(null); }
        return hasUpdates ? [...updated, ...newBabies] : prev;
      });
    }, 200);
    return () => clearInterval(tick);
  }, [currentZone, selectedEntity]);

  // --- ACTIONS ---
  const handleFeed = (food: typeof FARM_FOODS[0]) => {
      if (coins < food.price) { onShowMessage("Thiếu tiền!"); return; }
      soundService.playSFX('feed');
      setCoins(c => c - food.price);
      setEntities(prev => prev.map(e => e.type === EntityType.ANIMAL && e.habitat === currentZone ? {...e, hunger: Math.min(100, e.hunger + food.hunger), happiness: Math.min(100, e.happiness + food.happiness)} : e));
      setFoodMenuOpen(false);
  };

  const handleBuy = async (s: typeof FARM_SPECIES[0]) => {
      if (coins < s.price) return onShowMessage("Thiếu tiền!");
      setCoins(c => c - s.price);
      const name = await generateName(s.name);
      setEntities(prev => [...prev, { 
          id: Date.now().toString(), name, emoji: s.emoji, type: EntityType.ANIMAL, 
          hunger: 100, happiness: 100, x: 50, y: 70, species: s.name, diet: s.diet as any, habitat: currentZone, 
          facingRight: Math.random()>0.5, productionProgress: 0, isProductReady: false 
      }]);
      setShopOpen(false);
  };

  // --- STYLES & VISUALS ---
  const getZoneTheme = () => {
      switch(currentZone) {
          case FarmZone.BARN: return { sky: 'from-orange-100 via-orange-200 to-amber-100', ground: '#5D4037', decor: '🪵', texture: 'bg-[url("https://www.transparenttextures.com/patterns/wood-pattern.png")]', tint: 'bg-orange-900/10' };
          case FarmZone.POND: return { sky: 'from-blue-200 via-sky-100 to-white', ground: '#3b82f6', decor: '🪷', texture: 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]', tint: 'bg-blue-500/10' };
          case FarmZone.FIELD: default: return { sky: 'from-sky-300 via-blue-100 to-yellow-50', ground: '#eab308', decor: '🌾', texture: 'bg-[url("https://www.transparenttextures.com/patterns/food.png")]', tint: 'bg-yellow-500/10' };
      }
  };
  const theme = getZoneTheme();

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-sans" onClick={() => selectedEntity && setSelectedEntity(null)}>
      
      {/* 1. SKY */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.sky} transition-colors duration-1000`}></div>
      <div className="absolute top-10 right-10 text-yellow-500 text-[8rem] animate-[float-bob_25s_infinite] drop-shadow-xl opacity-80">🌞</div>
      {currentZone === FarmZone.FIELD && <div className="absolute bottom-[40%] right-[10%] text-[10rem] opacity-40 animate-[shimmer_60s_infinite]">🚜</div>}
      {currentZone === FarmZone.BARN && <div className="absolute bottom-[40%] left-[10%] text-[12rem] opacity-30">🏠</div>}

      {/* 2. GROUND PLANE */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] transition-colors duration-1000 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]" style={{ backgroundColor: theme.ground }}>
          <div className={`absolute inset-0 opacity-20 mix-blend-multiply ${theme.texture} bg-repeat`}></div>
          <div className={`absolute inset-0 ${theme.tint} pointer-events-none`}></div>
          
          <div className="absolute -top-8 left-0 right-0 h-8 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-repeat-x opacity-60 flex justify-between px-10">
               {[...Array(10)].map((_,i) => <div key={i} className="w-2 h-12 bg-[#3E2723] -mt-4"></div>)}
          </div>

          <div className="absolute -top-10 left-[15%] text-[6rem] drop-shadow-lg">{theme.decor}</div>
          <div className="absolute -top-8 right-[25%] text-[5rem] drop-shadow-lg">{theme.decor}</div>
      </div>

      {/* 3. WEATHER OVERLAYS */}
      {weather !== WeatherType.CLEAR && <div className={`absolute inset-0 pointer-events-none z-10 ${weather === WeatherType.RAIN ? 'weather-rain opacity-50' : weather === WeatherType.STORM ? 'weather-rain bg-black/40' : ''}`}></div>}
      
      {/* 4. ENTITIES */}
      {zoneEntities.map((animal, i) => {
          const speciesData = FARM_SPECIES.find(s => s.name === animal.species);
          return (
            <div key={animal.id} onClick={(e) => handleAnimalClick(e, animal)}
                className="absolute flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-110"
                style={{ left: `${animal.x}%`, top: `${animal.y}%`, transition: `top ${animal.transitionDuration}ms linear, left ${animal.transitionDuration}ms linear`, zIndex: Math.floor(animal.y) }}
            >
                {/* PRODUCTION ICON */}
                {animal.isProductReady && speciesData?.produce && (
                    <div className="absolute -top-14 animate-bounce z-20" onClick={(e) => handleHarvest(e, animal)}>
                        <div className="bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-yellow-400">
                            <span className="text-2xl filter drop-shadow-sm">{speciesData.produce.emoji}</span>
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/90"></div>
                    </div>
                )}

                <div style={{ transform: `scaleX(${animal.facingRight ? -1 : 1})` }} className={`${animal.isColliding ? 'shake-hit' : 'animal-walk'}`}>
                    {selectedEntity?.id === animal.id && <div className="absolute -inset-4 bg-yellow-400/30 blur-xl rounded-full animate-pulse"></div>}
                    <div className="text-7xl drop-shadow-md filter group-hover:brightness-110">{animal.emoji}</div>
                </div>
            </div>
          );
      })}

      {/* 5. VISUAL EFFECTS */}
      {hearts.map(h => (
          <div key={h.id} className="absolute text-4xl animate-[float-bob_0.8s_ease-out] pointer-events-none z-50 select-none" style={{ left: `${h.x}%`, top: `${h.y - 15}%` }}>❤️</div>
      ))}
      {harvestEffects.map(e => (
          <div key={e.id} className="absolute pointer-events-none z-50 flex flex-col items-center animate-[rise_1.5s_ease-out]" style={{ left: `${e.x}%`, top: `${e.y - 10}%` }}>
              <div className="text-4xl drop-shadow-lg">{e.emoji}</div>
              <div className="text-yellow-300 font-black text-2xl drop-shadow-md">+{e.amount}</div>
          </div>
      ))}

      {/* 6. HUD */}
      <div className="absolute top-6 left-6 right-6 flex justify-between z-30 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3">
             <Button variant="danger" onClick={onGoBack} className="shadow-2xl text-sm py-2 px-6 rounded-xl border-b-4 border-red-900 active:border-b-0 active:translate-y-1 bg-red-700">🏡 Trang Trại</Button>
             
             <div className="bg-amber-100 p-3 rounded-2xl border-4 border-amber-700 shadow flex items-center gap-4">
                 <input type="range" min="0.5" max="3" step="0.5" value={gameSpeed} onChange={e=>setGameSpeed(parseFloat(e.target.value))} className="w-24 accent-amber-700 h-2 bg-amber-300 rounded-lg" />
                 <button onClick={toggleWeather} className="text-2xl hover:scale-110 transition-transform">{weather === WeatherType.CLEAR ? '☀️' : '🌧️'}</button>
             </div>
             
             <div className="flex flex-col gap-1 mt-2">
                 {ZONES.map(z => (
                     <button key={z.id} onClick={() => setCurrentZone(z.id)} className={`flex items-center gap-3 px-4 py-2 rounded-r-xl border-l-8 shadow-md transition-all font-bold ${currentZone === z.id ? 'bg-amber-50 border-amber-800 text-amber-900 translate-x-3 text-lg' : 'bg-white/90 border-transparent text-gray-500 hover:bg-white hover:translate-x-1'}`}>
                         <span className="text-2xl">{z.emoji}</span><span>{z.name}</span>
                     </button>
                 ))}
             </div>
          </div>
          <div className="pointer-events-auto flex gap-3">
             <div className="bg-yellow-100 text-yellow-900 px-6 py-2 rounded-2xl border-4 border-yellow-600 shadow-xl font-black text-lg flex items-center gap-2">🚜 {currentCount}/{MAX_FARM_COUNT}</div>
             <div className="bg-amber-500 text-white px-6 py-2 rounded-2xl border-4 border-amber-700 shadow-xl font-black text-lg flex items-center gap-2">💰 {coins}</div>
          </div>
      </div>

      {/* 7. DOCK */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-800 px-6 py-3 rounded-2xl border-b-8 border-red-950 shadow-2xl flex items-end gap-3 z-30">
          <Button variant="wood" onClick={()=>setFoodMenuOpen(true)} className="bg-amber-600 border-amber-800 text-white">🌾 Cho Ăn</Button>
          <Button variant="wood" onClick={()=>setShopOpen(true)} className="bg-amber-600 border-amber-800 text-white">🛒 Chợ</Button>
          <Button variant="wood" onClick={()=>setPriceListOpen(true)} className="bg-amber-600 border-amber-800 text-white">📜 Sổ</Button>
          <div className="w-1 h-10 bg-black/20 mx-2 rounded-full"></div>
          <Button variant={petMode?'secondary':'wood'} onClick={togglePetMode} className="bg-pink-600 border-pink-800 text-white">{petMode?'💕 Xong':'👋 Chăm'}</Button>
          <Button variant={sellMode?'danger':'success'} onClick={toggleSellMode} className="border-b-4">{sellMode?'🛑 Dừng':'💲 Bán'}</Button>
      </div>

      {/* 8. INSPECTOR */}
      {selectedEntity && (
          <div className="absolute top-28 right-8 bg-[#FFF8E1] w-72 p-6 rounded-sm shadow-xl transform -rotate-1 border-[8px] border-[#795548] z-40 animate-slide-up" onClick={e=>e.stopPropagation()}>
              <div className="w-4 h-4 bg-[#3E2723] rounded-full absolute top-2 left-1/2 -translate-x-1/2 shadow-inner"></div>
              
              <h3 className="font-black text-2xl text-[#3E2723] mb-4 text-center uppercase tracking-wider">{selectedEntity.name}</h3>
              <div className="flex justify-center mb-6">
                 <div className="text-8xl drop-shadow-xl animate-[float-bob_3s_infinite]">{selectedEntity.emoji}</div>
              </div>
              
              <div className="space-y-3 mb-6 font-bold text-[#5D4037]">
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span>NO</span><span>{Math.round(selectedEntity.hunger)}%</span></div>
                      <div className="w-full bg-gray-300 h-3 rounded-full"><div className="h-full bg-green-600 rounded-full" style={{width:`${selectedEntity.hunger}%`}}></div></div>
                  </div>
                  {/* PRODUCTION PROGRESS BAR */}
                  {FARM_SPECIES.find(s => s.name === selectedEntity.species)?.produce && (
                      <div>
                          <div className="flex justify-between text-xs mb-1">
                              <span>SẢN XUẤT {selectedEntity.isProductReady ? '✅' : '⏳'}</span>
                              <span>{Math.round(selectedEntity.productionProgress || 0)}%</span>
                          </div>
                          <div className="w-full bg-gray-300 h-3 rounded-full overflow-hidden border border-gray-400">
                              <div className={`h-full transition-all duration-500 ${selectedEntity.isProductReady ? 'bg-yellow-400 animate-pulse' : 'bg-blue-500'}`} style={{width:`${selectedEntity.productionProgress || 0}%`}}></div>
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  <Button variant="wood" className="w-full text-xs py-2 bg-blue-600 border-blue-800 text-white" onClick={async ()=>{ generateAnimalFact(selectedEntity).then(onShowMessage) }}>🗣️ Chat</Button>
                  <Button variant="danger" className="w-full text-xs py-2" onClick={()=>{ setEntities(p=>p.filter(e=>e.id!==selectedEntity.id)); setCoins(c=>c+15); setSelectedEntity(null); }}>💲 Bán</Button>
              </div>
          </div>
      )}

      {/* --- MODALS (Reusing previous logic) --- */}
      {shopOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={()=>setShopOpen(false)}>
           <div className="bg-[#FFF3E0] border-[12px] border-[#5D4037] rounded-3xl p-8 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative" onClick={e=>e.stopPropagation()}>
               <h2 className="text-4xl font-black text-[#3E2723] mb-6 text-center uppercase tracking-widest">Chợ Nông Thôn</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 overflow-y-auto p-2 custom-scrollbar">
                   {FARM_SPECIES.filter(s=>s.habitat===currentZone).map(s => (
                       <div key={s.name} onClick={()=>handleBuy(s)} className={`bg-white p-4 rounded-xl border-b-8 border-r-8 border-[#8D6E63] active:border-0 active:translate-y-2 active:translate-x-2 cursor-pointer transition-all ${coins<s.price?'opacity-50 grayscale':''}`}>
                           <div className="text-6xl mb-4 text-center mt-2">{s.emoji}</div>
                           <div className="font-black text-[#3E2723] text-lg text-center">{s.name}</div>
                           <div className="bg-yellow-400 mx-auto mt-2 w-fit px-3 py-1 rounded-full font-bold text-[#3E2723] text-sm border-2 border-yellow-600">{s.price} 💰</div>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      )}
      
      {foodMenuOpen && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setFoodMenuOpen(false)}>
              <div className="bg-[#5D4037] border-4 border-[#3E2723] rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl animate-pop-in relative" onClick={e=>e.stopPropagation()}>
                  <h2 className="text-3xl font-black text-white mb-6 text-center uppercase">Kho Thức Ăn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {FARM_FOODS.map(f => (
                          <div key={f.id} onClick={()=>handleFeed(f)} className="flex items-center gap-4 bg-[#8D6E63] p-4 rounded-2xl hover:bg-[#A1887F] cursor-pointer border-b-4 border-[#3E2723] active:border-b-0 active:translate-y-1">
                              <div className="text-4xl">{f.emoji}</div>
                              <div className="flex-1">
                                  <div className="font-bold text-white text-lg">{f.name}</div>
                                  <div className="font-black text-yellow-300">{f.price} 💰</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
      
      {priceListOpen && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setPriceListOpen(false)}>
              <div className="bg-[#FFFDE7] border-[16px] border-[#5D4037] rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
                  <div className="p-8 border-b-4 border-[#5D4037]/20 flex justify-between items-center bg-[#FBC02D]/20">
                      <h2 className="text-3xl font-black text-[#3E2723] uppercase">Sổ Tay Nông Dân</h2>
                      <button onClick={()=>setPriceListOpen(false)} className="text-[#3E2723] text-2xl font-bold">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {FARM_SPECIES.map((animal) => (
                              <div key={animal.name} className="flex gap-4 p-4 border-b-2 border-dashed border-[#5D4037]/30 hover:bg-[#5D4037]/5">
                                  <div className="w-20 h-20 bg-white rounded-full border-4 border-[#8D6E63] flex items-center justify-center text-5xl shadow-sm">{animal.emoji}</div>
                                  <div>
                                      <h3 className="font-black text-xl text-[#3E2723]">{animal.name}</h3>
                                      <p className="text-sm text-gray-600 italic">"{animal.description}"</p>
                                      {animal.produce && (
                                          <div className="mt-2 text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded inline-block">
                                              Sản xuất: {animal.produce.emoji} {animal.produce.name} ({animal.produce.price} xu)
                                          </div>
                                      )}
                                      <div className="mt-2 text-sm font-bold text-[#5D4037]">Giá: {animal.price} 💰 | Độ khó: {animal.careLevel}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
