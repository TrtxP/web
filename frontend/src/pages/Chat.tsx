import React, { useCallback, useEffect, useState, useRef } from "react";
import { api } from "../services/matchService";
import { websocketService } from "../services/websocket";
import { matchService } from "../services/matchService";
import type {
  ChatMessage,
  ChatMessageDTO,
  ChatSummary,
  TypingIndicatorDTO,
  UserProfileStatusUpdate,
} from "../types";
import { useSearchParams } from "react-router-dom";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false);
  const [chatUnavailableMessage, setChatUnavailableMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [searchParams] = useSearchParams();
  const [unreadMessages, setUnreadMessages] = useState<{
    [chatId: number]: number;
  }>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const userIdParam = searchParams.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : null;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activePartner = chats.find((chat) => chat.id === activeChatId);
  const activePartnerId = activePartner?.partnerId ?? targetUserId;

  const fetchMessages = useCallback(
    async (pageNum: number, isInitial = false) => {
      if (!activeChatId) return;

      if (!isInitial && (isLoadingMore || !hasMore)) return;

      if (!isInitial) setIsLoadingMore(true);

      try {
        const res = await api.get<
          { content: ChatMessage[]; last: boolean } | ChatMessage[]
        >(`/chats/${activeChatId}/messages?page=${pageNum}&size=30`);

        let newMessages: ChatMessage[] = [];
        let isLastPage = false;

        if (Array.isArray(res.data)) {
          newMessages = res.data;
        } else {
          newMessages = res.data.content ?? [];
          isLastPage = res.data.last ?? false;
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

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop < 50 && hasMore && !isLoadingMore) {
      fetchMessages(page + 1, false);
    }
  };

  const getSenderId = (message: ChatMessage): number | null => {
    if (message.senderId !== undefined && message.senderId !== null) {
      return message.senderId;
    }
    if (message.sender && message.sender.id) {
      return message.sender.id;
    }
    return null;
  };

  const updateChatPosition = useCallback(
    (chatId: number, sentAt: string | Date) => {
      const formattedSentAt =
        typeof sentAt === "string" ? sentAt : new Date(sentAt).toISOString();

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c.id === chatId);

        if (chatIndex === -1) {
          matchService.getUserChats().then(setChats).catch(console.error);
          return prevChats;
        }

        const updatedChat = {
          ...prevChats[chatIndex],
          lastMessageAt: formattedSentAt,
        };

        const filteredChats = prevChats.filter((c) => c.id !== chatId);
        return [updatedChat, ...filteredChats];
      });
    },
    [],
  );

  const handleIncomingMessage = useCallback(
    (msg: ChatMessage) => {
      if (msg.chatId !== activeChatId && msg.senderId !== currentUserId) {
        setUnreadMessages((prev) => ({
          ...prev,
          [msg.chatId]: (prev[msg.chatId] || 0) + 1,
        }));
      }
      updateChatPosition(msg.chatId, msg.sentAt as string);
    },
    [activeChatId, currentUserId, updateChatPosition],
  );

  const handleSelectChat = (chatId: number, partnerName: string) => {
    setActiveChatId(chatId);
    setPartnerName(partnerName);
    setPartnerTyping(false);
    setChatUnavailableMessage(null);

    setUnreadMessages((prev) => ({
      ...prev,
      [chatId]: 0,
    }));
  };

  useEffect(() => {
    api
      .get<{ id: number }>("/me")
      .then((res) => setCurrentUserId(res.data.id))
      .catch((err) => console.error(`Failed to fetch current user: ${err}`));
  }, []);

  useEffect(() => {
    const fetchUserChats = async () => {
      try {
        const data = await matchService.getUserChats();
        setChats(data);
      } catch (err) {
        console.error(`Failed to load conversations: ${err}`);
      }
    };

    fetchUserChats();
  }, []);

  useEffect(() => {
    if (!targetUserId) return;

    const loadChat = async () => {
      try {
        const chatId = await matchService.getOrCreateChat(targetUserId);
        setActiveChatId(chatId);
        setChatUnavailableMessage(null);

        const partnerRes = await api.get<{
          id: number;
          name: string;
          isOnline?: boolean;
        }>(`/users/${targetUserId}`);

        setPartnerName(partnerRes.data.name);
        if (typeof partnerRes.data.isOnline !== "undefined") {
          setIsPartnerOnline(partnerRes.data.isOnline);
        }
      } catch (err) {
        console.error(
          `Failed to initialize chat for user ${targetUserId}: ${err}`,
        );
      }
    };

    loadChat();
  }, [targetUserId]);

  useEffect(() => {
    if (!activePartnerId) return;

    api
      .get<{ isOnline?: boolean }>(`/users/${activePartnerId}`)
      .then((res) => {
        if (typeof res.data.isOnline !== "undefined") {
          setIsPartnerOnline(res.data.isOnline);
        }
      })
      .catch((err) => console.error(`Failed to fetch partner status: ${err}`));
  }, [activePartnerId]);

  useEffect(() => {
    if (!activePartnerId) return;

    const unsubscribe = websocketService.subscribe(
      `/topic/users.status`,
      (rawPayload) => {
        const serverData = rawPayload as {
          userId: number;
          status: string;
        };

        const update: UserProfileStatusUpdate = {
          userId: serverData.userId,
          isOnline: serverData.status === "ONLINE",
          lastSeenAt: new Date().toISOString(),
        };

        if (update.userId === activePartnerId) {
          setIsPartnerOnline(update.isOnline);
        }
      },
    );

    return () => unsubscribe();
  }, [activePartnerId]);

  useEffect(() => {
    if (!activeChatId) return;

    (async () => {
      try {
        await fetchMessages(0, true);
      } catch (e) {
        console.error(`Failed to fetch initial messages: ${e}`);
      }
    })();

    const unsubMsg = websocketService.subscribe(
      `/topic/chat.${activeChatId}`,
      (rawPayload) => {
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

          handleIncomingMessage(msg);
          updateChatPosition(msg.chatId, msg.sentAt as unknown as string);
        }
      },
    );

    const unsubTyping = websocketService.subscribe(
      `/topic/chat.${activeChatId}.typing`,
      (rawPayload) => {
        const status = rawPayload as TypingIndicatorDTO;

        if (status.userId !== currentUserId) {
          setPartnerTyping(Boolean(status?.typing));
        }
      },
    );

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [
    activeChatId,
    currentUserId,
    fetchMessages,
    handleIncomingMessage,
    updateChatPosition,
  ]);

  useEffect(() => {
    if (!currentUserId) return;

    const unsubUserQueue = websocketService.subscribe(
      "/user/queue/messages",
      (rawPayLoad) => {
        const msg = rawPayLoad as ChatMessageDTO;
        handleIncomingMessage(msg);
      },
    );

    return () => {
      unsubUserQueue();
    };
  }, [currentUserId, handleIncomingMessage]);

  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribeConnectionEvents = websocketService.subscribe(
      `/topic/connections.${currentUserId}`,
      (rawPayload) => {
        const event = rawPayload as {
          status?: string;
          type?: string;
          partnerId?: number;
          chatId?: number;
        };

        const eventType =
          event.status ||
          event.type ||
          (typeof rawPayload === "string" ? rawPayload : undefined);

        if (eventType !== "DISCONNECTED") {
          return;
        }

        const disconnectedPartnerId = event.partnerId;
        const disconnectedChatId = event.chatId;

        setChats((prevChats) => {
          const removedChat = prevChats.find((chat) =>
            typeof disconnectedPartnerId === "number"
              ? chat.partnerId === disconnectedPartnerId
              : disconnectedChatId
              ? chat.id === disconnectedChatId
              : false,
          );

          const updatedChats = prevChats.filter((chat) =>
            typeof disconnectedPartnerId === "number"
              ? chat.partnerId !== disconnectedPartnerId
              : disconnectedChatId
              ? chat.id !== disconnectedChatId
              : true,
          );

          if (
            removedChat?.id === activeChatId ||
            disconnectedChatId === activeChatId ||
            (typeof disconnectedPartnerId === "number" &&
              disconnectedPartnerId === activePartnerId)
          ) {
            setActiveChatId(null);
            setPartnerName(null);
            setMessages([]);
            setChatUnavailableMessage("This dialogue isn't available");
          }

          return updatedChats;
        });

        if (
          typeof disconnectedPartnerId !== "number" &&
          typeof disconnectedChatId !== "number"
        ) {
          matchService
            .getUserChats()
            .then(setChats)
            .catch((err) =>
              console.error(`Failed to refresh conversations: ${err}`),
            );
        }
      },
    );

    return () => {
      unsubscribeConnectionEvents();
    };
  }, [currentUserId, activeChatId, activePartnerId]);

  // Optional enhancement: also listen to partner's connection channel so that
  // if this client is the initiator and the server only broadcasts DISCONNECTED
  // to the otherUserId channel, we still receive it (second tab/session case).
  useEffect(() => {
    if (!activePartnerId || !currentUserId) return;

    const unsubPartnerConnections = websocketService.subscribe(
      `/topic/connections.${activePartnerId}`,
      (rawPayload) => {
        const event = rawPayload as {
          status?: string;
          type?: string;
          partnerId?: number;
          chatId?: number;
        };

        const eventType =
          event.status ||
          event.type ||
          (typeof rawPayload === "string" ? rawPayload : undefined);

        if (eventType !== "DISCONNECTED") return;

        const disconnectedPartnerId = event.partnerId;
        const disconnectedChatId = event.chatId;

        // We're listening on partner's channel; consider only events where
        // partnerId equals our current user id (i.e. we were the partner)
        if (disconnectedPartnerId !== currentUserId) return;

        setChats((prevChats) => {
          const removedChat = prevChats.find((chat) =>
            typeof disconnectedPartnerId === "number"
              ? chat.partnerId === disconnectedPartnerId
              : disconnectedChatId
              ? chat.id === disconnectedChatId
              : false,
          );

          const updatedChats = prevChats.filter((chat) =>
            typeof disconnectedPartnerId === "number"
              ? chat.partnerId !== disconnectedPartnerId
              : disconnectedChatId
              ? chat.id !== disconnectedChatId
              : true,
          );

          if (
            removedChat?.id === activeChatId ||
            disconnectedChatId === activeChatId ||
            (typeof disconnectedPartnerId === "number" &&
              disconnectedPartnerId === activePartnerId)
          ) {
            setActiveChatId(null);
            setPartnerName(null);
            setMessages([]);
            setChatUnavailableMessage("This dialogue isn't available");
          }

          return updatedChats;
        });
      },
    );

    return () => unsubPartnerConnections();
  }, [activePartnerId, currentUserId, activeChatId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!activeChatId) return;

    websocketService.send("/app/chat.typing", {
      chatId: activeChatId,
      typing: e.target.value.length > 0,
    });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      websocketService.send("/app/chat.typing", {
        chatId: activeChatId,
        typing: false,
      });
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChatId) return;

    const payload = {
      chatId: activeChatId,
      content: inputValue.trim(),
    };

    try {
      websocketService.send("/app/chat.send", payload);
      setInputValue("");
      websocketService.send("/app/chat.typing", {
        chatId: activeChatId,
        typing: false,
      });
      setTimeout(
        () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch (err) {
      console.error(`Failed to send message: ${err}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="bg-white border rounded-2xl p-4 space-y-2 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Open Conversations</h3>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id, chat.partnerName)}
              className={`w-full text-left p-3 rounded-xl transition font-medium text-sm border flex items-center justify-between ${
                activeChatId === chat.id
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>💬 {chat.partnerName}</span>

                {(unreadMessages[chat.id] > 0 ||
                  (chat.unreadCount && chat.unreadCount > 0)) && (
                  <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full animate-pulse">
                    {unreadMessages[chat.id] || chat.unreadCount}
                  </span>
                )}
              </div>

              {activeChatId === chat.id && (
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-green-500" : "bg-gray-300"}`}
                />
              )}
            </button>
          ))
        ) : (
          <p className="no-chats-placeholder text-gray-500">
            No available chats yet
          </p>
        )}
      </div>

      <div className="md:col-span-2 bg-white border rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm">
        {activeChatId ? (
          <>
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-bold">
                  {partnerName
                    ? `Chat with ${partnerName}`
                    : "Conversation Window"}
                </span>
                <span
                  className={`text-xs font-semibold ${isPartnerOnline || partnerTyping ? "text-green-600" : "text-gray-400"}`}
                >
                  {isPartnerOnline || partnerTyping ? "● online" : "last seen recently"}
                </span>
              </div>

              {partnerTyping && (
                <span className="text-xs font-semibold text-indigo-600 animate-pulse">
                  💬 {partnerName} is typing...
                </span>
              )}
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {isLoadingMore && (
                <div className="text-center py-2 text-sm text-gray-400">
                  Loading chat history...
                </div>
              )}
              {messages.map((m) => {
                const messageSenderId = getSenderId(m);

                const isMine =
                  currentUserId !== null &&
                  messageSenderId !== null &&
                  String(messageSenderId) === String(currentUserId);

                return (
                  <div
                    key={m.id || `${m.sentAt}-${messageSenderId}`}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-md text-sm ${isMine ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 font-mono">
                      {new Date(m.sentAt).toLocaleTimeString([], {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t bg-gray-50 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-gray-400 font-medium text-sm">
            {chatUnavailableMessage ?? "Select a connection thread to start chatting."}
          </div>
        )}
      </div>
    </div>
  );
};
