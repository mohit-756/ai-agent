import React from 'react';
import { Sparkles, Check, Edit2, X, AlertCircle } from 'lucide-react';
import type { AgentOrchestratorResult } from '../../shared/services/agents/agentOrchestrator';
import { formatCurrency } from '../../services/expenseService';

interface Props {
  isOpen: boolean;
  result: AgentOrchestratorResult | null;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export const ConfidenceConfirmationModal: React.FC<Props> = ({
  isOpen,
  result,
  onConfirm,
  onEdit,
  onCancel,
}) => {
  if (!isOpen || !result || !result.proposedPayload) return null;

  const { proposedPayload, confidence } = result;
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Agent Confirmation</h3>
              <p className="text-[11px] text-slate-400">Review AI extracted details before saving</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs">
          <span className="text-slate-400 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
            AI Confidence Score:
          </span>
          <span className="font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            {confidencePercent}%
          </span>
        </div>

        {/* Extracted Payload Summary */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-500">Amount:</span>
            <span className="font-extrabold text-white text-sm">{formatCurrency(proposedPayload.amount)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-500">Description:</span>
            <span className="font-bold text-slate-200">{proposedPayload.description}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-500">Category:</span>
            <span className="font-bold text-indigo-400">{proposedPayload.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-semibold text-slate-300">{proposedPayload.paymentMethod}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Date:</span>
            <span className="font-medium text-slate-400">{proposedPayload.date}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition flex items-center space-x-1"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            <span>Edit Details</span>
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            <span>Approve & Save</span>
          </button>
        </div>

      </div>
    </div>
  );
};
