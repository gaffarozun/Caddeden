import { useContext } from 'react';
import { CafeDemoContext } from '@/contexts/CafeDemoContext';
export function useCafeDemo() {
  const state = useContext(CafeDemoContext);
  if (!state) throw new Error('useCafeDemo must be used within CafeDemoProvider');
  return state;
}
