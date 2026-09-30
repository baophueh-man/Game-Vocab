import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  BookOpen,
  Layers,
  Award,
  Copy,
  Trash2,
  Edit3,
  Download,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Plus,
  FolderOpen,
  Search,
  CheckCircle2,
  Calendar,
  Hash,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  WorksheetTemplate,
  WorksheetTemplateSection,
  BUILT_IN_PRESETS,
  getCustomTemplates,
  duplicateCustomTemplate,
  renameCustomTemplate,
  deleteCustomTemplate,
  exportTemplateAsJSON,
  exportAllTemplatesAsJSON,
  importTemplateFromJSON,
  isBuiltInPresetId
} from '../../utils/worksheetTemplates';
import { UICompositeSection } from './CompositeSectionCard';

// Friendly Exercise Type Names
export const EXERCISE_TYPE_NAMES: Record<number, string> = {
  1: 'Sắp xếp câu',
  2: 'Viết từ theo tranh',
  3: 'Nối từ với tranh/nghĩa',
  4: 'Điền chữ còn thiếu',
  6: 'Trắc nghiệm ABCD',
  7: 'Ghép cặp từ vựng',
  8: 'Tập tô nét mờ',
  9: 'Tô màu Yes/No',
  10: 'Nối từ với phiên âm',
  11: 'Viết lại câu hoàn chỉnh',
  12: 'Trắc nghiệm hình ảnh',
  13: 'Ô chữ Wordsearch',
  14: 'Nhận biết chữ cái',
  15: 'Vòng xoay chữ cái'
};

/**
 * Standardized Section Summary Renderer:
 * If primaryWordCount and reviewWordCount are both defined:
 *   [Phần ${i + 1}: ${typeLabel} (⭐${sec.primaryWordCount} + 🔄${sec.reviewWordCount})]
 * Else:
 *   [Phần ${i + 1}: ${typeLabel} (${sec.wordCount} từ)]
 */
export function renderSectionSummary(sec: WorksheetTemplateSection, i: number): string {
  const typeLabel = EXERCISE_TYPE_NAMES[sec.type] || `Type ${sec.type}`;
  if (sec.primaryWordCount !== undefined && sec.reviewWordCount !== undefined) {
    return `[Phần ${i + 1}: ${typeLabel} (⭐${sec.primaryWordCount} + 🔄${sec.reviewWordCount})]`;
  }
  return `[Phần ${i + 1}: ${typeLabel} (${sec.wordCount} từ)]`;
}

export interface WorksheetTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: WorksheetTemplate) => void;
  currentCompositeSections?: UICompositeSection[];
  onSaveCurrentAsTemplate?: (name: string, description?: string) => WorksheetTemplate | void;
  initialShowSaveForm?: boolean;
}

export default function WorksheetTemplateModal({
  isOpen,
  onClose,
  onApply,
  currentCompositeSections = [],
  onSaveCurrentAsTemplate,
  initialShowSaveForm = false
}: WorksheetTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'custom' | 'builtin'>('custom');
  const [customTemplates, setCustomTemplates] = useState<WorksheetTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Save current as template form state
  const [showSaveForm, setShowSaveForm] = useState<boolean>(initialShowSaveForm);
  const [saveName, setSaveName] = useState<string>('');
  const [saveDescription, setSaveDescription] = useState<string>('');

  // Toast feedback state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reload custom templates from storage
  const reloadTemplates = () => {
    try {
      const templates = getCustomTemplates();
      setCustomTemplates(templates);
    } catch (err) {
      console.error('Failed to load custom templates:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadTemplates();
      setShowSaveForm(initialShowSaveForm);
      if (initialShowSaveForm) {
        setSaveName(`Mẫu đề tổng hợp ${new Date().toLocaleDateString('vi-VN')}`);
      }
    }
  }, [isOpen, initialShowSaveForm]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
  };

  // Toggle card details expansion
  const toggleExpand = (templateId: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  // Duplicate a template
  const handleDuplicate = (template: WorksheetTemplate) => {
    const duplicated = duplicateCustomTemplate(template.id);
    if (duplicated) {
      reloadTemplates();
      setActiveTab('custom');
      showToast(`Đã nhân bản "${template.name}" thành công!`, 'success');
    } else {
      showToast('Không thể nhân bản mẫu này.', 'error');
    }
  };

  // Start renaming
  const handleStartRename = (template: WorksheetTemplate) => {
    if (template.isBuiltIn || isBuiltInPresetId(template.id)) {
      showToast('Không thể đổi tên mẫu chuẩn hệ thống.', 'info');
      return;
    }
    setRenamingId(template.id);
    setRenameValue(template.name);
  };

  // Save renamed template
  const handleSaveRename = (templateId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      showToast('Tên mẫu không được để trống.', 'error');
      return;
    }
    const success = renameCustomTemplate(templateId, trimmed);
    if (success) {
      reloadTemplates();
      setRenamingId(null);
      showToast('Đổi tên mẫu thành công!', 'success');
    } else {
      showToast('Không thể đổi tên mẫu.', 'error');
    }
  };

  // Delete a custom template
  const handleDeleteConfirm = (templateId: string) => {
    const success = deleteCustomTemplate(templateId);
    if (success) {
      reloadTemplates();
      setDeletingId(null);
      showToast('Đã xóa mẫu bài tập thành công!', 'success');
    } else {
      showToast('Không thể xóa mẫu bài tập.', 'error');
    }
  };

  // Save current worksheet as template
  const handleSaveCurrentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = saveName.trim();
    if (!trimmedName) {
      showToast('Vui lòng nhập tên cho Mẫu bài tập.', 'error');
      return;
    }
    if (!currentCompositeSections || currentCompositeSections.length === 0) {
      showToast('Chưa có phần bài tập nào để lưu thành mẫu.', 'error');
      return;
    }

    try {
      if (onSaveCurrentAsTemplate) {
        onSaveCurrentAsTemplate(trimmedName, saveDescription.trim());
      }
      reloadTemplates();
      setShowSaveForm(false);
      setSaveName('');
      setSaveDescription('');
      setActiveTab('custom');
      showToast(`Đã lưu "${trimmedName}" thành Mẫu bài tập!`, 'success');
    } catch (err: any) {
      console.error('Save template failed:', err);
      showToast(err.message || 'Lỗi khi lưu Mẫu bài tập', 'error');
    }
  };

  // Handle JSON Import via File Input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = importTemplateFromJSON(content);
        if (result.success) {
          reloadTemplates();
          setActiveTab('custom');
          showToast(`Nhập JSON thành công! (${result.importedCount} mẫu đã được thêm)`, 'success');
        } else {
          showToast(result.message || 'Lỗi khi đọc file JSON', 'error');
        }
      } catch (err: any) {
        showToast(`Lỗi khi xử lý file: ${err.message}`, 'error');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      showToast('Không thể đọc file đã chọn', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Handle Export All as JSON
  const handleExportAll = () => {
    if (customTemplates.length === 0) {
      showToast('Chưa có mẫu tự tạo nào để xuất bundle JSON.', 'info');
      return;
    }
    exportAllTemplatesAsJSON();
    showToast(`Đã tải xuống file bundle chứa ${customTemplates.length} mẫu bài tập!`, 'success');
  };

  // Filter templates based on search query
  const filteredCustom = useMemo(() => {
    if (!searchQuery.trim()) return customTemplates;
    const q = searchQuery.toLowerCase().trim();
    return customTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.sections.some((s) => s.title.toLowerCase().includes(q) || String(s.type).includes(q))
    );
  }, [customTemplates, searchQuery]);

  const filteredBuiltIn = useMemo(() => {
    if (!searchQuery.trim()) return BUILT_IN_PRESETS;
    const q = searchQuery.toLowerCase().trim();
    return BUILT_IN_PRESETS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.sections.some((s) => s.title.toLowerCase().includes(q) || String(s.type).includes(q))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json,application/json"
        className="hidden"
        data-testid="template-file-input"
      />

      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="template-modal-title" className="text-lg font-bold text-slate-900">
                  Mẫu Bài Tập Tổng Hợp (Worksheet Templates)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {customTemplates.length} của tôi + {BUILT_IN_PRESETS.length} chuẩn
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu cấu trúc đề thi, phân bổ từ vựng và nạp nhanh chỉ với 1 click
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="template-modal-close-btn"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toolbar / Header Action Bar */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowSaveForm((prev) => !prev);
                if (!showSaveForm && !saveName) {
                  setSaveName(`Mẫu đề tổng hợp ${new Date().toLocaleDateString('vi-VN')}`);
                }
              }}
              data-testid="template-modal-save-current-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer ${
                showSaveForm
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showSaveForm ? 'Đang mở form lưu' : '💾 Lưu đề hiện tại thành Mẫu'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-testid="template-modal-import-json-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Nhập 1 mẫu hoặc gói bundle mẫu từ file JSON"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>📥 Nhập file JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportAll}
              data-testid="template-modal-export-all-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Tải toàn bộ mẫu tự tạo thành file JSON để sao lưu"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>📤 Xuất tất cả JSON</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên mẫu, loại bài tập..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Floating / Inline Toast Notification Banner */}
        {toast && (
          <div
            data-testid="template-modal-toast"
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{toast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Save Current Worksheet Inline Form (Collapsible Panel) */}
        {showSaveForm && (
          <form
            onSubmit={handleSaveCurrentSubmit}
            data-testid="save-current-template-form"
            className="p-5 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border-b border-indigo-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                  ✓
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Lưu Đề Hiện Tại Thành Mẫu (Template)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                Đóng form
              </button>
            </div>

            {currentCompositeSections.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Hiện tại Worksheet chưa có phần bài tập nào. Vui lòng thêm ít nhất 1 phần bài tập trước khi lưu.
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Mẫu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Ví dụ: Đề kiểm tra 15p Unit 1..."
                      required
                      data-testid="save-template-name-input"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả ngắn (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      placeholder="Ví dụ: Dành cho học sinh lớp 3 ôn tập giữa kỳ..."
                      data-testid="save-template-desc-input"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <strong>{currentCompositeSections.length}</strong> phần bài tập
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      Tổng{' '}
                      <strong>
                        {currentCompositeSections.reduce(
                          (acc, s) => acc + (s.targetWordCount || s.selectedWordIndices.length || 4),
                          0
                        )}
                      </strong>{' '}
                      từ vựng
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSaveForm(false)}
                      data-testid="save-template-cancel-btn"
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      data-testid="save-template-submit-btn"
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận lưu Mẫu</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              data-testid="tab-custom-templates"
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Mẫu của tôi</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'custom' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {customTemplates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('builtin')}
              data-testid="tab-builtin-templates"
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'builtin'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Mẫu chuẩn có sẵn</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'builtin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {BUILT_IN_PRESETS.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {activeTab === 'custom' ? (
            /* Tab 1: Custom Templates */
            filteredCustom.length === 0 ? (
              customTemplates.length === 0 ? (
                <div
                  data-testid="custom-templates-empty-state"
                  className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <FolderOpen className="w-6 h-6 stroke-1.5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      Chưa có Mẫu bài tập tự tạo nào
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Bạn có thể lưu toàn bộ các phần bài tập và cấu hình hiện tại thành Mẫu, hoặc nhập mẫu từ file JSON để tái sử dụng nhanh chóng bất kỳ lúc nào.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveForm(true);
                        if (!saveName) {
                          setSaveName(`Mẫu đề tổng hợp ${new Date().toLocaleDateString('vi-VN')}`);
                        }
                      }}
                      data-testid="empty-state-save-cta-btn"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Lưu đề hiện tại thành Mẫu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Nhập từ file JSON</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Không tìm thấy mẫu tự tạo nào khớp với từ khóa "{searchQuery}".
                </div>
              )
            ) : (
              <div className="space-y-4" data-testid="custom-templates-list">
                {filteredCustom.map((template) => renderTemplateCard(template, false))}
              </div>
            )
          ) : (
            /* Tab 2: Built-in Presets */
            filteredBuiltIn.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                Không tìm thấy mẫu chuẩn nào khớp với từ khóa "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-4" data-testid="builtin-templates-list">
                {filteredBuiltIn.map((template) => renderTemplateCard(template, true))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Tự động lưu trữ bền vững trên trình duyệt (LocalStorage & IndexedDB)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="template-modal-close-footer-btn"
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  // Template Card Render Function
  function renderTemplateCard(template: WorksheetTemplate, isBuiltIn: boolean) {
    const isExpanded = expandedCardIds.has(template.id);
    const isRenaming = renamingId === template.id;
    const isDeleting = deletingId === template.id;

    const totalWordCount = template.sections.reduce(
      (sum, s) => sum + (s.wordCount || 4),
      0
    );

    return (
      <div
        key={template.id}
        data-testid={`template-card-${template.id}`}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
      >
        {/* Card Header & Summary */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              {isRenaming ? (
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    data-testid={`rename-input-${template.id}`}
                    autoFocus
                    className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRename(template.id)}
                    data-testid={`rename-save-btn-${template.id}`}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer"
                    title="Lưu tên mới"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(null)}
                    data-testid={`rename-cancel-btn-${template.id}`}
                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer"
                    title="Hủy"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {template.name}
                  </h4>
                  {isBuiltIn ? (
                    <span
                      data-testid={`badge-builtin-${template.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Chuẩn sư phạm
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(template.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              )}

              {template.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {template.description}
                </p>
              )}
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {template.sections.length} phần
              </span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                {totalWordCount} từ
              </span>
            </div>
          </div>

          {/* Horizontal Section Preview Badges */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cấu trúc các phần bài tập:
            </span>
            <div
              data-testid={`section-badges-${template.id}`}
              className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin"
            >
              {template.sections.map((sec, sIdx) => {
                const typeName = EXERCISE_TYPE_NAMES[sec.type] || `Type ${sec.type}`;
                const hasQuota = sec.primaryWordCount !== undefined && sec.reviewWordCount !== undefined;
                return (
                  <div
                    key={sec.id || sIdx}
                    data-testid={`section-badge-${sIdx}`}
                    title={renderSectionSummary(sec, sIdx)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/80 shrink-0 whitespace-nowrap shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-900 font-bold">Phần {sIdx + 1}:</span>
                    <span>{typeName}</span>
                    {hasQuota ? (
                      <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                        (⭐{sec.primaryWordCount} + 🔄{sec.reviewWordCount})
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                        ({sec.wordCount} từ)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Apply Primary Button */}
              <button
                type="button"
                onClick={() => onApply(template)}
                data-testid={`apply-template-btn-${template.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Áp dụng</span>
              </button>

              {/* Duplicate Button */}
              <button
                type="button"
                onClick={() => handleDuplicate(template)}
                data-testid={`duplicate-template-btn-${template.id}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Tạo bản sao độc lập của mẫu này"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nhân bản</span>
              </button>

              {/* Rename Button (Custom only) */}
              {!isBuiltIn && (
                <button
                  type="button"
                  onClick={() => handleStartRename(template)}
                  data-testid={`rename-template-btn-${template.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  title="Đổi tên mẫu bài tập"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Đổi tên</span>
                </button>
              )}

              {/* Delete Button (Custom only) */}
              {!isBuiltIn && (
                isDeleting ? (
                  <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-[11px] font-bold text-red-700 pl-1.5">
                      Xác nhận xóa?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteConfirm(template.id)}
                      data-testid={`delete-confirm-btn-${template.id}`}
                      className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 cursor-pointer"
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      data-testid={`delete-cancel-btn-${template.id}`}
                      className="px-2 py-1 bg-white text-slate-600 text-[11px] rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(template.id)}
                    data-testid={`delete-template-btn-${template.id}`}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Xóa mẫu bài tập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}

              {/* Single JSON Export */}
              <button
                type="button"
                onClick={() => exportTemplateAsJSON(template)}
                data-testid={`export-single-template-btn-${template.id}`}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Tải file JSON mẫu này"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preview Drawer Accordion Toggle */}
            <button
              type="button"
              onClick={() => toggleExpand(template.id)}
              data-testid={`toggle-expand-btn-${template.id}`}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết'}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Preview Drawer/Accordion Detail View */}
        {isExpanded && (
          <div
            data-testid={`template-details-${template.id}`}
            className="p-5 bg-slate-50 border-t border-slate-200 space-y-4 animate-in fade-in duration-150"
          >
            {/* Template Global Settings Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Khổ giấy</span>
                <span className="font-bold text-slate-800 uppercase">{template.paperSize || 'A4'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Phông chữ</span>
                <span className="font-bold text-slate-800">{template.fontFamily || 'r0c0i Linotte'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cỡ chữ cơ bản</span>
                <span className="font-bold text-slate-800">{template.fontSize || 12} pt</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Khoảng cách</span>
                <span className="font-bold text-slate-800">{template.spacing || 0} mm</span>
              </div>
            </div>

            {/* Detailed Section Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">
                Chi tiết từng phần bài tập ({template.sections.length} phần):
              </span>

              <div className="space-y-2">
                {template.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <strong className="text-slate-900">{sec.title}</strong>
                        <span className="text-[11px] text-slate-500">
                          ({EXERCISE_TYPE_NAMES[sec.type] || `Type ${sec.type}`})
                        </span>
                      </div>
                      {sec.primaryWordCount !== undefined && sec.reviewWordCount !== undefined ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center gap-1">
                          <span>⭐{sec.primaryWordCount}</span>
                          <span>+</span>
                          <span>🔄{sec.reviewWordCount}</span>
                          <span className="text-slate-400 font-normal">({sec.wordCount} từ)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                          {sec.wordCount} từ vựng
                        </span>
                      )}
                    </div>

                    {sec.instruction && (
                      <p className="text-[11px] text-slate-600 italic pl-7">
                        "{sec.instruction}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pl-7 flex-wrap">
                      {sec.blankMode && <span>Ô khuyết: <strong>{sec.blankMode}</strong></span>}
                      {sec.type4LayoutMode && <span>Bố cục Type 4: <strong>{sec.type4LayoutMode}</strong></span>}
                      {sec.choiceCount && <span>Số đáp án: <strong>{sec.choiceCount}</strong></span>}
                      {sec.matchMode && <span>Kiểu nối: <strong>{sec.matchMode}</strong></span>}
                      {sec.wordsearchGridSize && <span>Ô chữ: <strong>{sec.wordsearchGridSize}</strong></span>}
                      {sec.pageBreakBefore && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Sang trang mới
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
