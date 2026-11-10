import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSets, deleteSet, saveSet } from '../lib/storage';
import { WordSet, Word } from '../types';
import {
  Play,
  Edit,
  Trash2,
  Book,
  Plus,
  X,
  AlertTriangle,
  Share2,
  Check,
  Package,
  Download,
  Copy,
  Loader2,
  Cloud,
  Search,
  Folder,
  FolderPlus,
  FolderOpen,
  ArrowUpDown,
  ChevronDown,
  Edit3,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportWordSetPackage, importWordSetPackage } from '../utils/packageZip';
import { generateId } from '../lib/utils';
import { auth } from '../firebase';

const CUSTOM_FOLDERS_STORAGE_KEY = 'vocagame_custom_folders';

// Normalize Vietnamese & English string for accent-insensitive search
function normalizeSearchText(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'words-desc';

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

  // Search, Sort & Folder State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL'); // 'ALL' | 'UNCATEGORIZED' | folderName
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Folder UI Modals & Popovers
  const [openFolderMenuSetId, setOpenFolderMenuSetId] = useState<string | null>(null);
  const [inlineNewFolderText, setInlineNewFolderText] = useState('');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderInput, setRenameFolderInput] = useState('');
  const [batchFolderModal, setBatchFolderModal] = useState<string | null>(null);

  useEffect(() => {
    const loadSets = async () => {
      const loadedSets = await getSets();
      setSets(loadedSets);
    };
    loadSets();
  }, []);

  // Persist custom folders list to localStorage
  const saveCustomFoldersList = (folders: string[]) => {
    const unique = Array.from(new Set(folders.map((f) => f.trim()).filter(Boolean)));
    setCustomFolders(unique);
    try {
      localStorage.setItem(CUSTOM_FOLDERS_STORAGE_KEY, JSON.stringify(unique));
    } catch {}
  };

  // All available folders (merged from sets.folder and customFolders)
  const allFolders = useMemo(() => {
    const folderSet = new Set<string>(customFolders);
    sets.forEach((s) => {
      if (s.folder && s.folder.trim()) {
        folderSet.add(s.folder.trim());
      }
    });
    return Array.from(folderSet).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [sets, customFolders]);

  // Folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: sets.length, UNCATEGORIZED: 0 };
    allFolders.forEach((f) => {
      counts[f] = 0;
    });
    sets.forEach((s) => {
      const f = s.folder?.trim();
      if (f) {
        counts[f] = (counts[f] || 0) + 1;
      } else {
        counts.UNCATEGORIZED += 1;
      }
    });
    return counts;
  }, [sets, allFolders]);

  // Assign a set to a folder (or undefined to remove from folder)
  const handleAssignFolder = async (set: WordSet, folderName: string | undefined) => {
    const cleanFolder = folderName?.trim() || undefined;
    if (cleanFolder && !customFolders.includes(cleanFolder)) {
      saveCustomFoldersList([...customFolders, cleanFolder]);
    }

    const updatedSet: WordSet = {
      ...set,
      folder: cleanFolder,
    };

    // Optimistic UI update
    setSets((prev) => prev.map((item) => (item.id === set.id ? updatedSet : item)));
    setOpenFolderMenuSetId(null);
    setInlineNewFolderText('');

    try {
      await saveSet(updatedSet);
    } catch (err) {
      console.error('Failed to update folder for set:', err);
    }
  };

  // Create a new folder
  const handleCreateFolder = () => {
    const trimmed = newFolderNameInput.trim();
    if (!trimmed) return;
    if (!allFolders.includes(trimmed)) {
      saveCustomFoldersList([...customFolders, trimmed]);
    }
    setSelectedFolder(trimmed);
    setNewFolderNameInput('');
    setIsCreateFolderModalOpen(false);
  };

  // Rename an existing folder across all sets
  const handleConfirmRenameFolder = async () => {
    if (!renamingFolder) return;
    const newName = renameFolderInput.trim();
    if (!newName || newName === renamingFolder) {
      setRenamingFolder(null);
      return;
    }

    const updatedCustom = customFolders.map((f) => (f === renamingFolder ? newName : f));
    if (!updatedCustom.includes(newName)) updatedCustom.push(newName);
    saveCustomFoldersList(updatedCustom);

    const affectedSets = sets.filter((s) => s.folder?.trim() === renamingFolder);
    const updatedSets = sets.map((s) =>
      s.folder?.trim() === renamingFolder ? { ...s, folder: newName } : s
    );
    setSets(updatedSets);
    if (selectedFolder === renamingFolder) {
      setSelectedFolder(newName);
    }
    setRenamingFolder(null);

    for (const s of affectedSets) {
      await saveSet({ ...s, folder: newName });
    }
  };

  // Remove a folder (moves sets in it to Uncategorized without deleting sets)
  const handleRemoveFolder = async (folderToRemove: string) => {
    const updatedCustom = customFolders.filter((f) => f !== folderToRemove);
    saveCustomFoldersList(updatedCustom);

    const affectedSets = sets.filter((s) => s.folder?.trim() === folderToRemove);
    const updatedSets = sets.map((s) =>
      s.folder?.trim() === folderToRemove ? { ...s, folder: undefined } : s
    );
    setSets(updatedSets);
    if (selectedFolder === folderToRemove) {
      setSelectedFolder('ALL');
    }

    for (const s of affectedSets) {
      await saveSet({ ...s, folder: undefined });
    }
  };

  // Filtered & Sorted Sets + Matched Vocabulary Words
  const filteredAndSortedSets = useMemo(() => {
    const normQuery = normalizeSearchText(searchQuery);

    const results: { set: WordSet; matchedWords: Word[] }[] = [];

    for (const set of sets) {
      // 1. Check Folder Filter
      const setFolder = set.folder?.trim() || '';
      if (selectedFolder === 'UNCATEGORIZED' && setFolder !== '') continue;
      if (
        selectedFolder !== 'ALL' &&
        selectedFolder !== 'UNCATEGORIZED' &&
        setFolder !== selectedFolder
      ) {
        continue;
      }

      // 2. Check Search Query (Title, Description, Folder, and Inner Vocabulary Words)
      if (!normQuery) {
        results.push({ set, matchedWords: [] });
        continue;
      }

      const titleMatch = normalizeSearchText(set.title).includes(normQuery);
      const descMatch = normalizeSearchText(set.description || '').includes(normQuery);
      const folderMatch = normalizeSearchText(setFolder).includes(normQuery);

      const matchedWords = (set.words || []).filter(
        (w) =>
          normalizeSearchText(w.term).includes(normQuery) ||
          normalizeSearchText(w.definition).includes(normQuery)
      );

      if (titleMatch || descMatch || folderMatch || matchedWords.length > 0) {
        results.push({ set, matchedWords });
      }
    }

    // 3. Sort
    results.sort((a, b) => {
      if (sortBy === 'newest') return (b.set.createdAt || 0) - (a.set.createdAt || 0);
      if (sortBy === 'oldest') return (a.set.createdAt || 0) - (b.set.createdAt || 0);
      if (sortBy === 'name-asc') return a.set.title.localeCompare(b.set.title, 'vi');
      if (sortBy === 'words-desc') return (b.set.words?.length || 0) - (a.set.words?.length || 0);
      return 0;
    });

    return results;
  }, [sets, selectedFolder, searchQuery, sortBy]);

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
        const activeFolder =
          selectedFolder !== 'ALL' && selectedFolder !== 'UNCATEGORIZED'
            ? selectedFolder
            : undefined;

        const newSet: WordSet = {
          id: generateId(),
          title: result.title,
          description: result.description,
          folder: activeFolder,
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
    <div className="space-y-6 relative" onClick={() => setOpenFolderMenuSetId(null)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Library</h1>
          <p className="text-slate-500 mt-1">Manage your vocabulary sets, organize into folders, and play games.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
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

      {/* Search Bar & Folder Organization Panel */}
      {sets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          {/* Row 1: Instant Search Input + Sort Selector */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bộ flashcard theo tên bộ, mô tả, thư mục hoặc từ vựng bên trong (hỗ trợ gõ không dấu)..."
                className="w-full pl-11 pr-24 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-200/70 hover:bg-slate-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" /> Xóa
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600">
                <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                <span>Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name-asc">Tên A ➔ Z</option>
                  <option value="words-desc">Nhiều từ nhất</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setNewFolderNameInput('');
                  setIsCreateFolderModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                + Tạo Folder
              </button>
            </div>
          </div>

          {/* Row 2: Folder Filter Pills */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedFolder('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedFolder === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tất cả</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedFolder === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {folderCounts.ALL}
                </span>
              </button>

              {allFolders.map((folderName) => {
                const isSelected = selectedFolder === folderName;
                return (
                  <button
                    key={folderName}
                    onClick={() => setSelectedFolder(folderName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/60'
                    }`}
                  >
                    {isSelected ? (
                      <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>{folderName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                      {folderCounts[folderName] || 0}
                    </span>
                  </button>
                );
              })}

              {(allFolders.length > 0 || selectedFolder === 'UNCATEGORIZED') && (
                <button
                  onClick={() => setSelectedFolder('UNCATEGORIZED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    selectedFolder === 'UNCATEGORIZED'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <Book className="w-3.5 h-3.5" />
                  <span>Chưa vào Folder</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedFolder === 'UNCATEGORIZED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {folderCounts.UNCATEGORIZED}
                  </span>
                </button>
              )}
            </div>

            {/* Active Folder Management Actions */}
            {selectedFolder !== 'ALL' && selectedFolder !== 'UNCATEGORIZED' && (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setBatchFolderModal(selectedFolder)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Chọn nhanh các bộ flashcard để thêm vào Folder này"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm bộ từ vào đây
                </button>
                <button
                  onClick={() => {
                    setRenamingFolder(selectedFolder);
                    setRenameFolderInput(selectedFolder);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đổi tên Folder"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Đổi tên
                </button>
                <button
                  onClick={() => handleRemoveFolder(selectedFolder)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xóa Folder này (các bộ flashcard bên trong sẽ được giữ nguyên)"
                >
                  <X className="w-3.5 h-3.5" /> Bỏ Folder
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
      ) : filteredAndSortedSets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Không tìm thấy bộ flashcard nào</h3>
          <p className="text-slate-500 text-sm mt-1 mb-5 max-w-md mx-auto">
            {searchQuery
              ? `Không có bộ từ nào khớp với từ khóa "${searchQuery}"${selectedFolder !== 'ALL' ? ` trong mục đang chọn` : ''}.`
              : `Thư mục "${selectedFolder}" hiện chưa có bộ flashcard nào.`}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
            {selectedFolder !== 'ALL' && selectedFolder !== 'UNCATEGORIZED' && (
              <button
                onClick={() => setBatchFolderModal(selectedFolder)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Chọn bộ flashcard cho vào "{selectedFolder}"
              </button>
            )}
            {selectedFolder !== 'ALL' && (
              <button
                onClick={() => setSelectedFolder('ALL')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Xem tất cả bộ từ
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredAndSortedSets.map(({ set, matchedWords }, index) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-visible group flex flex-col justify-between relative"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {set.words.length}
                    </div>

                    {/* Quick Folder Badge & Assign Dropdown */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setOpenFolderMenuSetId(openFolderMenuSetId === set.id ? null : set.id);
                          setInlineNewFolderText('');
                        }}
                        title="Chuyển hoặc gắn bộ flashcard này vào Folder"
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer max-w-[135px] ${
                          set.folder
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <Folder className="w-3 h-3 shrink-0" />
                        <span className="truncate">{set.folder || '+ Folder'}</span>
                        <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                      </button>

                      {/* Dropdown Menu to Assign Folder */}
                      {openFolderMenuSetId === set.id && (
                        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                            Chọn Folder lưu trữ
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-0.5 my-1">
                            {allFolders.map((fName) => {
                              const isCurrent = set.folder === fName;
                              return (
                                <button
                                  key={fName}
                                  onClick={() => handleAssignFolder(set, fName)}
                                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                    isCurrent
                                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span className="truncate">{fName}</span>
                                  </span>
                                  {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Create new folder directly inside dropdown */}
                          <div className="pt-1.5 mt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={inlineNewFolderText}
                                onChange={(e) => setInlineNewFolderText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && inlineNewFolderText.trim()) {
                                    handleAssignFolder(set, inlineNewFolderText.trim());
                                  }
                                }}
                                placeholder="Tên Folder mới..."
                                className="flex-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                              />
                              <button
                                onClick={() => {
                                  if (inlineNewFolderText.trim()) {
                                    handleAssignFolder(set, inlineNewFolderText.trim());
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                              >
                                Lưu
                              </button>
                            </div>
                          </div>

                          {set.folder && (
                            <button
                              onClick={() => handleAssignFolder(set, undefined)}
                              className="w-full mt-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Gỡ khỏi Folder "{set.folder}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
                <h3 className="text-xl font-bold text-slate-900 mb-1 truncate" title={set.title}>
                  {set.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 h-10">
                  {set.description || 'No description'}
                </p>

                {/* Matched Vocabulary Preview when searching */}
                {searchQuery.trim() !== '' && matchedWords.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900">
                    <span className="font-bold block text-[11px] text-amber-700 mb-0.5">
                      🔍 Khớp {matchedWords.length} từ vựng:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchedWords.slice(0, 3).map((w) => (
                        <span
                          key={w.id}
                          className="px-1.5 py-0.5 bg-white rounded border border-amber-200 text-[11px] font-semibold"
                        >
                          {w.term} ({w.definition})
                        </span>
                      ))}
                      {matchedWords.length > 3 && (
                        <span className="text-[11px] text-amber-700 font-semibold">
                          +{matchedWords.length - 3} từ nữa
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 rounded-b-xl flex justify-between items-center">
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

      {/* Create New Folder Modal */}
      <AnimatePresence>
        {isCreateFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Tạo Thư Mục (Folder) Mới</h3>
                </div>
                <button
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Đặt tên thư mục theo lớp học, cấp độ hoặc chủ đề (VD: Lớp 3, Starters, Movers, Học kỳ 1...) để sắp xếp bộ flashcard gọn gàng.
              </p>
              <input
                type="text"
                value={newFolderNameInput}
                onChange={(e) => setNewFolderNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                }}
                placeholder="Nhập tên Folder..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm mb-5"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderNameInput.trim()}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Tạo Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Folder Modal */}
      <AnimatePresence>
        {renamingFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Đổi Tên Thư Mục</h3>
                <button
                  onClick={() => setRenamingFolder(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={renameFolderInput}
                onChange={(e) => setRenameFolderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRenameFolder();
                }}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm mb-5"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRenamingFolder(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmRenameFolder}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                >
                  Lưu Tên Mới
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Add/Remove Sets in Folder Modal */}
      <AnimatePresence>
        {batchFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Quản lý bộ từ trong "{batchFolderModal}"
                  </h3>
                </div>
                <button
                  onClick={() => setBatchFolderModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Tick chọn các bộ flashcard bạn muốn đưa vào thư mục <strong>{batchFolderModal}</strong>:
              </p>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl px-3">
                {sets.map((s) => {
                  const inThisFolder = s.folder?.trim() === batchFolderModal;
                  return (
                    <label
                      key={s.id}
                      className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={inThisFolder}
                          onChange={() =>
                            handleAssignFolder(s, inThisFolder ? undefined : batchFolderModal)
                          }
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-800 truncate">{s.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {s.words.length} từ {s.folder && s.folder !== batchFolderModal ? `• Đang ở: ${s.folder}` : ''}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setBatchFolderModal(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl cursor-pointer"
                >
                  Hoàn Tất
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
