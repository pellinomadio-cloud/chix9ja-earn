import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Advert {
  id: string;
  videoData?: string;
  link?: string;
  name?: string;
  price?: number;
  days?: number;
  status: string;
}

const Banner: React.FC = () => {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    // Real-time listener for approved adverts
    const q = query(collection(db, 'adverts'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Advert[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Advert);
      });
      setAdverts(fetched);
    }, (err) => {
      console.error("Error fetching approved ads for Banner:", err);
    });

    return () => unsubscribe();
  }, []);

  // Cycle ads every 6 seconds if there are multiple
  useEffect(() => {
    if (adverts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (adverts.length + 1)); // Include default slide at index = adverts.length
    }, 6000);
    return () => clearInterval(interval);
  }, [adverts]);

  const handleOpenLink = (link?: string) => {
    if (!link) return;
    let url = link.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  };

  const isDefaultSlide = adverts.length === 0 || currentIndex === adverts.length;
  const currentAd = isDefaultSlide ? null : adverts[currentIndex];

  return (
    <div id="app-dynamic-banner" className="mt-4 mb-24 relative rounded-2xl overflow-hidden shadow-xl border border-green-glow/20 bg-gray-950 transition-all duration-500">
      {/* Background Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/90 to-transparent z-10 pointer-events-none" />

      <div className="relative p-5 flex justify-between items-center min-h-[140px]">
        {isDefaultSlide ? (
          // DEFAULT STATIC PROMOTIONAL SLIDE
          <div className="flex-1 z-20">
            <span className="text-[9px] font-black tracking-widest bg-green-glow/10 text-green-glow px-2.5 py-1 rounded-full uppercase border border-green-glow/20">
              Special Offer
            </span>
            <h3 className="text-green-glow font-black text-xl italic mt-3 mb-1">Financial Freedom!</h3>
            <p className="text-gray-300 text-xs font-semibold mb-3 max-w-[210px] leading-relaxed">
              Unlock your potential with easy credit. <span className="font-extrabold text-green-glow">Our Quick Loan Is Ready When You Are</span>
            </p>
            <button className="bg-green-glow text-black text-xs font-black py-2.5 px-6 rounded-xl shadow-md active:scale-95 transition-all">
              Get Now!
            </button>
          </div>
        ) : (
          // DYNAMIC APPROVED ADVERT SLIDE
          <div className="flex-1 z-20">
            <span className="text-[9px] font-black tracking-widest bg-fuchsia-500/10 text-fuchsia-400 px-2.5 py-1 rounded-full uppercase border border-fuchsia-500/20">
              Sponsored Advert
            </span>
            <h3 className="text-white font-black text-lg truncate max-w-[200px] mt-3 mb-1 uppercase tracking-tight">
              {currentAd?.name || "Business Ad"}
            </h3>
            <p className="text-zinc-300 text-xs font-medium mb-3 max-w-[200px] line-clamp-2 leading-relaxed">
              Check out this sponsored offer from a verified chix9ja partner.
            </p>
            {(currentAd?.link || (currentAd as any)?.advertLink) && (
              <button 
                onClick={() => handleOpenLink(currentAd?.link || (currentAd as any)?.advertLink)}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Visit Website
              </button>
            )}
          </div>
        )}

        {/* Dynamic Media display (Right column) */}
        <div className="absolute right-0 top-0 bottom-0 h-full w-1/2 flex items-center justify-end overflow-hidden z-0">
          {isDefaultSlide ? (
            <img 
              src="https://picsum.photos/220/160?random=22" 
              alt="Growth" 
              className="object-cover h-full w-full opacity-60 mix-blend-lighten" 
            />
          ) : (
            currentAd?.videoData ? (
              <video 
                src={currentAd.videoData} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="object-cover h-full w-full opacity-65 hover:opacity-80 transition-opacity duration-300"
              />
            ) : (
              <img 
                src="https://picsum.photos/220/160?random=11" 
                alt="Ad" 
                className="object-cover h-full w-full opacity-60" 
              />
            )
          )}
        </div>
      </div>

      {/* Pagination Carousel Dots Indicator */}
      {adverts.length > 0 && (
        <div className="absolute bottom-3 left-5 z-20 flex space-x-1.5">
          {Array.from({ length: adverts.length + 1 }).map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-5 bg-green-glow' : 'w-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Banner;
