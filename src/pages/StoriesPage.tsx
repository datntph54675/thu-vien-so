import React, { useState } from 'react';
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { ArchiveDatabase, UserRole } from '../types/archive';
import {
  canUserAccessMediaFile,
  getRealCatalogRecords,
  getRecordRights,
} from '../services/archiveApi';
import { ResilientImage } from '../components/ResilientImage';

interface StoriesPageProps {
  db: ArchiveDatabase;
  currentRole?: UserRole;
  initialStoryId?: string;
  onOpenRecord: (recordId: string) => void;
}

export const StoriesPage: React.FC<StoriesPageProps> = ({
  db,
  currentRole = 'guest',
  initialStoryId,
  onOpenRecord,
}) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    initialStoryId || db.stories[0]?.id || ''
  );

  const activeRecords = getRealCatalogRecords(db);
  const activeStory =
    db.stories.find((s) => s.id === selectedStoryId) || db.stories[0];

  if (activeRecords.length === 0 || !activeStory) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="font-serif text-3xl text-[#1C1917]">Câu chuyện địa phương</h1>
        <p className="text-sm text-[#57534E]">
          Chưa có bài viết chuyên đề được liên kết với tư liệu xác thực trong cơ sở dữ liệu.
        </p>
      </div>
    );
  }

  const leadRec = activeRecords.find((r) => r.id === activeStory.leadRecordId);
  const leadFile = leadRec ? db.media_files.find((f) => f.recordId === leadRec.id) : undefined;
  const leadRights = leadRec ? getRecordRights(db, leadRec.id) : undefined;
  const canShowLead = leadRec ? canUserAccessMediaFile(db, leadRec, currentRole) : false;

  const linkedRecords = activeRecords.filter((r) => activeStory.recordIds.includes(r.id));
  const linkedSources = db.sources.filter((s) => activeStory.sourceIds.includes(s.id));

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#D6CEBE] pb-6 space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
          Biên soạn chuyên đề dựa trên bằng chứng tư liệu
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
          Câu chuyện lịch sử địa phương
        </h1>
        <p className="text-sm text-[#57534E] max-w-2xl">
          Mỗi bài viết đều dẫn chiếu trực tiếp tới mã bản ghi tư liệu, nguồn tham khảo gốc và giấy phép sử dụng. Không tự tạo sự kiện lịch sử khi thiếu chứng cứ.
        </p>
      </div>

      {/* Story Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {db.stories.map((st) => {
          const isCurrent = st.id === activeStory.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStoryId(st.id)}
              className={`text-left p-5 border transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                  : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EBE6DF]'
              }`}
            >
              <p
                className={`text-[11px] font-mono uppercase tracking-wider ${
                  isCurrent ? 'text-[#D4A76A]' : 'text-[#9A6B2F]'
                }`}
              >
                {st.theme}
              </p>
              <h2 className="font-serif text-lg font-semibold mt-1">{st.title}</h2>
            </button>
          );
        })}
      </div>

      {/* Editorial Asymmetric Reading Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start bg-[#FBF9F5] border border-[#D6CEBE] p-6 sm:p-10">
        <article className="lg:col-span-8 space-y-6">
          <header className="space-y-3 border-b border-[#E5DFD3] pb-6">
            <p className="text-xs font-mono uppercase tracking-wider text-[#9A6B2F]">
              {activeStory.theme} · {activeStory.publishedDate} · {activeStory.author}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] leading-tight">
              {activeStory.title}
            </h2>
            <p className="text-base text-[#57534E] font-serif italic">{activeStory.subtitle}</p>
          </header>

          <figure className="space-y-2">
            <div className="aspect-[16/9] overflow-hidden border border-[#D6CEBE] bg-[#EBE6DF]">
              <ResilientImage
                src={canShowLead ? leadFile?.thumbnailUrl || leadFile?.url : undefined}
                alt={leadRec?.title || activeStory.title}
                isRestricted={!canShowLead}
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="text-xs text-[#57534E] bg-[#F7F4EE] border border-[#E5DFD3] p-3 flex flex-wrap items-center justify-between gap-2">
              <span>
                {leadRec
                  ? `${leadRec.code}: ${leadRec.title} · Tác giả: ${leadRec.author} · ${leadRec.custodianOrgOrPerson} · ${leadRights?.licenseType || ''}`
                  : activeStory.verificationNote}
              </span>
              {leadRec?.originUrl && (
                <a
                  href={leadRec.originUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#9A6B2F] hover:underline font-medium shrink-0"
                >
                  XEM NGUỒN TƯ LIỆU GỐC <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </figcaption>
          </figure>

          <div className="space-y-5 max-w-prose text-[15px] sm:text-base text-[#292524] leading-[1.8]">
            {activeStory.bodyParagraphs.map((para, i) => (
              <p key={i} className={i === 0 ? 'drop-cap' : ''}>
                {para}
              </p>
            ))}
          </div>
        </article>

        {/* Margin Citations Sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:border-l lg:border-[#E5DFD3] lg:pl-8">
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#78350F] inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Bản ghi tư liệu dẫn chiếu ({linkedRecords.length})
            </h3>
            <div className="space-y-3">
              {linkedRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-[#F7F4EE] border border-[#E5DFD3] space-y-1.5"
                >
                  <p className="text-[11px] font-mono text-[#9A6B2F]">
                    {rec.code} · {rec.captureDateText}
                  </p>
                  <p className="text-sm font-medium text-[#1C1917]">{rec.title}</p>
                  <p className="text-[11px] text-[#57534E]">{rec.custodianOrgOrPerson}</p>
                  <button
                    type="button"
                    onClick={() => onOpenRecord(rec.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#5C3D2E] hover:text-[#1C1917] cursor-pointer"
                  >
                    Xem hồ sơ gốc <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#E5DFD3]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#78350F]">
              Nguồn tham khảo trích dẫn ({linkedSources.length})
            </h3>
            <div className="space-y-2.5">
              {linkedSources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 bg-[#F7F4EE] border border-[#E5DFD3] text-xs space-y-1"
                >
                  <p className="font-mono text-[11px] text-[#78716C]">{src.code}</p>
                  <p className="font-medium text-[#1C1917]">{src.title}</p>
                  <p className="text-[#57534E]">{src.authorOrPublisher}</p>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#9A6B2F] hover:underline"
                    >
                      Mở trang nguồn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
