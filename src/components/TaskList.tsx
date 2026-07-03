"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  selectPaginatedTasks,
  selectPaginationInfo,
  selectActiveTaskId,
  setSelectedTaskId,
  setFilters,
  setCurrentPage,
  selectTasksState,
} from "../store/tasksSlice";
import { Task, TaskStatus, TaskType, UnknownTask } from "../types/task";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers,
  MessageSquare,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

interface TaskListProps {
  connectionStatus: string;
}

function TaskRow({
  task,
  isSelected,
  onClick,
  now,
}: {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  now: number;
}) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const diff = Date.now() - task.updatedAt;
    if (diff < 3000) {
      const raf = requestAnimationFrame(() => {
        setFlash(true);
      });
      const timer = setTimeout(() => setFlash(false), 1500);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [task.updatedAt, task.status, task.assignee]);

  const getTypeBadge = (type: TaskType) => {
    switch (type) {
      case TaskType.IMAGE:
        return "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50";
      case TaskType.AUDIO:
        return "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50";
      case TaskType.TEXT:
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
      case TaskStatus.DONE:
        return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
      case TaskStatus.QA:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900";
      case TaskStatus.BLOCKED:
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800";
    }
  };

  const formatTime = (timeMs: number, currentTime: number) => {
    const seconds = Math.floor((currentTime - timeMs) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timeMs).toLocaleDateString();
  };

  const isUnknown = task.type === TaskType.UNKNOWN;

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 border-b border-slate-100 dark:border-slate-900/60 ${
        isSelected
          ? "bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
          : flash
          ? "bg-emerald-50 dark:bg-emerald-950/30 animate-pulse border-emerald-200 dark:border-emerald-900/50"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-900/20"
      }`}
    >
      <td className="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
        {task.id}
      </td>
      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 text-sm">
        <div className="flex flex-col gap-0.5">
          <span>{task.title}</span>
          {task.meta && Object.keys(task.meta).length > 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-mono font-medium">
              {Object.entries(task.meta)
                .map(([k, v]) => `${k}:${v}`)
                .join(" | ")}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${getTypeBadge(task.type)}`}>
          {isUnknown ? (task as UnknownTask).rawType : task.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(task.status)}`}>
          {task.status}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {task.assignee.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-medium">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs text-center">
        <div className="flex items-center justify-center gap-1">
          <MessageSquare size={13} className="text-slate-400" />
          <span>{task.annotationCount}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs text-right whitespace-nowrap">
        {formatTime(task.updatedAt, now)}
      </td>
    </tr>
  );
}

export default function TaskList({ connectionStatus }: TaskListProps) {
  const dispatch = useAppDispatch();
  const paginatedTasks = useAppSelector(selectPaginatedTasks);
  const pagination = useAppSelector(selectPaginationInfo);
  const activeTaskId = useAppSelector(selectActiveTaskId);
  const { filters, status, isStale, totalTasks } = useAppSelector(selectTasksState);
  
  const [prevSearch, setPrevSearch] = useState(filters.search);
  const [searchVal, setSearchVal] = useState(filters.search);

  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setSearchVal(filters.search);
  }

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchVal }));
  };

  const handleClearSearch = () => {
    setSearchVal("");
    dispatch(setFilters({ search: "" }));
  };

  const handleFilterChange = (field: string, value: string) => {
    dispatch(setFilters({ [field]: value }));
  };

  const toggleSort = (field: "updatedAt" | "title" | "annotationCount") => {
    if (filters.sortBy === field) {
      dispatch(setFilters({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" }));
    } else {
      dispatch(setFilters({ sortBy: field, sortOrder: "desc" }));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Task Activities
              <span className="text-xs font-normal text-slate-400">({totalTasks} total)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status tracking dashboard</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              connectionStatus === "connected"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                : connectionStatus === "connecting"
                ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
                : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
            }`}>
              {connectionStatus === "connected" ? (
                <>
                  <Wifi size={13} />
                  Live feed active
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <RefreshCw className="animate-spin" size={13} />
                  Connecting feed...
                </>
              ) : (
                <>
                  <WifiOff size={13} />
                  Live feed disconnected
                </>
              )}
            </span>
          </div>
        </div>

        {isStale && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-50 border border-amber-100 dark:bg-amber-950/15 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-xl text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <RefreshCw className="animate-spin text-amber-500" size={14} />
              Displaying cached local data. Revalidating with server...
            </span>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-slate-100 dark:border-slate-900 grid grid-cols-1 md:grid-cols-12 gap-3">
        <form onSubmit={handleSearchSubmit} className="md:col-span-4 relative">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search by title or assignee..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs md:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          {searchVal && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2 py-0.5 px-1 bg-slate-200 dark:bg-slate-850 hover:bg-slate-350 hover:dark:bg-slate-750 text-slate-500 rounded text-[10px]"
            >
              Clear
            </button>
          )}
        </form>

        <div className="md:col-span-8 flex flex-wrap items-center gap-2 justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter size={12} className="text-slate-400" />
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Types</option>
              <option value={TaskType.IMAGE}>Image</option>
              <option value={TaskType.AUDIO}>Audio</option>
              <option value={TaskType.TEXT}>Text</option>
              <option value={TaskType.UNKNOWN}>Unknown</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Layers size={12} className="text-slate-400" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value={TaskStatus.TODO}>TODO</option>
              <option value={TaskStatus.IN_PROGRESS}>IN PROGRESS</option>
              <option value={TaskStatus.DONE}>DONE</option>
              <option value={TaskStatus.QA}>QA</option>
              <option value={TaskStatus.BLOCKED}>BLOCKED</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => toggleSort("updatedAt")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filters.sortBy === "updatedAt"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Time
            </button>
            <button
              onClick={() => toggleSort("title")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filters.sortBy === "title"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Title
            </button>
            <button
              onClick={() => toggleSort("annotationCount")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filters.sortBy === "annotationCount"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Annotations
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-[300px]">
        {status === "loading" && paginatedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
            <RefreshCw className="animate-spin mb-2" size={24} />
            <p className="text-xs">Fetching task payload...</p>
          </div>
        ) : paginatedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
            <Layers size={36} className="mb-2 stroke-1" />
            <p className="text-xs font-semibold">No tasks found matching criteria.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900/60">
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  ID
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                  Annotations
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={activeTaskId === task.id}
                  now={now}
                  onClick={() => dispatch(setSelectedTaskId(task.id))}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/5">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-350">
            {Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-355">
            {Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)}
          </span>{" "}
          of <span className="font-semibold text-slate-700 dark:text-slate-355">{pagination.totalItems}</span> tasks
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(setCurrentPage(pagination.currentPage - 1))}
            disabled={pagination.currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent dark:border-slate-800 dark:hover:bg-slate-900 transition-all"
          >
            <ChevronLeft size={16} className="text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => dispatch(setCurrentPage(pagination.currentPage + 1))}
            disabled={pagination.currentPage === pagination.totalPages}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent dark:border-slate-800 dark:hover:bg-slate-900 transition-all"
          >
            <ChevronRight size={16} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
