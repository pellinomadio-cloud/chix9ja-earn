import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { User, ChixTokVideo, ChixTokComment, Transaction } from '../types';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, useBankDetails, syncUserFromLocalToFirestore, sanitizeForFirestore } from '../firebase';

interface ChixTokProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateToDeposit?: () => void;
  onBack: () => void;
}

// Preset Nigerian User Success Comments for >6K realistic testimonies
const presetSuccessComments: ChixTokComment[] = [
  {
    id: 'c1',
    userName: 'Chioma Okereke',
    comment: 'I followed step 2 and cashed out ₦350,000 straight to my Access Bank account! This works 100%! 🔥🔥',
    timeAgo: '2h ago',
    likesCount: 1420,
    isVerified: true
  },
  {
    id: 'c2',
    userName: 'Babajide Adebayo',
    comment: 'ChixTok tutorials are pure gold. Made ₦180k in my first week! Thank you admin 🙏',
    timeAgo: '3h ago',
    likesCount: 980,
    isVerified: false
  },
  {
    id: 'c3',
    userName: 'Zainab Ibrahim',
    comment: 'The ₦37,000 ChixTok access fee is the best investment I ever made. Already up ₦800,000!',
    timeAgo: '4h ago',
    likesCount: 2310,
    isVerified: true
  },
  {
    id: 'c4',
    userName: 'Emeka Nwosu',
    comment: 'Received my ₦500k bank alert 5 minutes ago! Followed the video instructions step by step 🚀',
    timeAgo: '5h ago',
    likesCount: 1850,
    isVerified: true
  },
  {
    id: 'c5',
    userName: 'Blessing Egwu',
    comment: 'God bless Chix9ja! Instant withdrawal cleared to GTBank without stress 💯',
    timeAgo: '6h ago',
    likesCount: 1120,
    isVerified: false
  },
  {
    id: 'c6',
    userName: 'Kelechi Nnamdi',
    comment: 'If you haven\'t joined ChixTok yet, you are missing out big time! ₦250k received!',
    timeAgo: '7h ago',
    likesCount: 890,
    isVerified: false
  },
  {
    id: 'c7',
    userName: 'Amina Musa',
    comment: 'Proof is in the bank alert! ₦420,000 credited today. So happy! 🎉',
    timeAgo: '8h ago',
    likesCount: 1540,
    isVerified: true
  },
  {
    id: 'c8',
    userName: 'Tunde Folorunsho',
    comment: 'This strategy is crazy! Cleared my pending cashout immediately 🔥',
    timeAgo: '10h ago',
    likesCount: 760,
    isVerified: false
  },
  {
    id: 'c9',
    userName: 'Florence Danjuma',
    comment: 'Just unlocked my second ₦500k payout! ChixTok tutorials never disappoint!',
    timeAgo: '12h ago',
    likesCount: 1390,
    isVerified: true
  },
  {
    id: 'c10',
    userName: 'Victor Chukwuma',
    comment: 'Direct bank credit confirmed! ₦300,000 into my Kuda account instantly!',
    timeAgo: '1d ago',
    likesCount: 2040,
    isVerified: true
  }
];

export const defaultChixTokVideos: ChixTokVideo[] = [
  {
    id: 'vid-1',
    title: 'Secret ₦500,000 Daily Cashout Strategy Revealed!',
    description: 'Learn step-by-step how to unlock maximum cashout acceleration on Chix9ja! Watch until the end for the secret withdrawal code. 🚀🔥 #ChixTok #Chix9ja #CashoutProof',
    creatorName: 'Chix9ja Official Tutorials',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-counting-money-41221-large.mp4',
    likesCount: 148500,
    commentsCount: 6840,
    sharesCount: 19200,
    comments: presetSuccessComments,
    createdAt: new Date().toISOString(),
    soundName: '♫ Chix9ja Official Success Anthem - Original Sound'
  },
  {
    id: 'vid-2',
    title: 'How to Instant Withdraw ₦250,000 to Any Bank in Nigeria',
    description: 'Fast track your pending withdrawal in 2 minutes! Detailed tutorial on linking your verified bank account and executing instant cashout. 💰📱 #BankAlert #FinancialFreedom',
    creatorName: 'Master Trader Alex',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-man-looking-at-his-phone-41584-large.mp4',
    likesCount: 124200,
    commentsCount: 6150,
    sharesCount: 14800,
    comments: presetSuccessComments,
    createdAt: new Date().toISOString(),
    soundName: '♫ VIP Cashout Beats - ChixTok Audio'
  },
  {
    id: 'vid-3',
    title: 'Weekly Promo Waitlist & Free ₦500k Dashboard Reward Guide',
    description: 'Don\'t miss out on your weekly ₦500,000 promo credit! Follow this 1-minute guide to join the waitlist and claim your reward automatically. 🎉✨ #FreeReward #Chix9jaTasks',
    creatorName: 'Coach Funke',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-smiling-woman-looking-at-her-smartphone-41582-large.mp4',
    likesCount: 162900,
    commentsCount: 7210,
    sharesCount: 22400,
    comments: presetSuccessComments,
    createdAt: new Date().toISOString(),
    soundName: '♫ ChixTok Viral Motivation - Original Sound'
  }
];

export const getStoredChixTokVideos = (): ChixTokVideo[] => {
  try {
    const saved = localStorage.getItem('chixtok_videos');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse chixtok_videos", e);
  }
  return defaultChixTokVideos;
};

export const saveChixTokVideos = async (videos: ChixTokVideo[]) => {
  try {
    localStorage.setItem('chixtok_videos', JSON.stringify(videos));
  } catch (e) {
    console.error("Failed to save chixtok_videos in localStorage", e);
  }
  for (const video of videos) {
    try {
      await setDoc(doc(db, 'chixtok_videos', video.id), sanitizeForFirestore(video), { merge: true });
    } catch (err) {
      console.warn(`Could not sync video ${video.id} to Firestore:`, err);
    }
  }
};

export const deleteChixTokVideoFromFirestore = async (vidId: string) => {
  try {
    localStorage.setItem('chixtok_videos', JSON.stringify(getStoredChixTokVideos().filter(v => v.id !== vidId)));
  } catch (e) {}
  try {
    await deleteDoc(doc(db, 'chixtok_videos', vidId));
  } catch (err) {
    console.warn(`Could not delete video ${vidId} from Firestore:`, err);
  }
};

const ChixTok: React.FC<ChixTokProps> = ({ user, onUpdateUser, onNavigateToDeposit, onBack }) => {
  const [videos, setVideos] = useState<ChixTokVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const { bankDetails } = useBankDetails();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Realtime subscription to both chixtok_videos AND approved sponsored adverts in Firestore
  useEffect(() => {
    let directChixTokVids: ChixTokVideo[] = [];
    let sponsoredAdVids: ChixTokVideo[] = [];

    const updateCombinedVideos = () => {
      const combinedMap = new Map<string, ChixTokVideo>();

      // Sponsored Adverts first so users see active sponsored videos at top
      sponsoredAdVids.forEach(v => combinedMap.set(v.id, v));
      directChixTokVids.forEach(v => {
        if (!combinedMap.has(v.id)) {
          combinedMap.set(v.id, v);
        }
      });

      const combinedList = Array.from(combinedMap.values());
      combinedList.sort((a, b) => {
        const aIsAd = a.id.startsWith('ad-') || a.id.startsWith('vid-ad-');
        const bIsAd = b.id.startsWith('ad-') || b.id.startsWith('vid-ad-');
        if (aIsAd && !bIsAd) return -1;
        if (!aIsAd && bIsAd) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      if (combinedList.length > 0) {
        setVideos(combinedList);
        try {
          localStorage.setItem('chixtok_videos', JSON.stringify(combinedList));
        } catch (e) {}
      } else {
        setVideos(getStoredChixTokVideos());
      }
    };

    // 1. Listen to chixtok_videos
    const unsubChixTok = onSnapshot(collection(db, 'chixtok_videos'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: ChixTokVideo[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as ChixTokVideo);
        });
        directChixTokVids = loaded;
      } else {
        // Seed default videos into Firestore if empty
        defaultChixTokVideos.forEach((v) => {
          setDoc(doc(db, 'chixtok_videos', v.id), sanitizeForFirestore(v), { merge: true }).catch(() => {});
        });
        directChixTokVids = defaultChixTokVideos;
      }
      updateCombinedVideos();
    }, (error) => {
      console.error("Error listening to chixtok_videos in Firestore:", error);
      directChixTokVids = getStoredChixTokVideos();
      updateCombinedVideos();
    });

    // 2. Listen to adverts collection (Approved sponsored video adverts only)
    const unsubAdverts = onSnapshot(collection(db, 'adverts'), (snapshot) => {
      const ads: ChixTokVideo[] = [];
      if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
          const adData = docSnap.data();
          if (adData.status === 'approved') {
            const videoSource = adData.videoData || adData.videoUrl || adData.video || 'https://assets.mixkit.co/videos/preview/mixkit-hands-counting-money-41221-large.mp4';
            const adVid: ChixTokVideo = {
              id: `ad-${docSnap.id}`,
              title: adData.videoName || adData.title || adData.name || 'Sponsored Video Advert',
              description: adData.advertLink ? `🔥 SPONSORED ADVERT: ${adData.advertLink}` : (adData.videoName || '🔥 Sponsored Advertisement on Chix9ja'),
              creatorName: adData.name ? `${adData.name} (Sponsored)` : 'Sponsored Partner',
              creatorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
              videoUrl: videoSource,
              likesCount: 38400,
              commentsCount: 940,
              sharesCount: 2100,
              comments: [
                {
                  id: `c-ad-${docSnap.id}-1`,
                  userName: 'Chix9ja Sponsor Manager',
                  comment: `Official Sponsored Video Advert. Click to check out: ${adData.advertLink || adData.link || 'https://chix9ja.com'}`,
                  timeAgo: 'Sponsored',
                  likesCount: 1540,
                  isVerified: true
                }
              ],
              createdAt: adData.timestamp || new Date().toISOString(),
              soundName: '♫ Sponsored Video Advert - Official Partner Sound'
            };
            ads.push(adVid);
          }
        });
      }
      sponsoredAdVids = ads;
      updateCombinedVideos();
    }, (error) => {
      console.error("Error listening to adverts in ChixTok:", error);
    });

    return () => {
      unsubChixTok();
      unsubAdverts();
    };
  }, []);

  const currentVideo = videos[currentIndex] || defaultChixTokVideos[0];

  // Play/Pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Toggle Like
  const handleToggleLike = (vidId: string) => {
    const isLiked = !!likedVideos[vidId];
    setLikedVideos(prev => ({ ...prev, [vidId]: !isLiked }));

    setVideos(prev => prev.map(v => {
      if (v.id === vidId) {
        return {
          ...v,
          likesCount: isLiked ? v.likesCount - 1 : v.likesCount + 1
        };
      }
      return v;
    }));
  };

  // Switch Video
  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleNextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const handleCopyAccount = () => {
    if (bankDetails.accountNumber) {
      navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Join ChixTok for ₦37,000 (Payment to Company Account & Admin Approval)
  const handleJoinChixTok = async () => {
    const COST = 37000;
    if (!proofBase64) {
      alert("Please select and upload your payment transfer receipt to our company account first.");
      return;
    }

    setIsSubmittingJoin(true);

    try {
      const updatedUser: User = {
        ...user,
        pendingActivation: 'chixtok',
        pendingPaymentProof: proofBase64,
        pendingPaymentAmount: COST,
        pendingPaymentDate: new Date().toISOString(),
        lastUploadTimestamp: Date.now()
      };

      onUpdateUser(updatedUser);
      await syncUserFromLocalToFirestore(user.email);

      setIsSubmittingJoin(false);
      setShowJoinModal(false);
      alert('🎉 Payment receipt submitted successfully! Your ₦37,000 ChixTok VIP membership payment to our company account has been sent to the admin team for verification. Once approved by admin, your commenting privileges will be automatically unlocked.');
    } catch (err) {
      console.error("Error submitting ChixTok payment proof:", err);
      setIsSubmittingJoin(false);
      alert("An error occurred while submitting payment proof. Please try again.");
    }
  };

  // Post a new comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!user.hasJoinedChixTok) {
      setShowJoinModal(true);
      return;
    }

    const myComment: ChixTokComment = {
      id: `c-user-${Date.now()}`,
      userName: user.name || 'Anonymous Member',
      comment: newCommentText.trim(),
      timeAgo: 'Just now',
      likesCount: 1,
      isVerified: user.isVIP || false
    };

    const updatedVideos = videos.map(v => {
      if (v.id === currentVideo.id) {
        return {
          ...v,
          commentsCount: v.commentsCount + 1,
          comments: [myComment, ...(v.comments || [])]
        };
      }
      return v;
    });

    setVideos(updatedVideos);
    saveChixTokVideos(updatedVideos);
    setNewCommentText('');
  };

  return (
    <div className="relative w-full h-[88vh] max-w-md mx-auto bg-black text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition active:scale-95"
        >
          <Icons.ArrowLeft size={20} />
        </button>

        {/* Center ChixTok Feed Navigation Tabs */}
        <div className="flex items-center space-x-4 text-sm font-bold tracking-wider">
          <span className="text-zinc-400 cursor-pointer hover:text-white transition">Following</span>
          <span className="text-white border-b-2 border-rose-500 pb-0.5 cursor-pointer flex items-center gap-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
            For You
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          </span>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition active:scale-95"
        >
          {isMuted ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}
        </button>
      </div>

      {/* Main Video Viewport */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden" onClick={togglePlay}>
        {currentVideo?.videoUrl ? (
          <video 
            ref={videoRef}
            src={currentVideo.videoUrl}
            className="w-full h-full object-cover"
            loop
            autoPlay
            playsInline
            muted={isMuted}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-rose-950/40 to-black flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
              <Icons.Video size={40} />
            </div>
            <h3 className="text-lg font-black text-white">{currentVideo.title}</h3>
            <p className="text-xs text-zinc-400">{currentVideo.description}</p>
          </div>
        )}

        {/* Play / Pause Tap Overlay Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white animate-scale-up">
              <Icons.Play size={32} className="ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Bottom Left Video Info Details Overlay */}
        <div className="absolute bottom-4 left-4 right-20 z-20 space-y-2 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <span className="font-black text-sm text-white drop-shadow-md">
              @{currentVideo.creatorName.replace(/\s+/g, '')}
            </span>
            <span className="bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
              <Icons.Check size={10} className="stroke-[3]" />
            </span>
            <button className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Follow
            </button>
          </div>

          <p className="text-xs text-zinc-100 font-medium line-clamp-2 leading-snug drop-shadow">
            {currentVideo.description}
          </p>

          {/* Audio Ticker */}
          <div className="flex items-center space-x-2 text-[11px] text-zinc-300 font-mono">
            <Icons.Music size={12} className="animate-spin-slow text-rose-400" />
            <span className="truncate max-w-[180px]">{currentVideo.soundName || 'Original Sound - Chix9ja'}</span>
          </div>
        </div>

        {/* Right Side Action Column */}
        <div className="absolute right-3 bottom-12 z-20 flex flex-col items-center space-y-5 pointer-events-auto">
          
          {/* Creator Avatar with Follow Badge */}
          <div className="relative group cursor-pointer">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 to-amber-400 shadow-lg">
              <img 
                src={currentVideo.creatorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} 
                alt="Creator"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-rose-500 text-white rounded-full p-0.5 shadow">
              <Icons.Plus size={12} className="stroke-[3]" />
            </div>
          </div>

          {/* Like Button */}
          <button 
            onClick={() => handleToggleLike(currentVideo.id)}
            className="flex flex-col items-center space-y-1 active:scale-75 transition"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md ${likedVideos[currentVideo.id] ? 'bg-rose-500/30 text-rose-500' : 'bg-black/40 text-white'}`}>
              <Icons.Heart size={24} className={likedVideos[currentVideo.id] ? 'fill-rose-500 text-rose-500' : 'text-white'} />
            </div>
            <span className="text-[11px] font-black text-white drop-shadow">
              {(currentVideo.likesCount / 1000).toFixed(1)}K
            </span>
          </button>

          {/* Comments Button */}
          <button 
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center space-y-1 active:scale-75 transition"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
              <Icons.MessageSquare size={24} className="fill-white/20 text-white" />
            </div>
            <span className="text-[11px] font-black text-white drop-shadow">
              {(currentVideo.commentsCount / 1000).toFixed(1)}K
            </span>
          </button>

          {/* Share Button */}
          <button 
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('✨ Tutorial link copied! Share with friends to earn referral bonuses!');
            }}
            className="flex flex-col items-center space-y-1 active:scale-75 transition"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
              <Icons.Share2 size={22} className="text-white" />
            </div>
            <span className="text-[11px] font-black text-white drop-shadow">
              {(currentVideo.sharesCount / 1000).toFixed(1)}K
            </span>
          </button>

          {/* Rotating Music Disc */}
          <div className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center animate-spin-slow p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-500 via-zinc-800 to-amber-400 flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-full" />
            </div>
          </div>

        </div>

        {/* Feed Swipe Navigation Buttons */}
        <div className="absolute right-3 top-24 z-20 flex flex-col space-y-2">
          {currentIndex > 0 && (
            <button 
              onClick={handlePrevVideo}
              className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition"
              title="Previous Video"
            >
              <Icons.ChevronDown size={18} className="rotate-180" />
            </button>
          )}
          {currentIndex < videos.length - 1 && (
            <button 
              onClick={handleNextVideo}
              className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition"
              title="Next Video"
            >
              <Icons.ChevronDown size={18} />
            </button>
          )}
        </div>

      </div>

      {/* COMMENTS DRAWER SLIDE-UP SHEET */}
      {showComments && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="w-full h-[70%] bg-zinc-900 rounded-t-3xl border-t border-zinc-800 flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-white">
                  {currentVideo.commentsCount.toLocaleString()} Comments
                </span>
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                  Testimonies Verified
                </span>
              </div>
              <button 
                onClick={() => setShowComments(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-zinc-800/50">
              {currentVideo.comments && currentVideo.comments.length > 0 ? (
                currentVideo.comments.map((cmt) => (
                  <div key={cmt.id} className="pt-3 first:pt-0 flex space-x-3 items-start">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-xs flex-shrink-0 shadow-md">
                      {cmt.userName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-zinc-200">{cmt.userName}</span>
                        {cmt.isVerified && (
                          <span className="bg-blue-500 text-white rounded-full p-0.5">
                            <Icons.Check size={8} className="stroke-[3]" />
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500">{cmt.timeAgo}</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{cmt.comment}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1 cursor-pointer hover:text-rose-400">
                          <Icons.Heart size={12} /> {cmt.likesCount}
                        </span>
                        <span className="cursor-pointer hover:text-zinc-300">Reply</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>

            {/* Comment Submission / Membership Requirement Footer */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800">
              {!user.hasJoinedChixTok ? (
                user.pendingActivation === 'chixtok' ? (
                  <div className="bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border border-amber-500/50 rounded-xl p-3 space-y-2 text-center shadow-lg">
                    <div className="flex items-center justify-center space-x-2 text-amber-400">
                      <Icons.Clock size={16} className="animate-spin" />
                      <span className="text-xs font-black uppercase tracking-wider">Payment Under Verification</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                      Your <strong className="text-yellow-300">₦37,000</strong> transfer receipt to our company account was received and is awaiting admin approval.
                    </p>
                    <button 
                      onClick={() => setShowJoinModal(true)}
                      className="w-full py-2.5 rounded-lg bg-zinc-800 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-zinc-700 transition flex items-center justify-center space-x-2"
                    >
                      <Icons.Eye size={14} />
                      <span>View Transfer Receipt Status</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-rose-950/60 via-zinc-900 to-amber-950/60 border border-rose-500/40 rounded-xl p-3 space-y-2 text-center shadow-lg">
                    <div className="flex items-center justify-center space-x-2 text-rose-400">
                      <Icons.Lock size={16} />
                      <span className="text-xs font-black uppercase tracking-wider">Comment Privileges Locked</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-medium">
                      Pay <strong className="text-yellow-300">₦37,000</strong> to company account to join ChixTok & drop comments.
                    </p>
                    <button 
                      onClick={() => setShowJoinModal(true)}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2"
                    >
                      <Icons.Sparkles size={14} />
                      <span>Pay ₦37,000 to Company Account</span>
                    </button>
                  </div>
                )
              ) : (
                <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                  <input 
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-xs rounded-full px-4 py-2.5 focus:outline-none focus:border-rose-500"
                  />
                  <button 
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-600 transition"
                  >
                    <Icons.Send size={16} />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* JOIN CHIXTOK PAYMENT MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full space-y-5 text-center shadow-2xl relative overflow-hidden my-auto">
            
            {user.pendingActivation === 'chixtok' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 p-0.5 mx-auto flex items-center justify-center text-amber-400">
                  <Icons.Clock size={32} className="animate-spin" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white tracking-wide">Payment Proof Submitted</h3>
                  <p className="text-xs text-amber-300 font-semibold">
                    Awaiting Administrator Approval
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Package:</span>
                    <span className="font-bold text-white">ChixTok VIP Joining Fee</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Amount Paid:</span>
                    <span className="font-bold text-yellow-400 font-mono">₦37,000</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-zinc-400">Submitted On:</span>
                    <span className="font-mono text-zinc-300">
                      {user.pendingPaymentDate ? new Date(user.pendingPaymentDate).toLocaleString() : 'Recently'}
                    </span>
                  </div>
                </div>

                {user.pendingPaymentProof && (
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Uploaded Transfer Receipt</span>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl max-h-48 overflow-hidden flex items-center justify-center">
                      <img src={user.pendingPaymentProof} alt="Payment Receipt" className="max-h-40 object-contain rounded-lg" />
                    </div>
                  </div>
                )}

                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-left text-[11px] text-amber-200/90 leading-relaxed">
                  <strong>Notice:</strong> Your payment receipt has been submitted directly to the Chix9ja admin queue. Admin will verify the transfer to the company account and approve your VIP membership shortly.
                </div>

                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="w-full py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 transition"
                >
                  Close & Wait for Approval
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-rose-400">
                    <Icons.Video size={26} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white tracking-wide">Join ChixTok VIP</h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Pay ₦37,000 to the official company account below and upload your transfer receipt for admin approval.
                  </p>
                </div>

                {/* Company Bank Details Card */}
                <div className="bg-zinc-950 border border-rose-500/30 rounded-xl p-4 text-left space-y-2.5 relative">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <Icons.Building size={12} />
                      Company Account Details
                    </span>
                    <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-500/30">
                      ₦37,000
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-[11px]">Bank Name:</span>
                      <span className="font-bold text-white">{bankDetails.bankName || 'Paga'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-[11px]">Account Number:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-yellow-300 text-sm tracking-wider">{bankDetails.accountNumber || '0435119272'}</span>
                        <button 
                          onClick={handleCopyAccount}
                          className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          {copiedAccount ? <Icons.Check size={12} /> : <Icons.Copy size={12} />}
                          <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-[11px]">Account Name:</span>
                      <span className="font-bold text-zinc-200 text-right text-[11px] truncate max-w-[180px]">{bankDetails.accountName || 'Marvelous Michael O'}</span>
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    Upload Payment Receipt / Proof of Transfer:
                  </label>
                  
                  <div className="relative border-2 border-dashed border-zinc-700 hover:border-rose-500/60 rounded-xl p-3 text-center bg-zinc-950/60 transition cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {proofFile ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                          <Icons.CheckCircle size={14} />
                          <span className="truncate max-w-[200px]">{proofFile.name}</span>
                        </div>
                        {proofBase64 && (
                          <img src={proofBase64} alt="Receipt preview" className="max-h-24 mx-auto rounded border border-zinc-800 object-contain mt-1" />
                        )}
                        <span className="text-[10px] text-zinc-400 block">Click to change file</span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <Icons.Upload size={20} className="mx-auto text-zinc-400" />
                        <span className="text-xs text-zinc-300 font-bold block">Select Payment Receipt</span>
                        <span className="text-[10px] text-zinc-500 block">PNG, JPG, JPEG or PDF format</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-left text-[10px] text-zinc-400 leading-relaxed">
                  💡 Transfers must be sent to the company bank account listed above. Once uploaded, admin will verify and approve your membership.
                </div>

                <div className="flex space-x-3 pt-1">
                  <button 
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs hover:bg-zinc-700 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleJoinChixTok}
                    disabled={isSubmittingJoin || !proofBase64}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmittingJoin ? (
                      <span className="animate-spin text-white">⏳</span>
                    ) : (
                      <span>Submit for Admin Approval</span>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ChixTok;
