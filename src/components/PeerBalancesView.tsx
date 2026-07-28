import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Check, 
  MessageSquare, 
  IndianRupee, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  CalendarClock, 
  History 
} from 'lucide-react';
import { PeerService } from '../services/peerService';
import type { PeerRecord, PeerSummary } from '../types/peer';
import { formatCurrency } from '../services/expenseService';

interface PeerBalancesViewProps {
  theme: 'neon' | 'mono';
  onUpdateMetrics?: () => void;
}

export const PeerBalancesView: React.FC<PeerBalancesViewProps> = ({ theme, onUpdateMetrics }) => {
  const [groupedSummaries, setGroupedSummaries] = useState<PeerSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettled, setShowSettled] = useState(false);
  const [expandedPeers, setExpandedPeers] = useState<Record<string, boolean>>({});

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPaybackModalOpen, setIsPaybackModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PeerRecord | null>(null);

  // Form states for new/edit record
  const [recordId, setRecordId] = useState<string | null>(null);
  const [peerName, setPeerName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Form states for payback
  const [paybackAmount, setPaybackAmount] = useState('');
  const [paybackDate, setPaybackDate] = useState(new Date().toISOString().split('T')[0]);
  const [paybackNotes, setPaybackNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Show current local data first for fast load
    setGroupedSummaries(PeerService.getGroupedSummaries());
    
    // Sync from Supabase in background
    await PeerService.syncFromCloud();
    const data = PeerService.getGroupedSummaries();
    setGroupedSummaries(data);
    if (onUpdateMetrics) {
      onUpdateMetrics();
    }
  };

  const handleOpenAddModal = () => {
    setRecordId(null);
    setPeerName('');
    setAmount('');
    setType('lent');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (record: PeerRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordId(record.id);
    setPeerName(record.name);
    setAmount(record.originalAmount.toString());
    setType(record.type);
    setDescription(record.description);
    setDate(record.date);
    setDueDate(record.dueDate || '');
    setIsRecordModalOpen(true);
  };

  const handleOpenPaybackModal = (record: PeerRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecord(record);
    setPaybackAmount(record.amount.toString());
    setPaybackDate(new Date().toISOString().split('T')[0]);
    setPaybackNotes('');
    setIsPaybackModalOpen(true);
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this peer record?')) {
      PeerService.deletePeerRecord(id);
      loadData();
    }
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !peerName.trim()) return;

    if (recordId) {
      PeerService.updatePeerRecord(recordId, {
        name: peerName.trim(),
        originalAmount: numAmount,
        type,
        description: description.trim() || 'Split Share',
        date,
        dueDate: dueDate || undefined
      });
    } else {
      PeerService.addPeerRecord({
        name: peerName.trim(),
        originalAmount: numAmount,
        type,
        description: description.trim() || 'Split Share',
        date,
        dueDate: dueDate || undefined
      });
    }

    setIsRecordModalOpen(false);
    loadData();
  };

  const handleSavePayback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const numAmount = parseFloat(paybackAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    PeerService.recordPayback(
      selectedRecord.id,
      numAmount,
      paybackDate,
      paybackNotes.trim() || undefined
    );

    setIsPaybackModalOpen(false);
    setSelectedRecord(null);
    loadData();
  };

  const handleRemovePayment = (recordId: string, paymentId: string) => {
    if (window.confirm('Delete this payment log? This will update the outstanding balance.')) {
      PeerService.removePayback(recordId, paymentId);
      loadData();
    }
  };

  const handleSendReminder = (record: PeerRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = record.dueDate && today > record.dueDate;
    
    let message = `Hey ${record.name}, just a friendly reminder regarding the outstanding balance of ₹${record.amount}`;
    if (record.description) {
      message += ` for "${record.description}"`;
    }
    message += ` from ${record.date}.`;

    if (isOverdue && record.dueDate) {
      message += ` (It was due on ${record.dueDate}).`;
    }
    
    message += ` Please transfer when you get a chance. Thanks!`;

    // WhatsApp link
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  const toggleExpandPeer = (name: string) => {
    setExpandedPeers(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Get aggregated stats
  const totalOwedToMe = PeerService.getOwedToMe();
  const totalIOwe = PeerService.getIOwe();
  const netPeerBalance = PeerService.getNetBalance();

  // Filter summaries based on search and status
  const filteredSummaries = groupedSummaries
    .map(summary => {
      // Filter the records of this peer
      const recordsFiltered = summary.records.filter(r => {
        const matchesSearch = r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = showSettled ? true : r.status === 'pending';
        return matchesSearch && matchesStatus;
      });

      return {
        ...summary,
        records: recordsFiltered
      };
    })
    .filter(summary => {
      // Keep peer only if they have matching records
      const hasRecords = summary.records.length > 0;
      return hasRecords;
    });

  const getDueDateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`, color: 'text-red-400 font-bold border-red-500/20 bg-red-500/10' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-amber-400 font-bold border-amber-500/20 bg-amber-500/10' };
    } else {
      return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'text-slate-400 border-slate-800 bg-slate-900/30' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-outfit text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Peer Balances & Lending Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track money lent to friends, paybacks, and setup reminder notifications.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
            theme === 'mono'
              ? 'bg-white text-black hover:bg-neutral-200 shadow-md'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Log Peer Transaction</span>
        </button>
      </div>

      {/* Peer Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Owed to Me */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Owed to Me (Receivables)</div>
          <div className="text-2xl font-bold font-outfit text-emerald-400 mt-2">
            {formatCurrency(totalOwedToMe)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Money friends took from you</p>
        </div>

        {/* I Owe */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">I Owe (Payables)</div>
          <div className="text-2xl font-bold font-outfit text-amber-500 mt-2">
            {formatCurrency(totalIOwe)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Money you borrowed from friends</p>
        </div>

        {/* Net Peer Balance */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Peer Balance</div>
          <div className={`text-2xl font-bold font-outfit mt-2 ${
            netPeerBalance > 0 ? 'text-emerald-400' : netPeerBalance < 0 ? 'text-amber-500' : 'text-slate-300'
          }`}>
            {netPeerBalance > 0 ? '+' : ''}{formatCurrency(netPeerBalance)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {netPeerBalance > 0 ? 'You are in the green' : netPeerBalance < 0 ? 'You are in debt' : 'All square!'}
          </p>
        </div>
      </div>

      {/* Actions and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/20 border border-slate-900 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by peer name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Show Settled Toggle Switch */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <label className="flex items-center cursor-pointer space-x-2 text-xs font-semibold text-slate-400">
            <input
              type="checkbox"
              checked={showSettled}
              onChange={(e) => setShowSettled(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>Show settled transactions</span>
          </label>
        </div>
      </div>

      {/* Grouped Peer Cards List */}
      <div className="space-y-3">
        {filteredSummaries.length > 0 ? (
          filteredSummaries.map((summary) => {
            const isExpanded = expandedPeers[summary.name];
            const isOwed = summary.netBalance > 0;
            const isSettled = summary.netBalance === 0;

            return (
              <div 
                key={summary.name}
                className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden hover:border-slate-800/80 transition duration-200"
              >
                {/* Header Strip for Person */}
                <div 
                  onClick={() => toggleExpandPeer(summary.name)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-950/20 hover:bg-slate-950/40 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isSettled 
                        ? 'bg-slate-800/40 text-slate-400' 
                        : isOwed 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{summary.name}</span>
                        {isSettled && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Settled
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        {summary.records.length} record{summary.records.length > 1 ? 's' : ''} logged
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-xs font-black font-outfit ${
                        isSettled 
                          ? 'text-slate-400' 
                          : isOwed 
                          ? 'text-emerald-400' 
                          : 'text-amber-500'
                      }`}>
                        {isSettled 
                          ? 'Settle' 
                          : isOwed 
                          ? `owes you ${formatCurrency(summary.netBalance)}`
                          : `you owe ${formatCurrency(Math.abs(summary.netBalance))}`
                        }
                      </div>
                    </div>
                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Individual Transactions Feed */}
                {isExpanded && (
                  <div className="border-t border-slate-900/60 p-4 space-y-3 bg-slate-950/10">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transaction History</div>
                    
                    <div className="space-y-2.5">
                      {summary.records.map((record) => {
                        const dateStatus = getDueDateStatus(record.dueDate);
                        
                        return (
                          <div 
                            key={record.id}
                            className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition duration-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Left Info Column */}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    record.type === 'lent'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                                  }`}>
                                    {record.type === 'lent' ? 'Lent' : 'Borrowed'}
                                  </span>
                                  
                                  <h4 className="text-xs font-bold text-white">
                                    {record.description}
                                  </h4>

                                  {record.status === 'settled' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center">
                                      <UserCheck className="w-3 h-3 mr-0.5" /> Paid Back
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500 font-medium">
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" /> {record.date}
                                  </span>
                                  
                                  {record.originalAmount !== record.amount && record.status === 'pending' && (
                                    <span>• Initial: {formatCurrency(record.originalAmount)}</span>
                                  )}

                                  {record.dueDate && record.status === 'pending' && (
                                    <>
                                      <span>•</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] flex items-center border ${dateStatus?.color || ''}`}>
                                        <CalendarClock className="w-3 h-3 mr-1" /> {dateStatus?.text || record.dueDate}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Right Pricing and Actions Column */}
                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-left sm:text-right">
                                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Outstanding</div>
                                  <div className="text-sm font-black font-outfit text-white">
                                    {formatCurrency(record.amount)}
                                  </div>
                                </div>

                                {/* Control Action Buttons */}
                                <div className="flex items-center space-x-1.5">
                                  {record.status === 'pending' && (
                                    <>
                                      {/* Record payback/settle button */}
                                      <button
                                        onClick={(e) => handleOpenPaybackModal(record, e)}
                                        title="Log Payback"
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold transition cursor-pointer"
                                      >
                                        Log Payback
                                      </button>
                                      
                                      {/* WhatsApp Reminder (only for lent) */}
                                      {record.type === 'lent' && (
                                        <button
                                          onClick={(e) => handleSendReminder(record, e)}
                                          title="Send WhatsApp Reminder"
                                          className="p-1.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/10 transition cursor-pointer"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  
                                  {/* Edit */}
                                  <button
                                    onClick={(e) => handleOpenEditModal(record, e)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-900 transition cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={(e) => handleDeleteRecord(record.id, e)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Partial Payments Log Subtimeline */}
                            {record.payments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-900/60 bg-slate-950/20 p-2.5 rounded-lg space-y-1.5">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                                  <History className="w-3 h-3 mr-1 text-slate-500" /> Payback History Log
                                </div>
                                <div className="space-y-1">
                                  {record.payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded">
                                      <div className="flex items-center space-x-2">
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="font-bold text-white">+{formatCurrency(payment.amount)}</span>
                                        <span>•</span>
                                        <span>{payment.date}</span>
                                        {payment.notes && <span className="text-slate-500 italic">({payment.notes})</span>}
                                      </div>
                                      <button 
                                        onClick={() => handleRemovePayment(record.id, payment.id)}
                                        className="text-slate-500 hover:text-red-400 transition"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 border border-dashed border-slate-900 rounded-2xl text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs text-slate-400 font-bold">No Peer Ledger Transactions found</div>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
              Search results are empty, or you don't have active lent/borrowed logs. Try logging one!
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Record Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {recordId ? 'Edit Peer Record' : 'Log Peer Transaction'}
                </h2>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              {/* Type Switcher (Lent vs Borrowed) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setType('lent')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      type === 'lent'
                        ? 'bg-emerald-600/90 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lent (They took from me)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('borrowed')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      type === 'borrowed'
                        ? 'bg-amber-600/90 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Borrowed (I took from them)
                  </button>
                </div>
              </div>

              {/* Peer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Peer Name (Who) *
                </label>
                <input
                  type="text"
                  required
                  value={peerName}
                  onChange={(e) => setPeerName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Memo *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lunch split, Movie tickets, Rent share"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Record Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition duration-200"
                >
                  {recordId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payback Modal */}
      {isPaybackModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white">
                  Log Payback payment
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsPaybackModalOpen(false);
                  setSelectedRecord(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayback} className="p-6 space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction Details</div>
                <div className="text-xs text-white font-bold mt-1.5">{selectedRecord.description}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Peer Name: <span className="text-white font-bold">{selectedRecord.name}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Remaining Debt: <span className="text-white font-bold">{formatCurrency(selectedRecord.amount)}</span>
                </div>
              </div>

              {/* Payback Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount Received Back (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    max={selectedRecord.amount}
                    value={paybackAmount}
                    onChange={(e) => setPaybackAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Cannot exceed outstanding amount of {formatCurrency(selectedRecord.amount)}
                </div>
              </div>

              {/* Payback Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payback Date
                </label>
                <input
                  type="date"
                  required
                  value={paybackDate}
                  onChange={(e) => setPaybackDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transaction Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paybackNotes}
                  onChange={(e) => setPaybackNotes(e.target.value)}
                  placeholder="e.g. Received via GPay, cash given back"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaybackModalOpen(false);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition duration-200"
                >
                  Log Payback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
