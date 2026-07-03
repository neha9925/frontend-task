export enum TaskType {
  IMAGE = "image",
  AUDIO = "audio",
  TEXT = "text",
  UNKNOWN = "unknown",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  QA = "QA",
  BLOCKED = "BLOCKED",
  UNKNOWN = "UNKNOWN",
}

export interface User {
  id: string;
  name: string;
}

export interface BaseTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: User | null;
  annotationCount: number;
  updatedAt: number; // clean epoch-ms number
  meta: Record<string, unknown>;
}

export interface ImageTask extends BaseTask {
  type: TaskType.IMAGE;
}

export interface AudioTask extends BaseTask {
  type: TaskType.AUDIO;
}

export interface TextTask extends BaseTask {
  type: TaskType.TEXT;
}

export interface UnknownTask extends BaseTask {
  type: TaskType.UNKNOWN;
  rawType: string;
}

export type Task = ImageTask | AudioTask | TextTask | UnknownTask;

// WebSocket Event Types
export type TaskUpdatedEvent = {
  kind: "task.updated";
  payload: {
    id: string;
    status: string; // raw status from mock
    updatedAt: number;
  };
};

export type TaskAssignedEvent = {
  kind: "task.assigned";
  payload: {
    id: string;
    assignee: User | null;
  };
};

export type AnnotationCreatedEvent = {
  kind: "annotation.created";
  payload: {
    taskId: string;
    by: string;
    at: number;
  };
};

export type TaskFeedEvent = TaskUpdatedEvent | TaskAssignedEvent | AnnotationCreatedEvent;
