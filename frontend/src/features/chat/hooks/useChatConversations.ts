import { useState, useEffect, useCallback } from "react";
import { api } from "../../../shared/api/httpClient.ts";
import { fetchUserOnlineStatusWithFallback } from "../../../entities/user/api/userApi.ts";
import { chatApi } from "../api/chatApi.ts";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";
import type {
  ChatMessage,
  ChatMessageDTO,
  ChatSummary,
  UserSummary,
} from "../model/types.ts";

export function useChatConversations(
  currentUserId: number | null,
  targetUserId: number | null,
) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [chatUnavailableMessage, setChatUnavailableMessage] = useState<
    string | null
  >(null);
  const [unreadMessages, setUnreadMessages] = useState<{
    [chatId: number]: number;
  }>({});
  const [partnerOnlineState, setPartnerOnlineState] = useState<{
    userId: number;
    isOnline: boolean;
  } | null>(null);

  const activePartner = chats.find((chat) => chat.id === activeChatId);
  const activePartnerId = activePartner?.partnerId ?? targetUserId;

  const isPartnerOnline =
    activePartnerId !== null && partnerOnlineState?.userId === activePartnerId
      ? partnerOnlineState.isOnline
      : false;

  const updateChatPosition = useCallback(
    (chatId: number, sentAt: string | Date) => {
      const formattedSentAt =
        typeof sentAt === "string" ? sentAt : new Date(sentAt).toISOString();

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c.id === chatId);

        if (chatIndex === -1) {
          chatApi.getUserChats().then(setChats).catch(console.error);
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
    (msg: ChatMessage | ChatMessageDTO) => {
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

  const handleSelectChat = useCallback(
    (chatId: number, selectedPartnerName: string) => {
      setActiveChatId(chatId);
      setPartnerName(selectedPartnerName);
      setChatUnavailableMessage(null);

      setUnreadMessages((prev) => ({
        ...prev,
        [chatId]: 0,
      }));
    },
    [],
  );

  const fetchPartnerOnlineStatus = useCallback(async (userId: number) => {
    try {
      const status = await fetchUserOnlineStatusWithFallback(userId);
      setPartnerOnlineState({ userId, isOnline: status });
    } catch (err) {
      console.error(`Failed to fetch partner status: ${err}`);
      setPartnerOnlineState({ userId, isOnline: false });
    }
  }, []);

  // 1. Initial chats load
  useEffect(() => {
    let isCancelled = false;

    const fetchUserChats = async () => {
      try {
        const data = await chatApi.getUserChats();
        if (!isCancelled) {
          setChats(data);
        }
      } catch (err) {
        console.error(`Failed to load conversations: ${err}`);
      }
    };

    fetchUserChats();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Initialize chat if targetUserId is given via query param
  useEffect(() => {
    if (!targetUserId) return;

    let isCancelled = false;

    const loadChat = async () => {
      try {
        const chatId = await chatApi.getOrCreateChat(targetUserId);
        if (isCancelled) return;
        setActiveChatId(chatId);
        setChatUnavailableMessage(null);

        const partnerRes = await api.get<UserSummary>(
          `/users/${targetUserId}`,
        );
        if (isCancelled) return;
        setPartnerName(partnerRes.data.name);
        await fetchPartnerOnlineStatus(targetUserId);
      } catch (err) {
        console.error(
          `Failed to initialize chat for user ${targetUserId}: ${err}`,
        );
      }
    };

    loadChat();

    return () => {
      isCancelled = true;
    };
  }, [targetUserId, fetchPartnerOnlineStatus]);

  // 3. Fetch online status when activePartnerId changes
  useEffect(() => {
    if (!activePartnerId) return;

    let ignore = false;

    fetchUserOnlineStatusWithFallback(activePartnerId)
      .then((status) => {
        if (!ignore) {
          setPartnerOnlineState({ userId: activePartnerId, isOnline: status });
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch partner status: ${err}`);
        if (!ignore) {
          setPartnerOnlineState({ userId: activePartnerId, isOnline: false });
        }
      });

    return () => {
      ignore = true;
    };
  }, [activePartnerId]);

  // 4. WebSocket subscription to /user/queue/messages
  const handleUserQueueMessage = useCallback(
    (rawPayload: unknown) => {
      const msg = rawPayload as ChatMessageDTO;
      handleIncomingMessage(msg);
    },
    [handleIncomingMessage],
  );

  useStompSubscription(
    currentUserId ? "/user/queue/messages" : null,
    handleUserQueueMessage,
    Boolean(currentUserId),
  );

  // 5. WebSocket subscription to /topic/users.status
  const handleUserStatusUpdate = useCallback(
    (rawPayload: unknown) => {
      const serverData = rawPayload as {
        userId: number;
        status: string;
      };

      if (
        activePartnerId &&
        Number(serverData.userId) === Number(activePartnerId)
      ) {
        setPartnerOnlineState({
          userId: Number(serverData.userId),
          isOnline: serverData.status === "ONLINE",
        });
      }
    },
    [activePartnerId],
  );

  useStompSubscription(
    activePartnerId ? "/topic/users.status" : null,
    handleUserStatusUpdate,
    Boolean(activePartnerId),
  );

  // 6. WebSocket subscription to /topic/connections.${currentUserId}
  const handleConnectionEvent = useCallback(
    (rawPayload: unknown) => {
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
          setChatUnavailableMessage("This dialogue isn't available");
        }

        return updatedChats;
      });

      if (
        typeof disconnectedPartnerId !== "number" &&
        typeof disconnectedChatId !== "number"
      ) {
        chatApi
          .getUserChats()
          .then(setChats)
          .catch((err) =>
            console.error(`Failed to refresh conversations: ${err}`),
          );
      }
    },
    [activeChatId, activePartnerId],
  );

  useStompSubscription(
    currentUserId ? `/topic/connections.${currentUserId}` : null,
    handleConnectionEvent,
    Boolean(currentUserId),
  );

  // 7. WebSocket subscription to /topic/connections.${activePartnerId}
  const handlePartnerConnectionEvent = useCallback(
    (rawPayload: unknown) => {
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
          setChatUnavailableMessage("This dialogue isn't available");
        }

        return updatedChats;
      });
    },
    [currentUserId, activeChatId, activePartnerId],
  );

  useStompSubscription(
    activePartnerId && currentUserId
      ? `/topic/connections.${activePartnerId}`
      : null,
    handlePartnerConnectionEvent,
    Boolean(activePartnerId && currentUserId),
  );

  return {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    partnerName,
    setPartnerName,
    activePartnerId,
    isPartnerOnline,
    chatUnavailableMessage,
    setChatUnavailableMessage,
    unreadMessages,
    handleSelectChat,
    updateChatPosition,
    handleIncomingMessage,
  };
}
