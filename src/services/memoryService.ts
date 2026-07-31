import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface MemoryItem {
  id: string;
  content: string;
  category: 'note' | 'reminder' | 'idea' | 'task';
  createdAt: string;
  date?: string;
  source?: 'manual' | 'voice' | 'whatsapp';
}

const MEMORIES_STORAGE_KEY = 'spendwise_real_life_memories';

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    content: 'Doctor appointment scheduled for Friday at 5:00 PM',
    category: 'reminder',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    source: 'voice'
  },
  {
    id: 'mem-2',
    content: 'Buy groceries: organic milk, sourdough bread, avocados',
    category: 'task',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    source: 'manual'
  },
  {
    id: 'mem-3',
    content: 'Idea: Build a 1-click WhatsApp voice expense and note logger',
    category: 'idea',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    date: new Date().toISOString().split('T')[0],
    source: 'voice'
  }
];

export class MemoryService {
  public static getMemories(): MemoryItem[] {
    try {
      const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
      if (!stored) {
        this.saveMemories(INITIAL_MEMORIES);
        return INITIAL_MEMORIES;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_MEMORIES;
    }
  }

  public static saveMemories(memories: MemoryItem[]): void {
    localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
  }

  public static addMemory(item: Omit<MemoryItem, 'id' | 'createdAt'>): MemoryItem {
    const memories = this.getMemories();
    const newMemory: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newMemory, ...memories];
    this.saveMemories(updated);

    // Sync in background to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase.from('memories').insert([{
        content: `[${newMemory.category.toUpperCase()}] ${newMemory.content}`,
        metadata: {
          category: newMemory.category,
          source: newMemory.source || 'manual',
          date: newMemory.date
        }
      }]).then(({ error }) => {
        if (error) console.error('Failed to sync memory to Supabase:', error);
      });
    }

    return newMemory;
  }

  public static deleteMemory(id: string): boolean {
    const memories = this.getMemories();
    const filtered = memories.filter(m => m.id !== id);
    if (filtered.length === memories.length) return false;
    this.saveMemories(filtered);
    return true;
  }
}
