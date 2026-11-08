import { useState, useRef, useCallback, useEffect } from "react";
import { chatApi } from "../api/chatApi.ts";
import { useChatEvents } from "./useChatEvents.ts";
import type { ChatEvent } from "../model/types.ts";

export function useChatTyping(
  activeChatId: number | null,
  currentUserId: number | null,
) {
  const [typingState, setTypingState] = useState<{ chatId: number; typing: boolean } | null>(null);
  const partnerTyping = typingState?.chatId === activeChatId && typingState.typing;
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partnerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypingEvent = useCallback(
    (event: ChatEvent) => {
      if (event.typing && event.typing.userId !== currentUserId) {
        setTypingState({ chatId: event.chatId, typing: event.typing.typing });
        if (partnerTimeout.current) clearTimeout(partnerTimeout.current);
        partnerTimeout.current = setTimeout(() => setTypingState(null), 3000);
      }
    },
    [currentUserId],
  );

  useChatEvents(
    activeChatId,
    handleTypingEvent,
    Boolean(activeChatId && currentUserId),
  );

  const handleTyping = useCallback(
    (text: string) => {
      if (!activeChatId) return;

      void chatApi.sendChatTyping(activeChatId, text.length > 0).catch(console.error);

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      typingTimeout.current = setTimeout(() => {
        void chatApi.sendChatTyping(activeChatId, false).catch(console.error);
      }, 1500);
    },
    [activeChatId],
  );

  const resetTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    if (activeChatId) {
      void chatApi.sendChatTyping(activeChatId, false).catch(console.error);
    }
  }, [activeChatId]);

  useEffect(() => {
    return () => {
      if (partnerTimeout.current) clearTimeout(partnerTimeout.current);
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [activeChatId]);

  return {
    partnerTyping,
    handleTyping,
    resetTyping,
  };
}

