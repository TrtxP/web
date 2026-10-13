import { useState, useRef, useCallback, useEffect } from "react";
import { chatApi } from "../api/chatApi.ts";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";
import type { TypingIndicatorDTO } from "../model/types.ts";

export function useChatTyping(
  activeChatId: number | null,
  currentUserId: number | null,
) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypingEvent = useCallback(
    (rawPayload: unknown) => {
      const status = rawPayload as TypingIndicatorDTO;

      if (status.userId !== currentUserId) {
        setPartnerTyping(Boolean(status?.typing));
      }
    },
    [currentUserId],
  );

  useStompSubscription(
    activeChatId ? `/topic/chat.${activeChatId}.typing` : null,
    handleTypingEvent,
    Boolean(activeChatId),
  );

  const handleTyping = useCallback(
    (text: string) => {
      if (!activeChatId) return;

      chatApi.sendChatTyping(activeChatId, text.length > 0);

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      typingTimeout.current = setTimeout(() => {
        chatApi.sendChatTyping(activeChatId, false);
      }, 1500);
    },
    [activeChatId],
  );

  const resetTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    if (activeChatId) {
      chatApi.sendChatTyping(activeChatId, false);
    }
  }, [activeChatId]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  return {
    partnerTyping,
    setPartnerTyping,
    handleTyping,
    resetTyping,
  };
}

