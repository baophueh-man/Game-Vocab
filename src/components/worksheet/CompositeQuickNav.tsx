import React from 'react';
import { Plus, Minimize2, Maximize2, Sparkles, Navigation } from 'lucide-react';
import { UICompositeSection } from './CompositeSectionCard';
import { WORKSHEET_TYPES } from '../../utils/worksheetGenerator';

interface CompositeQuickNavProps {
  sections: UICompositeSection[];
  activeSectionIndex?: number | null;
  onJumpToSection: (index: number) => void;
  onAddSection: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

export default function CompositeQuickNav({
  sections,
  activeSectionIndex,
  onJumpToSection,
  onAddSection,
  onCollapseAll,
  onExpandAll,
  focusMode,
  onToggleFocusMode
}: CompositeQuickNavProps) {
  const getShortTypeName = (type: number): string => {
    const meta = WORKSHEET_TYPES.find((t) => t.type === type);
    if (!meta) return `L${type}`;
    return meta.name.replace(/^Loại\s*\d+:\s*/i, '');
  };

  return (
    <div
      className="sticky top-20 z-10 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2"
      data-testid="composite-quick-nav"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Title & Section count */}
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          <span>Mục Lục Nhanh ({sections.length} phần):</span>
        </div>

        {/* Global Expand/Collapse & Focus Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCollapseAll}
            title="Thu gọn tất cả các phần"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Thu gọn hết</span>
          </button>

          <button
            type="button"
            onClick={onExpandAll}
            title="Mở rộng tất cả các phần"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Mở rộng hết</span>
          </button>

          <button
            type="button"
            onClick={onToggleFocusMode}
            title="Chế độ tập trung: Chỉ mở duy nhất 1 phần bài tập đang sửa"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
              focusMode
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Tập trung: {focusMode ? 'Bật' : 'Tắt'}</span>
          </button>

          <button
            type="button"
            onClick={onAddSection}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Pill buttons for jumping directly to any section */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
        {sections.map((sec, idx) => {
          const isCurrent = activeSectionIndex === idx;
          const wordCount = sec.selectedWordIndices?.length || 0;
          const shortName = getShortTypeName(sec.type);

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onJumpToSection(idx)}
              data-testid={`quick-jump-pill-${idx}`}
              title={`Nhảy tới Phần ${idx + 1}: ${sec.title}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  isCurrent ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {idx + 1}
              </span>
              <span className="max-w-[110px] truncate">{sec.title || shortName}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  isCurrent ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {wordCount}t
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
