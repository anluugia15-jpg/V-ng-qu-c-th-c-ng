
import React, { useState } from 'react';
import { GameMode } from '../types';
import { soundService } from '../services/soundService';

interface DashboardProps {
  onSelectMode: (mode: GameMode) => void;
  coins: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectMode, coins }) => {
  const [hoveredCard, setHoveredCard] = useState<GameMode | null>(null);

  const handleSelectMode = (mode: GameMode) => {
    if (mode === GameMode.AQUARIUM) soundService.playBGM('aquarium');
    if (mode === GameMode.ZOO) soundService.playBGM('zoo');
    if (mode === GameMode.FARM) soundService.playBGM('zoo'); // Reuse zoo music for now
    if (mode === GameMode.GARDEN) soundService.playBGM('zoo'); // Reuse zoo music for garden
    if (mode === GameMode.RESTAURANT) soundService.playBGM('aquarium'); // Reuse calm music for restaurant
    onSelectMode(mode);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#020617] perspective-1000">
      
      {/* --- Immersive Background --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black animate-[aurora_30s_ease_infinite] bg-[length:200%_200%]"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        {[...Array(30)].map((_, i) => (
           <div 
             key={i}
             className="absolute rounded-full bg-white blur-[1px] opacity-20 animate-[float-bob_8s_infinite]"
             style={{
               left: `${Math.random() * 100}%`,
               top: `${Math.random() * 100}%`,
               width: `${Math.random() * 4 + 1}px`,
               height: `${Math.random() * 4 + 1}px`,
               animationDelay: `${Math.random() * 5}s`,
               animationDuration: `${Math.random() * 10 + 10}s`
             }}
           />
        ))}
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center w-full max-w-7xl px-4 overflow-y-auto custom-scrollbar h-full justify-center py-10">
        
        {/* Title Section */}
        <div className="mt-4 mb-8 text-center relative animate-slide-up group flex-shrink-0">
           <div className="absolute -inset-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
           <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-slate-300 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-tighter mb-2">
             THẾ GIỚI
           </h1>
           <div className="flex items-center justify-center gap-4">
             <span className="h-1 w-12 bg-blue-400 rounded-full"></span>
             <h2 className="text-2xl md:text-5xl font-bold text-blue-200 tracking-widest uppercase">Thú Cưng</h2>
             <span className="h-1 w-12 bg-blue-400 rounded-full"></span>
           </div>
        </div>

        {/* 3D Cards Container */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl px-4 perspective-1000 mb-8 items-center">
          
          {/* AQUARIUM CARD */}
          <div 
            onClick={() => handleSelectMode(GameMode.AQUARIUM)}
            onMouseEnter={() => setHoveredCard(GameMode.AQUARIUM)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative w-72 h-[350px] rounded-[3rem] cursor-pointer transition-all duration-500 ease-out transform-style-3d
              ${hoveredCard === GameMode.AQUARIUM ? 'scale-105 rotate-y-[-5deg] rotate-x-[5deg] shadow-[0_50px_100px_-20px_rgba(59,130,246,0.5)] z-20' : 'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-10'}
            `}
          >
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-[#0c2444] border border-blue-500/30 backdrop-blur-sm">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e40af_0%,_#020617_80%)]"></div>
               <div className="absolute inset-0 opacity-30 mix-blend-overlay animate-[shimmer_6s_infinite] bg-gradient-to-tr from-transparent via-cyan-300 to-transparent"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center translate-z-20 group-hover:translate-z-30 transition-transform duration-500">
                  <div className="text-[7rem] drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] animate-[float-bob_5s_infinite]">🐬</div>
               </div>
               <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-z-30 flex flex-col justify-end p-6">
                  <h2 className="text-3xl font-black text-white mb-1 tracking-wide group-hover:text-cyan-300 transition-colors">Thủy Cung</h2>
                  <p className="text-blue-200/80 font-medium text-xs">Đại dương huyền bí</p>
               </div>
            </div>
          </div>

          {/* ZOO CARD */}
          <div 
            onClick={() => handleSelectMode(GameMode.ZOO)}
            onMouseEnter={() => setHoveredCard(GameMode.ZOO)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative w-72 h-[350px] rounded-[3rem] cursor-pointer transition-all duration-500 ease-out transform-style-3d
              ${hoveredCard === GameMode.ZOO ? 'scale-105 rotate-y-[5deg] rotate-x-[5deg] shadow-[0_50px_100px_-20px_rgba(16,185,129,0.5)] z-20' : 'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-10'}
            `}
          >
             <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-[#052e16] border border-emerald-500/30 backdrop-blur-sm">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#059669_0%,_#022c22_80%)]"></div>
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/forest.png')]"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center translate-z-20 group-hover:translate-z-30 transition-transform duration-500">
                  <div className="text-[7rem] drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] animate-[float-bob_6s_infinite_reverse]">🦁</div>
               </div>
               <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-z-30 flex flex-col justify-end p-6">
                  <h2 className="text-3xl font-black text-white mb-1 tracking-wide group-hover:text-emerald-300 transition-colors">Sở Thú</h2>
                  <p className="text-emerald-200/80 font-medium text-xs">Vương quốc hoang dã</p>
               </div>
            </div>
          </div>

          {/* FARM CARD */}
          <div 
            onClick={() => handleSelectMode(GameMode.FARM)}
            onMouseEnter={() => setHoveredCard(GameMode.FARM)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative w-72 h-[350px] rounded-[3rem] cursor-pointer transition-all duration-500 ease-out transform-style-3d
              ${hoveredCard === GameMode.FARM ? 'scale-105 rotate-y-[-5deg] rotate-x-[-5deg] shadow-[0_50px_100px_-20px_rgba(245,158,11,0.5)] z-20' : 'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-10'}
            `}
          >
             <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-[#451a03] border border-amber-500/30 backdrop-blur-sm">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#d97706_0%,_#451a03_80%)]"></div>
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center translate-z-20 group-hover:translate-z-30 transition-transform duration-500">
                  <div className="text-[7rem] drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] animate-[float-bob_5.5s_infinite]">🐮</div>
               </div>
               <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-z-30 flex flex-col justify-end p-6">
                  <h2 className="text-3xl font-black text-white mb-1 tracking-wide group-hover:text-amber-300 transition-colors">Nông Trại</h2>
                  <p className="text-amber-200/80 font-medium text-xs">Cuộc sống thanh bình</p>
               </div>
            </div>
          </div>

          {/* GARDEN CARD */}
          <div 
            onClick={() => handleSelectMode(GameMode.GARDEN)}
            onMouseEnter={() => setHoveredCard(GameMode.GARDEN)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative w-72 h-[350px] rounded-[3rem] cursor-pointer transition-all duration-500 ease-out transform-style-3d
              ${hoveredCard === GameMode.GARDEN ? 'scale-105 rotate-y-[5deg] rotate-x-[5deg] shadow-[0_50px_100px_-20px_rgba(236,72,153,0.5)] z-20' : 'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-10'}
            `}
          >
             <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-[#3f0f3f] border border-pink-500/30 backdrop-blur-sm">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#db2777_0%,_#500724_80%)]"></div>
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/flowers.png')]"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center translate-z-20 group-hover:translate-z-30 transition-transform duration-500">
                  <div className="text-[7rem] drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] animate-[float-bob_4.5s_infinite_reverse]">🍎</div>
               </div>
               <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-z-30 flex flex-col justify-end p-6">
                  <h2 className="text-3xl font-black text-white mb-1 tracking-wide group-hover:text-pink-300 transition-colors">Vườn Cây</h2>
                  <p className="text-pink-200/80 font-medium text-xs">Thu hoạch mùa màng</p>
               </div>
            </div>
          </div>

          {/* RESTAURANT CARD */}
          <div 
            onClick={() => handleSelectMode(GameMode.RESTAURANT)}
            onMouseEnter={() => setHoveredCard(GameMode.RESTAURANT)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative w-72 h-[350px] rounded-[3rem] cursor-pointer transition-all duration-500 ease-out transform-style-3d
              ${hoveredCard === GameMode.RESTAURANT ? 'scale-105 rotate-y-[5deg] rotate-x-[5deg] shadow-[0_50px_100px_-20px_rgba(251,146,60,0.5)] z-20' : 'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-10'}
            `}
          >
             <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-[#431407] border border-orange-500/30 backdrop-blur-sm">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#ea580c_0%,_#431407_80%)]"></div>
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/checkered-light-emboss.png')]"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center translate-z-20 group-hover:translate-z-30 transition-transform duration-500">
                  <div className="text-[7rem] drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] animate-[float-bob_5s_infinite]">🍔</div>
               </div>
               <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-z-30 flex flex-col justify-end p-6">
                  <h2 className="text-3xl font-black text-white mb-1 tracking-wide group-hover:text-orange-300 transition-colors">Quán Ăn</h2>
                  <p className="text-orange-200/80 font-medium text-xs">Phục vụ thực khách</p>
               </div>
            </div>
          </div>

        </div>

        {/* Footer Stats - Floating Capsule */}
        <div className="mt-4 mb-8 animate-slide-up flex-shrink-0" style={{animationDelay: '0.2s'}}>
          <div className="bg-white/5 backdrop-blur-2xl px-12 py-5 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center gap-6 group hover:bg-white/10 transition-all hover:scale-105">
             <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center shadow-lg text-3xl group-hover:rotate-12 transition-transform">💰</div>
                <div className="absolute -inset-2 bg-yellow-400/20 blur-xl rounded-full animate-pulse"></div>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-blue-300 uppercase font-bold tracking-[0.2em]">Tài sản</span>
               <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">{coins.toLocaleString()} <span className="text-yellow-400 text-2xl">Xu</span></span>
             </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
