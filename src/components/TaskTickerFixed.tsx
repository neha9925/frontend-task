"use client";

import React, { useEffect, useState } from "react";

type Task = { id: string; title: string; updatedAt: number };

export function TaskTicker({ apiBase }: { apiBase: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setError(null);
      }
    });

    fetch(`${apiBase}/api/tasks/${selectedId}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to fetch task: ${r.status}`);
        }
        return r.json();
      })
      .then((t) => {
        if (!t || typeof t !== "object" || !t.id) {
          throw new Error("Invalid task data");
        }

        setTasks((prev) => {
          const updatedAtEpoch = typeof t.updatedAt === "number" 
            ? t.updatedAt 
            : Date.parse(t.updatedAt || "") || Date.now();
            
          const normalizedTask = {
            id: t.id,
            title: t.title || `Task ${t.id}`,
            updatedAt: updatedAtEpoch,
          };

          const exists = prev.some((item) => item.id === normalizedTask.id);
          if (exists) {
            return prev.map((item) => (item.id === normalizedTask.id ? normalizedTask : item));
          }
          return [...prev, normalizedTask];
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("fetch error:", err);
          setError(`Task load failed`);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedId, apiBase]);

  const sorted = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
      <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Recent Ticker Activity</h4>
      {error && <p className="text-xs text-rose-500 mb-2">{error}</p>}
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-400">No tasks loaded in ticker. Select items from the list below.</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {sorted.map((t) => {
            const elapsedSeconds = Math.max(0, Math.floor((now - t.updatedAt) / 1000));
            return (
              <li
                key={t.id}
                onClick={() => {
                  setSelectedId(t.id);
                  setError(null);
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border ${
                  selectedId === t.id
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900"
                    : "bg-white text-slate-600 border-slate-100 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-850 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    updated {elapsedSeconds}s ago
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
