import { flushPendingContentSave, useAppStore } from '../../src/store/useAppStore';

const initialState = useAppStore.getState();

export function resetAppStore(): void {
  flushPendingContentSave();
  useAppStore.setState(initialState);
}
