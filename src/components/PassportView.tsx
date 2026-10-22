import React, { useState } from 'react';
import { Spot } from '../data/spotsData';
import { playUiClick } from '../utils/audio';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Filter,
  Lock,
  Search,
  Sparkles,
  Trophy,
  Calendar,
  Compass,
  FileText,
  Map,
} from 'lucide-react';

interface PassportViewProps {
  spots: Spot[];
  collectedMap: Record<string, string>; // spotId -> ISO timestamp
  onSelectSpot: (spot: Spot) => void;
  onOpenCertificate: () => void;
  onOpenItinerary: () => void;
  onClose: () => void;
}

// Explorer Honor Title Rank
export function getExplorerTitle(count: number): {
  title: string;
  badgeColor: string;
  nextThreshold: number;
  progressPercent: number;
} {
  if (count < 11) {
    return {
      title: '台灣初探者',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      nextThreshold: 11,
      progressPercent: Math.round((count / 11) * 100),
    };
  } else if (count < 31) {
    return {
      title: '寶島漫遊旅人',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      nextThreshold: 31,
      progressPercent: Math.round(((count - 10) / 20) * 100),
    };
  } else if (count < 61) {
    return {
      title: '深度巡航達人',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      nextThreshold: 61,
      progressPercent: Math.round(((count - 30) / 30) * 100),
    };
  } else if (count < 91) {
    return {
      title: '秘境山海旅宗',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      nextThreshold: 91,
      progressPercent: Math.round(((count - 60) / 30) * 100),
    };
  } else {
    return {
      title: '福爾摩沙巡禮宗師',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      nextThreshold: 100,
      progressPercent: 100,
    };
  }
}

export const PassportView: React.FC<PassportViewProps> = ({
  spots,
  collectedMap,
  onSelectSpot,
  onOpenCertificate,
  onOpenItinerary,
  onClose,
}) => {
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const collectedCount = Object.keys(collectedMap).length;
  const totalPercent = Math.round((collectedCount / spots.length) * 100);
  const titleInfo = getExplorerTitle(collectedCount);

  // Filtered spots
  const filteredSpots = spots.filter((s) => {
    const matchReg = filterRegion === 'all' || s.region === filterRegion;
    const isColl = !!collectedMap[s.id];
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'collected' && isColl) ||
      (filterStatus === 'uncollected' && !isColl);
    const matchSearch =
      searchQuery.trim() === '' ||
      s.name.includes(searchQuery.trim()) ||
      s.id.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      s.food.some((f) => f.includes(searchQuery.trim()));
    return matchReg && matchStatus && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Title & Explorer Passport Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-600 to-rose-700 flex items-center justify-center text-white shadow-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    台灣觀光探索者集章冊
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${titleInfo.badgeColor}`}>
                    ★ {titleInfo.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Taiwan Tourist Stamp Passport • 專屬數位旅行手帳
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  playUiClick();
                  onOpenItinerary();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Map className="w-4 h-4 text-emerald-400" />
                <span>行程規劃推薦</span>
              </button>

              <button
                onClick={() => {
                  playUiClick();
                  onOpenCertificate();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span>領取成就證書</span>
              </button>

              <button
                onClick={() => {
                  playUiClick();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                關閉
              </button>
            </div>
          </div>

          {/* Progress Bar & Level Overview */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="w-4 h-4 text-rose-500" />
                <span>百大景點收集進度</span>
                <span className="text-rose-400 font-bold text-sm">
                  {collectedCount} / {spots.length} ({totalPercent}%)
                </span>
              </div>
              <div className="text-slate-400">
                晉升下一階需要：
                <span className="text-amber-400 font-bold">
                  {Math.max(0, titleInfo.nextThreshold - collectedCount)} 章
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${totalPercent}%` }}
              />
            </div>

            {/* Honor Titles Roadmap */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2 text-[10px]">
              {[
                { name: '台灣初探者', range: '0-10 章', active: collectedCount >= 0 },
                { name: '寶島漫遊旅人', range: '11-30 章', active: collectedCount >= 11 },
                { name: '深度巡航達人', range: '31-60 章', active: collectedCount >= 31 },
                { name: '秘境山海旅宗', range: '61-90 章', active: collectedCount >= 61 },
                { name: '福爾摩沙巡禮宗師', range: '91-100 章', active: collectedCount >= 91 },
              ].map((lvl, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    lvl.active
                      ? 'bg-slate-800/80 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-600'
                  }`}
                >
                  <p className="font-bold">{lvl.name}</p>
                  <p className="text-[9px] opacity-75">{lvl.range}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            {[
              { id: 'all', label: '全台' },
              { id: 'north', label: '北部' },
              { id: 'central', label: '中部' },
              { id: 'south', label: '南部' },
              { id: 'east', label: '東部' },
              { id: 'islands', label: '離島' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  playUiClick();
                  setFilterRegion(reg.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  filterRegion === reg.id
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Collection Status & Search */}
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => {
                playUiClick();
                setFilterStatus(e.target.value as 'all' | 'collected' | 'uncollected');
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none"
            >
              <option value="all">全部狀態 ({spots.length})</option>
              <option value="collected">已收集 ({collectedCount})</option>
              <option value="uncollected">尚未收集 ({spots.length - collectedCount})</option>
            </select>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋景點/編號/美食..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* 100 Stamps Grid Display */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredSpots.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Compass className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">沒有符合條件的景點印章</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredSpots.map((spot) => {
                const isColl = !!collectedMap[spot.id];
                const stampTime = collectedMap[spot.id];

                return (
                  <button
                    key={spot.id}
                    onClick={() => {
                      playUiClick();
                      onSelectSpot(spot);
                    }}
                    className={`relative rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all group hover:scale-[1.03] active:scale-95 border ${
                      isColl
                        ? 'bg-rose-950/20 border-rose-600/40 hover:border-rose-500 shadow-lg'
                        : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* ID & Region Badge */}
                    <div className="w-full flex items-center justify-between text-[10px] mb-2 font-mono">
                      <span className="text-slate-400">{spot.id}</span>
                      <span className="text-slate-500">{spot.regionName}</span>
                    </div>

                    {/* Stamp Circular Badge Graphic */}
                    <div className="my-2 relative flex items-center justify-center w-20 h-20">
                      {isColl ? (
                        <div className="w-20 h-20 rounded-full border-2 border-rose-600 flex flex-col items-center justify-center p-1 bg-rose-500/10 transform rotate-[-4deg] group-hover:rotate-0 transition-transform">
                          <div className="w-full h-full rounded-full border border-dashed border-rose-500/80 flex flex-col items-center justify-between p-1">
                            <span className="text-[7px] font-bold text-rose-600">紀念戳章</span>
                            <span className="text-[10px] font-black text-rose-700 line-clamp-1 leading-tight">
                              {spot.name.slice(0, 4)}
                            </span>
                            <span className="text-[7px] font-mono text-rose-500">
                              {stampTime ? new Date(stampTime).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) : '已收集'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full border border-dashed border-slate-700 flex flex-col items-center justify-center p-1 text-slate-600">
                          <Lock className="w-5 h-5 text-slate-700 mb-1 group-hover:text-slate-500 transition-colors" />
                          <span className="text-[9px] text-slate-500">待解鎖</span>
                        </div>
                      )}
                    </div>

                    {/* Spot Name */}
                    <div className="w-full mt-1">
                      <p className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-white">
                        {spot.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{spot.categoryName}</p>
                    </div>

                    {/* Status Pill */}
                    <div className="mt-2 w-full pt-1.5 border-t border-slate-800/80">
                      <span
                        className={`text-[9px] font-semibold block ${
                          isColl ? 'text-rose-400' : 'text-slate-500'
                        }`}
                      >
                        {isColl ? '✓ 已收集此章' : '點擊查看並蓋章'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
