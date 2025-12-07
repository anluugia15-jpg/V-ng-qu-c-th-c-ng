import React, { useEffect, useState, useRef } from 'react';
import { Entity, EntityType, WeatherType, MovementPattern, AquaZone } from '../types';
import { FISH_SPECIES, FISH_FOODS } from '../constants';
import { Button } from './ui/Button';
import { generateName, generateAnimalFact } from '../services/geminiService';
import { soundService } from '../services/soundService';

interface AquariumProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  onGoBack: () => void;
  onShowMessage: (msg: string) => void;
}

const MAX_FISH_COUNT = 25; 

const ZONES = [
  { id: AquaZone.CORAL_REEF, name: 'Rạn San Hô', emoji: '🪸', color: 'from-cyan-400 to-blue-500' },
  { id: AquaZone.OPEN_OCEAN, name: 'Đại Dương', emoji: '🌊', color: 'from-blue-600 to-indigo-700' },
];

export const Aquarium: React.FC<AquariumProps> = ({ entities, setEntities, coins, setCoins, onGoBack, onShowMessage }) => {
  const [currentZone, setCurrentZone] = useState<AquaZone>(AquaZone.CORAL_REEF);
  const [shopOpen, setShopOpen] = useState(false);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [movementMenuOpen, setMovementMenuOpen] = useState(false);
  
  const [gameSpeed, setGameSpeed] = useState(1); 
  const [sellMode, setSellMode] = useState(false);
  const [weather, setWeather] = useState<WeatherType>(WeatherType.CLEAR);
  
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('random');
  const [customWaypoints, setCustomWaypoints] = useState<{x: number, y: number}[]>([]);
  const [spawnEffects, setSpawnEffects] = useState<{id: number, x: number, y: number}[]>([]);

  const speedRef = useRef(1);
  const patternRef = useRef<MovementPattern>('random');
  const waypointsRef = useRef<{x: number, y: number}[]>([]);
  const customPathIndicesRef = useRef<number[]>([0, 0, 0]); 

  const fishMovementState = useRef<Record<string, { nextMoveTime: number; schoolId?: number; schoolUntil?: number }>>({});
  
  const schoolTargetsRef = useRef([
    { x: 25, y: 25, vx: 0.4, vy: 0.2 },
    { x: 75, y: 75, vx: -0.3, vy: -0.15 },
    { x: 50, y: 50, vx: 0.2, vy: -0.3 }
  ]);

  useEffect(() => {
    return () => { soundService.stopBGM(); };
  }, []);

  useEffect(() => { speedRef.current = gameSpeed; }, [gameSpeed]);

  useEffect(() => {
    patternRef.current = movementPattern;
    waypointsRef.current = customWaypoints;
  }, [movementPattern, customWaypoints]);

  const toggleWeather = () => {
      const types = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.STORM];
      const currentIndex = types.indexOf(weather);
      const nextIndex = (currentIndex + 1) % types.length;
      setWeather(types[nextIndex]);
      onShowMessage(`Thời tiết: ${types[nextIndex] === WeatherType.CLEAR ? 'Nắng đẹp' : types[nextIndex] === WeatherType.RAIN ? 'Mưa rơi' : 'Bão tố!'}`);
  };

  const spawnSparkles = (x: number, y: number) => {
      const id = Date.now() + Math.random();
      setSpawnEffects(prev => [...prev, { id, x, y }]);
      setTimeout(() => setSpawnEffects(prev => prev.filter(e => e.id !== id)), 1500);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedEntity && !e.defaultPrevented) setSelectedEntity(null);
    if (movementPattern !== 'custom') return;
    if (shopOpen || foodMenuOpen || priceListOpen || movementMenuOpen) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCustomWaypoints(prev => [...prev, { x, y }]);
  };

  const clearWaypoints = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomWaypoints([]);
    customPathIndicesRef.current = [0, 0, 0];
  };

  const zoneEntities = entities.filter(e => 
    e.type === EntityType.FISH && (e.habitat === currentZone || (!e.habitat && currentZone === AquaZone.CORAL_REEF))
  );

  const currentFishCount = zoneEntities.length;
  const isFull = currentFishCount >= MAX_FISH_COUNT;

  // --- GAME LOOP ---
  useEffect(() => {
    let time = 0;
    const tick = setInterval(() => {
      const now = Date.now();
      const currentSpeed = speedRef.current;
      const currentPattern = patternRef.current;
      const currentWaypoints = waypointsRef.current;
      
      time += 0.01 * currentSpeed;

      // School Leaders Update
      schoolTargetsRef.current.forEach((target, index) => {
        if (currentPattern === 'random') {
             target.x += target.vx * currentSpeed;
             target.y += target.vy * currentSpeed;
             if (Math.random() < 0.05) { target.vx += (Math.random() - 0.5) * 0.3; target.vy += (Math.random() - 0.5) * 0.3; }
             if (target.x < 5 || target.x > 95) target.vx *= -1;
             if (target.y < 5 || target.y > 95) target.vy *= -1;
        } else if (currentPattern === 'circle') {
             const phase = index * (Math.PI * 2 / 3);
             target.x = 50 + 30 * Math.cos(time * currentSpeed + phase);
             target.y = 50 + 20 * Math.sin(time * currentSpeed + phase);
        } else if (currentPattern === 'zigzag') {
             const phase = index * 20;
             let newX = (time * 10 * 0.5 * currentSpeed + phase) % 200;
             if (newX > 100) newX = 200 - newX;
             target.x = newX;
             target.y = 50 + 35 * Math.sin((target.x + phase) * 0.1);
        } else if (currentPattern === 'custom') {
            if (currentWaypoints.length > 0) {
                const currentIndex = customPathIndicesRef.current[index] % currentWaypoints.length;
                const dest = currentWaypoints[currentIndex];
                const dx = dest.x - target.x;
                const dy = dest.y - target.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 2) {
                    customPathIndicesRef.current[index] = (currentIndex + 1) % currentWaypoints.length;
                } else {
                    target.x += (dx / dist) * 0.8 * currentSpeed;
                    target.y += (dy / dist) * 0.8 * currentSpeed;
                }
            } else {
                target.x = 50 + 10 * Math.cos(time + index);
                target.y = 50 + 10 * Math.sin(time + index);
            }
        }
        target.x = Math.max(2, Math.min(98, target.x));
        target.y = Math.max(2, Math.min(98, target.y));
      });

      setEntities(prev => {
        let hasUpdates = false;
        const currentZoneCount = prev.filter(e => e.type === EntityType.FISH && e.habitat === currentZone).length;
        const newBabies: Entity[] = [];
        const eatenIds: string[] = [];
        const alertMessages: string[] = [];

        const updatedEntities = prev.map(entity => {
          if (entity.type !== EntityType.FISH) return entity;
          if (eatenIds.includes(entity.id)) return entity; 
          
          if (!fishMovementState.current[entity.id]) fishMovementState.current[entity.id] = { nextMoveTime: 0 };
          const fishState = fishMovementState.current[entity.id];

          if (now < fishState.nextMoveTime) return entity;

          hasUpdates = true;
          let duration = 3000 / currentSpeed;
          let newReproduction = entity.reproductionProgress || 0;
          if (entity.hunger > 60 && entity.happiness > 60) newReproduction += 3 * currentSpeed; 

          if (newReproduction >= 100 && currentZoneCount + newBabies.length < MAX_FISH_COUNT) {
             newReproduction = 0;
             newBabies.push({
                ...entity, id: Date.now().toString() + Math.random(), name: entity.name + " Con",
                hunger: 50, happiness: 100, reproductionProgress: 0,
             });
             // Trigger birth visual effect
             setTimeout(() => spawnSparkles(entity.x, entity.y), 0);
          }

          let targetX, targetY;
          let newHunger = Math.max(0, entity.hunger - (0.5 * currentSpeed));
          let justAte = false;

          // Predator logic
          if (entity.diet === 'carnivore' && entity.hunger < 40) {
              let closestPrey: Entity | null = null;
              let minPreyDist = 10000;
              prev.forEach(other => {
                  if (other.type === EntityType.FISH && other.id !== entity.id && other.habitat === entity.habitat && !eatenIds.includes(other.id) && other.diet !== 'carnivore') {
                      const d = Math.sqrt(Math.pow(other.x - entity.x, 2) + Math.pow(other.y - entity.y, 2));
                      if (d < minPreyDist) { minPreyDist = d; closestPrey = other; }
                  }
              });
              if (closestPrey && minPreyDist < 100) { // Limit sight range
                  const prey = closestPrey as Entity;
                  if (minPreyDist < 5) {
                      eatenIds.push(prey.id); newHunger = 100; justAte = true;
                      if (entity.habitat === currentZone) { alertMessages.push(`${entity.name} đã ăn thịt ${prey.name}! 😱`); soundService.playSFX('catch'); }
                      targetX = prey.x; targetY = prey.y; duration = 1000 / currentSpeed;
                  } else {
                      targetX = prey.x; targetY = prey.y; duration = 1500 / currentSpeed; 
                  }
              }
          } 
          
          if (!justAte && !targetX) {
              const forceSchooling = currentPattern !== 'random';
              if (fishState.schoolUntil && now > fishState.schoolUntil && !forceSchooling) {
                  fishState.schoolId = undefined; fishState.schoolUntil = undefined;
              }
              if (fishState.schoolId === undefined && (forceSchooling || Math.random() < 0.3)) {
                  fishState.schoolId = Math.floor(Math.random() * schoolTargetsRef.current.length);
                  fishState.schoolUntil = now + (8000 + Math.random() * 6000); 
              }
              if (fishState.schoolId !== undefined) {
                  const leader = schoolTargetsRef.current[fishState.schoolId];
                  const spread = forceSchooling ? 6 : 12; 
                  targetX = leader.x + (Math.random() * spread - spread/2);
                  targetY = leader.y + (Math.random() * spread - spread/2);
                  duration = 2000 / currentSpeed; 
              } else {
                  targetX = Math.random() * 90 + 5;
                  targetY = Math.random() * 90 + 5;
                  duration = (3000 + Math.random() * 4000) / currentSpeed;
              }
          }

          let isColliding = false;
          if (targetX !== undefined) {
             if (targetX < 2 || targetX > 98 || targetY < 2 || targetY > 98) isColliding = true;
             targetX = Math.max(2, Math.min(98, targetX));
             targetY = Math.max(2, Math.min(98, targetY || 0));
          } else { targetX = entity.x; targetY = entity.y; }

          fishState.nextMoveTime = now + duration;
          const dx = targetX - entity.x;
          const dy = targetY - entity.y;
          let newRotation = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI) * 1.2;
          newRotation = Math.max(-25, Math.min(25, newRotation));

          return { 
              ...entity, x: targetX, y: targetY, hunger: newHunger,
              facingRight: dx > 0, rotation: newRotation, reproductionProgress: newReproduction,
              transitionDuration: duration, isColliding: isColliding
          };
        });

        if (alertMessages.length > 0) onShowMessage(alertMessages[0]);
        if (newBabies.length > 0 && newBabies[0].habitat === currentZone) {
            soundService.playSFX('buy'); onShowMessage("Cá con vừa chào đời! 🐟");
        }
        if (selectedEntity) {
            const updatedSelected = updatedEntities.find(e => e.id === selectedEntity.id);
            if (updatedSelected) setSelectedEntity(updatedSelected); else setSelectedEntity(null);
        }
        return hasUpdates ? [...updatedEntities.filter(e => !eatenIds.includes(e.id)), ...newBabies] : prev;
      });
    }, 200);
    return () => clearInterval(tick);
  }, [currentZone, selectedEntity, movementPattern]);

  // --- ACTIONS ---
  const handleFeed = (food: typeof FISH_FOODS[0]) => {
    if (coins < food.price) { onShowMessage(`Không đủ tiền!`); return; }
    soundService.playSFX('feed');
    setCoins(c => c - food.price);
    setEntities(prev => prev.map(e => e.type === EntityType.FISH && e.habitat === currentZone ? { 
        ...e, hunger: Math.min(100, e.hunger + food.hunger), happiness: Math.min(100, e.happiness + food.happiness), reproductionProgress: Math.min(100, (e.reproductionProgress || 0) + food.hunger * 0.4)
    } : e));
    onShowMessage(`Đã rắc ${food.name}!`);
    setFoodMenuOpen(false);
  };

  const handleBuyFish = async (species: typeof FISH_SPECIES[0]) => {
    if (isFull) { onShowMessage("Bể cá đã đầy!"); return; }
    if (coins < species.price) { onShowMessage("Không đủ tiền!"); return; }
    setCoins(c => c - species.price);
    soundService.playSFX('buy');
    const name = await generateName(species.name);
    setEntities(prev => [...prev, {
        id: Date.now().toString(), name, emoji: species.emoji, type: EntityType.FISH,
        hunger: 100, happiness: 100, x: 50, y: 50, species: species.name, diet: species.diet as any, habitat: currentZone, facingRight: Math.random() > 0.5, reproductionProgress: 0, transitionDuration: 3000
    }]);
    onShowMessage(`Chào mừng ${name}!`);
    setShopOpen(false);
  };

  const handleFishClick = (fish: Entity) => {
    if (sellMode) {
        const price = Math.floor((FISH_SPECIES.find(s => s.name === fish.species)?.price || 20) * 0.6);
        setEntities(prev => prev.filter(e => e.id !== fish.id));
        setCoins(prev => prev + price);
        soundService.playSFX('buy'); 
        onShowMessage(`Đã bán ${fish.name} (+${price} xu)`);
        if (selectedEntity?.id === fish.id) setSelectedEntity(null);
    } else {
        setSelectedEntity(fish);
    }
  };

  // --- STYLES ---
  const getZoneStyles = () => {
    switch(currentZone) {
      case AquaZone.OPEN_OCEAN:
        return {
           bg: 'bg-[radial-gradient(circle_at_top,_#1e40af_0%,_#0f172a_100%)]',
           decor: <>
               <div className="absolute bottom-[10%] left-[10%] text-[12rem] opacity-20 blur-[4px] animate-[gentle-float_8s_infinite] mix-blend-overlay">🐋</div>
               <div className="absolute top-[30%] right-[15%] text-[8rem] opacity-10 blur-[8px] animate-[float-bob_12s_infinite]">🦈</div>
           </>
        };
      case AquaZone.CORAL_REEF:
      default:
        return {
           bg: 'bg-[radial-gradient(ellipse_at_top_right,_#22d3ee_0%,_#0284c7_50%,_#0f172a_100%)]',
           decor: <>
              <div className="absolute bottom-[-20px] left-[5%] text-[10rem] opacity-90 blur-[1px] animate-[gentle-float_5s_infinite] drop-shadow-2xl brightness-75">🪸</div>
              <div className="absolute bottom-[-30px] left-[25%] text-[8rem] opacity-80 blur-[2px] animate-[gentle-float_7s_infinite_reverse] brightness-75">🌿</div>
              <div className="absolute bottom-0 right-[5%] text-[12rem] opacity-80 blur-[1px] animate-[gentle-float_6s_infinite] brightness-50">🪨</div>
              <div className="absolute bottom-[10%] right-[25%] text-[6rem] opacity-60 blur-[3px]">🐚</div>
           </>
        };
    }
  };
  const zoneStyle = getZoneStyles();

  return (
    <div className={`relative w-full h-full overflow-hidden transition-all duration-1000 ${sellMode ? 'cursor-crosshair' : ''} group/aquarium`} onClick={handleBackgroundClick}>
      
      {/* 1. DEEP BACKGROUND */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${zoneStyle.bg}`}></div>
      
      {/* 2. GOD RAYS (Sunbeams) */}
      {weather === WeatherType.CLEAR && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay sun-beams"></div>
      )}

      {/* 3. PARALLAX DECOR (Back) */}
      <div className="absolute inset-0 z-0 pointer-events-none">{zoneStyle.decor}</div>

      {/* 4. WATER SURFACE & WAVES */}
      <div className={`absolute top-0 left-0 w-[200%] h-64 pointer-events-none transition-all duration-1000
          ${weather === WeatherType.STORM ? 'opacity-60 animate-[wave_3s_linear_infinite] scale-y-150 brightness-50' : 'opacity-30 animate-[wave_8s_linear_infinite]'}
      `} style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="white"/></svg>')`, backgroundSize: '50% 100%' }}></div>

      {/* 5. WEATHER EFFECTS */}
      <div className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-1000 
          ${weather === WeatherType.RAIN ? 'weather-rain opacity-60' : weather === WeatherType.STORM ? 'weather-rain opacity-90 mix-blend-multiply bg-black/50' : 'opacity-0'}
      `}></div>
      {weather === WeatherType.STORM && <div className="absolute inset-0 z-10 weather-flash bg-white/30 mix-blend-overlay pointer-events-none"></div>}

      {/* 6. BUBBLES - Multi-layer for depth */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(15)].map((_, i) => (
             <div key={i} className="absolute text-blue-100/20 bubble" style={{
                 left: `${Math.random()*100}%`, animation: `rise ${5+Math.random()*10}s infinite`, fontSize: `${0.5+Math.random()*1.5}rem`, animationDelay: `${Math.random()*10}s`
             }}>🫧</div>
          ))}
      </div>

      {/* 7. CINEMATIC VIGNETTE & GLOW */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,10,30,0.8)_100%)]"></div>
      
      {/* CUSTOM PATH LINES */}
      {movementPattern === 'custom' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10"><polyline points={customWaypoints.map(p => `${p.x}%,${p.y}%`).join(' ')} fill="none" stroke="#4ade80" strokeWidth="2" strokeDasharray="5,5" opacity="0.6" filter="drop-shadow(0 0 2px #4ade80)" /></svg>
      )}

      {/* --- HUD --- */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-40 pointer-events-none">
          {/* Controls Capsule */}
          <div className="pointer-events-auto flex flex-col gap-4">
             <div className="flex gap-3">
                 <button onClick={onGoBack} className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-[1.2rem] border border-white/20 text-2xl hover:bg-white/10 hover:scale-105 transition-all shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex items-center justify-center">🏡</button>
                 <div className="bg-white/5 backdrop-blur-xl rounded-[1.2rem] px-5 flex items-center gap-4 border border-white/20 h-14 shadow-lg">
                     <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Speed</span>
                     <input type="range" min="0.5" max="3" step="0.5" value={gameSpeed} onChange={(e) => setGameSpeed(parseFloat(e.target.value))} className="w-24 accent-cyan-400 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                     <button onClick={toggleWeather} className="text-2xl hover:scale-110 transition-transform drop-shadow-md">{weather === WeatherType.CLEAR ? '☀️' : weather === WeatherType.RAIN ? '🌧️' : '⛈️'}</button>
                 </div>
             </div>
             
             {/* Zones Selector */}
             <div className="flex flex-col gap-2 mt-2 origin-top-left">
                 {ZONES.map(zone => (
                    <button key={zone.id} onClick={() => setCurrentZone(zone.id)} className={`group flex items-center gap-3 pl-3 pr-5 h-12 rounded-full transition-all duration-300 backdrop-blur-md border ${currentZone === zone.id ? `bg-gradient-to-r ${zone.color} border-white/40 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] translate-x-2` : 'bg-black/40 border-white/5 text-white/50 hover:bg-black/60 hover:text-white'}`}>
                        <span className="text-2xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{zone.emoji}</span>
                        <span className={`text-sm font-black tracking-wide ${currentZone !== zone.id ? 'hidden md:inline opacity-80' : ''}`}>{zone.name}</span>
                    </button>
                 ))}
             </div>
          </div>

          {/* Stats Capsule */}
          <div className="pointer-events-auto flex flex-col items-end gap-3">
              <div className="bg-white/5 backdrop-blur-xl pl-6 pr-2 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-4 group hover:bg-white/10 transition-colors">
                <span className="font-black text-2xl text-white tracking-tight drop-shadow-md">{coins.toLocaleString()} <span className="text-yellow-400 text-base">Xu</span></span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-xl shadow-inner">💰</div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black backdrop-blur-md border tracking-widest uppercase shadow-lg ${isFull ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse' : 'bg-blue-500/10 border-blue-400/30 text-blue-200'}`}>
                  Capacity {currentFishCount}/{MAX_FISH_COUNT}
              </div>
          </div>
      </div>

      {/* --- ENTITIES --- */}
      {zoneEntities.map((fish, index) => {
          const isSelected = selectedEntity?.id === fish.id;
          return (
            <div key={fish.id} onClick={(e) => { e.stopPropagation(); handleFishClick(fish); }}
                className={`absolute flex flex-col items-center justify-center transition-all cursor-pointer group/fish ${fish.isColliding ? 'shake-hit' : 'gentle-float'}`}
                style={{ 
                    left: `${fish.x}%`, top: `${fish.y}%`,
                    transition: `top ${fish.transitionDuration}ms linear, left ${fish.transitionDuration}ms linear, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)`,
                    transform: `rotate(${fish.rotation}deg) scaleX(${fish.facingRight ? -1 : 1}) scale(${isSelected ? 1.4 : 1})`,
                    zIndex: isSelected ? 30 : 10
                }}
            >
                {/* Glow behind fish */}
                {isSelected && <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>}
                
                {/* Status Icons */}
                {(fish.reproductionProgress || 0) > 80 && <div className="absolute -top-10 text-lg animate-bounce drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">❤️</div>}
                {fish.hunger < 40 && fish.diet === 'carnivore' && <div className="absolute -top-12 text-xl animate-pulse drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">🥩</div>}
                
                <div className={`text-7xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] filter brightness-110 contrast-125 transition-transform group-hover/fish:scale-110`}>
                    {fish.emoji}
                </div>
            </div>
          );
      })}

      {/* --- SPAWN EFFECTS (Sparkles) --- */}
      {spawnEffects.map(effect => (
          <div key={effect.id} className="absolute pointer-events-none z-50 flex items-center justify-center" style={{ left: `${effect.x}%`, top: `${effect.y}%` }}>
              <div className="absolute animate-ping w-24 h-24 bg-yellow-200/40 rounded-full blur-xl duration-700"></div>
              <div className="absolute animate-ping w-12 h-12 bg-white/60 rounded-full blur-md delay-100"></div>
              <div className="absolute text-5xl animate-[pop-in_0.5s_ease-out] drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">✨</div>
              <div className="absolute text-2xl animate-[rise_1s_ease-out] -translate-y-6 translate-x-6 opacity-80">🫧</div>
              <div className="absolute text-xl animate-[rise_1.2s_ease-out] -translate-y-4 -translate-x-6 delay-75 opacity-80">🫧</div>
          </div>
      ))}

      {/* --- INSPECTOR PANEL (Glass Card) --- */}
      {selectedEntity && !sellMode && (
          <div className="absolute top-28 right-6 w-80 bg-slate-900/60 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] z-40 animate-slide-up text-white" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">{selectedEntity.name}</h3>
                      <p className="text-xs text-blue-200/60 font-bold uppercase tracking-widest">{selectedEntity.species}</p>
                  </div>
                  <button onClick={() => setSelectedEntity(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors">✕</button>
              </div>
              
              <div className="flex justify-center mb-8 relative group">
                   <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                   <div className="text-9xl drop-shadow-2xl animate-[float-bob_3s_infinite] relative z-10">{selectedEntity.emoji}</div>
                   <div className="absolute -bottom-4 w-24 h-4 bg-black/60 blur-xl rounded-[100%]"></div>
              </div>

              <div className="space-y-4 mb-6">
                  {['Hunger', 'Happiness', 'Growth'].map((stat, i) => {
                      const val = i === 0 ? selectedEntity.hunger : i === 1 ? selectedEntity.happiness : (selectedEntity.reproductionProgress || 0);
                      const color = i === 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : i === 1 ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600';
                      const label = i === 0 ? 'Độ no' : i === 1 ? 'Vui vẻ' : 'Sinh trưởng';
                      return (
                          <div key={stat}>
                              <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                                  <span>{label}</span>
                                  <span>{Math.round(val)}%</span>
                              </div>
                              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
                                  <div className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-700 ease-out`} style={{width: `${val}%`}}></div>
                              </div>
                          </div>
                      )
                  })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <Button variant="glass" className="text-xs py-3 rounded-xl hover:bg-white/20" onClick={() => { setLoadingFact(true); generateAnimalFact(selectedEntity).then(f => { onShowMessage(f); setLoadingFact(false); }) }} disabled={loadingFact}>💬 Trò chuyện</Button>
                  <Button variant="danger" className="text-xs py-3 rounded-xl" onClick={() => handleFishClick(selectedEntity)}>💲 Bán ngay</Button>
              </div>
          </div>
      )}

      {/* --- MODERN DOCK --- */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 max-w-[95vw]">
          <div className="flex items-end gap-4 bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]">
            <DockIcon emoji="🧭" label="Điều khiển" onClick={() => setMovementMenuOpen(true)} active={movementMenuOpen} color="text-purple-400" />
            <div className="w-px h-10 bg-white/10"></div>
            <DockIcon emoji="🍞" label="Cho ăn" onClick={() => setFoodMenuOpen(true)} active={foodMenuOpen} color="text-orange-400" />
            <DockIcon emoji="🛒" label="Cửa hàng" onClick={() => setShopOpen(true)} active={shopOpen} color="text-cyan-400" />
            <DockIcon emoji="📜" label="Tra cứu" onClick={() => setPriceListOpen(true)} active={priceListOpen} color="text-blue-400" />
            <div className="w-px h-10 bg-white/10"></div>
            <DockIcon emoji={sellMode ? '🛑' : '💲'} label={sellMode ? 'Dừng bán' : 'Bán cá'} onClick={() => setSellMode(!sellMode)} active={sellMode} color={sellMode ? 'text-red-400' : 'text-emerald-400'} />
          </div>
      </div>

      {/* --- MODALS (Reusing previous logic but ensuring they sit on top with high Z-index) --- */}
      {movementMenuOpen && <MovementModal onClose={() => setMovementMenuOpen(false)} pattern={movementPattern} setPattern={setMovementPattern} onClear={clearWaypoints} hasPoints={customWaypoints.length > 0} />}
      {shopOpen && <ShopModal title={`Cửa hàng: ${ZONES.find(z => z.id === currentZone)?.name}`} items={FISH_SPECIES.filter(s => s.habitat === currentZone)} coins={coins} onBuy={handleBuyFish} onClose={() => setShopOpen(false)} isFull={isFull} />}
      {foodMenuOpen && <FoodModal items={FISH_FOODS} coins={coins} onFeed={handleFeed} onClose={() => setFoodMenuOpen(false)} />}
      {priceListOpen && <CatalogModal items={FISH_SPECIES} onClose={() => setPriceListOpen(false)} />}
    </div>
  );
};

// --- SUB-COMPONENTS ---
const DockIcon = ({ emoji, label, onClick, active, color }: any) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`group relative flex flex-col items-center gap-1 transition-all duration-300 ${active ? '-translate-y-6' : 'hover:-translate-y-3'}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg border border-white/10 transition-all ${active ? 'bg-white/20 scale-110 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/20 hover:bg-white/10'}`}>
            <span className={`filter drop-shadow-md ${color} transition-transform group-hover:scale-110`}>{emoji}</span>
        </div>
        <span className={`absolute -bottom-8 text-[10px] font-bold text-white/90 bg-black/80 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md`}>{label}</span>
        {active && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 shadow-[0_0_10px_currentColor] animate-pulse"></div>}
    </button>
);

const MovementModal = ({ onClose, pattern, setPattern, onClear, hasPoints }: any) => (
    <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-slide-up z-50 min-w-[340px]">
        <h3 className="text-white font-bold mb-4 flex justify-between items-center text-lg">🧭 Chế độ bơi <button onClick={onClose} className="hover:text-red-400">✕</button></h3>
        <div className="grid grid-cols-2 gap-3">
            {['random', 'circle', 'zigzag', 'custom'].map(p => (
                <Button key={p} variant={pattern === p ? 'neon' : 'glass'} className="text-sm py-3 capitalize" onClick={() => setPattern(p as any)}>
                    {p === 'random' ? '🎲 Tự do' : p === 'circle' ? '🔄 Xoáy' : p === 'zigzag' ? '〰️ Zíc zắc' : '✍️ Vẽ đường'}
                </Button>
            ))}
        </div>
        {pattern === 'custom' && <div className="mt-4 pt-4 border-t border-white/10 text-center"><p className="text-xs text-slate-400 mb-3">Chạm vào màn hình để đặt điểm đến</p><Button variant="danger" className="py-2 text-xs w-full" onClick={onClear} disabled={!hasPoints}>🗑️ Xóa đường đi</Button></div>}
    </div>
);

const ShopModal = ({ title, items, coins, onBuy, onClose, isFull }: any) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-6" onClick={onClose}>
        <div className="bg-slate-900/80 border border-white/10 rounded-[3rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-pop-in relative" onClick={e => e.stopPropagation()}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 tracking-tight">{title}</h2>
                <Button variant="danger" onClick={onClose} className="rounded-full px-4 py-2">Close</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 custom-scrollbar">
                {items.map((item: any) => (
                    <div key={item.name} onClick={() => onBuy(item)} className={`group relative bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 transition-all cursor-pointer hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] ${(coins < item.price || isFull) ? 'opacity-50 grayscale' : ''}`}>
                        {/* Card Sheen */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite] pointer-events-none rounded-[2rem]"></div>
                        
                        <div className="absolute top-5 right-5 text-[10px] font-black tracking-widest text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg uppercase">LVL {item.careLevel}</div>
                        <div className="h-40 flex items-center justify-center text-8xl drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500">{item.emoji}</div>
                        <div className="text-center relative z-10">
                            <h3 className="font-bold text-white text-xl mb-1">{item.name}</h3>
                            <div className="text-xs text-slate-400 mb-3 line-clamp-1">{item.description}</div>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg ${coins >= item.price ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                {item.price} <span>🟡</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const FoodModal = ({ items, onFeed, onClose }: any) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-white/20 rounded-[2rem] p-8 w-full max-w-lg animate-pop-in shadow-2xl" onClick={e => e.stopPropagation()}>
             <h2 className="text-3xl font-black text-white mb-6 text-center">🍽️ Thực Đơn</h2>
             <div className="space-y-4">
                 {items.map((food: any) => (
                     <div key={food.id} onClick={() => onFeed(food)} className="flex items-center gap-5 bg-white/5 p-4 rounded-2xl hover:bg-white/10 cursor-pointer border border-white/5 hover:border-orange-500/50 transition-all group">
                         <div className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{food.emoji}</div>
                         <div className="flex-1">
                             <div className="font-bold text-white text-lg">{food.name}</div>
                             <div className="flex gap-2 mt-1">
                                 <span className="text-[10px] font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded">+{food.hunger} NO</span>
                                 <span className="text-[10px] font-bold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">+{food.happiness} VUI</span>
                             </div>
                         </div>
                         <div className="font-black text-yellow-400 text-lg">{food.price} 💰</div>
                     </div>
                 ))}
             </div>
        </div>
    </div>
);

const CatalogModal = ({ items, onClose }: any) => (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-8" onClick={onClose}>
        <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col animate-slide-up overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/10 flex justify-between items-center"><h2 className="text-3xl font-black text-white tracking-tight">📖 Bách Khoa Toàn Thư</h2><button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">✕</button></div>
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-white/5 sticky top-0 backdrop-blur-xl text-white font-bold text-sm uppercase tracking-wider"><tr><th className="p-6">Loài</th><th className="p-6">Tên & Môi trường</th><th className="p-6">Đặc tính</th><th className="p-6">Giá</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                        {items.map((i: any) => (
                            <tr key={i.name} className="hover:bg-white/5 transition-colors group">
                                <td className="p-6 text-5xl group-hover:scale-110 transition-transform origin-left">{i.emoji}</td>
                                <td className="p-6">
                                    <div className="font-bold text-white text-lg">{i.name}</div>
                                    <div className="text-xs font-bold opacity-60 bg-white/10 inline-block px-2 py-0.5 rounded mt-1">{i.habitat}</div>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border ${i.diet === 'carnivore' ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-green-500/40 text-green-400 bg-green-500/10'}`}>{i.diet === 'carnivore' ? 'Ăn thịt' : 'Ăn cỏ'}</span>
                                    </div>
                                    <p className="text-sm mt-1 opacity-70 italic">"{i.description}"</p>
                                </td>
                                <td className="p-6 font-bold text-yellow-500">{i.price} 🟡</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);