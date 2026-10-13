import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../shared/api/httpClient.ts";
import { chatApi } from "../features/chat/api/chatApi.ts";
import { useChatConversations } from "../features/chat/hooks/useChatConversations.ts";
import { useActiveChatMessages } from "../features/chat/hooks/useActiveChatMessages.ts";
import { useChatTyping } from "../features/chat/hooks/useChatTyping.ts";
import { ChatSidebar } from "../features/chat/ui/ChatSidebar.tsx";
import { ChatHeader } from "../features/chat/ui/ChatHeader.tsx";
import { ChatMessageList } from "../features/chat/ui/ChatMessageList.tsx";
import { ChatMessageInput } from "../features/chat/ui/ChatMessageInput.tsx";

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : null;

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    let isCancelled = false;
    api
      .get<{ id: number }>("/me")
      .then((res) => {
        if (!isCancelled) {
          setCurrentUserId(res.data.id);
        }
      })
      .catch((err) => console.error(`Failed to fetch current user: ${err}`));

    return () => {
      isCancelled = true;
    };
  }, []);

  const {
    chats,
    activeChatId,
    partnerName,
    isPartnerOnline,
    chatUnavailableMessage,
    unreadMessages,
    handleSelectChat,
    handleIncomingMessage,
  } = useChatConversations(currentUserId, targetUserId);

  const {
    messages,
    scrollRef,
    scrollContainerRef,
    handleScroll,
    isLoadingMore,
  } = useActiveChatMessages(activeChatId, handleIncomingMessage);

  const { partnerTyping, handleTyping, resetTyping } = useChatTyping(
    activeChatId,
    currentUserId,
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    handleTyping(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChatId) return;

    try {
      chatApi.sendChatMessage(activeChatId, inputValue.trim());
      setInputValue("");
      resetTyping();
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
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        unreadMessages={unreadMessages}
        isPartnerOnline={isPartnerOnline}
        onSelectChat={handleSelectChat}
      />

      <div className="md:col-span-2 bg-white border rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm">
        {activeChatId ? (
          <>
            <ChatHeader
              partnerName={partnerName}
              isPartnerOnline={isPartnerOnline}
              partnerTyping={partnerTyping}
            />

            <ChatMessageList
              messages={messages}
              currentUserId={currentUserId}
              isLoadingMore={isLoadingMore}
              scrollContainerRef={scrollContainerRef}
              scrollRef={scrollRef}
              onScroll={handleScroll}
            />

            <ChatMessageInput
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <div className="m-auto text-gray-400 font-medium text-sm">
            {chatUnavailableMessage ??
              "Select a connection thread to start chatting."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

