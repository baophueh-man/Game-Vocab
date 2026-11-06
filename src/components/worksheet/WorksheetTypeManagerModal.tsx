import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Info,
  Pencil,
  AlertCircle
} from 'lucide-react';
import {
  useWorksheetTypes,
  getDefaultWorksheetTypes,
  CustomWorksheetTypesMap
} from '../../utils/worksheetTypeCustomization';
import { WorksheetType } from '../../utils/worksheetGenerator';

interface WorksheetTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFocusType?: number | null;
}

export default function WorksheetTypeManagerModal({
  isOpen,
  onClose,
  initialFocusType
}: WorksheetTypeManagerModalProps) {
  const {
    worksheetTypes,
    overrides,
    updateType,
    updateAll,
    resetType,
    resetAll,
    isCustomized
  } = useWorksheetTypes();

  const defaultTypes = useMemo(() => getDefaultWorksheetTypes(), []);

  // Local draft state for edits before hitting save
  const [draftNames, setDraftNames] = useState<Record<number, string>>({});
  const [draftDescriptions, setDraftDescriptions] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomizedOnly, setFilterCustomizedOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [focusedCardType, setFocusedCardType] = useState<number | null>(null);

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Sync draft state with current types whenever modal opens or types change
  useEffect(() => {
    if (isOpen) {
      const names: Record<number, string> = {};
      const descs: Record<number, string> = {};
      worksheetTypes.forEach((t) => {
        names[t.type] = t.name;
        descs[t.type] = t.description;
      });
      setDraftNames(names);
      setDraftDescriptions(descs);

      if (initialFocusType) {
        setFocusedCardType(initialFocusType);
        setTimeout(() => {
          const targetEl = cardRefs.current[initialFocusType];
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [isOpen, worksheetTypes, initialFocusType]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSaveSingle = (type: number) => {
    const name = draftNames[type] || '';
    const desc = draftDescriptions[type] || '';
    updateType(type, name, desc);
    showToast(`Đã lưu thay đổi cho Loại ${type}!`);
  };

  const handleResetSingle = (type: number) => {
    const defaultMeta = defaultTypes.find((d) => d.type === type);
    if (!defaultMeta) return;

    resetType(type);
    setDraftNames((prev) => ({ ...prev, [type]: defaultMeta.name }));
    setDraftDescriptions((prev) => ({ ...prev, [type]: defaultMeta.description }));
    showToast(`Đã khôi phục Loại ${type} về mặc định.`);
  };

  const handleSaveAll = () => {
    const customMap: CustomWorksheetTypesMap = {};
    worksheetTypes.forEach((t) => {
      const draftName = draftNames[t.type];
      const draftDesc = draftDescriptions[t.type];
      customMap[t.type] = {
        name: draftName,
        description: draftDesc
      };
    });
    updateAll(customMap);
    showToast('Đã lưu tất cả tên và mô tả Loại WS thành công!');
  };

  const handleResetAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục TẤT CẢ 18 loại bài tập về tên và mô tả mặc định của hệ thống không?')) {
      resetAll();
      const names: Record<number, string> = {};
      const descs: Record<number, string> = {};
      defaultTypes.forEach((t) => {
        names[t.type] = t.name;
        descs[t.type] = t.description;
      });
      setDraftNames(names);
      setDraftDescriptions(descs);
      showToast('Đã khôi phục toàn bộ 18 loại bài tập về mặc định!');
    }
  };

  // Filtered types
  const filteredTypes = useMemo(() => {
    return worksheetTypes.filter((t) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        t.type.toString().includes(searchQuery) ||
        (draftNames[t.type] || t.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (draftDescriptions[t.type] || t.description).toLowerCase().includes(searchQuery.toLowerCase());

      const matchCustomFilter = !filterCustomizedOnly || isCustomized(t.type);

      return matchSearch && matchCustomCustomFilter(matchCustomFilter);
    });

    function matchCustomCustomFilter(cond: boolean) {
      return cond;
    }
  }, [worksheetTypes, draftNames, draftDescriptions, searchQuery, filterCustomizedOnly, isCustomized]);

  const customizedCount = useMemo(() => {
    return worksheetTypes.filter((t) => isCustomized(t.type)).length;
  }, [worksheetTypes, isCustomized]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      data-testid="worksheet-type-manager-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-indigo-700/80 rounded-xl text-indigo-200">
                <Pencil className="w-5 h-5 text-indigo-100" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Chỉnh Sửa Tên & Mô Tả Loại Bài Tập (Loại WS)
              </h3>
              {customizedCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  Đã tùy chỉnh {customizedCount}/18 loại
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              Bạn có thể tự do đổi tên hiển thị và mô tả theo giáo trình, sở thích hoặc yêu cầu bài giảng. Dữ liệu sẽ được lưu tự động trên trình duyệt và áp dụng đồng bộ ngay lập tức.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-type-manager-modal-btn"
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filters, Reset all */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm loại bài tập theo số (ví dụ: 1, 15) hoặc từ khóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-ws-type-input"
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterCustomizedOnly(!filterCustomizedOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                filterCustomizedOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Chỉ loại đã sửa ({customizedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              data-testid="reset-all-custom-types-btn"
              disabled={customizedCount === 0}
              title="Khôi phục toàn bộ 18 loại về thiết lập gốc của hệ thống"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục tất cả</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              data-testid="save-all-custom-types-btn"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu tất cả thay đổi</span>
            </button>
          </div>
        </div>

        {/* Toast alert banner */}
        {toastMessage && (
          <div className="px-5 py-2.5 bg-emerald-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center transition-all animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-100" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredTypes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-semibold text-sm">Không tìm thấy loại bài tập nào phù hợp</p>
              <p className="text-xs text-slate-400">Hãy thử xóa từ khóa tìm kiếm hoặc bỏ lọc loại đã sửa</p>
            </div>
          ) : (
            filteredTypes.map((t) => {
              const typeNum = t.type;
              const isItemCustom = isCustomized(typeNum);
              const defaultMeta = defaultTypes.find((d) => d.type === typeNum);
              const isHighlight = focusedCardType === typeNum;

              return (
                <div
                  key={typeNum}
                  ref={(el) => {
                    cardRefs.current[typeNum] = el;
                  }}
                  id={`ws-type-card-${typeNum}`}
                  data-testid={`custom-type-editor-row-${typeNum}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHighlight
                      ? 'border-indigo-600 bg-indigo-50/50 ring-3 ring-indigo-400/30 shadow-md'
                      : isItemCustom
                      ? 'border-emerald-200 bg-emerald-50/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    {/* Thumbnail & Type Badge */}
                    <div className="flex items-center md:flex-col justify-between md:justify-center w-full md:w-32 shrink-0 gap-2">
                      <div className="flex items-center gap-2 md:flex-col">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                          Loại {typeNum}
                        </span>
                        {isItemCustom && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                            Đã sửa
                          </span>
                        )}
                      </div>
                      {t.thumbnail && (
                        <div className="w-20 h-14 md:w-28 md:h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                          <img
                            src={t.thumbnail}
                            alt={t.name}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Form Fields: Name & Description */}
                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <span>Tên hiển thị Loại {typeNum}</span>
                            <span className="text-red-500">*</span>
                          </label>
                          {defaultMeta && defaultMeta.name !== draftNames[typeNum] && (
                            <span className="text-[11px] text-slate-400 italic">
                              Mặc định: {defaultMeta.name}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={draftNames[typeNum] ?? t.name}
                          onChange={(e) =>
                            setDraftNames((prev) => ({
                              ...prev,
                              [typeNum]: e.target.value
                            }))
                          }
                          data-testid={`custom-type-name-input-${typeNum}`}
                          placeholder={`Nhập tên bài tập cho Loại ${typeNum}...`}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            Mô tả cách làm / hướng dẫn loại bài tập
                          </label>
                          {defaultMeta && defaultMeta.description !== draftDescriptions[typeNum] && (
                            <span className="text-[11px] text-slate-400 italic line-clamp-1 max-w-[280px]">
                              Mặc định: {defaultMeta.description}
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={draftDescriptions[typeNum] ?? t.description}
                          onChange={(e) =>
                            setDraftDescriptions((prev) => ({
                              ...prev,
                              [typeNum]: e.target.value
                            }))
                          }
                          data-testid={`custom-type-desc-input-${typeNum}`}
                          placeholder={`Nhập tóm tắt mô tả nội dung cho Loại ${typeNum}...`}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Actions per card */}
                    <div className="flex md:flex-col items-center justify-end gap-1.5 w-full md:w-auto shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveSingle(typeNum)}
                        data-testid={`save-custom-type-btn-${typeNum}`}
                        title="Lưu riêng loại bài tập này"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all cursor-pointer border border-indigo-200/80 hover:border-transparent"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Lưu</span>
                      </button>

                      {isItemCustom && (
                        <button
                          type="button"
                          onClick={() => handleResetSingle(typeNum)}
                          data-testid={`reset-custom-type-btn-${typeNum}`}
                          title="Khôi phục loại này về mặc định"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Đặt lại</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Mẹo: Bạn có thể lưu từng loại hoặc nhấn "Lưu tất cả" để áp dụng đồng loạt.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              data-testid="footer-save-all-btn"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu tất cả</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
