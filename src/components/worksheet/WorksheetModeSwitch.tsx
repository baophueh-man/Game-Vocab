import React from 'react';
import { FileText, Layers } from 'lucide-react';

interface WorksheetModeSwitchProps {
  mode: 'single' | 'composite';
  onChangeMode: (mode: 'single' | 'composite') => void;
}

export default function WorksheetModeSwitch({
  mode,
  onChangeMode
}: WorksheetModeSwitchProps) {
  return (
    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-2">
      <button
        type="button"
        onClick={() => onChangeMode('single')}
        data-testid="mode-tab-single"
        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          mode === 'single'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Worksheet Đơn</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeMode('composite')}
        data-testid="mode-tab-composite"
        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          mode === 'composite'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>Worksheet Tổng Hợp</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
            mode === 'composite'
              ? 'bg-white/20 text-white'
              : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          Mới
        </span>
      </button>
    </div>
  );
}
