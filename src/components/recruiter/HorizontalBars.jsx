import React from "react";

export default function HorizontalBars({ title, items, accent = "bg-slate-950" }) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="surface-card p-6">
      <p className="section-heading">{title}</p>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const width = Math.max(8, Math.round((item.count / max) * 100));

          return (
            <div key={item.skill} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-900">{item.skill}</span>
                <span className="text-slate-500">{item.count}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={["h-full rounded-full", accent].join(" ")}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
