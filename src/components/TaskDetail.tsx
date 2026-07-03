"use client";

import React from "react";
import { useAppSelector } from "../store";
import { selectActiveTask } from "../store/tasksSlice";
import AISummary from "./AISummary";
import { TaskStatus, TaskType, UnknownTask } from "../types/task";
import { Calendar, User, MessageSquare, Clipboard, Layers, FileCode } from "lucide-react";

interface TaskDetailProps {
  apiBase: string;
}

export default function TaskDetail({ apiBase }: TaskDetailProps) {
  const task = useAppSelector(selectActiveTask);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400";
      case TaskStatus.IN_PROGRESS:
        return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400";
      case TaskStatus.DONE:
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400";
      case TaskStatus.QA:
        return "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400";
      case TaskStatus.BLOCKED:
        return "text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900";
    }
  };

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl p-8 text-center text-slate-400 min-h-[400px]">
        <Clipboard size={48} className="stroke-1 mb-4 text-slate-300 dark:text-slate-700 animate-pulse" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-350 mb-1">No Task Selected</h3>
        <p className="text-sm max-w-[280px]">Select a task from the activities dashboard to view full metadata details, assignment status, and the AI streamed summary.</p>
      </div>
    );
  }

  const formattedDate = new Date(task.updatedAt).toLocaleString();
  const isUnknownType = task.type === TaskType.UNKNOWN;

  return (
    <div className="flex flex-col gap-6 h-full min-h-[400px]">
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
              {task.id}
            </span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
              task.type === TaskType.IMAGE
                ? "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400"
                : task.type === TaskType.AUDIO
                ? "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400"
                : task.type === TaskType.TEXT
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
            }`}>
              {isUnknownType ? (task as UnknownTask).rawType : task.type}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
            {task.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-900 py-4">
          <div className="flex items-start gap-2.5">
            <Layers className="text-slate-400 mt-0.5 shrink-0" size={16} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold inline-block text-center mt-0.5 ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MessageSquare className="text-slate-400 mt-0.5 shrink-0" size={16} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Annotations</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {task.annotationCount} counts
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 col-span-2 md:col-span-1">
            <User className="text-slate-400 mt-0.5 shrink-0" size={16} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assignee</span>
              {task.assignee ? (
                <span className="text-xs font-semibold text-slate-850 dark:text-slate-250">
                  {task.assignee.name} <span className="text-[10px] text-slate-400">({task.assignee.id})</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic font-medium">Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 col-span-2 md:col-span-1">
            <Calendar className="text-slate-400 mt-0.5 shrink-0" size={16} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Sync</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-mono">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileCode size={14} />
            Custom Metadata
          </h3>
          {task.meta && Object.keys(task.meta).length > 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <pre className="text-xs font-mono text-slate-600 dark:text-slate-350 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(task.meta, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-650 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-900">
              No custom attributes available for this task.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <AISummary key={task.id} taskId={task.id} apiBase={apiBase} />
      </div>
    </div>
  );
}
