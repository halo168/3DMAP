import React, { useState } from 'react';
import { Spot } from '../data/spotsData';
import { playUiClick } from '../utils/audio';
import {
  Calendar,
  Compass,
  MapPin,
  Sparkles,
  Utensils,
  X,
  Clock,
  Car,
  Train,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface ItineraryModalProps {
  spots: Spot[];
  collectedIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  onClose: () => void;
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({
  spots,
  collectedIds,
  onSelectSpot,
  onClose,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('smart');

  // Filter spots the user has already stamped
  const collectedSpots = spots.filter((s) => collectedIds.has(s.id));

  // Synthesize sequenced routes based on geography (North -> Central -> South -> East -> Islands)
  const sortedCollected = [...collectedSpots].sort((a, b) => {
    const order: Record<string, number> = { north: 1, central: 2, south: 3, east: 4, islands: 5 };
    return order[a.region] - order[b.region];
  });

  const presetPlans = [
    {
      id: 'smart',
      name: '個人化已收集印章慢活串聯線',
      days: `${Math.max(1, Math.ceil(collectedSpots.length / 3))} 日漫遊`,
      badge: `已納入 ${collectedSpots.length} 個已蓋章景點`,
      desc: '依據您護照中已親自蓋章的珍貴足跡，按地理順暢度串聯之專屬巡禮路線。',
      isDynamic: true,
    },
    {
      id: 'round-island',
      name: '經典山海環島 5 日全覽慢活巡禮',
      days: '5 天 4 夜',
      badge: '熱門首選',
      desc: '由台北都會出發，穿越雪山隧道，沿太平洋峭壁南下墾丁，再自府城回溯台中。',
      stops: [
        { day: 'Day 1', region: '北部', spotName: '台北 101 觀景台 → 九份老街與山城', food: '九份芋圓、草仔粿', note: '傍晚於九份茶樓俯瞰海景點燈' },
        { day: 'Day 2', region: '東部', spotName: '太魯閣燕子口 → 七星潭礫石灘', food: '花蓮炸彈蔥油餅、扁食', note: '早晨漫步大理石峽谷，傍晚吹太平洋海風' },
        { day: 'Day 3', region: '東部/南部', spotName: '池上伯朗大道 → 墾丁白沙灣', food: '全美行鐵路便當、後壁湖生魚片', note: '縱谷騎行稻浪，迎向南國恆春半島黃昏夕陽' },
        { day: 'Day 4', region: '南部', spotName: '台南赤崁樓與安平古堡 → 駁二藝術特區', food: '牛肉湯、同記安平豆花、海產粥', note: '探訪台灣近四百年歷史起點與港都文創大港橋' },
        { day: 'Day 5', region: '中部', spotName: '日月潭向山步道 → 高美濕地木棧道', food: '紅玉紅茶、清水筒仔米糕', note: '清晨湖畔騎乘單車，傍晚以高美濕地風車夕陽為完美句點' },
      ],
    },
    {
      id: 'metro-culture',
      name: '北中高鐵都會美食文創 3 日輕旅行',
      days: '3 天 2 夜',
      badge: '高鐵便捷',
      desc: '適合利用週末與高鐵串聯全台精華城市地標、知名夜市與文創聚落。',
      stops: [
        { day: 'Day 1', region: '台北都會', spotName: '故宮博物院 → 台北 101 → 士林夜市', food: '鼎泰豐小籠包、士林生煎包', note: '白天品味國寶珍藏，夜晚登頂世界地標與品嚐夜市' },
        { day: 'Day 2', region: '台中休閒', spotName: '科博館草悟道 → 審計新村 → 逢甲觀光夜市', food: '肉蛋土司、明倫蛋餅、大腸包小腸', note: '漫步綠園道老宅文創，晚上體驗全台創新小吃研發中心' },
        { day: 'Day 3', region: '高雄港都', spotName: '奇美博物館 → 駁二大港橋 → 六合夜市', food: '鴨肉珍、旗津烤小卷、木瓜牛奶', note: '純白宮殿藝術饗宴，午後漫步愛河灣與大港旋轉橋' },
      ],
    },
    {
      id: 'east-coast',
      name: '東部縱谷太平洋秘境 4 日行',
      days: '4 天 3 夜',
      badge: '療癒山海',
      desc: '沿著台灣最壯麗的蘇花公路與花東縱谷，深呼吸純淨空氣與原鄉文化。',
      stops: [
        { day: 'Day 1', region: '花蓮', spotName: '清水斷崖 → 太魯閣九曲洞', food: '太魯閣竹筒飯、原鄉烤肉', note: '近距離見證造山運動的崇高絕壁與碧綠溪水' },
        { day: 'Day 2', region: '縱谷', spotName: '瑞穗牧場 → 池上金城武樹', food: '香濃鮮奶酪、池上豆包', note: '品嚐瑞穗純淨鮮奶，傍晚金黃稻浪間漫步' },
        { day: 'Day 3', region: '海岸', spotName: '三仙台跨海八拱橋 → 加路蘭漂流木', food: '成功漁港現切旗魚、東河包子', note: '八拱橋晨光迎曙光，海岸裝置藝術凝望藍海' },
        { day: 'Day 4', region: '台東', spotName: '鹿野高台 → 鐵花村音樂聚落', food: '紅烏龍冷泡茶、米苔目', note: '視野遼闊的高台草原，夜晚在彩繪熱氣球燈海下聽民謠' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                台灣智慧慢活行程規劃
              </h2>
              <p className="text-xs text-slate-400">
                依據全台地理座標與您的集章印記智慧串聯環島慢活路線
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playUiClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Selector Tabs */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
          {presetPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                playUiClick();
                setSelectedPlanId(plan.id);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedPlanId === plan.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <span>{plan.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 font-medium">
                {plan.days}
              </span>
            </button>
          ))}
        </div>

        {/* Plan Details Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Active Plan Overview Card */}
          {(() => {
            const currentPlan = presetPlans.find((p) => p.id === selectedPlanId) || presetPlans[0];
            return (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    {currentPlan.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{currentPlan.days}</span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">{currentPlan.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{currentPlan.desc}</p>
              </div>
            );
          })()}

          {/* If Dynamic Collected Mode selected */}
          {selectedPlanId === 'smart' ? (
            collectedSpots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Compass className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <p className="text-sm font-semibold text-slate-300">尚未在任何景點蓋上紀念章</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  請在地圖上點擊地標，或在集章冊中選擇景點進行蓋章體驗。蓋章後，此處將自動為您串聯專屬路線！
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    個人化串聯路線清單 ({sortedCollected.length} 個站點)
                  </h4>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-rose-500">
                  {sortedCollected.map((spot, idx) => (
                    <div
                      key={spot.id}
                      onClick={() => onSelectSpot(spot)}
                      className="relative p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 cursor-pointer transition-all hover:translate-x-1 group"
                    >
                      {/* Step Number Dot */}
                      <div className="absolute -left-6 top-4 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-md">
                        {idx + 1}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {spot.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {spot.regionName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {spot.id}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" /> 最佳時段：{spot.bestTime.slice(0, 16)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5 text-rose-400" /> 推薦品嚐：{spot.food.join('、')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Preset Circuit Stops */
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                每日推薦行程與交通節奏
              </h4>

              {presetPlans
                .find((p) => p.id === selectedPlanId)
                ?.stops?.map((stop, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
                          {stop.day}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">[{stop.region}]</span>
                        <span className="text-sm font-bold text-white">{stop.spotName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>美食亮點：{stop.food}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-2">
                        <Car className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>漫活節奏：{stop.note}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
