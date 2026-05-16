import React from 'react';
import { motion } from 'framer-motion';

export function Card({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 64, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay }}
      className={`p-1.5 rounded-[2rem] bg-slate-900/5 ring-1 ring-slate-900/5 ${className}`}
    >
      <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white p-6 sm:p-8 shadow-antigravity shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
        {children}
      </div>
    </motion.div>
  );
}
