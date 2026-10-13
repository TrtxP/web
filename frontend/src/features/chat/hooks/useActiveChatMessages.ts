import { useState, useEffect, useRef, useCallback } from "react";
import { chatApi } from "../api/chatApi.ts";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";
import type { ChatMessage } from "../model/types.ts";

export function useActiveChatMessages(
  activeChatId: number | null,
  onIncomingMessage?: (msg: ChatMessage) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(
    async (pageNum: number, isInitial = false) => {
      if (!activeChatId) return;
      if (!isInitial && (isLoadingMore || !hasMore)) return;

      if (!isInitial) setIsLoadingMore(true);

      try {
        const data = await chatApi.getChatMessages(activeChatId, pageNum, 30);

        let newMessages: ChatMessage[] = [];
        let isLastPage = false;

        if (Array.isArray(data)) {
          newMessages = data;
        } else {
          newMessages = data.content ?? [];
          isLastPage = data.last ?? false;
        }

        const reversed = [...newMessages].reverse();

        if (isInitial) {
          setMessages(reversed);
          setPage(0);
          setHasMore(!isLastPage);

          requestAnimationFrame(() => {
            scrollRef.current?.scrollIntoView({ behavior: "auto" });
          });
        } else {
          const container = scrollContainerRef.current;
          const previousScrollHeight = container ? container.scrollHeight : 0;

          setMessages((prev) => [...reversed, ...prev]);
          setPage(pageNum);
          setHasMore(!isLastPage);

          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop =
                container.scrollHeight - previousScrollHeight;
            }
          });
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [activeChatId, hasMore, isLoadingMore],
  );

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop < 50 && hasMore && !isLoadingMore) {
      fetchMessages(page + 1, false);
    }
  }, [fetchMessages, hasMore, isLoadingMore, page]);

  // Initial load when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        await fetchMessages(0, true);
      } catch (e) {
        if (!isCancelled) {
          console.error(`Failed to fetch initial messages: ${e}`);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeChatId, fetchMessages]);

  // WebSocket message subscription for activeChatId
  const handleChatMessage = useCallback(
    (rawPayload: unknown) => {
      const msg = rawPayload as ChatMessage;

      if (msg.chatId === activeChatId) {
        setMessages((prev) => {
          const exists = prev.some((m) =>
            m.id && msg.id
              ? m.id === msg.id
              : m.sentAt === msg.sentAt && m.senderId === msg.senderId,
          );
          if (exists) return prev;
          return [...prev, msg];
        });

        requestAnimationFrame(() => {
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        if (onIncomingMessage) {
          onIncomingMessage(msg);
        }
      }
    },
    [activeChatId, onIncomingMessage],
  );

  useStompSubscription(
    activeChatId ? `/topic/chat.${activeChatId}` : null,
    handleChatMessage,
    Boolean(activeChatId),
  );

  return {
    messages,
    setMessages,
    scrollRef,
    scrollContainerRef,
    handleScroll,
    isLoadingMore,
    fetchMessages,
  };
}

