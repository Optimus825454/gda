import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 px-6 bg-[#111C44]/50 backdrop-blur-sm border-t border-blue-500/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center text-gray-400">
          <span>© {currentYear} Tüm hakları saklıdır.</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span>Design & Code by</span>
          <span className="text-blue-400 font-medium">Erkan ERDEM</span>
          <Heart className="w-4 h-4 text-red-400 animate-pulse" />
        </div>
      </div>
    </footer>
  );
};

export default Footer; 