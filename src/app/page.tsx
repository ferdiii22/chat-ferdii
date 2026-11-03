"use client";
import { useEffect, useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import Navbar from '@/components/Navbar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleSendMessage = async (userMessage: string) => {
    // 1. Add User Message
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // 2. Prepare for Assistant Message
      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '', // Start empty
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // 3. Send Request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) throw new Error(response.statusText);
      if (!response.body) throw new Error('No response body');

      // 4. Handle Streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value || new Uint8Array(), { stream: !done });

        // Tampilkan teks per karakter agar efek mengetik lebih halus dan lambat
        for (let i = 0; i < chunkValue.length; i++) {
          accumulatedContent += chunkValue[i];
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );

          // Jeda waktu per karakter (20ms) agar terasa natural seperti diketik manual
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Optional: Add error message to chat
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-gray-100 dark:bg-[#111315]" style={{ height: '100dvh' }}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main
        className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col"
        style={{ paddingTop: '4.5rem', overflow: 'hidden' }}
      >
        <ChatWindow messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
