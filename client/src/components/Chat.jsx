import { useState, useRef, useEffect } from 'react';

const QUICK_EMOJIS = ['🔥', '👏', '😱', '💀', '😂'];

export default function Chat({ messages, onSend, playerName, onTyping, typingPlayer }) {
  const [input, setInput]     = useState('');
  const bottomRef             = useRef(null);
  const typingTimerRef        = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Debounced typing indicator
    if (onTyping) {
      onTyping();
      clearTimeout(typingTimerRef.current);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <aside className="chat-panel" aria-label="Game chat">
      <div className="chat-header">
        <span>Chat</span>
        {/* Quick emoji reaction buttons */}
        <div className="chat-emoji-bar" aria-label="Quick reactions">
          {QUICK_EMOJIS.map(e => (
            <button
              key={e}
              className="emoji-btn"
              onClick={() => onSend(e)}
              aria-label={`React with ${e}`}
              title={`Send ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.name === playerName;
            // Single emoji = treat as reaction
            const isReaction = /^\p{Emoji}$/u.test(msg.message) || QUICK_EMOJIS.includes(msg.message);

            if (isReaction) {
              return (
                <div key={i} className={`chat-reaction ${isOwn ? 'own' : 'other'}`}>
                  <span className="reaction-emoji">{msg.message}</span>
                  <span className="chat-name-sm">{isOwn ? 'you' : msg.name}</span>
                </div>
              );
            }

            return (
              <div key={i} className={`chat-msg ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && <span className="chat-name">{msg.name}</span>}
                <span className="chat-bubble">{msg.message}</span>
                <span className="chat-time">{formatTime(msg.timestamp)}</span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingPlayer && typingPlayer !== playerName && (
          <div className="typing-indicator" aria-live="polite">
            <span className="typing-dots">
              <span /><span /><span />
            </span>
            <span className="typing-name">{typingPlayer} is typing</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={handleInput}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          maxLength={200}
          aria-label="Chat message"
          autoComplete="off"
        />
        <button
          id="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>
    </aside>
  );
}
