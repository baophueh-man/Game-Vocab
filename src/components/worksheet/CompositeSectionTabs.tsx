import React, { useState } from 'react';
import { Plus, Layers, ChevronLeft, ChevronRight, Copy, Trash2, ArrowUp, ArrowDown, GripVertical, Target } from 'lucide-react';
import { UICompositeSection } from './CompositeSectionCard';
import { WORKSHEET_TYPES } from '../../utils/worksheetGenerator';
import { useWorksheetTypes } from '../../utils/worksheetTypeCustomization';

interface CompositeSectionTabsProps {
  sections: UICompositeSection[];
  activeTabIndex: number;
  isFocusedPreview?: boolean;
  onSelectTab: (index: number) => void;
  onAddSection: () => void;
  onAddAllSections?: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onDuplicate?: (index: number) => void;
  onReorderSection?: (fromIndex: number, toIndex: number) => void;
}

export default function CompositeSectionTabs({
  sections,
  activeTabIndex,
  isFocusedPreview = true,
  onSelectTab,
  onAddSection,
  onAddAllSections,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  onReorderSection
}: CompositeSectionTabsProps) {
  const { worksheetTypes } = useWorksheetTypes();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const getTypeName = (type: number): string => {
    const meta = worksheetTypes.find((t) => t.type === type) || WORKSHEET_TYPES.find((t) => t.type === type);
    if (!meta) return `Loại ${type}`;
    // Strip "Loại X: " prefix if present for compact tab label
    return meta.name.replace(/^Loại\s*\d+:\s*/i, '');
  };

  return (
    <div className="space-y-3" data-testid="composite-section-tabs-container">
      {/* Scrollable Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
        {sections.map((sec, idx) => {
          const isActive = idx === activeTabIndex;
          const wordCount = sec.selectedWordIndices?.length || 0;
          const typeName = getTypeName(sec.type);
          const isDragTarget = dragOverIndex === idx;

          return (
            <button
              key={sec.id}
              type="button"
              draggable={Boolean(onReorderSection)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                if (!onReorderSection) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIndex !== idx) setDragOverIndex(idx);
              }}
              onDragLeave={() => {
                if (dragOverIndex === idx) setDragOverIndex(null);
              }}
              onDrop={(e) => {
                if (!onReorderSection) return;
                e.preventDefault();
                setDragOverIndex(null);
                const fromStr = e.dataTransfer.getData('text/plain');
                if (fromStr !== '') {
                  const fromIdx = Number(fromStr);
                  if (!isNaN(fromIdx) && fromIdx !== idx) {
                    onReorderSection(fromIdx, idx);
                  }
                }
              }}
              onClick={() => onSelectTab(idx)}
              data-testid={`composite-tab-${idx}`}
              title="Nhấn để chọn chỉnh sửa và xem trước bài này, hoặc kéo thả để đổi thứ tự bài"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isDragTarget
                  ? 'border-2 border-indigo-600 bg-indigo-50 ring-2 ring-indigo-300 scale-102'
                  : isActive
                  ? 'bg-white text-indigo-900 shadow-xs border border-indigo-300 ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              {onReorderSection && (
                <GripVertical className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-600 cursor-grab shrink-0 -mr-0.5" />
              )}
              {/* Badge Number */}
              <span
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {idx + 1}
              </span>

              {/* Title & Type */}
              <div className="flex flex-col text-left">
                <span className="line-clamp-1 max-w-[130px] font-bold">
                  {sec.title || typeName}
                </span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  Loại {sec.type}
                </span>
              </div>

              {/* Active Focused Preview Badge */}
              {isActive && isFocusedPreview && (
                <span
                  data-testid="composite-tab-active-focus-badge"
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500 text-white flex items-center gap-0.5 shadow-2xs"
                  title="Bài tập này đang được hiển thị trên khung xem trước PDF"
                >
                  <Target className="w-2.5 h-2.5" />
                  <span>Đang xem</span>
                </span>
              )}

              {/* Word Count Pill */}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {wordCount} từ
              </span>
            </button>
          );
        })}

        {/* Quick Add Section Button on Tab Bar */}
        <button
          type="button"
          onClick={onAddSection}
          data-testid="tab-add-section-btn"
          title="Thêm phần bài tập mới"
          className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 ml-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Thêm phần</span>
        </button>

        {onAddAllSections && (
          <button
            type="button"
            onClick={onAddAllSections}
            data-testid="tab-add-all-sections-btn"
            title="Thêm tất cả các loại bài tập có trong hệ thống"
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Tất cả loại</span>
          </button>
        )}
      </div>

      {/* Active Tab Sub-Toolbar: Quick actions for the currently active tab */}
      {sections.length > 0 && activeTabIndex >= 0 && activeTabIndex < sections.length && (
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-950">
              Đang chỉnh sửa: Phần {activeTabIndex + 1} / {sections.length}
            </span>
            <span className="text-indigo-400">•</span>
            <span className="text-indigo-700 font-medium truncate max-w-[200px]">
              {sections[activeTabIndex].title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMoveUp(activeTabIndex)}
              disabled={activeTabIndex === 0}
              title="Đổi thứ tự: Đẩy sang trái"
              className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(activeTabIndex)}
              disabled={activeTabIndex === sections.length - 1}
              title="Đổi thứ tự: Đẩy sang phải"
              className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(activeTabIndex)}
                title="Nhân bản phần này"
                className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors ml-0.5"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(activeTabIndex)}
              disabled={sections.length <= 1}
              title={sections.length <= 1 ? "Phải giữ lại ít nhất 1 phần bài tập" : "Xóa phần này"}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
