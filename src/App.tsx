/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ALL_100_SPOTS, Spot } from './data/spotsData';
import { TaiwanMap3D } from './components/TaiwanMap3D';
import { StampModal } from './components/StampModal';
import { PassportView, getExplorerTitle } from './components/PassportView';
import { CertificateView } from './components/CertificateView';
import { ItineraryModal } from './components/ItineraryModal';
import { playUiClick } from './utils/audio';
import {
  BookOpen,
  Compass,
  Map,
  Shuffle,
  Trophy,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'taiwan_travel_stamps_v1';

export default function App() {
  // Stored stamps: { [spotId]: isoTimestampString }
  const [collectedMap, setCollectedMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse localStorage stamps:', e);
    }
    // Pre-seed 3 authentic stamps (Taipei 101, Taroko, Sun Moon Lake) for immediate vivid experience
    return {
      'TW-TPE-01': new Date(Date.now() - 86400000 * 3).toISOString(),
      'TW-NTO-15': new Date(Date.now() - 86400000 * 2).toISOString(),
      'TW-HUA-29': new Date(Date.now() - 86400000 * 1).toISOString(),
    };
  });

  // Modal & View States
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Filters state shared with 3D map
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collectedMap));
    } catch (e) {
      console.warn('Failed to save stamps to localStorage:', e);
    }
  }, [collectedMap]);

  // Set of collected spot IDs
  const collectedIds = new Set(Object.keys(collectedMap));
  const titleInfo = getExplorerTitle(collectedIds.size);

  // Handlers for Stamping
  const handleStamp = (spotId: string) => {
    setCollectedMap((prev) => ({
      ...prev,
      [spotId]: new Date().toISOString(),
    }));
  };

  const handleUnstamp = (spotId: string) => {
    setCollectedMap((prev) => {
      const next = { ...prev };
      delete next[spotId];
      return next;
    });
  };

  // Random Discovery feature: Picks an unvisited spot and opens it
  const handleRandomExplore = () => {
    playUiClick();
    const uncollected = ALL_100_SPOTS.filter((s) => !collectedIds.has(s.id));
    const pool = uncollected.length > 0 ? uncollected : ALL_100_SPOTS;
    const randomSpot = pool[Math.floor(Math.random() * pool.length)];
    setSelectedSpot(randomSpot);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* 3D Map takes full viewport canvas */}
      <div className="absolute inset-0 z-0">
        <TaiwanMap3D
          spots={ALL_100_SPOTS}
          collectedIds={collectedIds}
          onSelectSpot={(spot) => setSelectedSpot(spot)}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Floating Modern Header Action Bar (Top center-right) */}
      <header className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Random Discovery Button */}
        <button
          onClick={handleRandomExplore}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          title="隨機探索一處未訪景點"
        >
          <Shuffle className="w-4 h-4 text-amber-400" />
          <span>隨機探索</span>
        </button>

        {/* Itinerary Planner Button */}
        <button
          onClick={() => {
            playUiClick();
            setIsItineraryOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          title="智慧慢活行程規劃"
        >
          <Map className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">行程規劃</span>
        </button>

        {/* Passport Drawer Button */}
        <button
          onClick={() => {
            playUiClick();
            setIsPassportOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-900/30 text-xs font-bold transition-all hover:scale-105 active:scale-95"
          title="開啟觀光集章冊"
        >
          <BookOpen className="w-4 h-4" />
          <span>集章冊 ({collectedIds.size}/100)</span>
        </button>

        {/* Certificate Button */}
        <button
          onClick={() => {
            playUiClick();
            setIsCertificateOpen(true);
          }}
          className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-700/80 shadow-xl transition-all hover:scale-105 active:scale-95"
          title="查看探索者成就證書"
        >
          <Trophy className="w-4 h-4" />
        </button>

        {/* Help / Guide Info */}
        <button
          onClick={() => {
            playUiClick();
            setIsHelpOpen(true);
          }}
          className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow-xl transition-all hover:scale-105 active:scale-95"
          title="使用導覽指引"
        >
          <Info className="w-4 h-4" />
        </button>
      </header>

      {/* Spot Detail & Stamp Modal */}
      {selectedSpot && (
        <StampModal
          spot={selectedSpot}
          isCollected={collectedIds.has(selectedSpot.id)}
          collectedAt={collectedMap[selectedSpot.id]}
          onStamp={handleStamp}
          onUnstamp={handleUnstamp}
          onClose={() => setSelectedSpot(null)}
        />
      )}

      {/* Passport View Modal / Drawer */}
      {isPassportOpen && (
        <PassportView
          spots={ALL_100_SPOTS}
          collectedMap={collectedMap}
          onSelectSpot={(spot) => {
            setIsPassportOpen(false);
            setSelectedSpot(spot);
          }}
          onOpenCertificate={() => {
            setIsPassportOpen(false);
            setIsCertificateOpen(true);
          }}
          onOpenItinerary={() => {
            setIsPassportOpen(false);
            setIsItineraryOpen(true);
          }}
          onClose={() => setIsPassportOpen(false)}
        />
      )}

      {/* Achievement Certificate Modal */}
      {isCertificateOpen && (
        <CertificateView
          collectedCount={collectedIds.size}
          totalCount={ALL_100_SPOTS.length}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}

      {/* Smart Itinerary Modal */}
      {isItineraryOpen && (
        <ItineraryModal
          spots={ALL_100_SPOTS}
          collectedIds={collectedIds}
          onSelectSpot={(spot) => {
            setIsItineraryOpen(false);
            setSelectedSpot(spot);
          }}
          onClose={() => setIsItineraryOpen(false)}
        />
      )}

      {/* Help / Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">台灣 3D 旅遊導覽與集章使用指引</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <p className="font-bold text-emerald-400">1. 3D 互動地圖操作</p>
                <p>• 電腦：按住滑鼠左鍵拖曳旋轉視角、滾輪縮放、按住右鍵平移。</p>
                <p>• 手機：單指滑動旋轉、雙指開合縮放、雙指滑動平移。</p>
                <p>• 螢幕控制項：右側上下箭頭可往南往北移動視角，支援 3D 透視與 2D 俯視一鍵切換。</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <p className="font-bold text-cyan-400">2. 五大分類特色 3D 造形</p>
                <p>• 🎡 休閒樂園（彩色摩天輪）| ⛰️ 壯麗自然（雙色三角錐山）</p>
                <p>• 🏮 人文古蹟（美濃油紙傘）| 🌽 夜市美食（黃色玉米）| 🌴 海岸海島（熱帶椰子樹）</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <p className="font-bold text-rose-400">3. 沈浸式重磅蓋章體驗</p>
                <p>點擊任何地標即可開啟導覽卡片，點擊「立即蓋上紀念章」將觸發震撼木槌敲章音效、衝擊動畫與慶祝彩帶！</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <p className="font-bold text-amber-400">4. 集章冊與成就證書</p>
                <p>收集進度實時保存在本機，從「台灣初探者」一路進階至「福爾摩沙巡禮宗師」，並可隨時列印官方榮譽證書！</p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md"
            >
              開始探索寶島台灣
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
