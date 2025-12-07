
import React, { useState, useEffect, useRef } from 'react';
import { Entity, EntityType, RestaurantZone } from '../types';
import { RESTAURANT_MENU, RESTAURANT_CUSTOMERS } from '../constants';
import { Button } from './ui/Button';
import { soundService } from '../services/soundService';

interface RestaurantProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  onGoBack: () => void;
  onShowMessage: (msg: string) => void;
}

const TABLES = [
  { id: 1, x: 20, y: 55 },
  { id: 2, x: 50, y: 55 },
  { id: 3, x: 80, y: 55 },
  { id: 4, x: 35, y: 80 },
  { id: 5, x: 65, y: 80 },
];

interface Order {
    id: string;
    customerId: string;
    tableId: number;
    item: typeof RESTAURANT_MENU[0];
    status: 'pending' | 'cooking' | 'ready' | 'served';
    progress: number; // 0 to 100
}

export const Restaurant: React.FC<RestaurantProps> = ({ entities, setEntities, coins, setCoins, onGoBack, onShowMessage }) => {
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [effects, setEffects] = useState<{id: number, x: number, y: number, text: string, type: 'money'|'heart'}[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const nextCustomerId = useRef(1);

  // --- GAME LOOP ---
  useEffect(() => {
    const tick = setInterval(() => {
      // 1. UPDATE CUSTOMERS
      setCustomers(prev => {
        let updated = prev.map(c => {
           // MOVEMENT
           if (c.diningState === 'walking_in') {
               const table = TABLES.find(t => t.id === c.tableId);
               if (table) {
                   const dx = table.x - c.x;
                   const dy = table.y - c.y;
                   const dist = Math.sqrt(dx*dx + dy*dy);
                   if (dist < 2) {
                       return { ...c, diningState: 'waiting', x: table.x, y: table.y - 5, transitionDuration: 0 };
                   } else {
                       return { ...c, x: c.x + (dx/dist)*3, y: c.y + (dy/dist)*3, facingRight: dx > 0, transitionDuration: 500 };
                   }
               }
           } else if (c.diningState === 'walking_out') {
               const exitX = 120;
               const dx = exitX - c.x;
               if (dx < 2) return null; // Remove
               return { ...c, x: c.x + 3, facingRight: true, transitionDuration: 500 };
           }
           return c;
        }).filter(Boolean) as Entity[];

        // SPAWN NEW CUSTOMERS
        if (Math.random() < 0.05 && updated.length < TABLES.length) {
            const occupiedTables = updated.map(c => c.tableId);
            const freeTables = TABLES.filter(t => !occupiedTables.includes(t.id));
            
            if (freeTables.length > 0) {
                const table = freeTables[Math.floor(Math.random() * freeTables.length)];
                const customerType = RESTAURANT_CUSTOMERS[Math.floor(Math.random() * RESTAURANT_CUSTOMERS.length)];
                const orderItem = RESTAURANT_MENU[Math.floor(Math.random() * RESTAURANT_MENU.length)];
                
                const newCustId = `cust_${nextCustomerId.current++}`;
                
                updated.push({
                    id: newCustId,
                    name: customerType.name,
                    emoji: customerType.emoji,
                    type: EntityType.CUSTOMER,
                    species: 'Customer',
                    hunger: 100,
                    happiness: 50,
                    x: -15,
                    y: 70,
                    tableId: table.id,
                    diningState: 'walking_in',
                    orderItem: orderItem,
                    facingRight: true,
                    transitionDuration: 1000,
                });
            }
        }
        return updated;
      });

      // 2. UPDATE ORDERS (Cooking Progress)
      setOrders(prevOrders => {
          return prevOrders.map(order => {
              if (order.status === 'cooking') {
                  const newProgress = order.progress + 2; // Cooking speed
                  if (newProgress >= 100) {
                      soundService.playSFX('catch'); // Ding!
                      return { ...order, status: 'ready', progress: 100 };
                  }
                  return { ...order, progress: newProgress };
              }
              return order;
          });
      });

    }, 200);

    return () => clearInterval(tick);
  }, []);

  // Sync Customers -> Orders (Create pending orders when customer sits)
  useEffect(() => {
      customers.forEach(c => {
          if (c.diningState === 'waiting') {
              setOrders(prev => {
                  if (prev.find(o => o.customerId === c.id)) return prev; // Already ordered
                  // Create new order
                  soundService.playSFX('feed'); // Paper sound
                  return [...prev, {
                      id: `order_${c.id}`,
                      customerId: c.id,
                      tableId: c.tableId || 0,
                      item: c.orderItem!,
                      status: 'pending',
                      progress: 0
                  }];
              });
          }
      });
  }, [customers]);

  const spawnEffect = (x: number, y: number, text: string, type: 'money'|'heart') => {
      const id = Date.now() + Math.random();
      setEffects(prev => [...prev, { id, x, y, text, type }]);
      setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), 1500);
  };

  const startCooking = (orderId: string) => {
      soundService.playSFX('buy'); // Sizzle sound
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cooking' } : o));
  };

  const serveOrder = (order: Order) => {
      // Find customer
      const customer = customers.find(c => c.id === order.customerId);
      if (!customer) {
          // Customer left? remove order
          setOrders(prev => prev.filter(o => o.id !== order.id));
          return;
      }

      // Serve visuals
      soundService.playSFX('buy');
      setOrders(prev => prev.filter(o => o.id !== order.id)); // Remove from kitchen
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, diningState: 'eating' } : c));
      
      // Eating Timer
      setTimeout(() => {
          setCustomers(prev => {
              const c = prev.find(x => x.id === customer.id);
              if (c) {
                  spawnEffect(c.x, c.y, `+${c.orderItem!.price}`, 'money');
                  setCoins(old => old + c.orderItem!.price);
                  soundService.playSFX('buy'); // Cha-ching
                  return prev.map(p => p.id === customer.id ? { ...p, diningState: 'walking_out' } : p);
              }
              return prev;
          });
      }, 3000);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#0a0a0a] font-sans flex flex-col">
      
      {/* ========================================= */}
      {/* TOP: DINING ROOM (Lounge Theme) - 60%     */}
      {/* ========================================= */}
      <div className="relative w-full h-[60%] overflow-hidden perspective-1000 z-10 shadow-[0_20px_50px_rgba(0,0,0,1)]">
          {/* WALLPAPER & AMBIENCE */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#2e1065_0%,_#0f172a_100%)]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          {/* FLOOR - Wood Parquet */}
          <div className="absolute bottom-0 w-full h-[80%] bg-[#1e1b4b] origin-bottom transform rotate-x-12 scale-110 shadow-inner">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay"></div>
          </div>

          {/* WINDOWS - City Night View */}
          <div className="absolute top-8 left-[10%] w-32 h-40 bg-black rounded-t-full border-[8px] border-[#1e293b] overflow-hidden shadow-[0_0_30px_rgba(56,189,248,0.2)]">
               <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e1b4b]"></div>
               {/* City Lights */}
               <div className="absolute bottom-0 left-0 right-0 h-10 flex gap-1 items-end opacity-50">
                  <div className="w-4 h-8 bg-yellow-600"></div><div className="w-6 h-12 bg-blue-800"></div><div className="w-5 h-6 bg-purple-800"></div>
               </div>
               <div className="absolute top-4 right-4 text-yellow-100 text-xs opacity-80">✨</div>
          </div>
          <div className="absolute top-8 right-[10%] w-32 h-40 bg-black rounded-t-full border-[8px] border-[#1e293b] overflow-hidden shadow-[0_0_30px_rgba(56,189,248,0.2)]">
               <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e1b4b]"></div>
               <div className="absolute bottom-0 left-0 right-0 h-12 flex gap-1 items-end opacity-50">
                  <div className="w-5 h-5 bg-pink-800"></div><div className="w-8 h-10 bg-indigo-800"></div>
               </div>
          </div>

          {/* TABLES & LIGHTING */}
          {TABLES.map(t => (
            <div key={t.id} className="absolute flex items-center justify-center z-10" style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}>
                {/* SPOTLIGHT EFFECT */}
                <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[150px] border-l-transparent border-r-transparent border-b-yellow-100/10 blur-xl pointer-events-none"></div>
                <div className="absolute w-40 h-20 bg-yellow-500/10 blur-xl rounded-[100%] pointer-events-none translate-y-8"></div>
                
                {/* Table Top */}
                <div className="relative w-32 h-20 bg-[#0f172a] rounded-[50%] border-4 border-[#334155] shadow-2xl z-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 rounded-[50%]"></div>
                    <div className="w-24 h-12 bg-white/5 rounded-[50%] blur-sm"></div>
                    {/* Flower Vase */}
                    <div className="absolute -top-4 text-xl opacity-80">🌹</div>
                </div>
                {/* Chairs */}
                <div className="absolute -left-10 w-12 h-12 bg-[#4c1d95] rounded-full border-b-4 border-[#2e1065] shadow-lg"></div>
                <div className="absolute -right-10 w-12 h-12 bg-[#4c1d95] rounded-full border-b-4 border-[#2e1065] shadow-lg"></div>
                
                <div className="absolute -bottom-10 opacity-30 text-[10px] text-blue-200 font-bold tracking-widest uppercase">Table {t.id}</div>
            </div>
          ))}

          {/* CUSTOMERS */}
          {customers.map(c => {
             const hasReadyOrder = orders.find(o => o.customerId === c.id && o.status === 'ready');
             return (
              <div key={c.id} 
                  className="absolute flex flex-col items-center justify-center transition-all duration-500 ease-linear z-30"
                  style={{ left: `${c.x}%`, top: `${c.y - 12}%`, transitionDuration: `${c.transitionDuration}ms` }}
              >
                  {/* READY BUBBLE */}
                  {hasReadyOrder && <div className="absolute -top-32 animate-bounce z-50 cursor-pointer group" onClick={() => serveOrder(hasReadyOrder)}>
                      <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.6)] font-black text-xs flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                          <span className="text-lg">🍽️</span> <span>PHỤC VỤ</span>
                      </div>
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-emerald-500 mx-auto mt-[-1px]"></div>
                  </div>}

                  {/* EATING STATE */}
                  {c.diningState === 'eating' && (
                      <div className="absolute -top-24 z-40">
                          <div className="bg-white/90 p-3 rounded-full shadow-lg text-3xl animate-[float-bob_2s_infinite] border-2 border-orange-200">{c.orderItem?.emoji}</div>
                      </div>
                  )}

                  <div style={{ transform: `scaleX(${c.facingRight ? -1 : 1})` }} className="text-8xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] filter brightness-110 relative hover:scale-105 transition-transform">
                      {c.emoji}
                  </div>
                  {/* Shadow */}
                  <div className="w-20 h-4 bg-black/60 blur-md rounded-[100%] mt-[-5px]"></div>
              </div>
             );
          })}
          
           {/* EFFECTS */}
           {effects.map(e => (
              <div key={e.id} className="absolute pointer-events-none z-50 flex flex-col items-center animate-[rise_1.5s_ease-out]" style={{ left: `${e.x}%`, top: `${e.y - 25}%` }}>
                  <div className={`font-black text-5xl drop-shadow-lg ${e.type === 'money' ? 'text-yellow-400' : 'text-red-500'}`}>{e.text}</div>
              </div>
          ))}

          {/* HUD Top - Glassmorphism */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-50 pointer-events-none items-start">
              <div className="pointer-events-auto flex gap-3">
                <Button variant="glass" onClick={onGoBack} className="bg-slate-900/50 text-xs py-3 px-4 rounded-xl border-slate-700/50 hover:bg-slate-800">🏡 Trang chủ</Button>
                <Button variant="neon" onClick={() => setMenuOpen(true)} className="text-xs py-3 px-4 rounded-xl">📜 Thực Đơn</Button>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-xl pl-6 pr-2 py-2 rounded-full border border-white/10 shadow-lg flex items-center gap-4 pointer-events-auto">
                <span className="font-black text-2xl text-white tracking-tight drop-shadow-md">{coins.toLocaleString()} <span className="text-yellow-400 text-base">Xu</span></span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-xl shadow-inner">💰</div>
              </div>
          </div>
      </div>

      {/* ========================================= */}
      {/* BOTTOM: PROFESSIONAL KITCHEN - 40%        */}
      {/* ========================================= */}
      <div className="relative w-full h-[40%] bg-[#1e293b] border-t-4 border-slate-600 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.7)] z-20">
          {/* Tile Background */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30"></div>
          
          {/* Header */}
          <div className="h-12 bg-[#0f172a] flex items-center justify-between px-6 border-b border-slate-700 relative z-10 shadow-md">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-slate-200 font-bold uppercase tracking-widest text-sm">Khu Vực Bếp</span>
              </div>
              <div className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-3 py-1 rounded border border-cyan-800">Pending Orders: {orders.length}</div>
          </div>

          {/* KITCHEN RAIL */}
          <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-center custom-scrollbar bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
              {orders.length === 0 && (
                  <div className="w-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
                      <div className="text-4xl">👨‍🍳</div>
                      <div className="text-sm font-bold uppercase tracking-widest">Bếp đang rảnh...</div>
                  </div>
              )}
              
              {orders.map(order => {
                  const isCooking = order.status === 'cooking';
                  const isReady = order.status === 'ready';

                  return (
                      <div key={order.id} 
                           onClick={() => {
                               if (order.status === 'pending') startCooking(order.id);
                               if (isReady) serveOrder(order);
                           }}
                           className={`
                              relative w-40 h-52 flex-shrink-0 rounded-2xl flex flex-col items-center justify-between transition-all cursor-pointer select-none overflow-hidden group
                              ${order.status === 'pending' ? 'bg-slate-200 hover:scale-105 hover:bg-white shadow-lg' : ''}
                              ${isCooking ? 'bg-slate-800 border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : ''}
                              ${isReady ? 'bg-emerald-900 border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] scale-105' : ''}
                           `}
                      >
                          {/* Ticket Top Clip */}
                          <div className="absolute top-0 left-0 right-0 h-2 bg-black/20"></div>

                          {/* Order Info */}
                          <div className={`w-full p-3 flex justify-between items-center text-[10px] font-black uppercase border-b ${isCooking ? 'text-orange-400 border-orange-500/30' : 'text-slate-500 border-slate-300'}`}>
                              <span>TABLE {order.tableId}</span>
                              <span>#{order.id.split('_')[1]}</span>
                          </div>

                          {/* Cooking Visuals */}
                          <div className="flex flex-col items-center relative z-10 py-2">
                              {isCooking && <div className="absolute -inset-4 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>}
                              <div className={`text-6xl drop-shadow-xl transition-transform duration-500 ${isCooking ? 'animate-[shiver_0.2s_infinite]' : 'group-hover:scale-110'}`}>
                                  {order.item.emoji}
                              </div>
                              <div className={`text-xs font-bold text-center mt-2 px-2 leading-tight ${isCooking || isReady ? 'text-white' : 'text-slate-800'}`}>{order.item.name}</div>
                          </div>

                          {/* Progress Bar / Button */}
                          <div className="w-full p-3 bg-black/5 mt-auto">
                              {order.status === 'pending' && (
                                  <div className="w-full bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg text-center shadow-md uppercase tracking-wider group-hover:bg-blue-500">
                                      Nấu Ngay
                                  </div>
                              )}
                              {isCooking && (
                                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden relative">
                                      <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-200" style={{ width: `${order.progress}%` }}></div>
                                  </div>
                              )}
                              {isReady && (
                                  <div className="w-full bg-emerald-500 text-white text-[10px] font-bold py-2 rounded-lg text-center shadow-md animate-pulse uppercase tracking-wider">
                                      Phục Vụ
                                  </div>
                              )}
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* MENU MODAL (Overhaul) */}
      {menuOpen && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setMenuOpen(false)}>
              <div className="bg-[#1e1b4b] border-[1px] border-indigo-500/30 rounded-[2rem] p-8 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(79,70,229,0.2)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                      <div>
                          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-cyan-200 tracking-tight uppercase">Thực Đơn Tối</h2>
                          <p className="text-indigo-300/60 text-sm font-bold tracking-widest mt-1">MIDNIGHT LOUNGE SELECTION</p>
                      </div>
                      <button onClick={() => setMenuOpen(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Food Column */}
                          <div>
                              <h3 className="text-xl font-bold text-orange-300 mb-6 uppercase tracking-widest border-l-4 border-orange-500 pl-4 flex items-center gap-2"><span>🍽️</span> Món Chính</h3>
                              <div className="space-y-4">
                                  {RESTAURANT_MENU.filter(i => i.type === 'food').map(item => (
                                      <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer">
                                          <div className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{item.emoji}</div>
                                          <div className="flex-1">
                                              <div className="text-white font-bold text-lg group-hover:text-orange-200 transition-colors">{item.name}</div>
                                              <div className="text-xs text-gray-400">Thời gian: {item.timeToEat / 1000}s</div>
                                          </div>
                                          <div className="text-yellow-400 font-black text-xl">{item.price} <span className="text-sm text-yellow-600">xu</span></div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* Drink Column */}
                          <div>
                              <h3 className="text-xl font-bold text-cyan-300 mb-6 uppercase tracking-widest border-l-4 border-cyan-500 pl-4 flex items-center gap-2"><span>🍸</span> Đồ Uống</h3>
                              <div className="space-y-4">
                                  {RESTAURANT_MENU.filter(i => i.type === 'drink').map(item => (
                                      <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer">
                                          <div className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{item.emoji}</div>
                                          <div className="flex-1">
                                              <div className="text-white font-bold text-lg group-hover:text-cyan-200 transition-colors">{item.name}</div>
                                              <div className="text-xs text-gray-400">Thời gian: {item.timeToEat / 1000}s</div>
                                          </div>
                                          <div className="text-yellow-400 font-black text-xl">{item.price} <span className="text-sm text-yellow-600">xu</span></div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
