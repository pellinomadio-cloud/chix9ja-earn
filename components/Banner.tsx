
import React from 'react';
import { Icons } from './Icons';

const Banner: React.FC = () => {
  return (
    <div className="mt-4 mb-24 relative rounded-xl overflow-hidden shadow-sm border border-green-glow/20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black"></div>
      
      <div className="relative p-4 flex justify-between items-center">
        <div className="flex-1 z-10">
            <h3 className="text-green-glow font-extrabold text-lg italic mb-1">Financial Freedom!</h3>
            <p className="text-gray-300 text-xs font-medium mb-3 max-w-[200px] leading-relaxed">
                Unlock your potential with easy credit. <span className="font-bold text-green-glow">Our Quick Loan Is Ready When You Are</span>
            </p>
            <button className="bg-green-glow text-black text-xs font-bold py-2 px-6 rounded-full shadow-sm">
                Get Now!
            </button>
            
             {/* Pagination Dots Simulation */}
            <div className="flex space-x-1 mt-3">
                <div className="w-2 h-2 rounded-full bg-green-glow"></div>
                <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                <div className="w-2 h-2 rounded-full bg-gray-700"></div>
            </div>
        </div>

        {/* Illustrations */}
        <div className="absolute right-0 bottom-0 h-full w-1/2 flex items-end justify-end pointer-events-none">
             <img 
                src="https://picsum.photos/200/150?random=10" 
                alt="Growth" 
                className="object-cover h-full w-full opacity-90 mask-image-gradient" 
                style={{maskImage: 'linear-gradient(to right, transparent, black)'}}
             />
        </div>
      </div>
    </div>
  );
};

export default Banner;
