import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/matchService';
import { websocketService } from '../services/websocket';

interface ChatMessageDTO { id: string; senderId: string; content: string; createdAt: string; }

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeChatId) return;

    // Fetches base chat slice
    api.get<ChatMessageDTO[]>(`/chats/${activeChatId}/messages?page=0&size=30`)
      .then(res => {
        setMessages(res.data.reverse());
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });

    const unsubMsg = websocketService.subscribe('MESSAGE', (msg: ChatMessageDTO) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    const unsubTyping = websocketService.subscribe('TYPING', (status: { typing: boolean }) => {
      setPartnerTyping(status.typing);
    });

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [activeChatId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    websocketService.send('TYPING_START', { chatId: activeChatId });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      websocketService.send('TYPING_STOP', { chatId: activeChatId });
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChatId) return;

    const payload = { content: inputValue };
    const res = await api.post<ChatMessageDTO>(`/chats/${activeChatId}/messages`, payload);
    setMessages(prev => [...prev, res.data]);
    setInputValue('');
    websocketService.send('TYPING_STOP', { chatId: activeChatId });
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="bg-white border rounded-2xl p-4 space-y-2 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Open Conversations</h3>
        <button 
          onClick={() => setActiveChatId('mock-chat-id-1')}
          className={`w-full text-left p-3 rounded-xl transition font-medium text-sm border ${activeChatId === 'mock-chat-id-1' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-gray-50'}`}
        >
          💬 Demonstration Chat Thread
        </button>
      </div>

      <div className="md:col-span-2 bg-white border rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm">
        {activeChatId ? (
          <>
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <span className="font-bold">Conversation Window</span>
              {partnerTyping && <span className="text-xs font-semibold text-indigo-600 animate-pulse">💬 Partner is typing...</span>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-md text-sm ${m.senderId === 'me' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                    {m.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 font-mono">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 flex gap-2">
              <input 
                type="text" 
                value={inputValue} 
                onChange={handleInputChange} 
                placeholder="Type your message..." 
                className="flex-1 border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" 
              />
              <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-gray-400 font-medium text-sm">Select a connection thread to start chatting.</div>
        )}
      </div>
    </div>
  );
};