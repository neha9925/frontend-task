import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../store";
import { handleWsEvent } from "../store/tasksSlice";
import { TaskFeedEvent } from "../types/task";

export function useTaskFeed(apiBase: string) {
  const dispatch = useAppDispatch();
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const wsUrl = apiBase.replace(/^http/, "ws") + "/ws";

    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setConnectionStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        console.log("WebSocket connected to:", wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data: TaskFeedEvent = JSON.parse(event.data);
          dispatch(handleWsEvent({ event: data, apiBase }));
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
        console.log("WebSocket closed. Attempting reconnect in 3s...");
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.warn("WebSocket connection error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [apiBase, dispatch]);

  return { connectionStatus };
}
