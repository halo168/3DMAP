import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Spot } from '../data/spotsData';
import { playStampSound, playUiClick } from '../utils/audio';
import {
  X,
  MapPin,
  Mountain,
  Clock,
  Sparkles,
  Utensils,
  BookOpen,
  Camera,
  Shirt,
  RotateCcw,
  CheckCircle,
  Bot,
  Star,
  Award,
} from 'lucide-react';

interface StampModalProps {
  spot: Spot;
  isCollected: boolean;
  collectedAt?: string;
  onStamp: (spotId: string) => void;
  onUnstamp: (spotId: string) => void;
  onClose: () => void;
}

export const StampModal: React.FC<StampModalProps> = ({
  spot,
  isCollected,
  collectedAt,
  onStamp,
  onUnstamp,
  onClose,
}) => {
  const [isStampingAnim, setIsStampingAnim] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'ai'>('guide');

  // Trigger Heavy Wooden Stamp animation, sound, and confetti
  const handlePerformStamp = () => {
    if (isStampingAnim) return;
    setIsStampingAnim(true);

    // Play procedural wooden hammer impact sound
    playStampSound();

    // Fire celebratory confetti after impact
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e'],
      });
      onStamp(spot.id);
      setIsStampingAnim(false);
    }, 450);
  };

  const handleResetStamp = () => {
    playUiClick();
    onUnstamp(spot.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            playUiClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-200 border border-slate-700 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Hero Image & Core Spot Attributes */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden shrink-0">
          <img
            src={spot.image}
            alt={spot.name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            onError={(e) => {
              // fallback image if Unsplash fails
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30" />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              {spot.id}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-slate-200 border border-slate-700 text-xs font-semibold">
              {spot.regionName}
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/25 backdrop-blur-md text-cyan-300 border border-cyan-500/40 text-xs font-semibold">
              {spot.categoryName}
            </span>
          </div>

          {/* Spot Title & Quick Meta */}
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {spot.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {spot.rating} ({spot.reviewsCount.toLocaleString()} 則真實評論)
              </span>
              <span className="flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                海拔：{spot.altitude}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Stamp Section (蓋章專區) */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
            {/* Left: Stamp Graphic Area */}
            <div className="relative flex items-center justify-center min-w-[130px] min-h-[130px]">
              {/* Wooden Stamp Arm Falling Animation */}
              {isStampingAnim && (
                <div className="absolute z-30 transform -translate-y-16 animate-bounce">
                  <div className="w-14 h-24 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 rounded-t-full shadow-2xl border-2 border-amber-950 flex flex-col items-center justify-end pb-2">
                    <div className="w-16 h-4 bg-amber-950 rounded-md shadow-md" />
                  </div>
                </div>
              )}

              {/* Stamped Vermilion Traditional Seal */}
              {isCollected ? (
                <div className="relative transform -rotate-3 transition-transform duration-300 hover:rotate-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-rose-600 flex flex-col items-center justify-center p-2 text-rose-600 shadow-lg bg-rose-500/10">
                    <div className="w-full h-full rounded-full border border-dashed border-rose-500/80 flex flex-col items-center justify-between p-1.5 text-center">
                      <span className="text-[9px] font-bold tracking-widest text-rose-600">★ 台灣觀光紀念章 ★</span>
                      <div className="my-auto">
                        <p className="text-xs sm:text-sm font-black tracking-tight leading-tight text-rose-700">
                          {spot.name.slice(0, 6)}
                        </p>
                        <p className="text-[10px] font-mono font-bold tracking-wider text-rose-600/90 mt-0.5">
                          {spot.id}
                        </p>
                      </div>
                      <span className="text-[8px] font-mono text-rose-500">
                        {collectedAt ? new Date(collectedAt).toLocaleDateString('zh-TW') : '2026 認證'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Uncollected Vintage Embossed Watermark Placeholder */
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-slate-600/80 flex flex-col items-center justify-center p-2 text-slate-500 text-center">
                  <Award className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="text-[11px] font-medium text-slate-400">尚未蓋章</span>
                  <span className="text-[9px] text-slate-500">點擊右側按鈕收集</span>
                </div>
              )}
            </div>

            {/* Right: Stamp Action CTA */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isCollected
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isCollected ? <CheckCircle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isCollected ? '【 已收集此章 】' : '【 尚未收集此景點章 】'}
                </span>
              </div>

              {isCollected ? (
                <div className="space-y-1">
                  <p className="text-xs text-slate-300">
                    專屬編號：<span className="font-mono text-rose-400 font-bold">{spot.id}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    蓋章時間：
                    {collectedAt
                      ? new Date(collectedAt).toLocaleString('zh-TW', { hour12: false })
                      : '已登記於在地探索者護照'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleResetStamp}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                      title="若誤按可重置此印章"
                    >
                      <RotateCcw className="w-3 h-3" /> 重置印章（取消蓋章/重新體驗）
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    來到 <span className="text-white font-semibold">{spot.name}</span> 留下您的足跡！
                  </p>
                  <button
                    onClick={handlePerformStamp}
                    disabled={isStampingAnim}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Award className="w-4 h-4" />
                    <span>立即蓋上紀念章</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher: Detailed Guide vs Gemini AI Guide */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 text-sm font-semibold">
          <button
            onClick={() => {
              playUiClick();
              setActiveTab('guide');
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>深度導覽資訊</span>
          </button>
          <button
            onClick={() => {
              playUiClick();
              setActiveTab('ai');
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'ai'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Gemini AI 在地導遊</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-left text-sm">
          {activeTab === 'guide' ? (
            <>
              {/* Highlights */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  必訪亮點特色
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spot.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 text-xs flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Visiting Time & Altitude */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">最佳參觀時機：</span>
                    {spot.bestTime}
                  </div>
                </div>
              </div>

              {/* History & Cultural Background */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  歷史與文化背景
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-850 p-3 rounded-2xl border border-slate-800">
                  {spot.history}
                </p>
              </div>

              {/* Insider Food Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-rose-400" />
                  在地內行推薦美食
                </h4>
                <div className="flex flex-wrap gap-2">
                  {spot.food.map((f, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1"
                    >
                      🍽️ {f}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Gemini AI Local Guide Card */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Gemini 在地智慧導遊</h4>
                      <p className="text-[10px] text-cyan-300">專屬即時行程建議與在地秘境剖析</p>
                    </div>
                  </div>
                  {/* Prompt requirement: 標註「介面展示，未接 API」 */}
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/40 font-mono">
                    介面展示，未接 API
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">在地私房內行秘技</p>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{spot.aiTip.spotSecret}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <Camera className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-cyan-300">IG 絕景最佳拍照機位</p>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{spot.aiTip.photoSpot}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <Shirt className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-300">推薦穿搭與隨身裝備</p>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{spot.aiTip.outfit}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
