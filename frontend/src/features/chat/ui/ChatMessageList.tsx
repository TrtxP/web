import React from "react";
import type { ChatMessage } from "../model/types.ts";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: number | null;
  isLoadingMore: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUserId,
  isLoadingMore,
  scrollContainerRef,
  scrollRef,
  onScroll,
}) => {
  const getSenderId = (message: ChatMessage): number | null => {
    if (message.senderId !== undefined && message.senderId !== null) {
      return message.senderId;
    }
    if (message.sender && message.sender.id) {
      return message.sender.id;
    }
    return null;
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={onScroll}
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
              className={`p-3 rounded-2xl max-w-md text-sm ${
                isMine
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
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
  );
};

