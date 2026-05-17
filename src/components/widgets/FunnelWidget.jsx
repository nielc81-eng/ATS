import React from 'react';
import { motion } from 'framer-motion';
import { ease } from '../../lib/motionConfig';
import { ChevronDown } from 'lucide-react';

export function FunnelWidget({ title, stages }) {
  const maxVal = stages.length > 0 ? stages[0].value : 1;

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
      {/* Background mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      {title && (
        <h3
          className="relative text-[10px] font-bold uppercase tracking-[0.18em] mb-5"
          style={{ color: '#94a3b8' }}
        >
          {title}
        </h3>
      )}

      <div className="relative space-y-0">
        {stages.map((stage, index) => {
          const widthPercent = Math.max(22, (stage.value / maxVal) * 100);
          const isLast = index === stages.length - 1;

          // Interpolate indigo → violet across funnel stages
          const hue = Math.round(239 + (index / Math.max(stages.length - 1, 1)) * 30);
          const barColor = `hsl(${hue}, 72%, 60%)`;
          const barBg = `hsl(${hue}, 72%, 60%, 0.1)`;

          return (
            <div key={stage.label} className="flex flex-col items-center">
              {/* Stage row */}
              <div className="w-full flex justify-center">
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${widthPercent}%`, opacity: 1 }}
                  transition={{
                    width: { ...ease.barSpring, delay: index * 0.1 },
                    opacity: { duration: 0.25, delay: index * 0.1 },
                  }}
                  className="relative flex items-center justify-between overflow-hidden px-4"
                  style={{
                    height: '2.75rem',
                    borderRadius: '0.75rem',
                    background: `hsl(${hue}, 72%, 60%, 0.08)`,
                    border: `1px solid hsl(${hue}, 72%, 60%, 0.18)`,
                  }}
                >
                  {/* Shimmer shine on hover */}
                  <div
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                    }}
                  />
                  <span
                    className="relative text-[13px] font-semibold truncate"
                    style={{ color: '#475569' }}
                  >
                    {stage.label}
                  </span>
                  <span
                    className="relative text-base font-bold tabular ml-2 shrink-0"
                    style={{ color: barColor }}
                  >
                    {stage.value}
                  </span>
                </motion.div>
              </div>

              {/* Conversion connector */}
              {!isLast && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.25, delay: 0.12 + index * 0.1, ease: ease.out }}
                  className="flex flex-col items-center py-1 origin-top"
                >
                  <div className="w-px h-2.5" style={{ background: 'rgba(15,23,42,0.1)' }} />
                  <span
                    className="text-[9px] font-bold whitespace-nowrap px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(15,23,42,0.04)',
                      border: '1px solid rgba(15,23,42,0.08)',
                      color: '#94a3b8',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <ChevronDown size={8} strokeWidth={2.5} className="inline -mt-0.5 mr-0.5" />
                    {stage.conversionRate ?? '—'}
                  </span>
                  <div className="w-px h-2.5" style={{ background: 'rgba(15,23,42,0.1)' }} />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {stages.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-300">No pipeline data.</div>
      )}
    </motion.div>
  );
}
