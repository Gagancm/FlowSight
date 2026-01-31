import { useState, useCallback } from 'react';
import { MOCK_CONNECTIONS } from '../services/mockData';
import type { Connection } from '../types/connections';

export function useConnections() {
  const [connections] = useState<Connection[]>(MOCK_CONNECTIONS);

  const addConnection = useCallback((source: string, target: string) => {
    // TODO: Implement
    console.log('Add connection', source, target);
  }, []);

  return { connections, addConnection };
}
