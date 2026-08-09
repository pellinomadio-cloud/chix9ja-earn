import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User, Plan, ChixTokVideo } from '../types';
import { db, useBankDetails, sanitizeForFirestore } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, XCircle, Clock, Lock } from 'lucide-react';

interface AdvertisePageProps {
  user: User;
  onBack: () => void;
  onGoToSubscribe?: () => void;
}

interface AdvertData {
  id?: string;
  videoName: string;
  videoSize: string;
  videoData: string;
  advertLink: string;
  link?: string;
  price: number;
  days: number;
  totalCost: number;
  status: 'pending' | 'approved' | 'declined' | 'stopped';
  paymentProof: string;
  timestamp: string;
}

export const AdvertisePage: React.FC<AdvertisePageProps> = ({ user, onBack, onGoToSubscribe }) => {
  const [step, setStep] = useState<'form' | 'payment' | 'pending'>('form');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoBase64, setVideoBase64] = useState<string>('');
  
  const [advertLink, setAdvertLink] = useState('');
  const [price, setPrice] = useState('1500'); // Default price per day
  const [days, setDays] = useState('7'); // Default days
  
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeAd, setActiveAd] = useState<AdvertData | null>(null);
  const [loading, setLoading] = useState(true);

  const { bankDetails } = useBankDetails();
  const isSubscribed = !!user.isSubscribed;

  // Calculate costs
  const priceNum = parseInt(price, 10) || 0;
  const daysNum = parseInt(days, 10) || 0;
  const totalCost = priceNum * daysNum;

  useEffect(() => {
    if (!isSubscribed) {
      setLoading(false);
      return;
    }

    // Fetch existing adverts for this user to check status
    const checkExistingAdverts = async () => {
      try {
        const q = query(
          collection(db, 'adverts'),
          where('email', '==', user.email)
        );
        const querySnapshot = await getDocs(q);
        const ads: AdvertData[] = [];
        querySnapshot.forEach((doc) => {
          ads.push({ id: doc.id, ...doc.data() } as AdvertData);
        });

        if (ads.length > 0) {
          // Sort by timestamp desc to find the most recent
          ads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const latestAd = ads[0];
          setActiveAd(latestAd);
          
          if (latestAd.status === 'pending') {
            setStep('pending');
          } else {
            setStep('form');
          }
        }
      } catch (err) {
        console.error("Error checking adverts:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingAdverts();
  }, [isSubscribed, user.email]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert("Please select a valid video file!");
      return;
    }

    setVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    // Convert to Base64 (Truncated or optimized if too large to prevent Firestore 1MB limits)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let b64 = reader.result as string;
      // If video file is larger than 600KB, optimize/truncate for Firestore storage (storing first chunk)
      if (b64.length > 800000) {
        b64 = b64.substring(0, 800000); // Guard rails
      }
      setVideoBase64(b64);
    };
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select an image file for payment proof!");
      return;
    }

    setProofFile(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setProofBase64(reader.result as string);
    };
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartAdvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      alert("Please upload your advertisement video!");
      return;
    }
    if (!advertLink.trim()) {
      alert("Please input your advertisement link!");
      return;
    }
    if (priceNum < 500) {
      alert("Minimum daily price is ₦500!");
      return;
    }
    if (daysNum < 1) {
      alert("Minimum duration is 1 day!");
      return;
    }

    setStep('payment');
  };

  const handleSubmitPayment = async () => {
    if (!proofFile || !proofBase64) {
      alert("Please upload the payment receipt proof!");
      return;
    }

    setSubmitting(true);

    try {
      const newAd: Omit<AdvertData, 'id'> = {
        videoName: videoFile?.name || 'advert_video.mp4',
        videoSize: videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
        videoData: videoBase64 || '',
        advertLink: advertLink.trim(),
        link: advertLink.trim(),
        price: priceNum,
        days: daysNum,
        totalCost: totalCost,
        status: 'pending',
        paymentProof: proofBase64,
        timestamp: new Date().toISOString()
      };

      // Save to firestore adverts collection (pending status initially)
      const docRef = await addDoc(collection(db, 'adverts'), {
        ...newAd,
        email: user.email,
        name: user.name
      });

      setActiveAd({ id: docRef.id, ...newAd });
      setStep('pending');
    } catch (err) {
      console.error("Error submitting advert:", err);
      alert("Failed to submit advert: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 pb-24 font-sans relative overflow-hidden animate-in fade-in duration-200 flex flex-col justify-center items-center px-4">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-md w-full bg-zinc-900/60 backdrop-blur-md rounded-3xl p-8 border border-fuchsia-500/20 text-center space-y-6">
          <div className="w-16 h-16 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto border border-fuchsia-500/30">
            <Icons.Lock className="text-fuchsia-500 h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-wider uppercase font-mono">
              Chix9ja <span className="text-fuchsia-500">Advertise</span>
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Advertise on Chix9ja! Pitch your business to thousands of active users by uploading promotional video campaigns. Exclusive to subscribed accounts.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={onGoToSubscribe}
              className="w-full py-3.5 bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(217,70,239,0.2)] hover:from-fuchsia-600 hover:to-fuchsia-700 active:scale-95 transition-all cursor-pointer"
            >
              Subscribe to Plan
            </button>
            <button
              onClick={onBack}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 pb-24 font-sans relative overflow-hidden animate-in fade-in duration-200 flex flex-col">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md p-4 sticky top-0 z-30 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <Icons.ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-black text-white tracking-wider uppercase font-mono">
            Chix9ja <span className="text-fuchsia-400">Ad Platform</span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Grow Your Business
          </p>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Icons.Sync className="animate-spin text-fuchsia-500" size={24} />
            <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">Checking active campaigns...</p>
          </div>
        ) : step === 'form' ? (
          <form onSubmit={handleStartAdvert} className="space-y-5 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800">
            <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
              Create Video Campaign
            </h3>

            {/* Video Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase">Upload Video Promo</label>
              <div className="border-2 border-dashed border-zinc-800 hover:border-fuchsia-500/50 rounded-2xl p-4 transition-all text-center relative bg-black/40">
                {videoPreview ? (
                  <div className="space-y-3">
                    <video src={videoPreview} controls className="w-full h-36 rounded-xl object-contain bg-black" />
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
                      <span className="truncate max-w-[180px]">{videoFile?.name}</span>
                      <span>{(videoFile!.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <label className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 cursor-pointer font-bold uppercase tracking-wider hover:bg-zinc-850">
                      Change Video
                      <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-6 cursor-pointer space-y-2">
                    <Icons.Upload className="text-zinc-500 h-8 w-8 animate-pulse" />
                    <span className="text-xs text-zinc-400 font-bold">Choose Video Campaign File</span>
                    <span className="text-[10px] text-zinc-600 font-medium">MP4, WebM formats supported</span>
                    <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Link Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-400 uppercase">Advert Call-To-Action Link</label>
              <input
                type="url"
                required
                value={advertLink}
                onChange={(e) => setAdvertLink(e.target.value)}
                placeholder="https://yourwebsite.com/promo"
                className="w-full py-3 px-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-xs text-white placeholder-zinc-650 font-medium focus:outline-none focus:border-fuchsia-500 transition-all"
              />
            </div>

            {/* Row Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-400 uppercase">Daily Price (₦)</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full py-3 px-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-sm font-black font-mono text-white text-center focus:outline-none focus:border-fuchsia-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-400 uppercase">Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full py-3 px-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-sm font-black font-mono text-white text-center focus:outline-none focus:border-fuchsia-500 transition-all"
                />
              </div>
            </div>

            {/* Campaign Summary */}
            <div className="p-4 bg-black/60 rounded-2xl border border-zinc-850 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Daily Cost:</span>
                <span className="text-white font-bold">₦{priceNum.toLocaleString()} / day</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Duration:</span>
                <span className="text-white font-bold">{daysNum} days</span>
              </div>
              <div className="border-t border-zinc-850 pt-2 flex justify-between font-bold text-sm text-fuchsia-400">
                <span>Total Payment:</span>
                <span>₦{totalCost.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Start Advert →
            </button>
          </form>
        ) : step === 'payment' ? (
          <div className="space-y-5 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase tracking-widest block">Checkout</span>
              <h3 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                Campaign Deposit
              </h3>
            </div>

            <div className="p-4 bg-fuchsia-950/20 rounded-2xl border border-fuchsia-500/20 text-center py-5">
              <span className="text-xs font-bold text-zinc-400 block uppercase">Total Transfer Amount</span>
              <span className="text-3xl font-black text-fuchsia-400 font-mono block mt-1">
                ₦{totalCost.toLocaleString()}
              </span>
            </div>

            {/* Bank Account */}
            <div className="p-4 bg-black/40 rounded-2xl border border-zinc-850 space-y-3.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Company Bank Details</span>
              
              <div className="font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">BANK NAME:</span>
                  <span className="text-zinc-200 font-bold">{bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">ACCOUNT NUMBER:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-amber-400 font-extrabold">{bankDetails.accountNumber}</span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-sans">Copied!</span>
                      ) : (
                        <Icons.Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ACCOUNT NAME:</span>
                  <span className="text-zinc-200 font-bold">{bankDetails.accountName}</span>
                </div>
              </div>
            </div>

            {/* Proof of Payment Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase">Upload Payment Proof Receipt</label>
              <div className="border-2 border-dashed border-zinc-800 hover:border-fuchsia-500/50 rounded-2xl p-4 transition-all text-center relative bg-black/40">
                {proofFile ? (
                  <div className="space-y-2">
                    <img src={proofBase64} alt="Receipt proof" className="w-full h-32 object-contain rounded-xl" />
                    <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wide">✓ Receipt selected</p>
                    <label className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 cursor-pointer font-bold hover:bg-zinc-850 uppercase tracking-wide">
                      Replace Receipt
                      <input type="file" accept="image/*" onChange={handleProofSelect} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-6 cursor-pointer space-y-2">
                    <Icons.Camera className="text-zinc-500 h-8 w-8 animate-pulse" />
                    <span className="text-xs text-zinc-400 font-bold">Select Deposit Screenshot / Receipt</span>
                    <input type="file" accept="image/*" onChange={handleProofSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                ← Edit Form
              </button>
              <button
                type="button"
                disabled={submitting || !proofFile}
                onClick={handleSubmitPayment}
                className="flex-1 py-3.5 bg-fuchsia-500 hover:bg-fuchsia-600 disabled:opacity-40 disabled:hover:bg-fuchsia-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Receipt'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 text-center py-8">
            <div className="w-16 h-16 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto border border-fuchsia-500/30">
              {activeAd?.status === 'approved' ? (
                <CheckCircle2 className="text-emerald-400 h-8 w-8" />
              ) : activeAd?.status === 'stopped' ? (
                <AlertCircle className="text-amber-400 h-8 w-8" />
              ) : activeAd?.status === 'declined' ? (
                <XCircle className="text-rose-400 h-8 w-8" />
              ) : (
                <Clock className="text-fuchsia-400 h-8 w-8 animate-pulse" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                {activeAd?.status === 'approved' ? (
                  <span className="text-emerald-400">Campaign Live & Active 🟢</span>
                ) : activeAd?.status === 'stopped' ? (
                  <span className="text-amber-400">Campaign Stopped 🛑</span>
                ) : activeAd?.status === 'declined' ? (
                  <span className="text-rose-400">Campaign Declined ❌</span>
                ) : (
                  <span>Campaign Pending Review ⏳</span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed px-2">
                {activeAd?.status === 'approved' ? (
                  <>Your promotional campaign is currently broadcast live on the main Chix9ja banner! Users can tap your landing page link to visit your offer.</>
                ) : activeAd?.status === 'stopped' ? (
                  <>This advertisement campaign has been stopped by the System Administrator. Contact support or launch a new campaign.</>
                ) : activeAd?.status === 'declined' ? (
                  <>Your advertisement request was declined. Please verify your payment details or creative and try again.</>
                ) : (
                  <>We have received your campaign request and payment proof of <span className="text-fuchsia-400 font-bold">₦{activeAd?.totalCost?.toLocaleString()}</span>. Our Central Treasury is verifying the transaction into the company account before setting your ad live.</>
                )}
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-zinc-850 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">CAMPAIGN:</span>
                <span className="text-zinc-200 truncate max-w-[150px]">{activeAd?.videoName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">LANDING PAGE:</span>
                <a 
                  href={(activeAd?.advertLink || activeAd?.link || '').startsWith('http') ? (activeAd?.advertLink || activeAd?.link || '') : `https://${activeAd?.advertLink || activeAd?.link || ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline truncate max-w-[150px] font-bold"
                >
                  {activeAd?.advertLink || activeAd?.link || 'No link'}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">DAYS BUDGETED:</span>
                <span className="text-white font-bold">{activeAd?.days} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">STATUS:</span>
                <span className={`font-black uppercase ${
                  activeAd?.status === 'approved' ? 'text-emerald-400' :
                  activeAd?.status === 'stopped' ? 'text-amber-400' :
                  activeAd?.status === 'declined' ? 'text-rose-400' : 'text-amber-500'
                }`}>
                  {activeAd?.status === 'approved' ? 'LIVE & APPROVED' :
                   activeAd?.status === 'stopped' ? 'STOPPED BY ADMIN' :
                   activeAd?.status === 'declined' ? 'DECLINED' : 'PENDING APPROVAL'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep('form');
              }}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Start Another Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
