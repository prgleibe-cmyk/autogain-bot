import React from 'react';

interface EliteLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const EliteLogo: React.FC<EliteLogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizes = {
    sm: 'h-16 w-16',
    md: 'h-32 w-32 lg:h-40 lg:w-40',
    lg: 'h-56 w-56 lg:h-64 lg:w-64',
    xl: 'h-72 w-72 lg:h-[28rem] lg:w-[28rem]' // Reduzido de 42rem para 28rem para melhor escala
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizes[size]} flex items-center justify-center group perspective-2000`}>
        
        {/* Container da Imagem */}
        <div className="relative z-10 w-full h-full flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-1">
          <img 
            src="/logo.png" 
            alt="AutoGain Logo" 
            className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2922/2922561.png';
            }}
          />
          
          {/* Brilho de Varredura */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_4s_infinite] skew-x-[-30deg]"></div>
          </div>
        </div>
      </div>
      
      {showText && (
        <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative inline-block">
             <h1 
              className="text-6xl lg:text-8xl font-[1000] tracking-tighter uppercase italic leading-none"
              style={{ 
                background: 'linear-gradient(180deg, #FFF9C4 0%, #FBBF24 45%, #D97706 55%, #78350F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.8))'
              }}
            >
              AutoGain
            </h1>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-[1px] w-8 bg-gold-600/50"></div>
            <p className="text-gold-500 font-black text-[10px] uppercase tracking-[1em] opacity-70">
               INSTITUTIONAL ALGO
            </p>
            <div className="h-[1px] w-8 bg-gold-600/50"></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-30deg); }
          40% { transform: translateX(200%) skewX(-30deg); }
          100% { transform: translateX(200%) skewX(-30deg); }
        }
      `}</style>
    </div>
  );
};

export default EliteLogo;