import localforage from "localforage";
import { Task } from "../types/task";

localforage.config({
  name: "AnnotationConsole",
  storeName: "tasks_store",
  driver: localforage.INDEXEDDB,
});

const TASKS_CACHE_KEY = "cached_tasks_v1";

export interface CachedData {
  tasks: Task[];
  total: number;
  timestamp: number;
}

export async function cacheTasks(tasks: Task[], total: number): Promise<void> {
  try {
    await localforage.setItem<CachedData>(TASKS_CACHE_KEY, {
      tasks,
      total,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("IndexedDB cache save failure:", error);
  }
}

export async function getCachedTasks(): Promise<CachedData | null> {
  try {
    return await localforage.getItem<CachedData>(TASKS_CACHE_KEY);
  } catch (error) {
    console.error("IndexedDB cache read failure:", error);
    return null;
  }
}

export async function clearCachedTasks(): Promise<void> {
  try {
    await localforage.removeItem(TASKS_CACHE_KEY);
  } catch (error) {
    console.error("IndexedDB cache clear failure:", error);
  }
}
