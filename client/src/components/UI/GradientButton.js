import React, { useState, useRef } from 'react';

const GradientButton = ({ 
  children, 
  className = "", 
  variant = "primary",
  size = "md",
  animated = true,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const variants = {
    primary: {
      gradient: 'from-blue-600 via-purple-600 to-pink-600',
      hoverGradient: 'from-blue-500 via-purple-500 to-pink-500',
      text: 'text-white',
    },
    secondary: {
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      hoverGradient: 'from-gray-500 via-gray-600 to-gray-700',
      text: 'text-white',
    },
    success: {
      gradient: 'from-green-600 via-emerald-600 to-teal-600',
      hoverGradient: 'from-green-500 via-emerald-500 to-teal-500',
      text: 'text-white',
    },
    outline: {
      gradient: 'from-transparent to-transparent',
      hoverGradient: 'from-blue-50 to-purple-50',
      text: 'text-gray-700 hover:text-gray-900',
      border: 'border-2 border-gradient-to-r from-blue-600 to-purple-600',
    }
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-4 md:px-6 py-3 text-base',
    lg: 'px-4 md:px-8 py-4 text-lg',
    xl: 'px-5 md:px-10 py-5 text-xl',
  };

  const selectedVariant = variants[variant];
  const selectedSize = sizes[size];

  const handleClick = (e) => {
    if (!animated) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 1000);

    props.onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-xl font-semibold
        transition-all duration-300 ease-out
        transform hover:scale-105 active:scale-95
        bg-gradient-to-r ${isHovered ? selectedVariant.hoverGradient : selectedVariant.gradient}
        ${selectedVariant.text}
        ${selectedSize}
        ${selectedVariant.border || ''}
        focus:outline-none focus:ring-4 focus:ring-blue-300/50
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      {...props}
    >
      {/* Shimmer effect */}
      {animated && (
        <div 
          className={`
            absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
            transform -skew-x-12 transition-transform duration-1000 ease-out
            ${isHovered ? 'translate-x-full' : '-translate-x-full'}
          `}
        />
      )}

      {/* Ripple effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default GradientButton;
