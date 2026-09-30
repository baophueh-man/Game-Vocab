import React from 'react';
import { Plus, ChevronLeft, ChevronRight, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { UICompositeSection } from './CompositeSectionCard';
import { WORKSHEET_TYPES } from '../../utils/worksheetGenerator';

interface CompositeSectionTabsProps {
  sections: UICompositeSection[];
  activeTabIndex: number;
  onSelectTab: (index: number) => void;
  onAddSection: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onDuplicate?: (index: number) => void;
}

export default function CompositeSectionTabs({
  sections,
  activeTabIndex,
  onSelectTab,
  onAddSection,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate
}: CompositeSectionTabsProps) {
  const getTypeName = (type: number): string => {
    const meta = WORKSHEET_TYPES.find((t) => t.type === type);
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

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectTab(idx)}
              data-testid={`composite-tab-${idx}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200/80 ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
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
