import { useState, useEffect, useRef, useCallback } from "react";
import { chatApi } from "../api/chatApi.ts";
import { useChatEvents } from "./useChatEvents.ts";
import type { ChatEvent, ChatMessage } from "../model/types.ts";

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    const existing = byId.get(message.id);
    byId.set(message.id, { ...message, read: Boolean(existing?.read || message.read) });
  }
  return [...byId.values()].sort((a, b) =>
    String(a.sentAt).localeCompare(String(b.sentAt)) || (a.id ?? 0) - (b.id ?? 0));
}

export function useActiveChatMessages(activeChatId: number | null, currentUserId?: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedChatId, setLoadedChatId] = useState(activeChatId);
  // Reset state during the guarded render, as recommended for prop-derived state.
  if (loadedChatId !== activeChatId) {
    setLoadedChatId(activeChatId);
    setMessages([]);
    setHasMore(false);
    setPage(0);
    setError(null);
  }
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const loading = useRef(false);
  const activeChat = useRef(activeChatId);
  useEffect(() => { activeChat.current = activeChatId; }, [activeChatId]);

  const reportError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : "Could not update chat. Please reload and try again.");
  }, []);

  const markRead = useCallback((chatId: number) => {
    void chatApi.markChatAsRead(chatId).catch(reportError);
  }, [reportError]);

  const fetchMessages = useCallback(async (pageNum: number, isInitial = false) => {
    if (!activeChatId || (!isInitial && loading.current)) return;
    const requestGeneration = generation.current;
    loading.current = true;
    try {
      const data = await chatApi.getChatMessages(activeChatId, pageNum, 30);
      if (requestGeneration !== generation.current) return;
      const container = scrollContainerRef.current;
      const previousHeight = container?.scrollHeight ?? 0;
      setMessages((previous) => mergeMessages(previous, data.content));
      setPage(pageNum);
      setHasMore(!data.last);
      setError(null);
      if (data.content.some((message) => !message.read && message.senderId !== currentUserId)) {
        markRead(activeChatId);
      }
      requestAnimationFrame(() => {
        if (requestGeneration !== generation.current) return;
        if (isInitial) scrollRef.current?.scrollIntoView({ behavior: "auto" });
        else if (container) container.scrollTop += container.scrollHeight - previousHeight;
      });
    } catch (cause) {
      if (requestGeneration === generation.current) reportError(cause);
    } finally {
      if (requestGeneration === generation.current) {
        loading.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [activeChatId, currentUserId, markRead, reportError]);

  useEffect(() => {
    generation.current += 1;
    loading.current = false;
    // Synchronize remote history; state updates follow the awaited HTTP request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeChatId && currentUserId) void fetchMessages(0, true);
    return () => { generation.current += 1; };
  }, [activeChatId, currentUserId, fetchMessages]);

  const acceptMessage = useCallback((message: ChatMessage) => {
    if (message.chatId !== activeChat.current) return;
    setMessages((previous) => mergeMessages(previous, [message]));
    requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  const handleEvent = useCallback((event: ChatEvent) => {
    if (event.chatId !== activeChatId) return;
    if (event.message) {
      acceptMessage(event.message);
      if (event.message.senderId !== currentUserId && activeChatId) markRead(activeChatId);
    }
    if (event.receipt && event.receipt.readerId !== currentUserId) {
      setMessages((previous) => previous.map((message) =>
        message.senderId === currentUserId ? { ...message, read: true } : message));
    }
  }, [activeChatId, currentUserId, acceptMessage, markRead]);

  useChatEvents(activeChatId, handleEvent, Boolean(activeChatId && currentUserId),
    () => { if (!loading.current) void fetchMessages(0, true); }, reportError);

  const handleScroll = useCallback(() => {
    if ((scrollContainerRef.current?.scrollTop ?? Infinity) < 50 && hasMore && !loading.current) {
      setIsLoadingMore(true);
      void fetchMessages(page + 1);
    }
  }, [fetchMessages, hasMore, page]);

  return { messages, setMessages, scrollRef, scrollContainerRef, handleScroll, isLoadingMore,
    fetchMessages, acceptMessage, error };
}
