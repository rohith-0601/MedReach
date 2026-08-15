import { useState } from 'react';
import { sendChatMessage } from '../lib/api';
import { X, Send, User, Bot, ToggleLeft, ToggleRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('internal');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(input, mode, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check that the server is running and GEMINI_API_KEY is configured.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed right-0 top-[56px] bottom-0 w-[400px] z-50 flex flex-col"
      style={{ backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E5E5' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E5E5E5' }}>
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: '#171717' }}>MedReach Assistant</h3>
          <p className="text-[11px]" style={{ color: '#737373' }}>
            {mode === 'internal' ? 'Internal Marketing Mode' : 'Recipient FAQ Mode'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMode(mode === 'internal' ? 'recipient' : 'internal'); setMessages([]); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium cursor-pointer"
            style={{ border: '1px solid #E5E5E5', color: '#737373' }}
          >
            {mode === 'internal' ? <ToggleRight size={14} style={{ color: '#2C4A7C' }} /> : <ToggleLeft size={14} />}
            {mode === 'internal' ? 'Internal' : 'Recipient'}
          </button>
          <button onClick={onClose} className="cursor-pointer" style={{ color: '#737373' }}><X size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot size={32} style={{ color: '#E5E5E5', margin: '0 auto 12px' }} />
            <p className="text-[13px] font-medium mb-1" style={{ color: '#171717' }}>
              {mode === 'internal' ? 'Marketing Assistant' : 'Program FAQ Assistant'}
            </p>
            <p className="text-[12px]" style={{ color: '#737373' }}>
              {mode === 'internal'
                ? 'I can help draft outreach content, generate status digests, and answer platform questions.'
                : 'I can answer questions about your enrolled programs and preferences. I cannot answer medical or clinical questions.'
              }
            </p>
            {mode === 'internal' && (
              <div className="mt-4 space-y-2">
                {['Draft a subject line for a cardiac wellness check-in', 'Give me a status digest of overdue programs', 'Suggest outreach strategies for low-adherence patients'].map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); }} className="block w-full text-left px-3 py-2 rounded-[4px] text-[12px] cursor-pointer"
                    style={{ border: '1px solid #E5E5E5', color: '#737373' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#2C4A7C' }}>
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div className="max-w-[85%] px-3 py-2 rounded-[6px] text-[13px] leading-[1.6]"
              style={{
                backgroundColor: msg.role === 'user' ? '#2C4A7C' : '#FAFAFA',
                color: msg.role === 'user' ? '#FFFFFF' : '#171717',
                border: msg.role === 'assistant' ? '1px solid #E5E5E5' : 'none'
              }}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none" style={{ fontSize: 13 }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#3A6B5C' }}>
                <User size={12} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#2C4A7C' }}>
              <Bot size={12} className="text-white" />
            </div>
            <div className="px-3 py-2 rounded-[6px]" style={{ backgroundColor: '#FAFAFA', border: '1px solid #E5E5E5' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#737373' }} />
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#737373', animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#737373', animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid #E5E5E5' }}>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder={mode === 'internal' ? 'Draft content, ask about data...' : 'Ask about your program...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary btn-sm">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
