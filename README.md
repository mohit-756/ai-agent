# SpendWise V2 — Production-Grade Agentic AI Financial Assistant & PWA

SpendWise Version 2 is a production-grade, offline-first personal finance platform and agentic AI assistant. Built with **React 19**, **Vite**, **Zustand**, **TanStack Query**, **IndexedDB (`idb-keyval`)**, **Zod**, and **Supabase Postgres with Row Level Security (RLS)**.

---

## 🏗️ Version 2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React PWA (Vite)                         │
│  - Feature Modules (expenses, budgets, peers, analytics...)  │
│  - Route-Level Code Splitting (React.lazy) & Error Boundaries│
│  - Zustand Global Stores & IndexedDB Replay Queue (idb-keyval)│
│  - TanStack Query (Server Caching & Optimistic Mutations)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / API Calls
┌──────────────────────────────▼──────────────────────────────┐
│                    Vercel API Gateway                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Agent Orchestrator                       │
│ ├─ Intent Router & 3-State Confidence Scorer                │
│ │   ├─ ≥ 0.90: Auto-Save                                    │
│ │   ├─ 0.70-0.89: Preview & Confirm                         │
│ │   └─ < 0.70: Open Form Modal                              │
│ ├─ Generic Tool Registry                                    │
│ └─ Sub-Agents (Expense, Budget, Peer, Insight, Reminder)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Tool Execution (idempotencyKey)
┌──────────────────────────────▼──────────────────────────────┐
│                      Tool & Service Layer                   │
│ ├─ NLP Parser          ├─ OCR Service                       │
│ ├─ Zod Schema Validator ├─ Budget & Analytics Engine        │
│ └─ Service / Repository Abstractions                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured Database Ops
┌──────────────────────────────▼──────────────────────────────┐
│                    Supabase Postgres Database               │
│ ├─ Row Level Security (Explicit Select/Insert/Update/Delete)│
│ └─ Idempotency & Audit Fields (source, idempotency_key...)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Agentic Architecture & 3-State Confidence UX

SpendWise V2 uses an explicit **Agent Orchestrator** backed by an extensible **Tool Registry**:

```typescript
export interface Tool {
  name: string;
  description: string;
  execute: (input: any, idempotencyKey?: string) => Promise<ToolExecutionResult>;
}
```

### 3-State Confidence Matrix
Every natural language input or image OCR scan is evaluated for intent confidence:

| Confidence | State | UX Action |
| :--- | :--- | :--- |
| **≥ 0.90** | `AUTO_SAVE` | Automatically executes the tool via `toolRegistry` and logs transaction immediately |
| **0.70 – 0.89** | `PREVIEW_CONFIRM` | Displays an inline preview badge and prompts user with a confirmation modal |
| **< 0.70** | `EDITABLE_FORM` | Pre-fills the manual expense modal for explicit user review and correction |

---

## ⚡ Architecture Decisions ("Why We Chose What We Chose")

### 1. Why Zustand over Redux?
- **Zero Boilerplate**: Redux requires actions, reducers, and thunks for modest state updates. Zustand provides lightweight, un-opinionated state management (`useAuthStore`, `useSyncStore`, `useUIStore`) ideal for client-first web apps.
- **Fast Performance**: Components subscribe only to atomic slices of state, preventing unnecessary renders.

### 2. Why TanStack Query?
- **Server-State Separation**: Disentangles local UI state from async server data.
- **Automatic Caching & Optimistic UI**: Provides instant feedback on mutations while background-refreshing stale queries (`staleTime: 60s`, `gcTime: 5m`).

### 3. Why Local-First with IndexedDB (`idb-keyval`)?
- **Zero Latency**: App renders instantly regardless of network condition.
- **Asynchronous & Transactional**: Unlike `localStorage` (which blocks the UI thread and has a ~5MB quota), IndexedDB offers hundreds of MBs of async structured storage for our `PendingAction[]` queue.
- **Idempotency Key Deduplication**: Every queued offline mutation attaches a unique UUID `idempotencyKey`. Reconnect replays skip duplicate inserts on the database level.

### 4. Why Supabase Postgres with RLS?
- **Enterprise Multi-Tenant Security**: Tables (`expenses`, `budgets`, `peer_records`, `receipts`, `ai_conversations`) enforce strict Row Level Security policies checking `auth.uid() = user_id`.
- **Serverless PostgreSQL**: Combines SQL relational query power with vector embeddings (`pgvector`) for context-aware AI memory retrieval.

---

## 🛡️ Database Schema & Row Level Security (RLS)

Run `supabase_schema.sql` in your Supabase SQL Editor:

```sql
-- Explicit 4-Part RLS Policies for Expenses
create policy "users_select_own_expenses" on expenses for select using (auth.uid() = user_id);
create policy "users_insert_own_expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "users_update_own_expenses" on expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_delete_own_expenses" on expenses for delete using (auth.uid() = user_id);
```

---

## 📦 Feature-Based Directory Structure

```
src/
  features/
    expenses/       # ExpensesView, ExpenseModal, QuickAddBar
    budgets/        # BudgetsView
    peers/          # PeerBalancesView & Lending Ledger
    analytics/      # AnalyticsView & Recharts reports
    ai-assistant/   # AIAssistantView, AIInsightsCard, ConfidenceConfirmationModal
    whatsapp/       # WhatsAppHubView & Webhook simulator
    dashboard/      # DashboardView overview
  shared/
    config/         # queryClient.ts configuration
    schemas/        # Zod validation schemas (financeSchemas.ts)
    stores/         # Zustand stores (useSyncStore, useAuthStore, useUIStore)
    repositories/   # ExpenseRepository, BudgetRepository, PeerRepository
    services/       # Domain services & AgentOrchestrator
    ui/             # AppErrorBoundary & shared components
  app/
```

---

## 💻 Local Development & Automated Testing

### Install Dependencies
```bash
npm install
```

### Run Unit Test Suite (Vitest)
```bash
npm run test
```

### Run Local Dev Server
```bash
npm run dev
```

### Build Production Bundle & PWA
```bash
npm run build
```
