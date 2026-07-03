"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchTasksPage,
  setCachedTasks,
  setCachedTasksLoaded,
  selectAllTasks,
  selectTasksState,
} from "../store/tasksSlice";
import { getCachedTasks, cacheTasks } from "../utils/db";
import { useTaskFeed } from "../hooks/useTaskFeed";
import TaskList from "./TaskList";
import TaskDetail from "./TaskDetail";
import { TaskTicker } from "./TaskTickerFixed";
import { Cpu, Info } from "lucide-react";

export default function ConsoleDashboard() {
  const dispatch = useAppDispatch();
  const allTasks = useAppSelector(selectAllTasks);
  const { totalTasks, currentPage, pageSize } = useAppSelector(selectTasksState);
  
  const apiBase = "http://127.0.0.1:4000";
  const { connectionStatus } = useTaskFeed(apiBase);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    async function loadFromDB() {
      try {
        const cached = await getCachedTasks();
        if (cached && cached.tasks && cached.tasks.length > 0) {
          dispatch(
            setCachedTasks({
              tasks: cached.tasks,
              total: cached.total,
            })
          );
        }
      } catch (err) {
        console.error("Cache read error:", err);
      } finally {
        setDbLoading(false);
      }
    }
    loadFromDB();
  }, [dispatch]);

  useEffect(() => {
    if (dbLoading) return;

    dispatch(fetchTasksPage({ page: currentPage, pageSize, apiBase }))
      .unwrap()
      .then(() => {
        dispatch(setCachedTasksLoaded());
      })
      .catch((err) => {
        console.error("Fetch page error:", err);
      });
  }, [dispatch, currentPage, pageSize, dbLoading]);

  useEffect(() => {
    if (allTasks.length > 0 && !dbLoading) {
      cacheTasks(allTasks, totalTasks);
    }
  }, [allTasks, totalTasks, dbLoading]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 flex flex-col font-sans">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu size={18} />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg tracking-tight text-slate-900 dark:text-slate-100">
              Annotation Activity Console
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wider">
              Internal Admin v1.0.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/DECISIONS.md"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-slate-600 dark:text-slate-350"
          >
            <Info size={14} />
            Decisions
          </a>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        <div className="xl:col-span-7 flex flex-col h-full gap-6">
          <div className="flex-1">
            <TaskList connectionStatus={connectionStatus} />
          </div>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-6 h-full">
          <TaskTicker apiBase={apiBase} />

          <div className="flex-1">
            <TaskDetail apiBase={apiBase} />
          </div>
        </div>
      </main>
    </div>
  );
}
