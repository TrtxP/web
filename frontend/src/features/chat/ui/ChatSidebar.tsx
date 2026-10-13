import React from "react";
import type { ChatSummary } from "../model/types.ts";

interface ChatSidebarProps {
  chats: ChatSummary[];
  activeChatId: number | null;
  unreadMessages: { [chatId: number]: number };
  isPartnerOnline: boolean;
  onSelectChat: (chatId: number, partnerName: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  unreadMessages,
  isPartnerOnline,
  onSelectChat,
}) => {
  return (
    <div className="bg-white border rounded-2xl p-4 space-y-2 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4">Open Conversations</h3>
      {chats.length > 0 ? (
        chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id, chat.partnerName)}
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
  );
};

