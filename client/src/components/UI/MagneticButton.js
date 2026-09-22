import React, { useRef, useEffect } from 'react';

const MagneticButton = ({ children, className = "", magnetStrength = 0.4, ...props }) => {
  const buttonRef = useRef(null);
  const isHovered = false;
  const position = { x: 0, y: 0 };
  const setIsHovered = () => {};
  const setPosition = () => {};

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * magnetStrength;
      const deltaY = (e.clientY - centerY) * magnetStrength;
      
      setPosition({ x: deltaX, y: deltaY });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [magnetStrength]);

  return (
    <button
      ref={buttonRef}
      className={`
        relative overflow-hidden transition-all duration-300 ease-out
        ${className}
      `}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      {...props}
    >
      {/* Background gradient effect */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
          transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      />
      
      {/* Ripple effect */}
      <div 
        className={`
          absolute inset-0 bg-white/20 rounded-full
          transition-transform duration-500 ease-out
          ${isHovered ? 'scale-150' : 'scale-0'}
        `}
      />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default MagneticButton;
