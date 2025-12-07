
import React, { useState, useEffect, useRef } from 'react';
import { Entity, EntityType, WeatherType, ZooZone } from '../types';
import { ANIMAL_SPECIES, ANIMAL_FOODS } from '../constants';
import { Button } from './ui/Button';
import { generateAnimalFact, generateName } from '../services/geminiService';
import { soundService } from '../services/soundService';

interface ZooProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  onGoBack: () => void;
  onShowMessage: (msg: string) => void;
}

const MAX_ANIMAL_COUNT = 20;

const ZONES = [
  { id: ZooZone.JUNGLE, name: 'Rừng Nhiệt Đới', emoji: '🌴', theme: 'emerald' },
  { id: ZooZone.DESERT, name: 'Sa Mạc', emoji: '🌵', theme: 'amber' },
  { id: ZooZone.ARCTIC, name: 'Bắc Cực', emoji: '❄️', theme: 'sky' },
  { id: ZooZone.ANTARCTIC, name: 'Nam Cực', emoji: '🐧', theme: 'indigo' },
];

export const Zoo: React.FC<ZooProps> = ({ entities, setEntities, coins, setCoins, onGoBack, onShowMessage }) => {
  const [currentZone, setCurrentZone] = useState<ZooZone>(ZooZone.JUNGLE);
  const [shopOpen, setShopOpen] = useState(false);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [sellMode, setSellMode] = useState(false);
  const [petMode, setPetMode] = useState(false);
  const [hearts, setHearts] = useState<{id: number, x: number, y: number}[]>([]);
  const [weather, setWeather] = useState<WeatherType>(WeatherType.CLEAR);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  const animalMovementState = useRef<Record<string, { nextMoveTime: number }>>({});
  const speedRef = useRef(1);
  const weatherRef = useRef<WeatherType>(WeatherType.CLEAR);
  // Adjusted herd targets to stay within ground bounds (Y > 40)
  const herdTargetsRef = useRef([{ x: 30, y: 50, vx: 0.3, vy: 0.2 }, { x: 70, y: 70, vx: -0.2, vy: 0.1 }]);

  useEffect(() => { speedRef.current = gameSpeed; }, [gameSpeed]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { return () => { soundService.stopBGM(); }; }, []);

  const zoneEntities = entities.filter(e => e.type === EntityType.ANIMAL && (e.habitat === currentZone || (!e.habitat && currentZone === ZooZone.JUNGLE)));
  const currentCount = zoneEntities.length;
  const isFull = currentCount >= MAX_ANIMAL_COUNT;

  const toggleWeather = () => {
    const types = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.STORM, WeatherType.SNOW];
    const next = types[(types.indexOf(weather) + 1) % types.length];
    setWeather(next);
    onShowMessage(`Thời tiết: ${next}`);
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
      if (newVal) onShowMessage("Chạm vào thú để vuốt ve! 👋");
  };

  const spawnHeart = (x: number, y: number) => {
      const id = Date.now() + Math.random();
      setHearts(prev => [...prev, { id, x, y }]);
      setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 800);
  };

  const handleAnimalClick = (e: React.MouseEvent, animal: Entity) => {
      e.stopPropagation();

      if (sellMode) {
          const price = Math.floor((ANIMAL_SPECIES.find(s => s.name === animal.species)?.price || 40) * 0.6);
          setEntities(prev => prev.filter(x => x.id !== animal.id));
          setCoins(c => c + price);
          soundService.playSFX('buy');
          onShowMessage(`Đã bán ${animal.name} (+${price} xu)`);
          if (selectedEntity?.id === animal.id) setSelectedEntity(null);
          return;
      }

      if (petMode) {
          setCoins(c => c + 5);
          setEntities(prev => prev.map(en => en.id === animal.id ? { ...en, happiness: Math.min(100, en.happiness + 10) } : en));
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
          // Boundary checks for herd leaders - Keep them inside valid ground (Y: 40-85)
          if (t.x < 10 || t.x > 90) t.vx *= -1; 
          if (t.y < 40 || t.y > 85) t.vy *= -1;
      });

      setEntities(prev => {
        let hasUpdates = false;
        const newBabies: Entity[] = [];
        const eatenIds: string[] = [];
        const alertMessages: string[] = [];

        const updated = prev.map(entity => {
          if (entity.type !== EntityType.ANIMAL || eatenIds.includes(entity.id)) return entity;
          if (!animalMovementState.current[entity.id]) animalMovementState.current[entity.id] = { nextMoveTime: 0 };
          if (now < animalMovementState.current[entity.id].nextMoveTime) return entity;

          hasUpdates = true;
          const speedMod = currentWeather === WeatherType.SNOW ? 0.6 : 1.0;
          const finalSpeed = currentSpeed * speedMod;
          
          let targetX, targetY, moveDuration = 3000 / finalSpeed;
          let newHunger = Math.max(0, entity.hunger - 0.5 * finalSpeed);

          // Hunting
          if (entity.diet === 'carnivore' && entity.hunger < 50) {
              const prey = prev.find(p => p.type === EntityType.ANIMAL && p.habitat === entity.habitat && p.id !== entity.id && !eatenIds.includes(p.id) && p.species !== entity.species && Math.hypot(p.x - entity.x, p.y - entity.y) < 30);
              if (prey) {
                 if (Math.hypot(prey.x - entity.x, prey.y - entity.y) < 5) {
                     eatenIds.push(prey.id); newHunger = 100;
                     if (entity.habitat === currentZone) { alertMessages.push(`${entity.name} ăn thịt ${prey.name}!`); soundService.playSFX('catch'); }
                 } else { targetX = prey.x; targetY = prey.y; moveDuration = 1000/finalSpeed; }
              }
          }
          
          if (!targetX) {
             const behavior = Math.random();
             if (behavior < 0.2) { targetX = entity.x; targetY = entity.y; }
             else if (behavior < 0.6 && herdTargetsRef.current.length > 0) {
                 const leader = herdTargetsRef.current[0];
                 targetX = leader.x + (Math.random()*10 - 5); targetY = leader.y + (Math.random()*10 - 5);
             } else {
                 targetX = entity.x + (Math.random()*30 - 15); targetY = entity.y + (Math.random()*20 - 10);
             }
          }
          
          if (targetX !== undefined) { 
              // Enforce Ground Boundaries
              // X: 5-95%
              // Y: 40-90% (Keep below horizon)
              targetX = Math.max(5, Math.min(95, targetX)); 
              targetY = Math.max(40, Math.min(90, targetY || 0)); 
          }
          
          animalMovementState.current[entity.id].nextMoveTime = now + moveDuration;
          return { ...entity, x: targetX, y: targetY, hunger: newHunger, facingRight: (targetX || entity.x) > entity.x, transitionDuration: moveDuration, isColliding: false };
        });

        if (alertMessages.length) onShowMessage(alertMessages[0]);
        if (selectedEntity) { const up = updated.find(e => e.id === selectedEntity.id); if (up) setSelectedEntity(up); else setSelectedEntity(null); }
        return hasUpdates ? [...updated.filter(e => !eatenIds.includes(e.id)), ...newBabies] : prev;
      });
    }, 200);
    return () => clearInterval(tick);
  }, [currentZone, selectedEntity]);

  // --- ACTIONS ---
  const handleFeed = (food: typeof ANIMAL_FOODS[0]) => {
      if (coins < food.price) { onShowMessage("Thiếu tiền!"); return; }
      soundService.playSFX('feed');
      setCoins(c => c - food.price);
      setEntities(prev => prev.map(e => e.type === EntityType.ANIMAL && e.habitat === currentZone ? {...e, hunger: Math.min(100, e.hunger + food.hunger), happiness: Math.min(100, e.happiness + food.happiness)} : e));
      setFoodMenuOpen(false);
  };

  const handleBuy = async (s: typeof ANIMAL_SPECIES[0]) => {
      if (coins < s.price) return onShowMessage("Thiếu tiền!");
      setCoins(c => c - s.price);
      const name = await generateName(s.name);
      setEntities(prev => [...prev, { id: Date.now().toString(), name, emoji: s.emoji, type: EntityType.ANIMAL, hunger: 100, happiness: 100, x: 50, y: 50, species: s.name, diet: s.diet as any, habitat: currentZone, facingRight: Math.random()>0.5 }]);
      setShopOpen(false);
  };

  // --- STYLES & VISUALS ---
  const getZoneTheme = () => {
      switch(currentZone) {
          case ZooZone.DESERT: return { sky: 'from-orange-300 via-amber-200 to-yellow-100', ground: '#d97706', decor: '🌵', texture: 'bg-[url("https://www.transparenttextures.com/patterns/sandpaper.png")]' };
          case ZooZone.ARCTIC: case ZooZone.ANTARCTIC: return { sky: 'from-slate-300 via-blue-100 to-white', ground: '#e0f2fe', decor: '🧊', texture: 'bg-[url("https://www.transparenttextures.com/patterns/snow.png")]' };
          default: return { sky: 'from-sky-400 via-blue-200 to-emerald-100', ground: '#15803d', decor: '🌳', texture: 'bg-[url("https://www.transparenttextures.com/patterns/grass.png")]' };
      }
  };
  const theme = getZoneTheme();

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-sans" onClick={() => selectedEntity && setSelectedEntity(null)}>
      
      {/* 1. SKY (Dynamic Day/Night implied) */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.sky} transition-colors duration-1000`}></div>
      <div className="absolute top-10 right-20 text-yellow-400 text-[10rem] animate-[float-bob_20s_infinite] drop-shadow-[0_0_60px_rgba(253,224,71,0.8)] filter brightness-125">☀️</div>
      <div className="absolute top-20 left-10 text-white opacity-40 text-[12rem] animate-[shimmer_30s_infinite] blur-xl">☁️</div>

      {/* 2. PARALLAX LAYERS */}
      {/* Distant Mountains */}
      <div className="absolute bottom-[35%] left-0 right-0 h-96 bg-gradient-to-t from-slate-500/40 to-transparent transform scale-y-150 origin-bottom blur-sm"></div>
      
      {/* 3. GROUND PLANE */}
      <div className="absolute bottom-0 left-0 right-0 h-[65%] transition-colors duration-1000 shadow-[0_-30px_60px_rgba(0,0,0,0.2)]" style={{ backgroundColor: theme.ground }}>
          <div className={`absolute inset-0 opacity-20 mix-blend-multiply ${theme.texture} bg-repeat`}></div>
          
          {/* Decor Elements (Fixed) */}
          <div className="absolute -top-16 left-[10%] text-[8rem] drop-shadow-2xl animate-[shiver_10s_infinite] origin-bottom">{theme.decor}</div>
          <div className="absolute -top-10 right-[20%] text-[6rem] drop-shadow-2xl animate-[shiver_12s_infinite] origin-bottom filter brightness-90">{theme.decor}</div>
          <div className="absolute -top-24 right-[5%] text-[10rem] drop-shadow-2xl animate-[shiver_15s_infinite] origin-bottom filter blur-[1px]">{theme.decor}</div>
      </div>

      {/* 4. WEATHER OVERLAYS */}
      {weather !== WeatherType.CLEAR && <div className={`absolute inset-0 pointer-events-none z-10 ${weather === WeatherType.RAIN ? 'weather-rain opacity-50' : weather === WeatherType.SNOW ? 'weather-snow opacity-90' : 'weather-rain bg-black/40'}`}></div>}
      {weather === WeatherType.STORM && <div className="absolute inset-0 z-10 weather-flash bg-white/30 mix-blend-overlay pointer-events-none"></div>}

      {/* 5. ENTITIES */}
      {zoneEntities.map((animal, i) => (
          <div key={animal.id} onClick={(e) => handleAnimalClick(e, animal)}
             className="absolute flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-110"
             style={{ left: `${animal.x}%`, top: `${animal.y}%`, transition: `top ${animal.transitionDuration}ms linear, left ${animal.transitionDuration}ms linear`, zIndex: Math.floor(animal.y) }}
          >
              <div style={{ transform: `scaleX(${animal.facingRight ? -1 : 1})` }} className={`${animal.isColliding ? 'shake-hit' : 'animal-walk'}`}>
                  {selectedEntity?.id === animal.id && <div className="absolute -inset-6 bg-white/40 blur-2xl rounded-full animate-pulse"></div>}
                  <div className="text-8xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)] filter group-hover:brightness-110">{animal.emoji}</div>
                  <div className="w-20 h-4 bg-black/30 rounded-[100%] absolute -bottom-2 left-1/2 -translate-x-1/2 blur-md"></div>
              </div>
          </div>
      ))}

      {/* 5.5 HEARTS */}
      {hearts.map(h => (
          <div key={h.id} className="absolute text-4xl animate-[float-bob_0.8s_ease-out] pointer-events-none z-50 select-none" style={{ left: `${h.x}%`, top: `${h.y - 15}%` }}>
              ❤️
          </div>
      ))}

      {/* 6. UI HUD (Wooden/Organic Theme) */}
      <div className="absolute top-6 left-6 right-6 flex justify-between z-30 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3">
             <Button variant="wood" onClick={onGoBack} className="shadow-2xl text-sm py-2 px-6 rounded-xl border-b-4 border-[#5C3A1A] active:border-b-0 active:translate-y-1">🏡 Về nhà</Button>
             
             <div className="bg-[#DEB887] p-3 rounded-2xl border-4 border-[#8B4513] shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex items-center gap-4 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
                 <input type="range" min="0.5" max="3" step="0.5" value={gameSpeed} onChange={e=>setGameSpeed(parseFloat(e.target.value))} className="w-24 accent-[#8B4513] h-2 bg-[#5C3A1A]/30 rounded-lg" />
                 <button onClick={toggleWeather} className="text-2xl hover:scale-110 transition-transform">{weather === WeatherType.CLEAR ? '☀️' : '⛈️'}</button>
             </div>
             
             <div className="flex flex-col gap-1 mt-2">
                 {ZONES.map(z => (
                     <button key={z.id} onClick={() => setCurrentZone(z.id)} className={`flex items-center gap-3 px-4 py-2 rounded-r-xl border-l-8 shadow-md transition-all font-bold ${currentZone === z.id ? 'bg-[#FFF8DC] border-[#8B4513] text-[#5C3A1A] translate-x-3 text-lg' : 'bg-white/90 border-transparent text-gray-500 hover:bg-white hover:translate-x-1'}`}>
                         <span className="text-2xl">{z.emoji}</span><span>{z.name}</span>
                     </button>
                 ))}
             </div>
          </div>
          <div className="pointer-events-auto flex gap-3">
             <div className="bg-emerald-700 text-emerald-100 px-6 py-2 rounded-2xl border-4 border-emerald-900 shadow-xl font-black text-lg flex items-center gap-2">🐾 {currentCount}/{MAX_ANIMAL_COUNT}</div>
             <div className="bg-amber-500 text-amber-900 px-6 py-2 rounded-2xl border-4 border-amber-700 shadow-xl font-black text-lg flex items-center gap-2">💰 {coins}</div>
          </div>
      </div>

      {/* 7. DOCK (Wooden Plank) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#DEB887] px-6 py-3 rounded-2xl border-b-8 border-[#8B4513] shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-end gap-3 z-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
          <div className="absolute top-2 left-2 w-2 h-2 bg-[#5C3A1A] rounded-full opacity-50"></div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-[#5C3A1A] rounded-full opacity-50"></div>
          <Button variant="wood" onClick={()=>setFoodMenuOpen(true)}>🍖 Ăn</Button>
          <Button variant="wood" onClick={()=>setShopOpen(true)}>🛒 Mua</Button>
          <Button variant="wood" onClick={()=>setPriceListOpen(true)}>📜 Sổ</Button>
          <div className="w-1 h-10 bg-[#8B4513]/30 mx-2 rounded-full"></div>
          <Button variant={petMode?'secondary':'wood'} onClick={togglePetMode} className="border-b-4 active:border-b-0">{petMode?'💕 Dừng':'👋 Vuốt ve'}</Button>
          <Button variant={sellMode?'danger':'success'} onClick={toggleSellMode} className="border-b-4 active:border-b-0">{sellMode?'🛑 Dừng':'💲 Bán'}</Button>
      </div>

      {/* 8. INSPECTOR CLIPBOARD (Organic Feel) */}
      {selectedEntity && (
          <div className="absolute top-28 right-8 bg-[#fffbeb] w-72 p-8 rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transform rotate-2 border-t-[12px] border-[#8B4513] z-40 animate-slide-up" onClick={e=>e.stopPropagation()}>
              <div className="w-24 h-6 bg-gray-400 absolute -top-8 left-1/2 -translate-x-1/2 rounded-t-lg border-2 border-gray-500 flex items-center justify-center"><div className="w-16 h-1 bg-black/20 rounded-full"></div></div> {/* Metal Clip */}
              
              <h3 className="font-black text-2xl text-[#5C3A1A] border-b-4 border-[#DEB887] pb-2 mb-4 text-center uppercase tracking-wide">{selectedEntity.name}</h3>
              <div className="flex justify-center mb-6">
                 <div className="text-8xl drop-shadow-xl animate-[float-bob_4s_infinite]">{selectedEntity.emoji}</div>
              </div>
              
              <div className="space-y-3 mb-6 font-bold text-[#5C3A1A]/80">
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span>NO BỤNG</span><span>{Math.round(selectedEntity.hunger)}%</span></div>
                      <div className="w-full bg-[#DEB887]/50 h-3 rounded-full border border-[#8B4513]/20"><div className="h-full bg-green-600 rounded-full transition-all" style={{width:`${selectedEntity.hunger}%`}}></div></div>
                  </div>
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span>VUI VẺ</span><span>{Math.round(selectedEntity.happiness)}%</span></div>
                      <div className="w-full bg-[#DEB887]/50 h-3 rounded-full border border-[#8B4513]/20"><div className="h-full bg-pink-500 rounded-full transition-all" style={{width:`${selectedEntity.happiness}%`}}></div></div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  <Button variant="wood" className="w-full text-xs py-2 shadow-sm" onClick={async ()=>{ generateAnimalFact(selectedEntity).then(onShowMessage) }}>🗣️ Chat</Button>
                  <Button variant="danger" className="w-full text-xs py-2 shadow-sm border-b-4 active:border-b-0" onClick={()=>{ setEntities(p=>p.filter(e=>e.id!==selectedEntity.id)); setCoins(c=>c+20); setSelectedEntity(null); }}>💲 Bán</Button>
              </div>
          </div>
      )}

      {/* --- MODALS (Enhanced visuals) --- */}
      {shopOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={()=>setShopOpen(false)}>
           <div className="bg-[#FFF8DC] border-[12px] border-[#8B4513] rounded-[3rem] p-8 w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl relative bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" onClick={e=>e.stopPropagation()}>
               <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-[#8B4513] opacity-60 shadow-inner"></div>
               <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#8B4513] opacity-60 shadow-inner"></div>
               
               <h2 className="text-5xl font-black text-[#5C3A1A] mb-8 text-center uppercase tracking-[0.2em] border-b-4 border-[#DEB887] pb-6 drop-shadow-sm flex items-center justify-center gap-4">
                   <span>🤠</span> Trạm Cứu Hộ <span>🤠</span>
               </h2>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                       {ANIMAL_SPECIES.filter(s=>s.habitat===currentZone).map(s => {
                           const canBuy = coins >= s.price && !isFull;
                           return (
                               <div key={s.name} onClick={() => canBuy && handleBuy(s)} 
                                   className={`group relative h-96 w-full bg-[#fdf6e3] rounded-[2rem] border-[6px] border-[#8B4513] shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-all duration-300 transform hover:-translate-y-3 cursor-pointer overflow-hidden ${!canBuy ? 'opacity-60 grayscale' : ''}`}
                               >
                                   {/* Card Texture Overlay */}
                                   <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] pointer-events-none"></div>
                                   
                                   {/* Dashed Inner Border */}
                                   <div className="absolute inset-3 border-2 border-dashed border-[#8B4513]/40 rounded-[1.5rem] pointer-events-none"></div>

                                   {/* Top Badges */}
                                   <div className="absolute top-6 right-6 z-20 flex gap-2">
                                       <div className={`text-xs font-black px-2 py-1 rounded-md shadow-sm border uppercase ${s.diet==='carnivore' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                                           {s.diet==='carnivore'?'🥩':'🌿'}
                                       </div>
                                   </div>

                                   {/* Main Content */}
                                   <div className="absolute inset-0 flex flex-col items-center pt-12 transition-transform duration-500 group-hover:-translate-y-16">
                                       <div className="relative mb-6">
                                           <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                           <div className="text-8xl drop-shadow-2xl relative z-10 filter group-hover:brightness-110 transition-all duration-300">{s.emoji}</div>
                                       </div>
                                       
                                       <h3 className="font-black text-2xl text-[#5C3A1A] uppercase tracking-wide mb-1">{s.name}</h3>
                                       
                                       {/* Price Stamp */}
                                       <div className={`mt-2 px-4 py-1.5 rounded-lg transform -rotate-2 border-2 shadow-md font-black text-lg flex items-center gap-2 ${canBuy ? 'bg-[#FFD700] border-[#DAA520] text-[#5C3A1A]' : 'bg-gray-300 border-gray-400 text-gray-600'}`}>
                                           {s.price} <span className="text-sm">🪙</span>
                                       </div>
                                   </div>

                                   {/* Slide-up Info Panel */}
                                   <div className="absolute inset-x-0 bottom-0 h-40 bg-[#8B4513] text-[#FFE4B5] p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out flex flex-col justify-center border-t-4 border-[#DEB887] shadow-inner">
                                       <div className="text-xs font-bold text-[#DEB887] uppercase tracking-widest mb-1">Hồ sơ loài</div>
                                       <p className="text-sm leading-snug opacity-90 italic mb-3">"{s.description}"</p>
                                       
                                       <div className="flex justify-between items-end border-t border-[#FFE4B5]/20 pt-2">
                                           <div className="flex flex-col">
                                               <span className="text-[10px] uppercase opacity-70">Độ khó</span>
                                               <span className="font-bold text-yellow-400">{s.careLevel}</span>
                                           </div>
                                           <div className="text-2xl opacity-50 group-hover:opacity-100 group-hover:scale-125 transition-all">🐾</div>
                                       </div>
                                   </div>

                                   {/* Not Enough Money Overlay */}
                                   {!canBuy && (
                                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                            {isFull ? 
                                                <span className="bg-red-600 text-white font-black text-xl px-4 py-2 transform -rotate-12 border-4 border-white shadow-xl">ĐẦY CHUỒNG</span> :
                                                <span className="bg-gray-700 text-white font-black text-xl px-4 py-2 transform -rotate-12 border-4 border-white shadow-xl">THIẾU TIỀN</span>
                                            }
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               </div>
           </div>
        </div>
      )}
      
      {foodMenuOpen && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setFoodMenuOpen(false)}>
              <div className="bg-[#5C3A1A] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] border-4 border-[#3E2723] rounded-[2.5rem] p-8 w-full max-w-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-pop-in relative overflow-hidden" onClick={e=>e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8 border-b-2 border-[#DEB887]/30 pb-4">
                      <h2 className="text-4xl font-black text-[#FFE4B5] tracking-wide uppercase drop-shadow-[0_2px_0_#3E2723]">Kho Lương Thực</h2>
                      <button onClick={()=>setFoodMenuOpen(false)} className="w-12 h-12 rounded-full bg-[#3E2723] text-[#DEB887] border-2 border-[#DEB887] hover:bg-[#DEB887] hover:text-[#3E2723] font-bold transition-colors text-xl">✕</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {ANIMAL_FOODS.map(f => (
                          <div key={f.id} onClick={()=>handleFeed(f)} className="group relative bg-[#3E2723]/90 p-5 rounded-3xl border-2 border-[#DEB887]/20 hover:border-[#DEB887] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl">
                              <div className="flex items-center gap-5 relative z-10">
                                  <div className="w-16 h-16 bg-[#2D1B15] rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-[#DEB887]/10 group-hover:scale-110 transition-transform">{f.emoji}</div>
                                  <div className="flex-1">
                                      <div className="font-bold text-[#FFE4B5] text-xl mb-1 group-hover:text-white">{f.name}</div>
                                      <div className="flex gap-2 mt-1">
                                          <span className="text-[10px] font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded">+{f.hunger} NO</span>
                                          <span className="text-[10px] font-bold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">+{f.happiness} VUI</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="absolute top-3 right-3 font-black text-yellow-400 text-lg drop-shadow-md">{f.price} 💰</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {priceListOpen && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setPriceListOpen(false)}>
              <div className="bg-[#fdf6e3] border-[16px] border-[#8B4513] rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                  <div className="p-8 border-b-4 border-[#8B4513]/20 flex justify-between items-center bg-[#DEB887]/20">
                      <h2 className="text-4xl font-black text-[#5C3A1A] tracking-tighter uppercase drop-shadow-sm">Sổ Tay Kiểm Lâm</h2>
                      <button onClick={()=>setPriceListOpen(false)} className="text-[#5C3A1A] text-2xl font-bold hover:rotate-90 transition-transform">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {ANIMAL_SPECIES.map((animal) => (
                              <div key={animal.name} className="flex gap-4 sm:gap-6 p-4 border-b-2 border-dotted border-[#8B4513]/30 hover:bg-[#8B4513]/5 transition-colors group items-start">
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-md border-2 border-[#8B4513]/10 flex flex-shrink-0 items-center justify-center text-5xl sm:text-6xl group-hover:rotate-6 transition-transform">{animal.emoji}</div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start flex-wrap gap-2">
                                          <h3 className="font-black text-xl sm:text-2xl text-[#5C3A1A] truncate">{animal.name}</h3>
                                          <span className="text-[#8B4513] font-black text-base sm:text-lg bg-[#FFE4B5] px-2 rounded whitespace-nowrap">{animal.price} 💰</span>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-2 my-2">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border flex items-center gap-1 ${animal.diet === 'carnivore' ? 'border-red-800/20 text-red-800 bg-red-100' : 'border-green-800/20 text-green-800 bg-green-100'}`}>
                                              {animal.diet === 'carnivore' ? '🥩 Ăn thịt' : '🌿 Ăn cỏ'}
                                          </span>
                                          <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border border-blue-800/20 text-blue-800 bg-blue-100 flex items-center gap-1">
                                              ⭐ Lv: {animal.careLevel}
                                          </span>
                                          <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border border-[#8B4513]/20 text-[#5C3A1A] bg-[#DEB887]/30 flex items-center gap-1">
                                              {ZONES.find(z => z.id === animal.habitat)?.emoji} {ZONES.find(z => z.id === animal.habitat)?.name}
                                          </span>
                                      </div>

                                      <p className="text-sm text-gray-700 italic font-serif leading-relaxed opacity-80">"{animal.description}"</p>
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
