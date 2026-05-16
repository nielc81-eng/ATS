import React from 'react';
import { motion } from 'framer-motion';

export function Button({ children, icon: Icon, variant = 'primary', className = '', ...props }) {
  const baseClasses = "relative inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition-all duration-700 ease-fluid group cursor-pointer";
  
  const variants = {
    primary: "bg-slate-950 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:border-slate-300 shadow-sm",
  };

  return (
    <motion.button
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-3">
        {children}
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-700 ease-fluid group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
            <Icon size={16} />
          </span>
        )}
      </span>
    </motion.button>
  );
}
