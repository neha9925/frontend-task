# Technical Decisions & TaskTicker Bug Audit

## Architecture Notes

### State Management
Chosen: Redux Toolkit (Thunks & Entity Adapter).
RTK Query was considered, but thunks are easier here because:
1. We need to handle WebSocket events that modify specific elements (updating status, incrementing counts) or fetch detailed information if a task is not yet loaded locally.
2. Direct management makes it simpler to hydrate state from IndexedDB on startup.

### Data Normalizer
All tasks are run through `normalizeTask` in `src/utils/normalize.ts`.
- Casing: Standardizes `in_progress`, `InProgress` -> `TaskStatus.IN_PROGRESS`.
- Date: Parses both timestamps (numbers) and ISO strings (strings) into numbers, defaulting to `Date.now()` if malformed.
- Types: Discriminated union. Unknown types (like `"video"`) are assigned to `TaskType.UNKNOWN` and their raw type is saved as `rawType`.
- Count: Parses string and numeric values safely, defaulting to `0` if invalid.

### Websocket Sync
`useTaskFeed` hook listens to events. If an event targets an ID not in Redux (i.e. unloaded page), it fetches it via `fetchTaskById` and inserts it. Reconnects are throttled to 3s.

### SSE Sanitization
SSE streams AI summary markdown which contains HTML and script blocks. The raw stream is sanitized using DOMPurify on the client before being rendered with ReactMarkdown + rehypeRaw. Hydration guards prevent Next.js SSR crashes.

### Client Cache
`localforage` stores tasks locally. On boot, the dashboard loads from IndexedDB and displays a "stale" banner, then fetches page 1 and overwrites the cache in the background.

---

## Bug Hunt Audit (`buggy/TaskTicker.tsx`)

Bugs found and fixed:

1. **Stale Interval closure**: `useEffect` clock was stuck because of missing dependency or lack of functional state updates. Fixed using `setTick(prev => prev + 1)`.
2. **Missing selected ID guard**: Clicking null / initial render fetched `/api/tasks/null` causing 404. Guarded with `if (!selectedId) return;`.
3. **In-place state mutation**: `prev.push(t)` mutated the React state array in place, preventing re-renders. Fixed by returning `[...prev, task]`.
4. **Task duplication**: Ticker kept appending duplicate clicks. Fixed by checking if ID exists in array first.
5. **In-place sorting**: `tasks.sort()` directly mutated the state array. Fixed by copying: `[...tasks].sort()`.
6. **Key index usage**: Mapping elements used list index `key={i}`. Changed to stable `key={t.id}`.
7. **No error handling**: Malformed task payloads or 404s caused property read crashes. Added response validation and catch blocks.
8. **Race conditions**: Selecting different tasks fast led to out-of-order state updates. Added `AbortController` cancellation.
