import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'wood' | 'glass' | 'neon';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  // Base style with 3D feel and interaction
  const baseStyle = "relative px-5 py-2.5 rounded-2xl font-black tracking-wide transform transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 overflow-hidden group select-none outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-transparent";
  
  const variants = {
    primary: "bg-gradient-to-b from-blue-400 to-blue-600 text-white shadow-[0_4px_0_rgb(30,58,138),0_10px_20px_rgba(59,130,246,0.5)] active:shadow-none active:translate-y-1 border-t border-blue-300",
    secondary: "bg-gradient-to-b from-purple-400 to-purple-600 text-white shadow-[0_4px_0_rgb(88,28,135),0_10px_20px_rgba(147,51,234,0.5)] active:shadow-none active:translate-y-1 border-t border-purple-300",
    danger: "bg-gradient-to-b from-rose-400 to-red-600 text-white shadow-[0_4px_0_rgb(159,18,57),0_10px_20px_rgba(225,29,72,0.5)] active:shadow-none active:translate-y-1 border-t border-rose-300",
    success: "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_4px_0_rgb(6,78,59),0_10px_20px_rgba(16,185,129,0.5)] active:shadow-none active:translate-y-1 border-t border-emerald-300",
    
    // Thematic variants
    wood: "bg-[#8B5A2B] text-[#FFE4B5] border-2 border-[#5C3A1A] shadow-[0_4px_0_#5C3A1A,0_6px_10px_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]",
    glass: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-white/40",
    neon: "bg-slate-900/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] backdrop-blur-md",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button className={`${baseStyle} ${selectedVariant} ${className}`} {...props}>
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-150%] group-hover:animate-[shimmer_0.8s_infinite] pointer-events-none" />
      
      {/* Inner glow/highlight for 3D depth */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_0_rgba(255,255,255,0.2)] pointer-events-none" />
      
      <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">{children}</span>
    </button>
  );
};