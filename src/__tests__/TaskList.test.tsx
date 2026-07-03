import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import tasksReducer, { TasksState } from "../store/tasksSlice";
import TaskList from "../components/TaskList";
import { Task, TaskStatus, TaskType } from "../types/task";

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Audio task",
    type: TaskType.AUDIO,
    status: TaskStatus.IN_PROGRESS,
    assignee: { id: "u1", name: "Asha" },
    annotationCount: 10,
    updatedAt: 1000,
    meta: {},
  },
  {
    id: "t2",
    title: "Image task",
    type: TaskType.IMAGE,
    status: TaskStatus.DONE,
    assignee: { id: "u2", name: "Ben" },
    annotationCount: 20,
    updatedAt: 2000,
    meta: {},
  },
];

const renderWithRedux = (
  component: React.ReactElement,
  preloadedState?: { tasks: TasksState }
) => {
  const store = configureStore({
    reducer: { tasks: tasksReducer },
    preloadedState,
  });
  return {
    ...render(<Provider store={store}>{component}</Provider>),
    store,
  };
};

describe("TaskList Component", () => {
  let preloadedState: { tasks: TasksState };

  beforeEach(() => {
    preloadedState = {
      tasks: {
        ids: ["t1", "t2"],
        entities: {
          t1: mockTasks[0],
          t2: mockTasks[1],
        },
        status: "succeeded",
        error: null,
        currentPage: 1,
        pageSize: 2,
        totalTasks: 2,
        isStale: false,
        activeTaskId: null,
        filters: {
          type: "all",
          status: "all",
          search: "",
          sortBy: "updatedAt",
          sortOrder: "desc",
        },
      },
    };
  });

  it("renders tasks from store correctly", () => {
    renderWithRedux(<TaskList connectionStatus="connected" />, preloadedState);
    
    expect(screen.getByText("Audio task")).toBeInTheDocument();
    expect(screen.getByText("Image task")).toBeInTheDocument();
  });

  it("allows searching for tasks", () => {
    const { store } = renderWithRedux(<TaskList connectionStatus="connected" />, preloadedState);
    
    const searchInput = screen.getByPlaceholderText("Search by title or assignee...");
    fireEvent.change(searchInput, { target: { value: "Audio" } });
    
    // Search is form-based, submit it
    fireEvent.submit(searchInput);
    
    // Check that state was updated with search string
    expect(store.getState().tasks.filters.search).toBe("Audio");
  });

  it("displays WebSocket status correct labels", () => {
    renderWithRedux(<TaskList connectionStatus="connected" />, preloadedState);
    expect(screen.getByText("Live feed active")).toBeInTheDocument();
  });
});
