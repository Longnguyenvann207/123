import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  // Fluent UI / Material 3 Style Base
  const baseStyles = "inline-flex items-center justify-center rounded-[6px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed";
  
  const variants = {
    // Solid fill, dynamic accent color
    primary: "bg-[var(--accent-color)] hover:opacity-90 text-white focus:ring-[var(--accent-color)] shadow-md hover:shadow-lg active:scale-[0.98]",
    // Outlined / Card style
    secondary: "bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] focus:ring-[var(--border-color)]",
    // Minimalist
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] active:bg-[var(--bg-card)]",
    danger: "bg-[#c53030] text-white hover:bg-[#9b2c2c] focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm", // Slightly taller for touch targets
    lg: "px-7 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};