import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { saveImageFile } from '../lib/storage';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  initialQuery: string;
}

export default function ImageSearchModal({ isOpen, onClose, onSelect, initialQuery }: ImageSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<{ url: string; thumb: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      if (activeTab === 'search') {
        searchImages(initialQuery);
      }
    }
  }, [isOpen, initialQuery, activeTab]);

  const searchImages = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Using Wikimedia Commons API for free image search without API key
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.query && data.query.pages) {
        const results = Object.values(data.query.pages)
          .map((page: any) => {
            const info = page.imageinfo?.[0];
            if (!info) return null;
            
            // Filter out non-image files (like audio/video)
            const url = info.url.toLowerCase();
            if (!url.endsWith('.jpg') && !url.endsWith('.jpeg') && !url.endsWith('.png') && !url.endsWith('.gif') && !url.endsWith('.svg')) {
              return null;
            }
            
            return {
              url: info.url,
              thumb: info.thumburl || info.url
            };
          })
          .filter(Boolean) as { url: string; thumb: string }[];
          
        setImages(results);
        if (results.length === 0) {
          setError('No images found. Try a different search term.');
        }
      } else {
        setImages([]);
        setError('No images found. Try a different search term.');
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchImages(query);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const filename = `images/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);
      
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 8000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadUrl = await getDownloadURL(storageRef);
      
      onSelect(downloadUrl);
    } catch (error) {
      // Storage upload failed or timed out, fallback to Firestore silently
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const firestoreUrl = await saveImageFile(base64Data);
        onSelect(firestoreUrl);
      } catch (fallbackError) {
        console.error('Fallback to Firestore failed:', fallbackError);
        alert('Failed to upload image. Please ensure Firebase is configured correctly.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Image for "{initialQuery}"
            </h3>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex border-b border-slate-200">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'search' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('search')}
            >
              Search Online
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Image
            </button>
          </div>

          {activeTab === 'search' ? (
            <>
              <div className="p-4 border-b border-slate-100">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for images..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Search
                  </button>
                </form>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                    <p>Searching images...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => onSelect(img.url)}
                        className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-all bg-slate-100"
                      >
                        <img 
                          src={img.thumb} 
                          alt="Search result" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 p-8 bg-slate-50/50 flex flex-col items-center justify-center min-h-[300px]">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              
              <div className="w-full max-w-sm">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full aspect-video border-2 border-dashed border-indigo-300 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-indigo-50 hover:border-indigo-400 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <span className="text-slate-600 font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-700">Click to upload image</p>
                        <p className="text-sm text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
