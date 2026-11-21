import React, { useMemo, useState } from 'react';
import {
  Search,
  Share2,
  RotateCcw,
  ArrowRight,
  Film,
  Volume2,
  Image as ImageIcon,
  Map as MapIcon,
} from 'lucide-react';
import {
  ArchiveDatabase,
  HistoricalVerificationStatus,
  MediaType,
  PublicationState,
  RightsStatus,
  UserRole,
} from '../types/archive';
import {
  canUserAccessMediaFile,
  getRealCatalogRecords,
  getRecordRights,
  getRecordSources,
  HISTORICAL_VERIFICATION_LABELS,
  PROVENANCE_TIER_LABELS,
  PUBLICATION_STATE_LABELS,
  RIGHTS_STATUS_LABELS,
} from '../services/archiveApi';
import { ResilientImage } from '../components/ResilientImage';
import { SourceCitationBlock } from '../components/SourceCitationBlock';

interface LibraryPageProps {
  db: ArchiveDatabase;
  currentRole: UserRole;
  initialCategoryId?: string;
  initialImageEra?: string;
  initialMediaType?: MediaType;
  onOpenRecord: (recordId: string) => void;
  onNotify: (msg: string) => void;
}

const PAGE_SIZE = 6;

const RIGHTS_STATUS_OPTIONS: RightsStatus[] = [
  'permitted',
  'research_only',
  'permission_pending',
  'unverified',
  'prohibited',
];

const HIST_VERIFICATION_OPTIONS: HistoricalVerificationStatus[] = [
  'verified',
  'partial',
  'unverified',
];

const PUBLICATION_OPTIONS: PublicationState[] = ['published', 'hidden', 'draft'];

export const LibraryPage: React.FC<LibraryPageProps> = ({
  db,
  currentRole,
  initialCategoryId = '',
  initialImageEra = '',
  initialMediaType = '' as MediaType | '',
  onOpenRecord,
  onNotify,
}) => {
  const [keyword, setKeyword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [mediaType, setMediaType] = useState<MediaType | ''>(initialMediaType);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [imageEra, setImageEra] = useState(initialImageEra);
  const [verificationFilter, setVerificationFilter] = useState<HistoricalVerificationStatus | ''>('');
  const [rightsFilter, setRightsFilter] = useState<RightsStatus | ''>('');
  const [pubFilter, setPubFilter] = useState<PublicationState | ''>('');
  const [sortBy, setSortBy] = useState<'newest' | 'year_asc' | 'year_desc' | 'title_asc'>('newest');
  const [page, setPage] = useState(1);

  const activeRecords = getRealCatalogRecords(db);

  const distinctPeriods = useMemo(() => {
    return Array.from(new Set(activeRecords.map((r) => r.historicalPeriod))).filter(Boolean);
  }, [activeRecords]);

  const distinctYears = useMemo(() => {
    return Array.from(
      new Set(
        activeRecords
          .map((r) => r.captureYear)
          .filter((y): y is number => typeof y === 'number')
      )
    ).sort((a, b) => a - b);
  }, [activeRecords]);

  const filteredRecords = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const list = activeRecords.filter((rec) => {
      const rights = getRecordRights(db, rec.id);
      if (q) {
        const hay = [
          rec.code,
          rec.title,
          rec.description,
          rec.author,
          rec.custodianOrgOrPerson,
          rec.specificPlace,
          rec.keywords.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (locationId && rec.locationId !== locationId) return false;
      if (periodFilter && rec.historicalPeriod !== periodFilter) return false;
      if (yearFilter && String(rec.captureYear ?? '') !== yearFilter) return false;
      if (mediaType && rec.mediaType !== mediaType) return false;
      if (categoryId && rec.categoryId !== categoryId) return false;
      if (imageEra && rec.imageEra !== imageEra) return false;
      if (verificationFilter && rec.historical_verification !== verificationFilter) return false;
      if (rightsFilter && rights?.rights_status !== rightsFilter) return false;
      if (pubFilter && rec.publication_state !== pubFilter) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'year_asc') return (a.captureYear ?? 9999) - (b.captureYear ?? 9999);
      if (sortBy === 'year_desc') return (b.captureYear ?? 0) - (a.captureYear ?? 0);
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title, 'vi');
      return a.code.localeCompare(b.code, 'vi');
    });
  }, [
    activeRecords,
    db,
    keyword,
    locationId,
    periodFilter,
    yearFilter,
    mediaType,
    categoryId,
    imageEra,
    verificationFilter,
    rightsFilter,
    pubFilter,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setKeyword('');
    setLocationId('');
    setPeriodFilter('');
    setYearFilter('');
    setMediaType('');
    setCategoryId('');
    setImageEra('');
    setVerificationFilter('');
    setRightsFilter('');
    setPubFilter('');
    setSortBy('newest');
    setPage(1);
  };

  const handleShare = (recordId: string, code: string) => {
    const shareUrl = `${window.location.origin}/?record=${encodeURIComponent(recordId)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    onNotify(`Đã sao chép liên kết chia sẻ hồ sơ ${code}`);
  };

  const mediaTypeLabel = (t: MediaType) => {
    if (t === 'image') return 'Ảnh tư liệu';
    if (t === 'video') return 'Video';
    if (t === 'audio') return 'Bản ghi âm';
    return 'Bản đồ & tài liệu';
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Title */}
      <div className="border-b border-[#D6CEBE] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
            Kho lưu trữ trung tâm · {db.localityConfig.localityName}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-1">
            Thư viện tư liệu số
          </h1>
          <p className="text-sm text-[#57534E] mt-2 max-w-2xl leading-relaxed">
            Tra cứu toàn bộ hồ sơ ảnh, bản đồ, tài liệu lưu trữ, video và bản ghi âm. Mọi bản ghi đều hiển thị rõ nguồn gốc, tác giả, giấy phép và tách biệt trạng thái xác minh lịch sử với quyền công bố.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-[#44403C]">
          Hiển thị {filteredRecords.length} / {activeRecords.length} bản ghi thực tế
        </div>
      </div>

      {/* Filter Panel */}
      <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo từ khóa, mã tư liệu, tên, tác giả, đơn vị lưu giữ..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917] focus:outline-none focus:border-[#9A6B2F]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Lọc theo địa danh"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-sm bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
            >
              <option value="">Tất cả địa danh</option>
              {db.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Lọc theo loại tư liệu"
              value={mediaType}
              onChange={(e) => {
                setMediaType(e.target.value as MediaType | '');
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-sm bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
            >
              <option value="">Tất cả loại hình</option>
              <option value="image">Ảnh tư liệu</option>
              <option value="map_document">Bản đồ & tài liệu</option>
              <option value="video">Video</option>
              <option value="audio">Bản ghi âm</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Sắp xếp"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2.5 text-sm bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
            >
              <option value="newest">Sắp xếp: Mã hồ sơ</option>
              <option value="year_asc">Năm tăng dần</option>
              <option value="year_desc">Năm giảm dần</option>
              <option value="title_asc">Tên A–Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <select
            aria-label="Lọc theo chủ đề"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả chủ đề</option>
            {db.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo giai đoạn lịch sử"
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả giai đoạn</option>
            {distinctPeriods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo năm"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả năm</option>
            {distinctYears.map((y) => (
              <option key={y} value={String(y)}>
                Năm {y}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo xác minh lịch sử"
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value as HistoricalVerificationStatus | '');
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Mọi mức độ xác minh</option>
            {HIST_VERIFICATION_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {HISTORICAL_VERIFICATION_LABELS[v]}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo quyền sử dụng"
            value={rightsFilter}
            onChange={(e) => {
              setRightsFilter(e.target.value as RightsStatus | '');
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Mọi trạng thái bản quyền</option>
            {RIGHTS_STATUS_OPTIONS.map((rs) => (
              <option key={rs} value={rs}>
                {RIGHTS_STATUS_LABELS[rs]}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo trạng thái xuất bản"
            value={pubFilter}
            onChange={(e) => {
              setPubFilter(e.target.value as PublicationState | '');
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Mọi trạng thái xuất bản</option>
            {PUBLICATION_OPTIONS.map((ps) => (
              <option key={ps} value={ps}>
                {PUBLICATION_STATE_LABELS[ps]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5DFD3] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#57534E]">Lọc nhanh thời kỳ ảnh:</span>
            {[
              { id: '', label: 'Tất cả' },
              { id: 'xua', label: 'Ảnh xưa' },
              { id: 'nay', label: 'Ảnh hiện nay' },
              { id: 'tu_lieu', label: 'Tài liệu & bản đồ' },
            ].map((tab) => (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => {
                  setImageEra(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 border transition-colors cursor-pointer ${
                  imageEra === tab.id
                    ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                    : 'bg-[#F7F4EE] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78350F] hover:text-[#1C1917] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại bộ lọc
          </button>
        </div>
      </section>

      {/* Results Grid or Empty State */}
      {paginated.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-12 text-center space-y-3">
          <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
            {activeRecords.length === 0
              ? 'Chưa có dữ liệu tư liệu trong kho lưu trữ'
              : 'Không tìm thấy bản ghi phù hợp với điều kiện lọc'}
          </h2>
          <p className="text-sm text-[#57534E] max-w-lg mx-auto">
            {activeRecords.length === 0
              ? 'Hệ thống đang ở trạng thái dữ liệu trống (0 bản ghi). Quản trị viên có thể bổ sung tư liệu mới hoặc tắt chế độ kiểm thử rỗng trong mục Quản trị.'
              : 'Hãy thử bỏ bớt điều kiện lọc hoặc tìm kiếm bằng từ khóa khác.'}
          </p>
          {activeRecords.length > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] cursor-pointer"
            >
              Xóa bộ lọc hiện tại
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((record) => {
            const file = db.media_files.find((f) => f.recordId === record.id);
            const loc = db.locations.find((l) => l.id === record.locationId);
            const rights = getRecordRights(db, record.id);
            const recordSources = getRecordSources(db, record.id);
            const canViewMedia = canUserAccessMediaFile(db, record, currentRole);

            return (
              <article
                key={record.id}
                className="bg-[#FBF9F5] border border-[#D6CEBE] flex flex-col justify-between"
              >
                <div>
                  {/* Media Frame */}
                  <div className="relative aspect-[4/3] bg-[#EBE6DF] overflow-hidden border-b border-[#E5DFD3]">
                    <ResilientImage
                      src={canViewMedia ? file?.thumbnailUrl || file?.url : undefined}
                      alt={record.title}
                      isRestricted={!canViewMedia}
                      restrictionLabel={
                        rights
                          ? RIGHTS_STATUS_LABELS[rights.rights_status]
                          : 'Chưa có hình ảnh được xác nhận quyền công bố'
                      }
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#1C1917]/85 text-[#FAF8F4] px-2.5 py-1 text-[11px] font-mono tracking-wider inline-flex items-center gap-1.5">
                      {record.mediaType === 'image' && <ImageIcon className="w-3 h-3" />}
                      {record.mediaType === 'map_document' && <MapIcon className="w-3 h-3" />}
                      {record.mediaType === 'video' && <Film className="w-3 h-3" />}
                      {record.mediaType === 'audio' && <Volume2 className="w-3 h-3" />}
                      {record.code}
                    </div>
                  </div>

                  {/* Clean Metadata */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-[#57534E]">
                      {mediaTypeLabel(record.mediaType)} · {record.captureDateText}
                    </p>

                    <h2 className="font-serif text-xl font-semibold text-[#1C1917] leading-snug">
                      {record.title}
                    </h2>

                    <p className="text-xs text-[#44403C] line-clamp-2 leading-relaxed">
                      {record.description}
                    </p>

                    <dl className="pt-3 border-t border-[#E5DFD3] space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-[#78716C] shrink-0">Địa điểm:</dt>
                        <dd className="text-[#1C1917] text-right truncate">
                          {loc?.name || record.specificPlace || 'Chưa xác định'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-[#78716C] shrink-0">Phân loại dữ liệu:</dt>
                        <dd className="text-[#1C1917] text-right truncate">
                          {PROVENANCE_TIER_LABELS[record.data_provenance_tier]}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-[#78716C] shrink-0">Xác minh lịch sử:</dt>
                        <dd className="text-[#1C1917] text-right">
                          {HISTORICAL_VERIFICATION_LABELS[record.historical_verification]}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-[#78716C] shrink-0">Trạng thái xuất bản:</dt>
                        <dd className="text-[#1C1917] text-right">
                          {PUBLICATION_STATE_LABELS[record.publication_state]}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Mandatory Compact Source & License Block */}
                  <SourceCitationBlock
                    record={record}
                    rights={rights}
                    sources={recordSources}
                    compact
                  />
                </div>

                <div className="px-5 py-3.5 bg-[#FBF9F5] border-t border-[#D6CEBE] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenRecord(record.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] hover:text-[#9A6B2F] cursor-pointer"
                  >
                    Xem hồ sơ chi tiết
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(record.id, record.code)}
                    className="inline-flex items-center gap-1 text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Chia sẻ
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#D6CEBE] pt-6 text-xs">
          <span className="text-[#57534E] tabular-nums">
            Trang {safePage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-2 border border-[#D6CEBE] bg-[#FBF9F5] disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-2 border border-[#D6CEBE] bg-[#FBF9F5] disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
