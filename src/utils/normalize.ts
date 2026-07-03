import { Task, TaskType, TaskStatus, User } from "../types/task";

export function normalizeStatus(rawStatus: unknown): TaskStatus {
  if (typeof rawStatus !== "string") {
    return TaskStatus.UNKNOWN;
  }
  const clean = rawStatus.trim().toLowerCase();
  switch (clean) {
    case "todo":
      return TaskStatus.TODO;
    case "in_progress":
    case "inprogress":
      return TaskStatus.IN_PROGRESS;
    case "done":
      return TaskStatus.DONE;
    case "qa":
      return TaskStatus.QA;
    case "blocked":
      return TaskStatus.BLOCKED;
    default:
      return TaskStatus.UNKNOWN;
  }
}

export function normalizeUpdatedAt(rawDate: unknown): number {
  if (typeof rawDate === "number") {
    return rawDate;
  }
  if (typeof rawDate === "string") {
    const parsed = Date.parse(rawDate);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
}

export function normalizeAnnotationCount(rawCount: unknown): number {
  if (typeof rawCount === "number") {
    return rawCount;
  }
  if (typeof rawCount === "string") {
    const parsed = parseInt(rawCount, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
}

export function normalizeTask(raw: unknown): Task {
  if (!raw || typeof raw !== "object") {
    return {
      id: "unknown",
      title: "Unknown Task",
      status: TaskStatus.UNKNOWN,
      assignee: null,
      annotationCount: 0,
      updatedAt: Date.now(),
      meta: {},
      type: TaskType.UNKNOWN,
      rawType: "unknown",
    };
  }

  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : (obj.id !== undefined && obj.id !== null ? String(obj.id) : "unknown");
  const title = typeof obj.title === "string" ? obj.title : `Task ${id}`;
  const status = normalizeStatus(obj.status);

  let assignee: User | null = null;
  if (obj.assignee && typeof obj.assignee === "object") {
    const assigneeObj = obj.assignee as Record<string, unknown>;
    const userId = typeof assigneeObj.id === "string" ? assigneeObj.id : String(assigneeObj.id || "");
    const userName = typeof assigneeObj.name === "string" ? assigneeObj.name : "Unknown User";
    if (userId) {
      assignee = { id: userId, name: userName };
    }
  }

  const annotationCount = normalizeAnnotationCount(obj.annotationCount);
  const updatedAt = normalizeUpdatedAt(obj.updatedAt);
  const meta = obj.meta && typeof obj.meta === "object" && !Array.isArray(obj.meta) ? (obj.meta as Record<string, unknown>) : {};

  const rawType = typeof obj.type === "string" ? obj.type : "unknown";

  const baseTask = {
    id,
    title,
    status,
    assignee,
    annotationCount,
    updatedAt,
    meta,
  };

  switch (rawType) {
    case "image":
      return {
        ...baseTask,
        type: TaskType.IMAGE,
      };
    case "audio":
      return {
        ...baseTask,
        type: TaskType.AUDIO,
      };
    case "text":
      return {
        ...baseTask,
        type: TaskType.TEXT,
      };
    default:
      return {
        ...baseTask,
        type: TaskType.UNKNOWN,
        rawType,
      };
  }
}
