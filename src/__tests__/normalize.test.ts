import { normalizeTask } from "../utils/normalize";
import { TaskType, TaskStatus, UnknownTask } from "../types/task";

describe("normalizeTask", () => {
  it("should normalize raw task with standard fields", () => {
    const raw = {
      id: "t1",
      title: "Task 1",
      type: "image",
      status: "in_progress",
      assignee: { id: "u1", name: "Asha" },
      annotationCount: 5,
      updatedAt: 1719600000000,
    };
    const task = normalizeTask(raw);
    expect(task.id).toBe("t1");
    expect(task.type).toBe(TaskType.IMAGE);
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    expect(task.annotationCount).toBe(5);
    expect(task.updatedAt).toBe(1719600000000);
  });

  it("should handle status casing and spelling variations", () => {
    expect(normalizeTask({ status: "InProgress" }).status).toBe(TaskStatus.IN_PROGRESS);
    expect(normalizeTask({ status: "done" }).status).toBe(TaskStatus.DONE);
    expect(normalizeTask({ status: "QA" }).status).toBe(TaskStatus.QA);
    expect(normalizeTask({ status: "todo" }).status).toBe(TaskStatus.TODO);
    expect(normalizeTask({ status: "BLOCKED" }).status).toBe(TaskStatus.BLOCKED);
    expect(normalizeTask({ status: "something_weird" }).status).toBe(TaskStatus.UNKNOWN);
  });

  it("should handle mixed updatedAt formats", () => {
    const isoDate = "2024-06-28T14:40:00.000Z";
    const parsedEpoch = Date.parse(isoDate);
    
    expect(normalizeTask({ updatedAt: isoDate }).updatedAt).toBe(parsedEpoch);
    expect(normalizeTask({ updatedAt: 1719600000000 }).updatedAt).toBe(1719600000000);
    // Invalid date defaults to current timestamp (approx check)
    const now = Date.now();
    const task = normalizeTask({ updatedAt: "invalid_date" });
    expect(task.updatedAt - now).toBeLessThan(100);
  });

  it("should parse string annotationCount correctly", () => {
    expect(normalizeTask({ annotationCount: "12" }).annotationCount).toBe(12);
    expect(normalizeTask({ annotationCount: "invalid" }).annotationCount).toBe(0);
  });

  it("should handle unknown types and preserve rawType", () => {
    const task = normalizeTask({ type: "video" });
    expect(task.type).toBe(TaskType.UNKNOWN);
    expect((task as UnknownTask).rawType).toBe("video");
  });
});
