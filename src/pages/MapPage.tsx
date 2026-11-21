import React, { useMemo, useState } from 'react';
import { MapPin, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { ArchiveDatabase, UserRole } from '../types/archive';
import {
  canUserAccessMediaFile,
  getRealCatalogRecords,
  getRecordRights,
} from '../services/archiveApi';
import { ResilientImage } from '../components/ResilientImage';

interface MapPageProps {
  db: ArchiveDatabase;
  currentRole: UserRole;
  onOpenRecord: (recordId: string) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ db, currentRole, onOpenRecord }) => {
  const [areaFilter, setAreaFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedLocId, setSelectedLocId] = useState<string>(db.locations[0]?.id || '');

  const activeRecords = getRealCatalogRecords(db);

  const areas = useMemo(
    () => Array.from(new Set(db.locations.map((l) => l.area))).filter(Boolean),
    [db.locations]
  );

  const filteredLocations = useMemo(() => {
    return db.locations.filter((loc) => {
      if (areaFilter && loc.area !== areaFilter) return false;
      if (categoryFilter) {
        const hasCat = activeRecords.some(
          (r) => r.locationId === loc.id && r.categoryId === categoryFilter
        );
        if (!hasCat) return false;
      }
      return true;
    });
  }, [db.locations, areaFilter, categoryFilter, activeRecords]);

  const selectedLoc =
    filteredLocations.find((l) => l.id === selectedLocId) || filteredLocations[0];

  const locRecords = useMemo(() => {
    if (!selectedLoc) return [];
    return activeRecords.filter((r) => {
      if (r.locationId !== selectedLoc.id) return false;
      if (categoryFilter && r.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [selectedLoc, activeRecords, categoryFilter]);

  const mapDocRecords = activeRecords.filter((r) => r.mediaType === 'map_document');

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#D6CEBE] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
            Không gian địa lý tư liệu · {db.localityConfig.localityName}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-1">
            Bản đồ di sản địa phương
          </h1>
          <p className="text-sm text-[#57534E] mt-2 max-w-2xl leading-relaxed">
            Các địa điểm di sản tại Hà Nội được gắn tọa độ địa lý WGS84 xác thực cùng liên kết tới bình đồ cổ (1885, 1889) và hồ sơ ảnh xưa – nay tương ứng.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Lọc theo khu vực"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả quận / khu vực</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo chủ đề"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả chủ đề</option>
            {db.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeRecords.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-12 text-center">
          <h2 className="font-serif text-2xl text-[#1C1917]">Chưa có dữ liệu địa điểm</h2>
          <p className="text-sm text-[#57534E] mt-2">
            Khi kho tư liệu có bản ghi được gắn địa danh, các điểm di sản sẽ tự động hiển thị trên bản đồ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive Spatial Canvas */}
          <div className="lg:col-span-7 bg-[#FBF9F5] border border-[#D6CEBE] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
              <span className="font-mono uppercase tracking-wider text-[#78350F]">
                Sơ đồ phân bố không gian nội đô Hà Nội (Hệ quy chiếu WGS84)
              </span>
              <span className="tabular-nums">{filteredLocations.length} địa điểm có tư liệu</span>
            </div>

            <div className="relative aspect-[4/3] w-full bg-[#EBE6DF] border border-[#D6CEBE] overflow-hidden">
              <svg
                viewBox="0 0 100 75"
                className="w-full h-full"
                aria-label="Sơ đồ phân bố các địa điểm di sản tại Hà Nội"
              >
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="#D6CEBE"
                      strokeWidth="0.25"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="75" fill="url(#grid)" />

                {/* Sông Hồng (phía Đông - Bắc) */}
                <path
                  d="M 65 0 Q 75 24, 86 45 T 96 75 L 100 75 L 100 0 Z"
                  fill="#D6D0C4"
                  stroke="#A89F8F"
                  strokeWidth="0.5"
                />

                {/* Hồ Hoàn Kiếm */}
                <ellipse
                  cx="56"
                  cy="41"
                  rx="4"
                  ry="7"
                  fill="#CFC8BA"
                  stroke="#9A6B2F"
                  strokeWidth="0.4"
                />

                {/* Trục tuyến giao thông lịch sử */}
                <path
                  d="M 18 35 L 82 32 M 40 12 L 48 64 M 50 18 L 62 56"
                  fill="none"
                  stroke="#C4B9A5"
                  strokeWidth="0.55"
                  strokeDasharray="1.5 1"
                />

                <text x="72" y="14" fontSize="2.7" fill="#57534E" fontFamily="serif" fontStyle="italic">
                  Sông Hồng
                </text>
                <text x="51" y="51" fontSize="2.3" fill="#5C3D2E" fontFamily="serif">
                  Hồ Hoàn Kiếm
                </text>
              </svg>

              {/* Clickable Location Pins */}
              {filteredLocations.map((loc, idx) => {
                const count = activeRecords.filter((r) => r.locationId === loc.id).length;
                const isSelected = selectedLoc?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocId(loc.id)}
                    style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`px-2 py-1 text-[11px] font-mono tabular-nums border transition-transform whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917] scale-105 shadow-md'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#9A6B2F] hover:bg-[#1C1917] hover:text-[#FAF8F4]'
                      }`}
                    >
                      0{idx + 1} · {loc.name.split(' ')[0]} ({count})
                    </span>
                    <MapPin
                      className={`w-5 h-5 mt-0.5 ${
                        isSelected ? 'text-[#9A6B2F]' : 'text-[#5C3D2E]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[#44403C] bg-[#F7F4EE] border border-[#E5DFD3] p-3.5">
              <CheckCircle2 className="w-4 h-4 text-[#14532D] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  Tọa độ GPS của {filteredLocations.filter((l) => l.coordinatesVerified).length} địa danh trên được đối chiếu thực tế theo di tích và bình đồ lịch sử Hà Nội. Bấm vào từng ghim để xem tọa độ chính xác và mở tư liệu gắn với địa điểm.
                </p>
                {mapDocRecords.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {mapDocRecords.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onOpenRecord(m.id)}
                        className="text-[#9A6B2F] hover:underline font-medium cursor-pointer"
                      >
                        Mở bản đồ/văn bản lưu trữ: {m.code} ({m.captureDateText})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Location Detail Panel */}
          <div className="lg:col-span-5 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-5">
            {selectedLoc ? (
              <>
                <div className="border-b border-[#E5DFD3] pb-4 space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#9A6B2F]">
                    {selectedLoc.area} ·{' '}
                    {selectedLoc.coordinatesVerified
                      ? 'Tọa độ đã xác minh'
                      : 'Tọa độ chờ xác minh'}
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
                    {selectedLoc.name}
                  </h2>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {selectedLoc.description}
                  </p>
                  <p className="text-xs text-[#78716C]">{selectedLoc.addressOrNote}</p>
                  {selectedLoc.lat && selectedLoc.lng && (
                    <p className="text-[11px] font-mono text-[#1C1917]">
                      Tọa độ WGS84: {selectedLoc.lat.toFixed(4)}° N, {selectedLoc.lng.toFixed(4)}° E
                    </p>
                  )}
                  {selectedLoc.sourceReference && (
                    <p className="text-[11px] text-[#57534E]">
                      Căn cứ định vị: {selectedLoc.sourceReference}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#57534E]">
                    Tư liệu gắn với địa điểm ({locRecords.length})
                  </h3>

                  {locRecords.length === 0 ? (
                    <p className="text-xs text-[#57534E]">
                      Không có bản ghi nào khớp bộ lọc tại địa điểm này.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                      {locRecords.map((rec) => {
                        const file = db.media_files.find((f) => f.recordId === rec.id);
                        const rights = getRecordRights(db, rec.id);
                        const canView = canUserAccessMediaFile(db, rec, currentRole);
                        return (
                          <div
                            key={rec.id}
                            className="flex gap-3 p-3 bg-[#F7F4EE] border border-[#E5DFD3] items-center"
                          >
                            <div className="w-20 h-16 shrink-0 overflow-hidden bg-[#EBE6DF]">
                              <ResilientImage
                                src={canView ? file?.thumbnailUrl || file?.url : undefined}
                                alt={rec.title}
                                isRestricted={!canView}
                                restrictionLabel="Chưa công bố"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-[11px] font-mono text-[#78350F]">
                                {rec.code} · {rec.captureDateText}
                              </p>
                              <p className="text-xs font-medium text-[#1C1917] truncate">
                                {rec.title}
                              </p>
                              <p className="text-[11px] text-[#78716C] truncate">
                                {rights?.licenseType || 'Chưa xác định quyền'}
                              </p>
                              <div className="flex items-center gap-3 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenRecord(rec.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9A6B2F] hover:text-[#1C1917] cursor-pointer"
                                >
                                  Mở hồ sơ <ArrowRight className="w-3 h-3" />
                                </button>
                                {rec.originUrl && (
                                  <a
                                    href={rec.originUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-[#57534E] hover:text-[#1C1917]"
                                  >
                                    Nguồn gốc <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#57534E]">Chọn một điểm trên bản đồ để xem tư liệu.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
