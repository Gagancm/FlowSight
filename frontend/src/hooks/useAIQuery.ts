import { useState, useCallback } from 'react';

export function useAIQuery() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendQuery = useCallback(async (query: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    // TODO: Call watsonx Orchestrate API
    setLoading(false);
  }, []);

  return { messages, loading, sendQuery };
}
