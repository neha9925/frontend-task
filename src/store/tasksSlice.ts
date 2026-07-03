import { createSlice, createAsyncThunk, createEntityAdapter, createSelector, PayloadAction } from "@reduxjs/toolkit";
import { Task, User, TaskFeedEvent } from "../types/task";
import { normalizeTask, normalizeStatus } from "../utils/normalize";
import { RootState } from "./index";

const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => b.updatedAt - a.updatedAt,
});

export interface TasksState extends ReturnType<typeof tasksAdapter.getInitialState> {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalTasks: number;
  isStale: boolean;
  activeTaskId: string | null;
  filters: {
    type: string;
    status: string;
    search: string;
    sortBy: "updatedAt" | "title" | "annotationCount";
    sortOrder: "asc" | "desc";
  };
}

const initialState: TasksState = tasksAdapter.getInitialState({
  status: "idle",
  error: null,
  currentPage: 1,
  pageSize: 20,
  totalTasks: 0,
  isStale: false,
  activeTaskId: null,
  filters: {
    type: "all",
    status: "all",
    search: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
});

export const fetchTasksPage = createAsyncThunk(
  "tasks/fetchPage",
  async ({ page, pageSize, apiBase }: { page: number; pageSize: number; apiBase: string }) => {
    const response = await fetch(`${apiBase}/api/tasks?page=${page}&pageSize=${pageSize}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      items: data.items.map((item: unknown) => normalizeTask(item)),
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
    };
  }
);

export const fetchTaskById = createAsyncThunk(
  "tasks/fetchById",
  async ({ id, apiBase }: { id: string; apiBase: string }) => {
    const response = await fetch(`${apiBase}/api/tasks/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch task ${id}`);
    }
    const data = await response.json();
    return normalizeTask(data);
  }
);

export const handleWsEvent = createAsyncThunk(
  "tasks/handleWsEvent",
  async ({ event, apiBase }: { event: TaskFeedEvent; apiBase: string }, { dispatch, getState }) => {
    const state = (getState() as RootState).tasks;
    const { kind, payload } = event;

    if (kind === "task.updated") {
      const { id, status, updatedAt } = payload;
      const exists = !!state.entities[id];
      if (exists) {
        dispatch(wsTaskUpdated({ id, status, updatedAt }));
      } else {
        dispatch(fetchTaskById({ id, apiBase }));
      }
    } else if (kind === "task.assigned") {
      const { id, assignee } = payload;
      const exists = !!state.entities[id];
      if (exists) {
        dispatch(wsTaskAssigned({ id, assignee }));
      } else {
        dispatch(fetchTaskById({ id, apiBase }));
      }
    } else if (kind === "annotation.created") {
      const { taskId, by, at } = payload;
      const exists = !!state.entities[taskId];
      if (exists) {
        dispatch(wsAnnotationCreated({ taskId, by, at }));
      } else {
        dispatch(fetchTaskById({ id: taskId, apiBase }));
      }
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setCachedTasks(state, action: PayloadAction<{ tasks: Task[]; total: number }>) {
      tasksAdapter.setAll(state, action.payload.tasks);
      state.totalTasks = action.payload.total;
      state.isStale = true;
      state.status = "succeeded";
    },
    setCachedTasksLoaded(state) {
      state.isStale = false;
    },
    setSelectedTaskId(state, action: PayloadAction<string | null>) {
      state.activeTaskId = action.payload;
    },
    setFilters(state, action: PayloadAction<Partial<TasksState["filters"]>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    wsTaskUpdated(state, action: PayloadAction<{ id: string; status: string; updatedAt: number }>) {
      const { id, status, updatedAt } = action.payload;
      const task = state.entities[id];
      if (task) {
        task.status = normalizeStatus(status);
        task.updatedAt = updatedAt;
      }
    },
    wsTaskAssigned(state, action: PayloadAction<{ id: string; assignee: User | null }>) {
      const { id, assignee } = action.payload;
      const task = state.entities[id];
      if (task) {
        task.assignee = assignee;
      }
    },
    wsAnnotationCreated(state, action: PayloadAction<{ taskId: string; by: string; at: number }>) {
      const { taskId, at } = action.payload;
      const task = state.entities[taskId];
      if (task) {
        task.annotationCount += 1;
        task.updatedAt = at;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasksPage.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTasksPage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isStale = false;
        tasksAdapter.upsertMany(state, action.payload.items);
        state.totalTasks = action.payload.total;
        state.currentPage = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchTasksPage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Something went wrong";
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        tasksAdapter.upsertOne(state, action.payload);
      });
  },
});

export const {
  setCachedTasks,
  setCachedTasksLoaded,
  setSelectedTaskId,
  setFilters,
  setCurrentPage,
  wsTaskUpdated,
  wsTaskAssigned,
  wsAnnotationCreated,
} = tasksSlice.actions;

export default tasksSlice.reducer;

const adapterSelectors = tasksAdapter.getSelectors();

export const selectTasksState = (state: { tasks: TasksState }) => state.tasks;

export const selectAllTasks = (state: { tasks: TasksState }) =>
  adapterSelectors.selectAll(state.tasks);

export const selectTaskEntities = (state: { tasks: TasksState }) =>
  adapterSelectors.selectEntities(state.tasks);

export const selectActiveTaskId = (state: { tasks: TasksState }) =>
  state.tasks.activeTaskId;

export const selectActiveTask = createSelector(
  [selectTaskEntities, selectActiveTaskId],
  (entities, activeId) => (activeId ? entities[activeId] : null)
);

export const selectFiltersState = createSelector(
  [selectTasksState],
  (state) => state.filters
);

export const selectFilteredTasks = createSelector(
  [selectAllTasks, selectFiltersState],
  (tasks, filters) => {
    const { type, status, search, sortBy, sortOrder } = filters;

    const result = tasks.filter((task) => {
      if (type !== "all" && task.type !== type) {
        return false;
      }
      if (status !== "all" && task.status !== status) {
        return false;
      }
      if (search.trim() !== "") {
        const query = search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(query);
        const assigneeMatch = task.assignee?.name.toLowerCase().includes(query) || false;
        if (!titleMatch && !assigneeMatch) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "updatedAt") {
        comparison = a.updatedAt - b.updatedAt;
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "annotationCount") {
        comparison = a.annotationCount - b.annotationCount;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }
);

export const selectPaginatedTasks = createSelector(
  [selectFilteredTasks, selectTasksState],
  (filteredTasks, state) => {
    const { currentPage, pageSize } = state;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTasks.slice(startIndex, startIndex + pageSize);
  }
);

export const selectPaginationInfo = createSelector(
  [selectFilteredTasks, selectTasksState],
  (filteredTasks, state) => {
    const { currentPage, pageSize } = state;
    const totalFiltered = filteredTasks.length;
    const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
    return {
      currentPage,
      pageSize,
      totalItems: totalFiltered,
      totalPages,
    };
  }
);
