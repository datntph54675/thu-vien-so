import React, { useState } from 'react';
import { Film, Volume2, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { ArchiveDatabase, UserRole } from '../types/archive';
import {
  canUserAccessMediaFile,
  getRealCatalogRecords,
  getRecordRights,
  getRecordSources,
  HISTORICAL_VERIFICATION_LABELS,
  RIGHTS_STATUS_LABELS,
} from '../services/archiveApi';
import { SourceCitationBlock } from '../components/SourceCitationBlock';

interface AudiovisualPageProps {
  db: ArchiveDatabase;
  currentRole: UserRole;
  onOpenRecord: (recordId: string) => void;
}

const SUBTYPES = [
  'Tất cả',
  'Video lịch sử',
  'Phóng sự',
  'Phỏng vấn nhân chứng',
  'Lời kể người dân',
  'Bản ghi âm',
  'Âm thanh môi trường',
  'Tư liệu sự kiện',
] as const;

export const AudiovisualPage: React.FC<AudiovisualPageProps> = ({
  db,
  currentRole,
  onOpenRecord,
}) => {
  const [subTypeFilter, setSubTypeFilter] = useState<string>('Tất cả');

  const activeRecords = getRealCatalogRecords(db).filter(
    (r) => r.mediaType === 'video' || r.mediaType === 'audio'
  );

  const filtered = activeRecords.filter((r) => {
    if (subTypeFilter === 'Tất cả') return true;
    return r.audiovisualSubType === subTypeFilter;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#D6CEBE] pb-6 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
          Khu vực di sản tư liệu nghe nhìn
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
          Tư liệu nghe nhìn: Video & Bản ghi âm
        </h1>
        <p className="text-sm text-[#57534E] max-w-2xl leading-relaxed">
          Lưu giữ video lịch sử, phóng sự, phỏng vấn nhân chứng và bản ghi âm. Hệ thống không sử dụng âm thanh hoặc trình chiếu giả lập: chỉ các tệp nghe nhìn có nguồn gốc thực tế, đã xác minh bản quyền (permitted) và quyền riêng tư mới được mở trình phát công khai.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {SUBTYPES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setSubTypeFilter(st)}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTypeFilter === st
                ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-12 text-center">
          <h2 className="font-serif text-2xl text-[#1C1917]">
            Chưa có tư liệu nghe nhìn phù hợp
          </h2>
          <p className="text-sm text-[#57534E] mt-2">
            Hãy chọn phân loại khác hoặc bổ sung tệp video/âm thanh đã được cấp phép trong trang Quản trị.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((rec) => {
            const file = db.media_files.find((f) => f.recordId === rec.id);
            const rights = getRecordRights(db, rec.id);
            const sources = getRecordSources(db, rec.id);
            const canPlay = canUserAccessMediaFile(db, rec, currentRole) && Boolean(file?.url);

            return (
              <article
                key={rec.id}
                className="bg-[#FBF9F5] border border-[#D6CEBE] flex flex-col justify-between"
              >
                <div>
                  {/* Real Player OR Honest Unverified Notice */}
                  {canPlay && file?.url ? (
                    <div className="bg-[#1C1917] text-[#FAF8F4] border-b border-[#D6CEBE] p-5 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#D4A76A]">
                        <span className="inline-flex items-center gap-1.5">
                          {rec.mediaType === 'video' ? (
                            <Film className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          {rec.audiovisualSubType || rec.mediaType.toUpperCase()}
                        </span>
                        <span>{file.resolutionOrQuality}</span>
                      </div>

                      {rec.mediaType === 'video' ? (
                        <video
                          controls
                          preload="metadata"
                          src={file.url}
                          className="w-full aspect-video bg-black border border-stone-700"
                        />
                      ) : (
                        <audio controls preload="metadata" src={file.url} className="w-full" />
                      )}

                      {file.transcriptOrAudioNote && (
                        <p className="text-xs text-stone-300 bg-stone-900 p-3 border border-stone-700 leading-relaxed">
                          {file.transcriptOrAudioNote}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#EBE6DF] border-b border-[#D6CEBE] p-8 text-center space-y-2.5">
                      {rights?.rights_status === 'permission_pending' ? (
                        <Lock className="w-7 h-7 text-[#78350F] mx-auto" strokeWidth={1.5} />
                      ) : (
                        <AlertCircle
                          className="w-7 h-7 text-[#78350F] mx-auto"
                          strokeWidth={1.5}
                        />
                      )}
                      <p className="text-xs font-mono uppercase tracking-wider text-[#78350F]">
                        Chưa có tư liệu xác minh ·{' '}
                        {rights
                          ? RIGHTS_STATUS_LABELS[rights.rights_status]
                          : 'Chưa xác minh quyền sử dụng'}
                      </p>
                      <p className="text-xs text-[#44403C] max-w-md mx-auto leading-relaxed">
                        {rec.mediaType === 'video'
                          ? 'Hiện chưa có tệp video lịch sử Hà Nội có giấy phép phát trực tuyến được xác nhận. Không sử dụng video dựng giả để thay thế.'
                          : 'Hiện chưa có tệp ghi âm phỏng vấn nhân chứng thực tế kèm phiếu đồng ý hợp lệ. Không sử dụng giọng đọc hoặc âm thanh tổng hợp.'}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="p-6 space-y-3">
                    <p className="text-xs text-[#57534E]">
                      {rec.code} · {rec.audiovisualSubType} · {rec.captureDateText} ·{' '}
                      {HISTORICAL_VERIFICATION_LABELS[rec.historical_verification]}
                    </p>
                    <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
                      {rec.title}
                    </h2>
                    <p className="text-sm text-[#44403C] leading-relaxed">{rec.description}</p>
                  </div>

                  <SourceCitationBlock
                    record={rec}
                    rights={rights}
                    sources={sources}
                    compact
                  />
                </div>

                <div className="px-6 py-3.5 bg-[#FBF9F5] border-t border-[#D6CEBE] flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenRecord(rec.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] hover:text-[#9A6B2F] cursor-pointer"
                  >
                    Xem hồ sơ tư liệu <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
