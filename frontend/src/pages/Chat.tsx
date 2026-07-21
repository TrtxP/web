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
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [searchParams] = useSearchParams();
  const [unreadMessages, setUnreadMessages] = useState<{
    [chatId: number]: number;
  }>({});
  const userIdParam = searchParams.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : null;
  const getSenderId = (message: ChatMessage): number | null => {
    if (message.senderId !== undefined && message.senderId !== null) {
      return message.senderId; // З WebSocket (ChatMessageDTO)
    }
    if (message.sender && message.sender.id) {
      return message.sender.id; // З REST API (/messages)
    }
    return null;
  };

  const handleIncomingMessage = useCallback(
    (msg: ChatMessageDTO) => {
      if (msg.chatId !== activeChatId && msg.senderId !== currentUserId) {
        setUnreadMessages((prev) => ({
          ...prev,
          [msg.chatId]: (prev[msg.chatId] || 0) + 1,
        }));
        console.log("Incoming WebSocket msg:", msg)
      }
    },
    [activeChatId, currentUserId],
  );

  const handleSelectChat = (chatId: number, partnerName: string) => {
    setActiveChatId(chatId);
    setPartnerName(partnerName);

    // Скидаємо непрочитані для обраного чату
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
    if (!targetUserId) return;

    const loadChat = async () => {
      try {
        const chatId = await matchService.getOrCreateChat(targetUserId);
        setActiveChatId(chatId);

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
    const fetchUserChats = async () => {
      try {
        const data = await matchService.getUserChats();
        setChats(data);
      } catch (err) {
        console.error(`Failed to load conversations: ${err}`);
      }
    };

    fetchUserChats();
  }, [activeChatId]);

  useEffect(() => {
    if (!targetUserId) return;

    const unsubscribe = websocketService.subscribe(
      `/topic/users.status`,
      (rawPayload) => {
        const serverData = rawPayload as {
          userId: number;
          status: string;
        };

        console.log(
          `Received status update in Chat: ${JSON.stringify(serverData)}`,
        );

        const update: UserProfileStatusUpdate = {
          userId: serverData.userId,
          isOnline: serverData.status === "ONLINE",
          lastSeenAt: new Date().toISOString(),
        };

        // Якщо статус прийшов саме для того юзера, з яким ми зараз спілкуємось
        if (update.userId === targetUserId) {
          setIsPartnerOnline(update.isOnline);
        }
      },
    );

    return () => unsubscribe();
  }, [targetUserId]);

  // Load chat history and subscribe to real-time updates
  useEffect(() => {
    if (!activeChatId) return;

    // Fetch initial chat history
    api
      .get<ChatMessageDTO[] | { content: ChatMessageDTO[] }>(
        `/chats/${activeChatId}/messages?page=0&size=30`,
      )
      .then((res) => {
        const messageArray = Array.isArray(res.data)
          ? res.data
          : (res.data.content ?? []);
        setMessages([...messageArray].reverse());
        setTimeout(
          () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      })
      .catch((err) => console.error(`Failed to load chat history: ${err}`));

    // Subscribe to messages for the specific chat room via topic
    const unsubMsg = websocketService.subscribe(
      `/topic/chat.${activeChatId}`,
      (rawPayload) => {
        const msg = rawPayload as ChatMessageDTO;

        if (msg.chatId === activeChatId) {
          setMessages((prev) => {
            if (
              prev.some(
                (m) => m.sentAt === msg.sentAt && m.senderId === msg.senderId,
              )
            )
              return prev;
            return [...prev, msg];
          });
          setTimeout(
            () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
            50,
          );

          handleIncomingMessage(msg)
        }
      },
    );

    // Subscribe to typing indicator for this specific chat
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
  }, [activeChatId, currentUserId, handleIncomingMessage]);

  useEffect(() => {
    if (!currentUserId) return

    const unsubUserQueue = websocketService.subscribe("/user/queue/messages", (rawPayLoad) => {
      const msg = rawPayLoad as ChatMessageDTO

      handleIncomingMessage(msg)
    })

    return () => {
      unsubUserQueue()
    }
  }, [currentUserId, activeChatId, handleIncomingMessage])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!activeChatId) return;

    // Send typing indicator
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
      // Send message via WebSocket
      websocketService.send("/app/chat.send", payload);
      setInputValue("");
      // Send typing stopped indicator
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
              onClick={() => {
                setActiveChatId(chat.id);
                setPartnerName(chat.partnerName);
                handleSelectChat(chat.id, chat.partnerName);
              }}
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
                  {isPartnerOnline || partnerTyping ? "● online" : "offline"}
                </span>
              </div>

              {partnerTyping && (
                <span className="text-xs font-semibold text-indigo-600 animate-pulse">
                  💬 Partner is typing...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            Select a connection thread to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};
