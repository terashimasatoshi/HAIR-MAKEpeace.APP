"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Button ---
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading, 
  leftIcon, 
  rightIcon, 
  fullWidth, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target";
  const sizeStyles = "h-11 px-6 text-sm md:text-base";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-white focus:ring-primary",
    secondary: "bg-accent hover:bg-accent-light text-white focus:ring-accent",
    outline: "border-2 border-primary text-primary hover:bg-primary/5 focus:ring-primary",
    ghost: "text-text-secondary hover:bg-black/5 hover:text-text-primary",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={cn(baseStyles, sizeStyles, variants[variant], widthClass, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

// --- Card ---
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export function Card({ title, subtitle, children, onClick, className = '', action }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-surface rounded-xl shadow-sm border border-border/50 p-4 md:p-5",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle || action) && (
        <div className="flex justify-between items-start mb-3">
          <div>
            {title && <h3 className="text-lg font-bold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// --- Section ---
interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, description, children, className = '' }: SectionProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-primary-dark">{title}</h2>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// --- Loading ---
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
