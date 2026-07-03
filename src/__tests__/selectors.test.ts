import { selectFilteredTasks, TasksState } from "../store/tasksSlice";
import { Task, TaskStatus, TaskType } from "../types/task";

describe("Tasks Selectors", () => {
  const mockTasks: Task[] = [
    {
      id: "t1",
      title: "Audio recording task",
      type: TaskType.AUDIO,
      status: TaskStatus.IN_PROGRESS,
      assignee: { id: "u1", name: "Asha" },
      annotationCount: 10,
      updatedAt: 1000,
      meta: {},
    },
    {
      id: "t2",
      title: "Image labeling task",
      type: TaskType.IMAGE,
      status: TaskStatus.DONE,
      assignee: { id: "u2", name: "Ben" },
      annotationCount: 20,
      updatedAt: 3000,
      meta: {},
    },
    {
      id: "t3",
      title: "Text transcript task",
      type: TaskType.TEXT,
      status: TaskStatus.TODO,
      assignee: null,
      annotationCount: 5,
      updatedAt: 2000,
      meta: {},
    },
  ];

  const createMockState = (filters: Partial<TasksState["filters"]> = {}): { tasks: TasksState } => ({
    tasks: {
      ids: mockTasks.map((t) => t.id),
      entities: mockTasks.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}),
      status: "succeeded",
      error: null,
      currentPage: 1,
      pageSize: 2,
      totalTasks: 3,
      isStale: false,
      activeTaskId: null,
      filters: {
        type: "all",
        status: "all",
        search: "",
        sortBy: "updatedAt",
        sortOrder: "desc",
        ...filters,
      },
    },
  });

  it("should select all tasks without filtering (sorted by updatedAt desc by default)", () => {
    const state = createMockState();
    const result = selectFilteredTasks(state);
    expect(result).toHaveLength(3);
    // t2 (3000) -> t3 (2000) -> t1 (1000)
    expect(result[0].id).toBe("t2");
    expect(result[1].id).toBe("t3");
    expect(result[2].id).toBe("t1");
  });

  it("should filter by type", () => {
    const state = createMockState({ type: TaskType.IMAGE });
    const result = selectFilteredTasks(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t2");
  });

  it("should filter by status", () => {
    const state = createMockState({ status: TaskStatus.IN_PROGRESS });
    const result = selectFilteredTasks(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
  });

  it("should filter by search query (title and assignee)", () => {
    // Matches "Image" in title
    let state = createMockState({ search: "Image" });
    let result = selectFilteredTasks(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t2");

    // Matches "Asha" in assignee name
    state = createMockState({ search: "Asha" });
    result = selectFilteredTasks(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
  });

  it("should sort by title ascending", () => {
    const state = createMockState({ sortBy: "title", sortOrder: "asc" });
    const result = selectFilteredTasks(state);
    expect(result[0].id).toBe("t1"); // Audio...
    expect(result[1].id).toBe("t2"); // Image...
    expect(result[2].id).toBe("t3"); // Text...
  });
});
