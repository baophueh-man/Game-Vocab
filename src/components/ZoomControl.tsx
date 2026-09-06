import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function ZoomControl() {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${(zoomLevel / 100) * 16}px`;
  }, [zoomLevel]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const { isChildLocked } = useSettings();

  if (isChildLocked) {
    return null;
  }

  return (
    <div 
      className="fixed z-[100] flex flex-col items-center bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-slate-200"
      style={{ 
        bottom: '16px', 
        right: '16px', 
        padding: '6px',
        gap: '4px'
      }}
    >
      <button 
        onClick={toggleFullscreen}
        className="text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors flex items-center justify-center mb-1"
        style={{ width: '36px', height: '36px' }}
        title={isFullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}
      >
        {isFullscreen ? <Minimize style={{ width: '20px', height: '20px' }} /> : <Maximize style={{ width: '20px', height: '20px' }} />}
      </button>
      <div className="w-6 h-px bg-slate-200 mb-1"></div>
      <button 
        onClick={handleZoomIn}
        className="text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors flex items-center justify-center"
        style={{ width: '36px', height: '36px' }}
        title="Phóng to"
      >
        <ZoomIn style={{ width: '20px', height: '20px' }} />
      </button>
      <span 
        className="font-bold text-slate-700 text-center"
        style={{ fontSize: '12px', padding: '4px 0', width: '36px' }}
      >
        {zoomLevel}%
      </span>
      <button 
        onClick={handleZoomOut}
        className="text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors flex items-center justify-center"
        style={{ width: '36px', height: '36px' }}
        title="Thu nhỏ"
      >
        <ZoomOut style={{ width: '20px', height: '20px' }} />
      </button>
    </div>
  );
}
