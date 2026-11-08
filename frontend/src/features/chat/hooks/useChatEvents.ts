import { useEffect, useRef } from "react";
import { subscribeGraphql } from "../../../shared/api/graphqlClient.ts";
import { chatEventsDocument } from "../api/chatDocuments.ts";
import { mapEvent, type WireEvent } from "../api/chatMapping.ts";
import type { ChatEvent } from "../model/types.ts";

export function useChatEvents(chatId: number | null, onEvent: (event: ChatEvent) => void,
  enabled = true, onConnected?: () => void, onError?: (error: unknown) => void) {
  const callbacks = useRef({ onEvent, onConnected, onError });
  useEffect(() => { callbacks.current = { onEvent, onConnected, onError }; });

  useEffect(() => {
    if (!enabled) return;
    try {
      return subscribeGraphql<{ chatEvents: WireEvent }>(chatEventsDocument, { chatId },
        (data) => callbacks.current.onEvent(mapEvent(data.chatEvents)),
        (error) => {
          console.error("Chat subscription failed:", error);
          callbacks.current.onError?.(error);
        },
        () => callbacks.current.onConnected?.());
    } catch (error) {
      console.error("Cannot subscribe to chat:", error);
      callbacks.current.onError?.(error);
    }
  }, [chatId, enabled]);
}
