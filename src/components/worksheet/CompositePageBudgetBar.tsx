import React, { useState } from 'react';
import {
  Shuffle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  FileCheck,
  ArrowUpDown,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { PageTelemetry } from '../../utils/worksheetPageOptimizer';

interface CompositePageBudgetBarProps {
  telemetry: PageTelemetry;
  targetPages: number;
  onTargetPagesChange: (pages: number) => void;
  onSmartShuffle: () => void;
  onAutoReorder: () => void;
  onAutoAlignGridWords?: (targetSectionId?: string) => void;
  canUndo: boolean;
  onUndo: () => void;
  paperSize: 'a5' | 'a4';
  lastActionMessage?: string | null;
}

export default function CompositePageBudgetBar({
  telemetry,
  targetPages,
  onTargetPagesChange,
  onSmartShuffle,
  onAutoReorder,
  onAutoAlignGridWords,
  canUndo,
  onUndo,
  paperSize,
  lastActionMessage
}: CompositePageBudgetBarProps) {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const {
    totalPages,
    pages,
    lastPageFillPercentage,
    isOrphanSpillover,
    spilloverHeightMm,
    averageSaveNeededPerPrevPageMm,
    sectionContributions,
    orphanGridWarnings = []
  } = telemetry;

  const isA5 = paperSize !== 'a4';
  const paperName = isA5 ? 'A5' : 'A4';
  const isTargetMatched = totalPages === targetPages;

  return (
    <div
      data-testid="composite-page-budget-bar"
      className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all mb-4"
    >
      {/* Main Top Bar */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 via-white to-purple-50/40 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        {/* Left: Page Count Badge & Diagnosis */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm shadow-2xs ${
                isOrphanSpillover
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : isTargetMatched
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>
                Hiện tại: <strong>{totalPages} trang {paperName}</strong>
              </span>
            </div>

            {/* Spillover Alert Badge */}
            {isOrphanSpillover && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200"
                title={`Trang ${totalPages} chỉ dùng ${lastPageFillPercentage}% diện tích (~${spilloverHeightMm.toFixed(1)}mm)`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Trang {totalPages} bị tràn nhẹ ({lastPageFillPercentage}%)
                </span>
              </div>
            )}

            {!isOrphanSpillover && isTargetMatched && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Đúng chuẩn {targetPages} trang mục tiêu</span>
              </div>
            )}
          </div>

          {/* Target Page Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-semibold text-slate-500">Mục tiêu:</span>
            <select
              value={targetPages}
              onChange={(e) => onTargetPagesChange(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer py-0.5"
              data-testid="target-page-select"
            >
              <option value={1}>1 trang</option>
              <option value={2}>2 trang (1 tờ in 2 mặt)</option>
              <option value={4}>4 trang {paperName} (⭐ Chuẩn Booklet)</option>
              <option value={6}>6 trang</option>
              <option value={8}>8 trang</option>
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo Button */}
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="Khôi phục lại thứ tự ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Hoàn tác</span>
            </button>
          )}

          {/* Auto Align Grid Words Button (Show if there are orphan warnings) */}
          {orphanGridWarnings.length > 0 && onAutoAlignGridWords && (
            <button
              type="button"
              onClick={() => onAutoAlignGridWords()}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              data-testid="auto-align-grid-button"
              title="Tự động làm tròn số từ về bội số của cột để triệt tiêu hàng mồ côi tiết kiệm ~22mm/bài"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>✨ Làm tròn số từ</span>
            </button>
          )}

          {/* Auto Reorder Button (Keep vocab, only optimize section positions) */}
          <button
            type="button"
            onClick={onAutoReorder}
            className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            data-testid="auto-reorder-button"
            title="Đổi thứ tự sắp xếp các phần bài tập để ghép khít trang nhất mà không thay đổi từ vựng"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>🔄 Xếp lại thứ tự bài</span>
          </button>

          {/* Smart Shuffle Button (Shuffle vocab + optimal order, ZERO compression) */}
          <button
            type="button"
            onClick={onSmartShuffle}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 active:scale-98 ring-2 ring-purple-200 shadow-purple-200"
            data-testid="smart-shuffle-button"
            title="Trộn ngẫu nhiên từ vựng và tự động sắp xếp thứ tự các phần bài tập để tiết kiệm trang nhất (Giữ nguyên 100% cỡ chữ & cỡ ảnh)"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-300" />
            <span>🎲 Trộn bài tiết kiệm trang</span>
          </button>

          {/* Details toggle */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Xem chi tiết phân bổ từng trang"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Visual Page Strip (Thanh mật độ tải từng trang) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50/70 border-b border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" />
            Mật độ tải từng trang ({pages.length} trang):
          </span>
          {isOrphanSpillover && averageSaveNeededPerPrevPageMm > 0 && (
            <span className="text-amber-700 font-medium">
              💡 Trang {totalPages} chỉ có bài tập lẻ (~{spilloverHeightMm.toFixed(1)}mm). Nhấn &quot;Trộn bài&quot; hoặc &quot;Xếp lại thứ tự&quot; để ghép gọn!
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {pages.map((p) => {
            const isSpill = p.pageNumber === totalPages && isOrphanSpillover;
            const isIdeal = p.fillPercentage >= 75 && p.fillPercentage <= 98;
            return (
              <div
                key={p.pageNumber}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  isSpill
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200'
                    : isIdeal
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
                title={`Trang ${p.pageNumber}: Đã dùng ${p.usedHeightMm.toFixed(1)}mm / ${p.maxHeightMm.toFixed(1)}mm`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                  <span>Trang {p.pageNumber}</span>
                  <span
                    className={
                      isSpill
                        ? 'text-amber-700'
                        : isIdeal
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }
                  >
                    {p.fillPercentage}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isSpill
                        ? 'bg-amber-500'
                        : isIdeal
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, p.fillPercentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Orphan Recommendations Tip */}
      {orphanGridWarnings.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50/90 border-b border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Mẹo tiết kiệm trang (chống hàng mồ côi):</span>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                {orphanGridWarnings.slice(0, 2).map((w, idx) => (
                  <li key={idx}>
                    {w.message}
                    {onAutoAlignGridWords && (
                      <button
                        type="button"
                        onClick={() => onAutoAlignGridWords(w.sectionId)}
                        className="ml-2 px-1.5 py-0.5 bg-white text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                        title={`Làm tròn bài này thành ${w.suggestedCount} từ`}
                      >
                        ⚡ Làm tròn bài này ({w.suggestedCount} từ)
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {onAutoAlignGridWords && (
            <button
              type="button"
              onClick={() => onAutoAlignGridWords()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              title="Làm tròn tất cả các bài tập bị lẻ từ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Làm tròn tất cả ({orphanGridWarnings.length} bài)</span>
            </button>
          )}
        </div>
      )}

      {/* Action Result Notification Banner */}
      {lastActionMessage && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{lastActionMessage}</span>
        </div>
      )}

      {/* Expandable Section Details */}
      {showDetails && (
        <div className="p-3 sm:p-4 bg-white text-xs border-t border-slate-100 space-y-2">
          <div className="font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Ước tính chiều cao từng phần bài tập (giữ nguyên 100% cỡ chữ & cỡ ảnh):</span>
            <span className="text-slate-400 font-normal">Dựa trên mô phỏng {paperName}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {sectionContributions.map((sec, idx) => (
              <div
                key={sec.sectionId}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800 block truncate max-w-[150px]">
                    {idx + 1}. {sec.title}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {sec.wordCount} từ vựng
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-indigo-700">
                    ~{sec.estimatedHeightMm}mm
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ({sec.estimatedPages} trang)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
