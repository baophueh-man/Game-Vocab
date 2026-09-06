import React, { useState } from 'react';
import { Volume2, Gauge, Sparkles, Cpu, Smartphone, Settings2, Play, Loader2, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings, TTSSourceMode } from '../../contexts/SettingsContext';

const GEMINI_VOICES = [
  { id: 'Kore', name: 'Kore (Calm Female)' },
  { id: 'Charon', name: 'Charon (Deep Male)' },
  { id: 'Puck', name: 'Puck (Friendly Male)' },
  { id: 'Fenrir', name: 'Fenrir (Strong Male)' },
  { id: 'Zephyr', name: 'Zephyr (Energetic Female)' },
];

export default function VoiceSettings() {
  const { 
    ttsSource, setTtsSource,
    enVoice, setEnVoice, 
    vnVoice, setVnVoice, 
    enGeminiVoice, setEnGeminiVoice,
    viGeminiVoice, setViGeminiVoice,
    enVoices, vnVoices, 
    speechRate, setSpeechRate,
    speakEn, speakVn,
    reduceMotion, setReduceMotion
  } = useSettings();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [testingEn, setTestingEn] = useState(false);
  const [testingVn, setTestingVn] = useState(false);

  const formatVoiceName = (voice: SpeechSynthesisVoice) => {
    let prefix = '';
    if (voice.lang.includes('en-US')) prefix = '🇺🇸 US';
    else if (voice.lang.includes('en-GB')) prefix = '🇬🇧 UK';
    else if (voice.lang.includes('vi')) prefix = '🇻🇳 VN';
    else prefix = voice.lang;

    let shortName = voice.name
      .replace(/Microsoft /gi, '')
      .replace(/Google /gi, '')
      .replace(/Apple /gi, '')
      .replace(/ Desktop/gi, '')
      .replace(/ English \(United States\)/gi, '')
      .replace(/ English \(United Kingdom\)/gi, '')
      .replace(/ Vietnamese/gi, '')
      .trim();

    if (!shortName || shortName === 'English' || shortName === 'Vietnamese') {
      shortName = voice.name.split(' ')[0];
    }

    return `${prefix} - ${shortName}`;
  };

  const handleTestEn = async () => {
    setTestingEn(true);
    try {
      await speakEn('Hello, welcome to VocaGame!');
    } finally {
      setTestingEn(false);
    }
  };

  const handleTestVn = async () => {
    setTestingVn(true);
    try {
      await speakVn('Xin chào, chào mừng bạn đến với VocaGame!');
    } finally {
      setTestingVn(false);
    }
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="relative z-30">
      {/* Trigger Button */}
      <button
        onClick={() => setShowSettingsModal(!showSettingsModal)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:bg-slate-50 font-bold text-slate-700 transition-all hover:scale-105"
        title="Voice, Audio & Performance Settings"
      >
        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
        <span className="hidden sm:inline text-sm">Cài đặt</span>
        <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
          {ttsSource === 'auto' ? 'Auto AI' : ttsSource === 'gemini' ? 'Gemini' : 'Device'}
        </span>
        {reduceMotion && (
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold border border-amber-200">
            <Zap className="w-2.5 h-2.5 fill-amber-600 text-amber-600" /> Máy yếu
          </span>
        )}
      </button>

      {/* Settings Modal Popover */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
              onClick={() => setShowSettingsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-84 max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-50 text-slate-800 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Cài Đặt Ứng Dụng</h3>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                >
                  Đóng
                </button>
              </div>

              {/* 0. Performance & Low Spec Mode Toggle */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/70 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${reduceMotion ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">Giảm Hoạt Ảnh (Máy Yếu)</h4>
                      <p className="text-[11px] font-semibold text-amber-700">Tối ưu cho Chrome & máy cấu hình thấp</p>
                    </div>
                  </div>
                  
                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      reduceMotion ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        reduceMotion ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {reduceMotion 
                    ? '✅ Đang bật: Đã tắt pháo hoa (confetti), hiệu ứng làm mờ và chuyển động nặng để chọn câu trả lời mượt mà, phản hồi tức thì.'
                    : '💡 Bật tùy chọn này nếu bạn thấy máy bị giật lag hoặc đơ nhẹ khi bấm chọn câu trả lời.'}
                </p>
              </div>

              {/* 1. TTS Source Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Nguồn Âm Thanh (Audio Source)
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setTtsSource('auto')}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      ttsSource === 'auto' 
                        ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tự động AI</span>
                  </button>
                  <button
                    onClick={() => setTtsSource('gemini')}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      ttsSource === 'gemini' 
                        ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Gemini AI</span>
                  </button>
                  <button
                    onClick={() => setTtsSource('device')}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      ttsSource === 'device' 
                        ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Thiết bị</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  {ttsSource === 'auto' && '⚡ Tự động dùng Gemini AI cho Tiếng Việt trên di động hoặc khi thiết bị không có sẵn giọng chuẩn.'}
                  {ttsSource === 'gemini' && '✨ Luôn sử dụng giọng đọc AI Gemini chất lượng cao server-side.'}
                  {ttsSource === 'device' && '📱 Sử dụng bộ tổng hợp giọng nói cài sẵn trên trình duyệt.'}
                </p>
              </div>

              {/* 2. Gemini Voices Selection */}
              {(ttsSource === 'auto' || ttsSource === 'gemini') && (
                <div className="space-y-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Chất giọng Gemini AI Voice</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      🇬🇧 Tiếng Anh (English)
                    </label>
                    <select
                      value={enGeminiVoice}
                      onChange={(e) => setEnGeminiVoice(e.target.value)}
                      className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {GEMINI_VOICES.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      🇻🇳 Tiếng Việt (Vietnamese)
                    </label>
                    <select
                      value={viGeminiVoice}
                      onChange={(e) => setViGeminiVoice(e.target.value)}
                      className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {GEMINI_VOICES.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 3. Device Voices Selection */}
              {(ttsSource === 'auto' || ttsSource === 'device') && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span>Giọng thiết bị (Browser Device Voices)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      🇬🇧 Device EN Voice
                    </label>
                    <select
                      value={enVoice}
                      onChange={(e) => setEnVoice(e.target.value)}
                      className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {enVoices.length === 0 ? (
                        <option value="">Default System Voice</option>
                      ) : (
                        enVoices.map(v => (
                          <option key={v.voiceURI || v.name} value={v.name}>
                            {formatVoiceName(v)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      🇻🇳 Device VN Voice
                    </label>
                    <select
                      value={vnVoice}
                      onChange={(e) => setVnVoice(e.target.value)}
                      className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {vnVoices.length === 0 ? (
                        <option value="">Not available on device (Will use Gemini AI)</option>
                      ) : (
                        vnVoices.map(v => (
                          <option key={v.voiceURI || v.name} value={v.name}>
                            {formatVoiceName(v)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* 4. Speed Setting */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-amber-500" />
                    Tốc Độ Đọc (Speed)
                  </span>
                  <span className="text-indigo-600 font-extrabold">{speechRate}x</span>
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {speedOptions.map(rate => (
                    <button
                      key={rate}
                      onClick={() => setSpeechRate(rate)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        speechRate === rate
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Test Audio Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nghe Thử Giọng Đọc (Test Audio)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleTestEn}
                    disabled={testingEn || testingVn}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                  >
                    {testingEn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Thử Tiếng Anh</span>
                  </button>
                  <button
                    onClick={handleTestVn}
                    disabled={testingEn || testingVn}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                  >
                    {testingVn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Thử Tiếng Việt</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
