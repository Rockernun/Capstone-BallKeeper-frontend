import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ItemCalendarModal } from '../components/ItemCalendarModal';
import { Modal } from '../components/Modal';

type Message = {
  id: number;
  sender: 'user' | 'ai' | 'system';
  text: string;
};

// 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-1.5">
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

// 채팅 메시지 컴포넌트
const ChatMessage = ({ message }: { message: Message }) => {
  if (message.sender === 'system') {
    return (
      <div className="text-center text-xs text-gray-500 my-2 px-4">
        {message.text}
      </div>
    );
  }
  
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-end gap-2 my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
         <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">AI</div>
      )}
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-md ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-white text-gray-800 rounded-bl-none'
        }`}
        style={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
      >
        {message.text}
      </div>
    </div>
  );
};

// 메인 챗봇 페이지
export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  
  const [calendarTarget, setCalendarTarget] = useState<{id: number, name: string} | null>(null);

  // 환영 메시지 설정
  useEffect(() => {
    if (user) {
      setMessages([
        { id: Date.now(), sender: 'ai', text: `안녕하세요, ${user.name}님! 무엇을 도와드릴까요?\n\n'내 예약 확인', '예약 취소', '나이키 공 내일 2시 예약'과 같이 말씀해주세요.` }
      ]);
    }
  }, [user]);

  // 스크롤 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await apiClient.post('/api/chat', {
        userId: user.id,
        message: currentInput,
      });
      
      const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = { id: Date.now() + 1, sender: 'system', text: `오류가 발생했습니다: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenItemList = async () => {
    setIsListModalOpen(true);
    try {
      const data = await apiClient.get('/api/items'); // 기존 활성 물품 조회 API
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-indigo-600">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM8.547 5.245a.75.75 0 0 1 1.052.043l.896.945a.75.75 0 0 0 1.004.093l.31-.192a.75.75 0 0 1 .844.03l2.25 1.5a.75.75 0 0 1-.029 1.286l-2.09 1.045a.75.75 0 0 0-.416.666v1.328a.75.75 0 0 1-1.5 0v-1.328a.75.75 0 0 0-.416-.666l-2.09-1.045a.75.75 0 0 1-.03-1.286l2.25-1.5a.75.75 0 0 1 .843-.03l.31.192a.75.75 0 0 0 1.005-.093l.896-.945a.75.75 0 0 1 1.052-.043 8.25 8.25 0 0 0-9.299 9.324.75.75 0 0 1-1.423.433A9.75 9.75 0 0 1 8.547 5.245Z" clipRule="evenodd" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">BallKeeper AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
              onClick={handleOpenItemList}
              className="text-sm bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded-full hover:bg-gray-50 transition shadow-sm"
            >
              📅 예약 현황 확인
            </button>
            <span className="text-sm text-gray-600 hidden sm:block">환영합니다, {user.name}님!</span>
            {isAdmin() && (
              <Link to="/admin" className="text-sm text-green-600 hover:text-green-800 font-semibold">
                관리자 페이지
              </Link>
            )}
            <button onClick={handleLogout} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold">로그아웃</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start gap-2 my-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">AI</div>
                <div className="px-4 py-3 rounded-2xl shadow-md bg-white text-gray-800 rounded-bl-none">
                    <LoadingSpinner />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 w-full px-5 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300"
              disabled={isLoading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
        </div>
      </footer>
      {/* 1. 물품 목록 모달 */}
          <Modal 
            isOpen={isListModalOpen} 
            onClose={() => setIsListModalOpen(false)} 
            title="예약 가능 물품 목록"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <button
                    onClick={() => setCalendarTarget({ id: item.id, name: item.name })}
                    className="text-xs bg-indigo-100 text-indigo-700 py-1 px-2 rounded hover:bg-indigo-200"
                  >
                    달력 보기
                  </button>
                </div>
              ))}
            </div>
          </Modal>
    
          {/* 2. 캘린더 모달 */}
          <ItemCalendarModal
            isOpen={!!calendarTarget}
            onClose={() => setCalendarTarget(null)}
            itemId={calendarTarget?.id || null}
            itemName={calendarTarget?.name || ''}
          />
    </div>
  );
}