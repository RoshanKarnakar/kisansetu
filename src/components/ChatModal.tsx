import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  Truck,
  Building2,
  UserCheck
} from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getChatMessages, sendChatMessage, subscribeToChatMessages } from '../lib/supabaseService';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  currentUserRole: 'farmer' | 'buyer';
  language: Language;
  onCallBuyer?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  farmerId,
  farmerName,
  buyerId,
  buyerName,
  buyerPhone,
  currentUserRole,
  language,
  onCallBuyer,
}) => {
  const isHindi = language === 'hi';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadMessages = async () => {
      const data = await getChatMessages(bookingId);
      if (isMounted) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    };
    loadMessages();

    // Subscribe to live Realtime updates
    const unsubscribe = subscribeToChatMessages(bookingId || 'general', (newMsg) => {
      if (isMounted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isOpen, bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    const newMsg = await sendChatMessage({
      booking_id: bookingId,
      farmer_id: farmerId,
      buyer_id: buyerId,
      sender: currentUserRole,
      sender_name: currentUserRole === 'farmer' ? farmerName : buyerName,
      text,
    });

    setMessages((prev) => [...prev, newMsg]);
    setSending(false);
    setTimeout(scrollToBottom, 100);
  };

  const quickPrompts = currentUserRole === 'farmer' ? [
    isHindi ? 'ट्रॉली मंडी गेट 2 पहुंच चुकी है' : 'Tractor trolley reached Gate 2',
    isHindi ? 'नमी 11.2% जांची गई है' : 'Moisture tested at 11.2%',
    isHindi ? 'धर्मकांटा तौल रसीद तैयार है' : 'Weighbridge slip ready',
    isHindi ? 'कृपया भुगतान की स्थिति बताएं' : 'Please share payment status',
  ] : [
    isHindi ? 'गेट 2 पर हमारा सहायक उपस्थित है' : 'Our agent is present at Gate 2',
    isHindi ? 'तौल के तुरंत बाद DBT जारी होगा' : 'DBT will be released immediately after weighing',
    isHindi ? 'अनाज की गुणवत्ता बहुत अच्छी है' : 'Grain quality meets premium spec',
    isHindi ? 'कृपया तौल रसीद पर्ची दिखाएं' : 'Please present the weighbridge slip',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full h-[620px] max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1B5E3C] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center border border-emerald-400/40 text-amber-300">
              {currentUserRole === 'farmer' ? (
                <Building2 className="w-5 h-5 text-amber-300" />
              ) : (
                <UserCheck className="w-5 h-5 text-emerald-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  {currentUserRole === 'farmer' ? buyerName : farmerName}
                </h3>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-700/80 text-emerald-200 border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  {isHindi ? 'सत्यापित' : 'Verified'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {bookingId ? `Booking #${bookingId}` : (isHindi ? 'लाइव चैट' : 'Live Mandi Chat')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {buyerPhone && onCallBuyer && (
              <button
                type="button"
                onClick={onCallBuyer}
                title={isHindi ? 'कॉल करें' : 'Call'}
                className="p-2 rounded-full hover:bg-emerald-800 text-amber-300 bg-emerald-900/60 border border-emerald-600/40 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Realtime Status Banner */}
        <div className="bg-[#FAF6EE] px-4 py-1.5 border-b border-[#E8DFC9] flex items-center justify-between text-[11px] text-gray-600 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {isHindi ? 'सुपाबेस रियल-टाइम चैट सक्रिय' : 'Supabase Realtime Chat Active'}
          </span>
          <span className="text-gray-500">
            {isHindi ? 'मंडी एस्क्रो संरक्षित' : 'APMC Escrow Protected'}
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FBFBF9]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">
                {isHindi ? 'कोई संदेश नहीं' : 'No messages yet in this deal thread'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {isHindi 
                  ? 'मंडी डिलीवरी, तौल या समय के संबंध में संदेश भेजें।' 
                  : 'Send a message regarding vehicle arrival, weighment, or delivery schedule.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === currentUserRole;
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs max-w-sm text-center shadow-2xs">
                      <span className="font-semibold">{msg.sender_name}: </span>
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-gray-400 px-1 mb-0.5">
                    {msg.sender_name}
                  </span>
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-2xs ${
                      isMe
                        ? 'bg-[#1B5E3C] text-white rounded-br-xs'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                        isMe ? 'text-emerald-200' : 'text-gray-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.sent_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider shrink-0 mr-1">
            {isHindi ? 'सुझाव:' : 'Quick:'}
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputText(prompt)}
              className="text-[11px] whitespace-nowrap bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isHindi ? 'संदेश लिखें...' : 'Type a message...'}
            className="flex-1 bg-gray-100 focus:bg-white text-gray-900 text-sm px-4 py-2.5 rounded-full border border-transparent focus:border-[#1B5E3C] focus:outline-none transition-all"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#1B5E3C] hover:bg-[#14472D] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
