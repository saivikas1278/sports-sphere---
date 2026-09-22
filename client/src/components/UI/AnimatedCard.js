import React, { useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const AnimatedCard = ({ 
  children, 
  className = "", 
  tiltEffect = true, 
  glowEffect = true, 
  hoverScale = true,
  borderGlow = false,
  backgroundPattern = false 
}) => {
  const isHovered = false;
  const mousePosition = { x: 0, y: 0 };
  const setIsHovered = () => {};
  const setMousePosition = () => {};
  const cardRef = useRef(null);
  const { isDark } = useTheme();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const getTransform = () => {
    if (!tiltEffect || !isHovered) return '';
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return '';
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (mousePosition.y - centerY) / 10;
    const rotateY = (centerX - mousePosition.x) / 10;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${hoverScale ? 'scale(1.02)' : ''}`;
  };

  const getGlowStyle = () => {
    if (!glowEffect || !isHovered) return {};
    
    return {
      boxShadow: isDark 
        ? `
          0 0 20px rgba(34, 211, 238, 0.2),
          0 0 40px rgba(34, 211, 238, 0.15),
          0 10px 30px rgba(0, 0, 0, 0.2)
        `
        : `
          0 0 20px rgba(59, 130, 246, 0.15),
          0 0 40px rgba(59, 130, 246, 0.1),
          0 10px 30px rgba(0, 0, 0, 0.1)
        `
    };
  };

  const getBorderGlowStyle = () => {
    if (!borderGlow || !isHovered) return {};
    
    return {
      background: isDark
        ? `
          linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box,
          linear-gradient(45deg, #22d3ee, #a78bfa, #60a5fa) border-box
        `
        : `
          linear-gradient(white, white) padding-box,
          linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4) border-box
        `,
      border: '2px solid transparent',
    };
  };

  const getBackgroundPattern = () => {
    if (!backgroundPattern) return {};
    
    return {
      backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)
      `,
      backgroundSize: '20px 20px'
    };
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-xl transition-all duration-300 ease-out
        ${className}
      `}
      style={{
        transform: getTransform(),
        ...getGlowStyle(),
        ...getBorderGlowStyle(),
        ...getBackgroundPattern()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Animated background gradient */}
      <div 
        className={`
          absolute inset-0 opacity-0 transition-opacity duration-300
          ${isDark 
            ? 'bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10'
            : 'bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50'
          }
          ${isHovered ? 'opacity-100' : ''}
        `}
      />
      
      {/* Shimmer effect */}
      <div 
        className={`
          absolute -inset-px transform -skew-x-12 transition-transform duration-1000 ease-out
          ${isDark
            ? 'bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
          }
          ${isHovered ? 'translate-x-full' : '-translate-x-full'}
        `}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedCard;
