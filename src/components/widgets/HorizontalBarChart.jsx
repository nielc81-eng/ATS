import React from 'react';
import { motion } from 'framer-motion';
import { ease } from '../../lib/motionConfig';

// Map Tailwind colorClass to an actual CSS hex for the glow gradient
const colorMap = {
  'bg-cyan-500': '#06b6d4',
  'bg-emerald-500': '#10b981',
  'bg-blue-400': '#60a5fa',
  'bg-indigo-400': '#818cf8',
  'bg-purple-400': '#c084fc',
  'bg-rose-500': '#f43f5e',
  'bg-slate-400': '#94a3b8',
  'bg-amber-400': '#fbbf24',
  'bg-violet-500': '#8b5cf6',
  'bg-sky-400': '#38bdf8',
};

function getHex(colorClass) {
  return colorMap[colorClass] ?? '#6366f1';
}

export function HorizontalBarChart({ title, data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: ease.out }}
      className="relative overflow-hidden"
      style={{
        borderRadius: '1.25rem',
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05)',
        padding: '1.25rem',
      }}
    >
      {/* Subtle background mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      {title && (
        <div className="relative flex items-center justify-between mb-5">
          <h3
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: '#94a3b8' }}
          >
            {title}
          </h3>
          <span
            className="text-[10px] font-semibold tabular"
            style={{ color: '#cbd5e1' }}
          >
            Total: {total}
          </span>
        </div>
      )}

      <div className="relative space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const hex = getHex(item.colorClass);

          return (
            <div key={item.label ?? index}>
              {/* Label row */}
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-semibold text-slate-700 leading-tight">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-slate-800 tabular">
                    {item.value}
                  </span>
                  <span
                    className="text-[10px] font-semibold tabular rounded-full px-1.5 py-0.5"
                    style={{ background: `${hex}15`, color: hex }}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Track + fill */}
              <div
                className="relative h-2 w-full overflow-hidden rounded-full"
                style={{ background: 'rgba(15,23,42,0.06)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    ...ease.barSpring,
                    delay: 0.08 + index * 0.1,
                  }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${hex}cc 0%, ${hex} 100%)`,
                    boxShadow: `0 0 8px ${hex}50`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-300">
          No data to display.
        </div>
      )}
    </motion.div>
  );
}
