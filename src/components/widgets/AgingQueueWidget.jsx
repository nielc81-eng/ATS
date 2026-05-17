import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import { listItemVariants, staggerContainer, ease } from '../../lib/motionConfig';

export function AgingQueueWidget({ title, items, emptyMessage = 'No items in queue' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: ease.out }}
      className="relative flex h-full flex-col overflow-hidden"
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
          background: 'radial-gradient(ellipse 60% 40% at 0% 100%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#94a3b8' }}
        >
          {title}
        </h3>
        <motion.span
          key={items.length}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="tabular inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{
            background: items.length > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(15,23,42,0.06)',
            color: items.length > 0 ? '#e11d48' : '#94a3b8',
            border: `1px solid ${items.length > 0 ? 'rgba(244,63,94,0.15)' : 'rgba(15,23,42,0.08)'}`,
          }}
        >
          {items.length}
        </motion.span>
      </div>

      {/* Divider */}
      <div className="relative mb-3 h-px w-full" style={{ background: 'rgba(15,23,42,0.06)' }} />

      {/* List */}
      <div className="relative flex-1 overflow-y-auto space-y-2 pr-0.5 -mr-0.5">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center py-10 text-center"
            >
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.06)' }}
              >
                <Clock strokeWidth={1.5} style={{ width: '1.25rem', height: '1.25rem', color: '#cbd5e1' }} />
              </div>
              <p className="text-sm font-medium text-slate-300">{emptyMessage}</p>
            </motion.div>
          ) : (
            <motion.ul
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-2"
            >
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  variants={listItemVariants}
                  layout
                  className="group relative flex items-start justify-between overflow-hidden rounded-xl p-3 transition-all duration-200"
                  style={{
                    background: 'rgba(248,250,255,0.8)',
                    border: '1px solid rgba(15,23,42,0.06)',
                  }}
                  whileHover={{
                    background: '#ffffff',
                    borderColor: 'rgba(15,23,42,0.1)',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                  }}
                >
                  {/* Urgent indicator */}
                  {item.urgent && (
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full"
                      style={{ background: 'linear-gradient(180deg, #f43f5e 0%, #fb7185 100%)' }}
                    />
                  )}

                  <div className="min-w-0 flex-1 pr-3 pl-2">
                    <h4 className="text-sm font-semibold text-slate-800 truncate leading-tight">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="mt-0.5 text-[11px] text-slate-400 truncate leading-tight">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    {/* Age badge */}
                    <span
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold"
                      style={
                        item.urgent
                          ? { background: 'rgba(244,63,94,0.08)', color: '#e11d48', border: '1px solid rgba(244,63,94,0.15)' }
                          : { background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1px solid rgba(245,158,11,0.15)' }
                      }
                    >
                      {item.urgent && (
                        <AlertCircle style={{ width: '0.625rem', height: '0.625rem' }} strokeWidth={2.5} />
                      )}
                      {item.age}
                    </span>

                    {/* Status label */}
                    {item.status && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: '#cbd5e1' }}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
