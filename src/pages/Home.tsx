import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getSets, deleteSet, saveSet } from '../lib/storage';
import { WordSet } from '../types';
import { Play, Edit, Trash2, Book, Plus, X, AlertTriangle, Share2, Check, Package, Download, Copy, Loader2, Cloud, ExternalLink, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportWordSetPackage, importWordSetPackage } from '../utils/packageZip';
import { generateId } from '../lib/utils';
import { auth } from '../firebase';

export default function Home() {
  const [sets, setSets] = useState<WordSet[]>([]);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareModalSet, setShareModalSet] = useState<WordSet | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isProcessingPackage, setIsProcessingPackage] = useState(false);
  const [packageStatusText, setPackageStatusText] = useState('');
  const packageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSets = async () => {
      const loadedSets = await getSets();
      setSets(loadedSets);
    };
    loadSets();
  }, []);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDeleteSetId(id);
    setDeletePassword('');
    setDeleteError('');
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (deletePassword.trim() !== '13579') {
      setDeleteError('Mật khẩu không đúng. Vui lòng nhập 13579');
      return;
    }
    
    if (deleteSetId) {
      try {
        setIsDeleting(true);
        await deleteSet(deleteSetId);
        const loadedSets = await getSets();
        setSets(loadedSets);
        setDeleteSetId(null);
      } catch (error) {
        console.error('Delete error:', error);
        setDeleteError('Không thể xoá bộ từ vựng.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getPublicShareUrl = (setId: string) => {
    // If currently running in AI Studio private dev environment, map to the public preview domain
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}/play/${setId}`;
  };

  const handleShareClick = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const targetSet = sets.find(s => s.id === id);
    if (!targetSet) return;

    setShareModalSet(targetSet);
    const url = getPublicShareUrl(id);

    // Sync to Firestore immediately so it's guaranteed to be available on cloud
    setIsSyncingCloud(true);
    saveSet(targetSet)
      .then(() => setIsSyncingCloud(false))
      .catch((err) => {
        console.warn('Sync to cloud on share failed:', err);
        setIsSyncingCloud(false);
      });

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
      // Fallback if clipboard API is blocked (e.g. in some iframes)
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedId(id);
        setTimeout(() => {
          setCopiedId(null);
        }, 3000);
      } catch (e) {
        console.error('Fallback copy failed: ', e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDuplicateSet = async (e: React.MouseEvent, originalSet: WordSet) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsProcessingPackage(true);
      setPackageStatusText('Đang nhân bản bộ từ vựng...');
      
      const newWords = originalSet.words.map(w => ({
        ...w,
        id: generateId(),
      }));

      const clonedSet: WordSet = {
        ...originalSet,
        id: generateId(),
        title: `${originalSet.title} (Bản sao)`,
        words: newWords,
        createdAt: Date.now(),
      };

      await saveSet(clonedSet);
      const loaded = await getSets();
      setSets(loaded);
    } catch (err) {
      console.error('Duplicate set error:', err);
      alert('Không thể nhân bản bộ từ vựng.');
    } finally {
      setIsProcessingPackage(false);
      setPackageStatusText('');
    }
  };

  const handleExportPackageFromHome = async (e: React.MouseEvent, set: WordSet) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsProcessingPackage(true);
      await exportWordSetPackage(set.title, set.description || '', set.words, (_curr, _total, msg) => {
        setPackageStatusText(msg);
      });
    } catch (err) {
      console.error('Export package error:', err);
      alert('Có lỗi xảy ra khi xuất gói ZIP.');
    } finally {
      setIsProcessingPackage(false);
      setPackageStatusText('');
    }
  };

  const handleImportPackageFromHome = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPackage(true);
      const result = await importWordSetPackage(file, (_curr, _total, msg) => {
        setPackageStatusText(msg);
      });

      if (result.words && result.words.length > 0) {
        const newSet: WordSet = {
          id: generateId(),
          title: result.title,
          description: result.description,
          words: result.words,
          createdAt: Date.now(),
          userId: auth.currentUser?.uid || 'guest',
        };

        await saveSet(newSet);
        const loaded = await getSets();
        setSets(loaded);
        alert(`Đã nhập thành công bộ từ vựng "${result.title}" với ${result.words.length} từ vào thư viện!`);
      }
    } catch (err: any) {
      console.error('Import package error:', err);
      alert(err?.message || 'Có lỗi xảy ra khi giải nén gói ZIP.');
    } finally {
      setIsProcessingPackage(false);
      setPackageStatusText('');
      if (packageFileInputRef.current) packageFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Library</h1>
          <p className="text-slate-500 mt-1">Manage your vocabulary sets and play games.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".zip"
            ref={packageFileInputRef}
            className="hidden"
            onChange={handleImportPackageFromHome}
          />
          <button
            onClick={() => packageFileInputRef.current?.click()}
            disabled={isProcessingPackage}
            title="Nhập 1 bộ flashcard hoàn chỉnh (từ vựng + hình ảnh + âm thanh) từ file .zip"
            className="bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-xs"
          >
            <Package className="w-4 h-4 text-indigo-600" />
            Nhập Gói ZIP (1-Click)
          </button>
          <Link
            to="/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create Set
          </Link>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Book className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No vocabulary sets yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Create your first set manually or import from Excel or 1-Click ZIP Package to start playing learning games.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/create"
              className="text-indigo-600 font-medium hover:underline"
            >
              Create your first set &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {sets.map((set, index) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {set.words.length}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleExportPackageFromHome(e, set)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Xuất gói ZIP trọn bộ (1-Click)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicateSet(e, set)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Nhân bản bộ này (Duplicate)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleShareClick(e, set.id)}
                      className={`p-2 rounded-full transition-colors ${copiedId === set.id ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      title={copiedId === set.id ? "Copied!" : "Copy Link"}
                    >
                      {copiedId === set.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <Link
                      to={`/edit/${set.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => handleDeleteClick(set.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{set.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 h-10">
                  {set.description || 'No description'}
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {new Date(set.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to={`/play/${set.id}`}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Play Games <Play className="w-4 h-4 fill-current" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full Package Processing Overlay */}
      <AnimatePresence>
        {isProcessingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Đang xử lý Gói ZIP</h4>
                <p className="text-xs text-slate-500 mt-1">{packageStatusText || 'Vui lòng chờ trong giây lát...'}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteSetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-red-600">
                    <div className="p-2 bg-red-50 rounded-full">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Delete Set</h3>
                  </div>
                  <button 
                    onClick={() => setDeleteSetId(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-slate-600 mb-6">
                  Are you sure you want to delete this vocabulary set? This action cannot be undone.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter password to confirm (13579)
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmDelete();
                    }}
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                      deleteError ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                    }`}
                    placeholder="Password"
                    autoFocus
                  />
                  {deleteError && (
                    <p className="text-red-500 text-sm mt-2">{deleteError}</p>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => !isDeleting && setDeleteSetId(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Set'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share / Public Link Modal */}
      <AnimatePresence>
        {shareModalSet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Chia Sẻ Bộ Flashcard</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{shareModalSet.title}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShareModalSet(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cloud Sync Status */}
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-900">Đã đồng bộ Đám mây (Firestore)</span>
                      {isSyncingCloud && <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />}
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Bất kỳ ai mở link này đều có thể chơi ngay lập tức trên điện thoại, máy tính bảng mà không cần đăng nhập.
                    </p>
                  </div>
                </div>

                {/* Link Box */}
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Link Công Khai (Public Share Link)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500">
                    <input
                      type="text"
                      readOnly
                      value={getPublicShareUrl(shareModalSet.id)}
                      className="bg-transparent flex-1 text-xs sm:text-sm font-mono text-slate-800 outline-none px-2 select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={async () => {
                        const url = getPublicShareUrl(shareModalSet.id);
                        await navigator.clipboard.writeText(url);
                        setCopiedId(shareModalSet.id);
                        setTimeout(() => setCopiedId(null), 2500);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      {copiedId === shareModalSet.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Đã Chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao Chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Alternative Offline Option */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">Chia sẻ Offline (Gói ZIP)</span>
                    <span className="text-[11px] text-slate-500">Tải trọn bộ kèm hình ảnh và âm thanh gửi qua Zalo/Drive</span>
                  </div>
                  <button
                    onClick={(e) => {
                      handleExportPackageFromHome(e, shareModalSet);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Tải ZIP</span>
                  </button>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShareModalSet(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
