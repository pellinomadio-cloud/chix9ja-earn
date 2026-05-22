
import React from 'react';
import { Icons } from './Icons';
import { Transaction } from '../types';

interface TransactionReceiptProps {
  transaction: Transaction;
  userName: string;
  onBack: () => void;
}

const TransactionReceipt: React.FC<TransactionReceiptProps> = ({ transaction, userName, onBack }) => {
  const isCredit = transaction.type === 'credit';
  const isPending = transaction.status === 'pending';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800">
          <Icons.ArrowLeft size={24} className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Transaction Receipt</h2>
      </div>

      <div className="bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-800 relative">
        {/* Receipt Header Decorations */}
        <div className="absolute top-0 left-0 w-full h-2 bg-green-glow"></div>
        
        <div className="p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-glow rounded-full flex items-center justify-center text-black font-black italic text-xl shadow-lg">
            Cx
          </div>
          
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction Status</p>
            {isPending ? (
              <div className="flex items-center justify-center space-x-1.5 text-orange-500 mt-1">
                <Icons.Clock size={16} fill="currentColor" className="opacity-20 animate-pulse" />
                <span className="text-sm font-black uppercase">Pending Verification</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-1.5 text-green-400 mt-1">
                <Icons.CheckCircle size={16} fill="currentColor" className="opacity-20" />
                <span className="text-sm font-black uppercase">Successful</span>
              </div>
            )}
          </div>

          <div className="py-2">
            <h3 className="text-4xl font-black text-white tracking-tight">
              {isCredit ? '+' : '-'}₦{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="w-full space-y-4 pt-4 border-t border-dashed border-gray-800">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-500 uppercase">Transaction Type</span>
              <span className="text-sm font-bold text-gray-200 capitalize">{transaction.type}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-500 uppercase">Description</span>
              <span className="text-sm font-bold text-gray-200 text-right max-w-[180px] break-words">
                {transaction.description}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-500 uppercase">Sender/Recipient</span>
              <span className="text-sm font-bold text-gray-200">{isCredit ? 'chix9ja System' : userName}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-500 uppercase">Transaction Date</span>
              <span className="text-sm font-bold text-gray-200 text-right">
                {formatDate(transaction.date)}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-500 uppercase">Reference</span>
              <span className="text-sm font-mono font-bold text-green-glow">{transaction.id}</span>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="pt-6 w-full">
            <div className="bg-black/50 p-3 rounded-xl flex items-center justify-center space-x-2">
              <Icons.ShieldCheck size={14} className="text-green-glow" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Verified by chix9ja Security</span>
            </div>
          </div>
        </div>

        {/* Receipt "Jagged" Bottom Edge Visual */}
        <div className="flex justify-between w-full h-2 overflow-hidden">
           {Array.from({ length: 20 }).map((_, i) => (
             <div key={i} className="w-4 h-4 bg-black transform rotate-45 -mt-2 shrink-0"></div>
           ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'chix9ja Transaction Receipt',
                text: `Transaction of ₦${transaction.amount.toLocaleString()} is ${transaction.status} on chix9ja. Ref: ${transaction.id}`
              });
            } else {
              alert('Receipt shared successfully (simulated)');
            }
          }}
          className="flex-1 py-4 bg-green-glow hover:bg-green-dark text-black font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <Icons.Share2 size={20} />
          <span>Share Receipt</span>
        </button>
        <button 
          onClick={onBack}
          className="px-6 py-4 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-gray-700 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TransactionReceipt;
