import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, MoveHorizontal, AlertCircle, ExternalLink } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface BeforeAfterSliderProps {
  oldImageUrl?: string;
  newImageUrl?: string;
  oldLabel: string;
  newLabel?: string;
  oldYearText: string;
  newYearText?: string;
  oldCitation?: string;
  oldSourceUrl?: string;
  newCitation?: string;
  newSourceUrl?: string;
  locationName: string;
  changeSummary: string;
  isOldRestricted?: boolean;
  isNewRestricted?: boolean;
  allowFullscreen?: boolean;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  oldImageUrl,
  newImageUrl,
  oldLabel,
  newLabel,
  oldYearText,
  newYearText,
  oldCitation,
  oldSourceUrl,
  newCitation,
  newSourceUrl,
  locationName,
  changeSummary,
  isOldRestricted = false,
  isNewRestricted = false,
  allowFullscreen = true,
}) => {
  const [position, setPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const hasValidOld = Boolean(oldImageUrl) && !isOldRestricted;
  const hasValidNew = Boolean(newImageUrl) && !isNewRestricted;
  const canSlideCompare = hasValidOld && hasValidNew;

  const renderCanvas = (fullHeight: boolean) => {
    if (!canSlideCompare) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#D6CEBE] bg-[#FBF9F5]">
          <div className={`relative overflow-hidden ${fullHeight ? 'h-[62vh]' : 'aspect-[16/10]'}`}>
            <ResilientImage
              src={oldImageUrl}
              alt={oldLabel}
              isRestricted={isOldRestricted || !oldImageUrl}
              restrictionLabel="Chưa có hình ảnh được xác nhận quyền công bố"
              className="w-full h-full object-cover"
            />
            {hasValidOld && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-[#FAF8F4]">
                <p className="text-[11px] font-mono tracking-widest uppercase text-[#E7D8C1]">
                  Tư liệu xưa · {oldYearText}
                </p>
                <p className="text-sm font-medium mt-0.5">{oldLabel}</p>
              </div>
            )}
          </div>

          <div className={`relative overflow-hidden border-t lg:border-t-0 lg:border-l border-[#D6CEBE] ${fullHeight ? 'h-[62vh]' : 'aspect-[16/10]'}`}>
            {hasValidNew ? (
              <>
                <ResilientImage
                  src={newImageUrl}
                  alt={newLabel || 'Ảnh hiện nay'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-[#FAF8F4]">
                  <p className="text-[11px] font-mono tracking-widest uppercase text-[#E7D8C1]">
                    Tư liệu nay · {newYearText || 'Hiện tại'}
                  </p>
                  <p className="text-sm font-medium mt-0.5">{newLabel}</p>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#F1ECE2]">
                <AlertCircle className="w-8 h-8 text-[#9A6B2F] mb-3" strokeWidth={1.5} />
                <h4 className="font-serif text-xl font-medium text-[#1C1917]">
                  Chưa có tư liệu xác minh đầy đủ để đối chiếu
                </h4>
                <p className="text-sm text-[#57534E] mt-2 max-w-md leading-relaxed">
                  Địa điểm <span className="font-medium text-[#1C1917]">{locationName}</span> hiện chưa đủ cả ảnh xưa và ảnh nay được phép công bố. Hệ thống không tự ghép ảnh thay thế để bảo đảm tính xác thực.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative select-none overflow-hidden bg-[#1C1917] border border-[#D6CEBE] cursor-ew-resize touch-none ${
          fullHeight ? 'h-[72vh] w-full' : 'aspect-[16/9] w-full'
        }`}
      >
        {/* Base Layer: Hiện tại (After) */}
        <div className="absolute inset-0">
          <ResilientImage
            src={newImageUrl}
            alt={newLabel || 'Ảnh hiện nay'}
            isRestricted={isNewRestricted}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Clipped Layer: Xưa (Before) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <ResilientImage
            src={oldImageUrl}
            alt={oldLabel}
            isRestricted={isOldRestricted}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Contrast scrims and editorial labels */}
        <div className="pointer-events-none absolute top-4 left-4 bg-[#1C1917]/85 text-[#FAF8F4] px-3 py-1.5 border border-[#D6CEBE]/30">
          <span className="text-[11px] font-mono tracking-wider uppercase block text-[#E2C28E]">
            Xưa · {oldYearText}
          </span>
        </div>

        <div className="pointer-events-none absolute top-4 right-4 bg-[#1C1917]/85 text-[#FAF8F4] px-3 py-1.5 border border-[#D6CEBE]/30 text-right">
          <span className="text-[11px] font-mono tracking-wider uppercase block text-[#E2C28E]">
            Nay · {newYearText || 'Hiện tại'}
          </span>
        </div>

        {/* Divider Line & Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#FAF8F4] shadow-[0_0_12px_rgba(0,0,0,0.65)]"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#1C1917] border-2 border-[#FAF8F4] text-[#FAF8F4] flex items-center justify-center shadow-lg">
            <MoveHorizontal className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {renderCanvas(false)}

        {/* Source & License Caption strip for both Old & New images */}
        {(oldCitation || newCitation) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#F7F4EE] border border-[#E5DFD3] p-3.5">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#78350F]">
                Nguồn ảnh Xưa ({oldYearText})
              </p>
              <p className="text-[#44403C]">{oldCitation || 'Chưa xác định'}</p>
              {oldSourceUrl && (
                <a
                  href={oldSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#9A6B2F] hover:text-[#1C1917] font-medium"
                >
                  Xem nguồn gốc tư liệu <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="space-y-1 md:border-l md:border-[#E5DFD3] md:pl-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#78350F]">
                Nguồn ảnh Nay ({newYearText || 'Chưa xác định'})
              </p>
              <p className="text-[#44403C]">{newCitation || 'Chưa có tư liệu đối ứng'}</p>
              {newSourceUrl && (
                <a
                  href={newSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#9A6B2F] hover:text-[#1C1917] font-medium"
                >
                  Xem nguồn gốc tư liệu <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Accessible range control + metadata footer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-[#E5DFD3]">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-wider text-[#78350F]">
              Địa điểm: {locationName}
            </p>
            <p className="text-sm text-[#44403C] leading-relaxed">{changeSummary}</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {canSlideCompare && (
              <div className="flex items-center gap-2">
                <label htmlFor="slider-range" className="text-xs text-[#57534E] whitespace-nowrap">
                  Tỷ lệ Xưa/Nay
                </label>
                <input
                  id="slider-range"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(position)}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  className="w-28 accent-[#9A6B2F] cursor-pointer"
                />
                <span className="text-xs font-mono tabular-nums text-[#44403C] w-9 text-right">
                  {Math.round(position)}%
                </span>
              </div>
            )}
            {allowFullscreen && canSlideCompare && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EBE6DF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Toàn màn hình
              </button>
            )}
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/95 text-[#FAF8F4] flex flex-col p-4 md:p-8">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-700">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#D4A76A]">
                Đối chiếu toàn màn hình · {locationName}
              </p>
              <h3 className="font-serif text-xl font-medium text-[#FAF8F4] mt-0.5">
                {oldLabel} — {newLabel}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-stone-600 bg-stone-800 hover:bg-stone-700 text-[#FAF8F4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              Đóng toàn màn hình
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="w-full max-w-6xl">{renderCanvas(true)}</div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-700 text-xs text-stone-300">
            <p className="line-clamp-1">{changeSummary}</p>
            <div className="flex items-center gap-3 shrink-0">
              <span>Kéo thanh trượt:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(position)}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-40 accent-[#D4A76A]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
