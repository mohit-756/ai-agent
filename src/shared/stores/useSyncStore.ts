import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { ExpenseRepository } from '../repositories/expenseRepo';
import { BudgetRepository } from '../repositories/budgetRepo';
import { PeerRepository } from '../repositories/peerRepo';

export interface PendingAction {
  id: string; // UUID
  type: 'ADD_EXPENSE' | 'UPDATE_BUDGET' | 'ADD_PEER_RECORD' | 'DELETE_EXPENSE';
  payload: any;
  createdAt: string;
  idempotencyKey: string;
}

interface SyncStoreState {
  pendingQueue: PendingAction[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  initQueue: () => Promise<void>;
  enqueueAction: (action: Omit<PendingAction, 'id' | 'createdAt' | 'idempotencyKey'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  replayQueue: () => Promise<{ processed: number; failed: number }>;
}

const STORAGE_KEY = 'spendwise_pending_actions_v2';

export const useSyncStore = create<SyncStoreState>((setStore, getStore) => ({
  pendingQueue: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncedAt: null,

  initQueue: async () => {
    try {
      const stored = await get<PendingAction[]>(STORAGE_KEY);
      if (stored && Array.isArray(stored)) {
        setStore({ pendingQueue: stored });
      }
    } catch (err) {
      console.error('Failed to initialize sync queue from IndexedDB:', err);
    }
  },

  enqueueAction: async (action) => {
    const idempotencyKey = crypto.randomUUID();
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      idempotencyKey,
    };
    const updatedQueue = [...getStore().pendingQueue, newAction];
    setStore({ pendingQueue: updatedQueue });
    await set(STORAGE_KEY, updatedQueue);

    // If online, trigger immediate replay attempt
    if (getStore().isOnline) {
      getStore().replayQueue();
    }
  },

  removeFromQueue: async (id: string) => {
    const updatedQueue = getStore().pendingQueue.filter((item) => item.id !== id);
    setStore({ pendingQueue: updatedQueue });
    await set(STORAGE_KEY, updatedQueue);
  },

  clearQueue: async () => {
    setStore({ pendingQueue: [] });
    await set(STORAGE_KEY, []);
  },

  setOnlineStatus: (status: boolean) => {
    setStore({ isOnline: status });
    if (status) {
      getStore().replayQueue();
    }
  },

  replayQueue: async () => {
    const queue = getStore().pendingQueue;
    if (queue.length === 0 || getStore().isSyncing) {
      return { processed: 0, failed: 0 };
    }

    setStore({ isSyncing: true });
    let processed = 0;
    let failed = 0;

    for (const action of [...queue]) {
      try {
        let success = false;
        if (action.type === 'ADD_EXPENSE') {
          success = await ExpenseRepository.insert(action.payload, action.idempotencyKey);
        } else if (action.type === 'UPDATE_BUDGET') {
          success = await BudgetRepository.upsert(action.payload);
        } else if (action.type === 'ADD_PEER_RECORD') {
          success = await PeerRepository.insert(action.payload);
        } else if (action.type === 'DELETE_EXPENSE') {
          success = await ExpenseRepository.delete(action.payload.id);
        }

        if (success) {
          await getStore().removeFromQueue(action.id);
          processed++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Failed to replay offline action ${action.id}:`, err);
        failed++;
      }
    }

    setStore({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
    return { processed, failed };
  },
}));
