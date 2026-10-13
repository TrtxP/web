import { useEffect, useRef } from "react";
import { websocketService, type MessageCallback } from "./websocketService.ts";

export function useStompSubscription(
  destination: string | null | undefined,
  callback: MessageCallback,
  enabled = true,
): void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!destination || !enabled) return;

    const unsubscribe = websocketService.subscribe(destination, (data) => {
      callbackRef.current(data);
    });

    return () => {
      unsubscribe();
    };
  }, [destination, enabled]);
}
