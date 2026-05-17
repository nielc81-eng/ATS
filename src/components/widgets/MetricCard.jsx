import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cardVariants, cardHover } from '../../lib/motionConfig';

const trendConfig = {
  up: {
    icon: TrendingUp,
    style: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
    glow: 'rgba(16, 185, 129, 0.12)',
  },
  down: {
    icon: TrendingDown,
    style: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
    glow: 'rgba(244, 63, 94, 0.10)',
  },
  neutral: {
    icon: Minus,
    style: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    glow: 'transparent',
  },
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  subtext,
  accentColor = 'indigo',
}) {
  const cfg = trendConfig[trendDirection] ?? trendConfig.neutral;
  const TrendIcon = cfg.icon;

  // Accent gradient map
  const accents = {
    indigo: { from: '#6366f1', to: '#818cf8', bg: 'rgba(99,102,241,0.06)', badge: 'rgba(99,102,241,0.08)', badgeText: '#4f46e5' },
    emerald: { from: '#10b981', to: '#34d399', bg: 'rgba(16,185,129,0.06)', badge: 'rgba(16,185,129,0.08)', badgeText: '#059669' },
    rose: { from: '#f43f5e', to: '#fb7185', bg: 'rgba(244,63,94,0.06)', badge: 'rgba(244,63,94,0.08)', badgeText: '#e11d48' },
    sky: { from: '#0ea5e9', to: '#38bdf8', bg: 'rgba(14,165,233,0.06)', badge: 'rgba(14,165,233,0.08)', badgeText: '#0284c7' },
    violet: { from: '#8b5cf6', to: '#a78bfa', bg: 'rgba(139,92,246,0.06)', badge: 'rgba(139,92,246,0.08)', badgeText: '#7c3aed' },
    amber: { from: '#f59e0b', to: '#fbbf24', bg: 'rgba(245,158,11,0.06)', badge: 'rgba(245,158,11,0.08)', badgeText: '#d97706' },
  };
  const accent = accents[accentColor] ?? accents.indigo;

  return (
    <motion.div
      variants={cardVariants}
      {...cardHover}
      className="relative overflow-hidden cursor-default"
      style={{
        borderRadius: '1.25rem',
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
        padding: '1.25rem',
      }}
    >
      {/* Background accent fill */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 100% 100%, ${accent.bg} 0%, transparent 70%)`,
        }}
      />

      {/* Top row: title + icon */}
      <div className="relative flex items-start justify-between mb-4">
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#94a3b8' }}
        >
          {title}
        </h3>

        {Icon && (
          // Double-bezel icon container
          <div
            className="flex-none"
            style={{
              padding: '4px',
              borderRadius: '0.75rem',
              border: '1px solid rgba(15,23,42,0.06)',
              background: 'rgba(248,250,255,0.8)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: `linear-gradient(135deg, ${accent.from}18 0%, ${accent.to}10 100%)`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <Icon
                style={{ width: '1rem', height: '1rem', color: accent.from }}
                strokeWidth={1.75}
              />
            </div>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative">
        <motion.p
          className="tabular leading-none font-bold text-slate-900"
          style={{ fontSize: '2.25rem', letterSpacing: '-0.03em' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
        >
          {value}
        </motion.p>
      </div>

      {/* Trend + subtext */}
      {(trend || subtext) && (
        <div className="relative flex items-center gap-2 mt-3.5">
          {trend && (
            <span
              className={['inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', cfg.style].join(' ')}
            >
              <TrendIcon style={{ width: '0.75rem', height: '0.75rem' }} strokeWidth={2.5} />
              {trend}
            </span>
          )}
          {subtext && (
            <span className="text-[11px] text-slate-400 leading-tight">
              {subtext}
            </span>
          )}
        </div>
      )}

      {/* Bottom gradient line accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-[1.25rem]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent.from}40 50%, transparent 100%)`,
        }}
      />
    </motion.div>
  );
}
