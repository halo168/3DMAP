import React, { useState } from 'react';
import { getExplorerTitle } from './PassportView';
import { playUiClick } from '../utils/audio';
import { Award, Printer, X, Download, ShieldCheck, Sparkles, Edit3 } from 'lucide-react';

interface CertificateViewProps {
  collectedCount: number;
  totalCount: number;
  onClose: () => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  collectedCount,
  totalCount,
  onClose,
}) => {
  const [explorerName, setExplorerName] = useState('熱血台灣旅行家');
  const [isEditingName, setIsEditingName] = useState(false);
  const titleInfo = getExplorerTitle(collectedCount);
  const today = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const certNumber = `TW-CERT-${String(collectedCount).padStart(3, '0')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const handlePrint = () => {
    playUiClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">台灣觀光探索者官方成就證書</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>列印 / 存為 PDF 證書</span>
            </button>
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
        </div>

        {/* Printable Certificate Canvas Content */}
        <div className="p-6 sm:p-10 bg-amber-50 text-slate-900 print:m-0 print:p-8 relative selection:bg-rose-200">
          {/* Ornate Traditional Border Frame */}
          <div className="border-4 border-amber-800 p-6 sm:p-8 rounded-2xl relative bg-gradient-to-b from-amber-50/90 via-orange-50/50 to-amber-100/80 shadow-xl">
            {/* Inner Gold Foil Double Line */}
            <div className="border border-dashed border-amber-700/60 p-4 sm:p-6 rounded-xl flex flex-col items-center text-center relative">
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-800/40 text-lg font-serif">❖</div>
              <div className="absolute top-2 right-2 text-amber-800/40 text-lg font-serif">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-800/40 text-lg font-serif">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-800/40 text-lg font-serif">❖</div>

              {/* Certificate Crest Header */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 via-rose-700 to-amber-800 flex items-center justify-center text-amber-100 shadow-md mb-3 border-2 border-amber-300">
                <Sparkles className="w-8 h-8" />
              </div>

              <span className="text-xs font-serif tracking-[0.25em] text-amber-900/80 uppercase font-bold">
                REPUBLIC OF CHINA (TAIWAN) TOURISM BUREAU
              </span>
              <h1 className="text-2xl sm:text-4xl font-black font-serif text-amber-950 mt-1 tracking-widest">
                福爾摩沙探索榮譽證書
              </h1>
              <p className="text-[11px] font-mono text-amber-800 mt-1 tracking-wider">
                CERTIFICATE OF FORMOSA EXPLORATION EXCELLENCE
              </p>

              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-700 to-transparent my-4" />

              {/* Recipient Name Section */}
              <div className="my-2 flex flex-col items-center">
                <span className="text-xs text-amber-900/70 font-serif">茲證明觀光旅人</span>
                <div className="flex items-center gap-2 mt-1">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={explorerName}
                      onChange={(e) => setExplorerName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      autoFocus
                      className="text-xl sm:text-2xl font-black text-amber-950 border-b-2 border-amber-800 bg-transparent text-center outline-none px-2"
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingName(true)}
                      className="text-xl sm:text-3xl font-black text-amber-950 border-b-2 border-amber-800/50 pb-1 cursor-pointer hover:border-amber-800 transition-colors flex items-center gap-1.5"
                      title="點擊修改證書姓名"
                    >
                      {explorerName}
                      <span className="text-xs font-normal text-amber-700 print:hidden">
                        [修改]
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Certificate Body Paragraph */}
              <p className="max-w-lg text-xs sm:text-sm text-amber-950/80 leading-relaxed font-serif my-4">
                熱情走訪寶島台灣之壯麗山林、碧藍海岸、百年人文古蹟、經典主題樂園與夜市特色美食，於數位集章冊中正式達成
                <span className="font-bold text-rose-800 mx-1">
                  {collectedCount} 處 ({Math.round((collectedCount / totalCount) * 100)}%)
                </span>
                之觀光集章里程碑，特頒予榮譽頭銜：
              </p>

              {/* Conferred Title Ribbon */}
              <div className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-700 via-rose-700 to-amber-800 text-amber-50 font-black text-base sm:text-xl tracking-widest shadow-lg border border-amber-300 my-2">
                ★ {titleInfo.title} ★
              </div>

              {/* Bottom Verification & Official Stamp */}
              <div className="w-full mt-8 pt-4 border-t border-amber-700/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="text-[11px] text-amber-900/80 space-y-1">
                  <p>
                    <span className="font-semibold">頒發日期：</span>
                    {today}
                  </p>
                  <p>
                    <span className="font-semibold">證書流水編號：</span>
                    <span className="font-mono text-amber-800">{certNumber}</span>
                  </p>
                  <p className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> 數位台灣觀光指南驗證核可
                  </p>
                </div>

                {/* Red Vermilion Verification Seal */}
                <div className="w-20 h-20 rounded-full border-4 border-rose-700 p-1 flex flex-col items-center justify-center text-rose-700 rotate-[-8deg] bg-rose-600/10 shadow-md">
                  <div className="w-full h-full rounded-full border border-dashed border-rose-600 flex flex-col items-center justify-center text-center p-1">
                    <span className="text-[7px] font-bold">台灣觀光認證</span>
                    <span className="text-[9px] font-black leading-tight">榮譽印信</span>
                    <span className="text-[6px] font-mono">FORMOSA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
