import type { Expense } from '../types/expense';
import type { PeerRecord } from '../types/peer';

function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSVCell(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

export function exportExpensesToCSV(expenses: Expense[], filename = 'SpendWise_Expenses.csv'): void {
  const headers = ['ID', 'Date', 'Amount (INR)', 'Category', 'Description', 'Merchant', 'Payment Method', 'Source', 'Notes'];
  const rows = expenses.map(e => [
    escapeCSVCell(e.id),
    escapeCSVCell(e.date),
    escapeCSVCell(e.amount),
    escapeCSVCell(e.category),
    escapeCSVCell(e.description),
    escapeCSVCell(e.merchant || ''),
    escapeCSVCell(e.paymentMethod || ''),
    escapeCSVCell(e.source || 'manual'),
    escapeCSVCell(e.notes || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(filename, csvContent);
}

export function exportPeerRecordsToCSV(records: PeerRecord[], filename = 'SpendWise_Peer_Ledger.csv'): void {
  const headers = ['ID', 'Person', 'Type', 'Outstanding Amount (INR)', 'Original Amount (INR)', 'Description', 'Date', 'Due Date', 'Status', 'Payments Count'];
  const rows = records.map(r => [
    escapeCSVCell(r.id),
    escapeCSVCell(r.name),
    escapeCSVCell(r.type === 'lent' ? 'You Lent Money' : 'You Borrowed Money'),
    escapeCSVCell(r.amount),
    escapeCSVCell(r.originalAmount),
    escapeCSVCell(r.description),
    escapeCSVCell(r.date),
    escapeCSVCell(r.dueDate || ''),
    escapeCSVCell(r.status),
    escapeCSVCell(r.payments ? r.payments.length : 0)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(filename, csvContent);
}
