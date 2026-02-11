"use client";

import { useEffect, useRef, useCallback } from "react";
import { ActivityLogEntry } from "@/types/robot";

type UseActivityLogSSEOptions = {
  url?: string;
  maxItems?: number;
  onEntry?: (entry: ActivityLogEntry) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
};

export function useActivityLogSSE(
  entries: ActivityLogEntry[],
  setEntries: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>,
  options: UseActivityLogSSEOptions = {}
) {
  const {
    url = process.env.NEXT_PUBLIC_SSE_URL,
    maxItems = 100,
    onEntry,
    onError,
    onOpen,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);

  const addEntry = useCallback(
    (entry: ActivityLogEntry) => {
      setEntries((prev) => {
        const exists = prev.some((e) => e.id === entry.id);
        if (exists) return prev;
        const updated = [entry, ...prev];
        return updated.slice(0, maxItems);
      });
      onEntry?.(entry);
    },
    [setEntries, maxItems, onEntry]
  );

  useEffect(() => {
    if (!url) {
      console.warn("SSE URL not configured. Set NEXT_PUBLIC_SSE_URL environment variable.");
      return;
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ActivityLogEntry;
        addEntry(data);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      onError?.(error);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [url, addEntry, onError, onOpen]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  return { disconnect };
}
