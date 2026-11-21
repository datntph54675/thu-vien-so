import React from 'react';
import { ArrowLeft, ArrowRight, Share2, SlidersHorizontal, ExternalLink, Lock } from 'lucide-react';
import { ArchiveDatabase, UserRole } from '../types/archive';
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

interface RecordDetailPageProps {
  db: ArchiveDatabase;
  recordId: string;
  currentRole: UserRole;
  onBack: () => void;
  onOpenRecord: (recordId: string) => void;
  onOpenCompare: (comparisonId: string) => void;
  onNotify: (msg: string) => void;
}

export const RecordDetailPage: React.FC<RecordDetailPageProps> = ({
  db,
  recordId,
  currentRole,
  onBack,
  onOpenRecord,
  onOpenCompare,
  onNotify,
}) => {
  const record = db.media_records.find((r) => r.id === recordId);

  if (!record) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl text-[#1C1917]">Không tìm thấy hồ sơ tư liệu</h1>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] cursor-pointer"
        >
          Quay lại thư viện
        </button>
      </div>
    );
  }

  const file = db.media_files.find((f) => f.recordId === record.id);
  const location = db.locations.find((l) => l.id === record.locationId);
  const category = db.categories.find((c) => c.id === record.categoryId);
  const rights = getRecordRights(db, record.id);
  const recordSourceLinks = db.record_sources.filter((rs) => rs.recordId === record.id);
  const linkedSources = getRecordSources(db, record.id);
  const reviewLogs = db.review_logs.filter((l) => l.recordId === record.id);
  const comparisonPair = db.comparisons.find(
    (c) => c.oldRecordId === record.id || c.newRecordId === record.id
  );

  // Related records: same location or same category or paired in comparison
  const relatedRecords = getRealCatalogRecords(db)
    .filter(
      (r) =>
        r.id !== record.id &&
        (r.locationId === record.locationId ||
          r.categoryId === record.categoryId ||
          r.id === comparisonPair?.oldRecordId ||
          r.id === comparisonPair?.newRecordId)
    )
    .slice(0, 4);

  const canViewMedia = canUserAccessMediaFile(db, record, currentRole);
  const val = (v?: string, fallback = 'Chưa xác định') => (v && v.trim() ? v : fallback);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?record=${encodeURIComponent(record.id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    onNotify(`Đã sao chép liên kết hồ sơ ${record.code}`);
  };

  const mediaTypeText = (t: typeof record.mediaType) => {
    if (t === 'image') return 'Hình ảnh tư liệu';
    if (t === 'map_document') return 'Bản đồ & Tài liệu lưu trữ';
    if (t === 'video') return 'Video tư liệu';
    return 'Bản ghi âm';
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D6CEBE] pb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5C3D2E] hover:text-[#1C1917] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại thư viện tư liệu
        </button>

        <div className="flex items-center gap-3">
          {comparisonPair && (
            <button
              type="button"
              onClick={() => onOpenCompare(comparisonPair.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#9A6B2F] text-[#78350F] bg-[#FBF9F5] hover:bg-[#EBE6DF] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Mở đối chiếu Xưa - Nay
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EBE6DF] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Chia sẻ liên kết
          </button>
        </div>
      </div>

      {/* Main Stage: Media + Immediate Provenance / Source & Rights Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#EBE6DF] border border-[#D6CEBE]">
            <div className="aspect-[16/11] relative overflow-hidden">
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
            </div>
            <div className="p-4 bg-[#FBF9F5] border-t border-[#D6CEBE] flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
              <span>
                Loại: {mediaTypeText(record.mediaType)} ·{' '}
                {file?.resolutionOrQuality || 'Chưa có thông số tệp'}
              </span>
              {!canViewMedia && (
                <span className="inline-flex items-center gap-1 text-[#9A3412] font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Tệp gốc không hiển thị công khai theo quy định quyền công bố
                </span>
              )}
            </div>
          </div>

          {/* Dedicated Prominent Nguồn và bản quyền section */}
          <SourceCitationBlock record={record} rights={rights} sources={linkedSources} />
        </div>

        {/* Right Dossier Header & 1. Thông tin cơ bản + 3 Separated Statuses */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
              {record.code} · {PROVENANCE_TIER_LABELS[record.data_provenance_tier]}
            </p>
            <h1 className="font-serif text-3xl font-semibold text-[#1C1917] leading-tight">
              {record.title}
            </h1>
            <p className="text-sm text-[#44403C] leading-relaxed pt-2">{record.description}</p>
          </div>

          {/* Separated 3-status governance block */}
          <div className="bg-[#F1ECE2] border border-[#D6CEBE] p-4 space-y-2.5 text-xs">
            <p className="font-mono uppercase tracking-wider text-[11px] text-[#78350F]">
              Trạng thái kiểm định tách biệt
            </p>
            <div className="flex justify-between gap-2">
              <span className="text-[#57534E]">Quyền sử dụng:</span>
              <span
                className={`font-semibold text-right ${
                  rights?.rights_status === 'permitted' ? 'text-[#14532D]' : 'text-[#9A3412]'
                }`}
              >
                {rights
                  ? RIGHTS_STATUS_LABELS[rights.rights_status]
                  : 'Chưa xác minh quyền sử dụng'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#57534E]">Xác minh lịch sử:</span>
              <span className="font-medium text-[#1C1917] text-right">
                {HISTORICAL_VERIFICATION_LABELS[record.historical_verification]}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#57534E]">Trạng thái xuất bản:</span>
              <span className="font-medium text-[#1C1917] text-right">
                {PUBLICATION_STATE_LABELS[record.publication_state]}
              </span>
            </div>
          </div>

          <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-[#1C1917] border-b border-[#E5DFD3] pb-2">
              1. Thông tin cơ bản (15 trường chuẩn)
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Mã tư liệu</dt>
                <dd className="col-span-2 font-mono text-[#1C1917]">{record.code}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Địa phương</dt>
                <dd className="col-span-2 text-[#1C1917]">{val(record.localityName)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Địa danh cụ thể</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {val(record.specificPlace || location?.name)}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Tọa độ / Vị trí</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {location?.addressOrNote || 'Chưa xác định'}
                  {location?.coordinatesVerified && location.lat && location.lng
                    ? ` (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
                    : ''}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Thời gian / Niên đại</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {val(record.captureDateText)} · {val(record.historicalPeriod)}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Tác giả / Người chụp</dt>
                <dd className="col-span-2 text-[#1C1917]">{val(record.author)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Đơn vị lưu giữ gốc</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {val(record.custodianOrgOrPerson, 'Chưa được nguồn cung cấp')}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Tình trạng bản tư liệu</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {val(record.materialFormatState || file?.materialFormatState)}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Chủ đề / Loại hình</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {category?.name || 'Khác'} · {mediaTypeText(record.mediaType)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* 3 Structured Dossier Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 2. Thông tin lịch sử */}
        <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[#1C1917] border-b border-[#E5DFD3] pb-2">
            2. Thông tin lịch sử
          </h2>
          <dl className="space-y-3 text-xs leading-relaxed">
            <div>
              <dt className="text-[#78716C] font-medium">Bối cảnh lịch sử</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.historicalContext)}</dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Sự kiện liên quan</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.relatedEvent)}</dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Mô tả kiến trúc / không gian</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.architectureOrSpaceNote)}</dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Những thay đổi được ghi nhận</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.observedChanges)}</dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Ý nghĩa đối với lịch sử địa phương</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.localSignificance)}</dd>
            </div>
          </dl>
        </section>

        {/* 3. Thông tin nguồn gốc & Nguồn liên kết */}
        <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[#1C1917] border-b border-[#E5DFD3] pb-2">
            3. Xuất xứ & Tài liệu dẫn chiếu
          </h2>
          <dl className="space-y-3 text-xs leading-relaxed">
            <div>
              <dt className="text-[#78716C] font-medium">Bộ sưu tập</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.collectionName)}</dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Đường dẫn gốc trực tiếp</dt>
              <dd className="text-[#1C1917] mt-0.5 break-all">
                {record.originUrl ? (
                  <a
                    href={record.originUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#9A6B2F] hover:underline"
                  >
                    {record.originUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  'Chưa được nguồn cung cấp'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Tài liệu đối chiếu</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(record.referenceDocumentNote)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <dt className="text-[#78716C] font-medium">Ngày truy cập nguồn</dt>
                <dd className="text-[#1C1917] mt-0.5 font-mono">
                  {val(record.accessedDate, 'Chưa ghi nhận')}
                </dd>
              </div>
              <div>
                <dt className="text-[#78716C] font-medium">Người biên mục</dt>
                <dd className="text-[#1C1917] mt-0.5">{val(record.enteredBy)}</dd>
              </div>
            </div>
            <div className="pt-2 border-t border-[#E5DFD3]">
              <dt className="text-[#78716C] font-medium mb-1">
                Nguồn tham khảo liên kết ({linkedSources.length})
              </dt>
              <dd className="space-y-2">
                {linkedSources.length === 0 ? (
                  <span className="text-[#78716C]">Chưa liên kết nguồn</span>
                ) : (
                  linkedSources.map((src) => {
                    const linkMeta = recordSourceLinks.find((rs) => rs.sourceId === src.id);
                    const href = linkMeta?.directItemUrl || src.url;
                    return (
                      <div key={src.id} className="p-2.5 bg-[#F7F4EE] border border-[#E5DFD3] space-y-1">
                        <p className="font-mono text-[11px] text-[#78350F]">{src.code}</p>
                        <p className="text-[#1C1917] font-medium">{src.title}</p>
                        <p className="text-[#57534E]">{src.authorOrPublisher}</p>
                        {linkMeta?.citationNote && (
                          <p className="text-[11px] text-[#78716C]">{linkMeta.citationNote}</p>
                        )}
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#9A6B2F] hover:underline"
                          >
                            Mở nguồn tham khảo <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* 4. Bằng chứng bản quyền & Nhật ký kiểm duyệt */}
        <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[#1C1917] border-b border-[#E5DFD3] pb-2">
            4. Kiểm định & Nhật ký thao tác
          </h2>
          <dl className="space-y-3 text-xs leading-relaxed">
            <div>
              <dt className="text-[#78716C] font-medium">Chủ sở hữu quyền</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(rights?.rightsOwner)}</dd>
            </div>
            <div>
              <dt className="text-[#78716C] font-medium">Bằng chứng pháp lý / Căn cứ</dt>
              <dd className="text-[#1C1917] mt-0.5">{val(rights?.permissionEvidence)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <dt className="text-[#78716C] font-medium">Ngày xác minh</dt>
                <dd className="text-[#1C1917] mt-0.5 font-mono">{val(rights?.verifiedAt)}</dd>
              </div>
              <div>
                <dt className="text-[#78716C] font-medium">Người xác minh</dt>
                <dd className="text-[#1C1917] mt-0.5">{val(rights?.verifiedBy)}</dd>
              </div>
            </div>
            <div className="pt-2 border-t border-[#E5DFD3]">
              <dt className="text-[#78716C] font-medium mb-1">Nhật ký kiểm duyệt</dt>
              {reviewLogs.length === 0 ? (
                <dd className="text-[#78716C]">Chưa có thao tác thay đổi bổ sung sau khi nhập kho.</dd>
              ) : (
                <dd className="space-y-1.5">
                  {reviewLogs.map((log) => (
                    <div key={log.id} className="p-2 bg-[#F7F4EE] border border-[#E5DFD3]">
                      <p className="font-medium text-[#1C1917]">
                        {log.action} · {log.stage}
                      </p>
                      <p className="text-[#57534E]">{log.reasonNote}</p>
                      <p className="text-[11px] text-[#78716C] font-mono mt-0.5">
                        {log.actorName} · {log.created_at.slice(0, 10)}
                      </p>
                    </div>
                  ))}
                </dd>
              )}
            </div>
          </dl>
        </section>
      </div>

      {/* 10. Các tư liệu liên quan */}
      {relatedRecords.length > 0 && (
        <section className="border-t border-[#D6CEBE] pt-8 space-y-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#9A6B2F]">
              Liên kết cùng địa danh hoặc chủ đề
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#1C1917] mt-1">
              Các tư liệu liên quan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedRecords.map((rel) => {
              const relFile = db.media_files.find((f) => f.recordId === rel.id);
              const relRights = getRecordRights(db, rel.id);
              const canShowRel = canUserAccessMediaFile(db, rel, currentRole);
              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onOpenRecord(rel.id)}
                  className="text-left bg-[#FBF9F5] border border-[#D6CEBE] hover:border-[#9A6B2F] transition-colors flex flex-col cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-[#EBE6DF] overflow-hidden border-b border-[#E5DFD3]">
                    <ResilientImage
                      src={canShowRel ? relFile?.thumbnailUrl || relFile?.url : undefined}
                      alt={rel.title}
                      isRestricted={!canShowRel}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <p className="text-[11px] font-mono text-[#78350F]">
                      {rel.code} · {rel.captureDateText}
                    </p>
                    <p className="font-serif text-base font-semibold text-[#1C1917] line-clamp-2">
                      {rel.title}
                    </p>
                    <p className="text-[11px] text-[#57534E] line-clamp-1">
                      {relRights?.licenseType || 'Chưa xác định'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F] pt-1">
                      Mở hồ sơ <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
