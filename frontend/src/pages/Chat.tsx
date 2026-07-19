import React, { useEffect, useState, useRef } from "react";
import { api } from "../services/matchService";
import { websocketService } from "../services/websocket";
import { matchService } from "../services/matchService";
import type {
  ChatMessageDTO,
  TypingIndicatorDTO,
  UserProfileStatusUpdate,
} from "../types"; // 🔴 ДОДАНО: тип UserProfileStatusUpdate
import { useSearchParams } from "react-router-dom";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false); // 🔴 ДОДАНО: стейт для онлайн-статусу партнеру
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : null;

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
      .get<ChatMessageDTO[]>(`/chats/${activeChatId}/messages?page=0&size=30`)
      .then((res) => {
        setMessages(res.data.reverse());
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
  }, [activeChatId, currentUserId]);

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
        {activeChatId && partnerName ? (
          <button
            onClick={() => setActiveChatId(activeChatId)}
            className={`w-full text-left p-3 rounded-xl transition font-medium text-sm border flex items-center justify-between ${
              activeChatId
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "hover:bg-gray-50"
            }`}
          >
            <span>💬 {partnerName}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-green-500" : "bg-gray-300"}`}
            />
          </button>
        ) : null}
        <button
          onClick={() => setActiveChatId(1)}
          className={`w-full text-left p-3 rounded-xl transition font-medium text-sm border ${activeChatId === 1 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "hover:bg-gray-50"}`}
        >
          💬 Demonstration Chat Thread
        </button>
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
                  className={`text-xs font-semibold ${isPartnerOnline ? "text-green-600" : "text-gray-400"}`}
                >
                  {isPartnerOnline ? "● online" : "offline"}
                </span>
              </div>

              {partnerTyping && (
                <span className="text-xs font-semibold text-indigo-600 animate-pulse">
                  💬 Partner is typing...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.sentAt}
                  className={`flex flex-col ${m.senderId === currentUserId ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-md text-sm ${m.senderId === currentUserId ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 font-mono">
                    {new Date(m.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
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
