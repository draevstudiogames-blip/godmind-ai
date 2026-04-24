import { useState, useEffect, useCallback } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  updatedAt: number;
}

export function useChatHistory() {
  const [history, setHistory] = useState<ChatSession[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('godmind_chat_history') : null;
      if (stored) {
        return JSON.parse(stored).sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt);
      }
    } catch(err) {
      console.error(err);
    }
    return [];
  });

  const loadHistory = () => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('godmind_chat_history') : null;
      if (stored) {
        setHistory(JSON.parse(stored).sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt));
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => loadHistory();
    window.addEventListener('chat-history-updated', handleStorageChange);
    return () => window.removeEventListener('chat-history-updated', handleStorageChange);
  }, []);

  const saveSession = useCallback(async (session: ChatSession) => {
    try {
      let currentHistory: ChatSession[] = [];
      const stored = typeof window !== 'undefined' ? localStorage.getItem('godmind_chat_history') : null;
      if (stored) currentHistory = JSON.parse(stored);
      
      const existingIdx = currentHistory.findIndex(s => s.id === session.id);
      if (existingIdx >= 0) {
        currentHistory[existingIdx] = session;
      } else {
        currentHistory.push(session);
      }
      localStorage.setItem('godmind_chat_history', JSON.stringify(currentHistory));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('chat-history-updated'));

      // Save to Supabase via secure API route (fail silently if table isn't set up yet)
      try {
        await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upsert',
            payload: {
              id: session.id,
              title: session.title,
              messages: session.messages,
              updated_at: new Date(session.updatedAt).toISOString()
            }
          })
        });
      } catch (err) {
        console.error("Supabase sync error:", err);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('godmind_chat_history') : null;
      if (stored) {
        const currentHistory = JSON.parse(stored).filter((s: ChatSession) => s.id !== id);
        localStorage.setItem('godmind_chat_history', JSON.stringify(currentHistory));
        setHistory(currentHistory);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('chat-history-updated'));
        
        // Delete from Supabase via secure API route
        try {
          await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete',
              payload: { id }
            })
          });
        } catch (err) {
          console.error("Supabase sync error:", err);
        }
      }
    } catch(err) {
      console.error(err);
    }
  }, []);

  return { history, saveSession, deleteSession };
}
