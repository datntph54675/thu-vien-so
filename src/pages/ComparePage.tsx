import React, { useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { ArchiveDatabase, UserRole } from '../types/archive';
import {
  canUserAccessMediaFile,
  getRealCatalogRecords,
  getRecordRights,
  getRecordSources,
} from '../services/archiveApi';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { SourceCitationBlock } from '../components/SourceCitationBlock';

interface ComparePageProps {
  db: ArchiveDatabase;
  currentRole: UserRole;
  initialComparisonId?: string;
  onOpenRecord: (recordId: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  db,
  currentRole,
  initialComparisonId,
  onOpenRecord,
}) => {
  const activeRecords = getRealCatalogRecords(db);
  const [selectedId, setSelectedId] = useState<string>(
    initialComparisonId || db.comparisons[0]?.id || ''
  );

  const selected =
    db.comparisons.find((c) => c.id === selectedId) || db.comparisons[0];

  const oldRec = activeRecords.find((r) => r.id === selected?.oldRecordId);
  const newRec = activeRecords.find((r) => r.id === selected?.newRecordId);
  const location = db.locations.find((l) => l.id === selected?.locationId);

  const oldRights = oldRec ? getRecordRights(db, oldRec.id) : undefined;
  const newRights = newRec ? getRecordRights(db, newRec.id) : undefined;
  const oldSources = oldRec ? getRecordSources(db, oldRec.id) : [];
  const newSources = newRec ? getRecordSources(db, newRec.id) : [];

  const getMediaUrl = (recordId?: string) => {
    if (!recordId) return undefined;
    const rec = activeRecords.find((r) => r.id === recordId);
    if (!rec || !canUserAccessMediaFile(db, rec, currentRole)) return undefined;
    return db.media_files.find((f) => f.recordId === recordId)?.url;
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#D6CEBE] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
            Công cụ đối chiếu không gian qua thời gian
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-1">
            So sánh ảnh xưa và nay
          </h1>
          <p className="text-sm text-[#57534E] mt-2 max-w-2xl leading-relaxed">
            Kéo thanh trượt để quan sát sự chuyển biến tại cùng một địa điểm. Mỗi bức ảnh trong cặp đối chiếu hiển thị độc lập tác giả, đơn vị lưu giữ, giấy phép và liên kết nguồn gốc.
          </p>
        </div>
      </div>

      {activeRecords.length === 0 || !selected || !oldRec ? (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-12 text-center space-y-2">
          <h2 className="font-serif text-2xl text-[#1C1917]">Chưa có dữ liệu so sánh</h2>
          <p className="text-sm text-[#57534E]">
            Kho tư liệu hiện chưa có cặp ảnh Xưa - Nay được ghép nối hợp lệ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left selector column */}
          <aside className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#57534E]">
              Danh sách cặp tư liệu đối chiếu ({db.comparisons.length})
            </h2>
            {db.comparisons.map((cmp) => {
              const loc = db.locations.find((l) => l.id === cmp.locationId);
              const cmpOld = activeRecords.find((r) => r.id === cmp.oldRecordId);
              const cmpNew = activeRecords.find((r) => r.id === cmp.newRecordId);
              const bothReady =
                Boolean(cmpOld && canUserAccessMediaFile(db, cmpOld, currentRole)) &&
                Boolean(cmpNew && canUserAccessMediaFile(db, cmpNew, currentRole));
              const isSelected = cmp.id === selected.id;
              return (
                <button
                  key={cmp.id}
                  type="button"
                  onClick={() => setSelectedId(cmp.id)}
                  className={`w-full text-left p-4 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                      : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EBE6DF]'
                  }`}
                >
                  <p
                    className={`text-[11px] font-mono uppercase tracking-wider ${
                      isSelected ? 'text-[#D4A76A]' : 'text-[#78350F]'
                    }`}
                  >
                    {loc?.name || 'Địa điểm'}
                  </p>
                  <p className="font-serif text-base font-medium mt-1">{cmp.title}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      isSelected ? 'text-stone-300' : 'text-[#57534E]'
                    }`}
                  >
                    {bothReady
                      ? 'Đủ ảnh Xưa & Nay được phép công bố'
                      : 'Một phía chưa có tư liệu xác nhận công bố'}
                  </p>
                </button>
              );
            })}

            <div className="bg-[#F1ECE2] border border-[#D6CEBE] p-4 text-xs text-[#44403C] flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-[#78350F] shrink-0 mt-0.5" />
              <p>
                Nguyên tắc bảo tàng: Không ghép hai ảnh khác địa điểm và không hiển thị ảnh chưa xác minh tệp hoặc chưa rõ bản quyền.
              </p>
            </div>
          </aside>

          {/* Main Slider Stage */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-5 sm:p-6 space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
                  {selected.title}
                </h2>
                <p className="text-xs text-[#57534E] mt-1">{selected.architecturalNotes}</p>
              </div>

              <BeforeAfterSlider
                oldImageUrl={getMediaUrl(oldRec.id)}
                newImageUrl={getMediaUrl(newRec?.id)}
                oldLabel={oldRec.title}
                newLabel={newRec?.title}
                oldYearText={oldRec.captureDateText}
                newYearText={newRec?.captureDateText}
                oldCitation={`${oldRec.author} · ${oldRec.custodianOrgOrPerson} · ${oldRights?.licenseType || 'Chưa xác định'}`}
                oldSourceUrl={oldRec.originUrl || oldSources.find((s) => s.url)?.url}
                newCitation={
                  newRec
                    ? `${newRec.author} · ${newRec.custodianOrgOrPerson} · ${newRights?.licenseType || 'Chưa xác định'}`
                    : undefined
                }
                newSourceUrl={newRec?.originUrl || newSources.find((s) => s.url)?.url}
                locationName={location?.name || 'Chưa xác định'}
                changeSummary={selected.changeSummary}
                isOldRestricted={!canUserAccessMediaFile(db, oldRec, currentRole)}
                isNewRestricted={
                  newRec ? !canUserAccessMediaFile(db, newRec, currentRole) : false
                }
              />

              {/* Direct dossier cards + individual provenance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E5DFD3]">
                <div className="bg-[#F7F4EE] border border-[#E5DFD3] flex flex-col justify-between">
                  <div className="p-4 space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#78350F]">
                      Hồ sơ ảnh xưa · {oldRec.code}
                    </p>
                    <p className="text-sm font-medium text-[#1C1917]">{oldRec.title}</p>
                    <p className="text-xs text-[#57534E]">Thời gian: {oldRec.captureDateText}</p>
                    <button
                      type="button"
                      onClick={() => onOpenRecord(oldRec.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F] hover:text-[#1C1917] cursor-pointer"
                    >
                      Xem hồ sơ đầy đủ <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <SourceCitationBlock
                    record={oldRec}
                    rights={oldRights}
                    sources={oldSources}
                    compact
                  />
                </div>

                <div className="bg-[#F7F4EE] border border-[#E5DFD3] flex flex-col justify-between">
                  {newRec ? (
                    <>
                      <div className="p-4 space-y-2">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-[#78350F]">
                          Hồ sơ ảnh hiện nay · {newRec.code}
                        </p>
                        <p className="text-sm font-medium text-[#1C1917]">{newRec.title}</p>
                        <p className="text-xs text-[#57534E]">
                          Thời gian: {newRec.captureDateText}
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenRecord(newRec.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F] hover:text-[#1C1917] cursor-pointer"
                        >
                          Xem hồ sơ đầy đủ <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <SourceCitationBlock
                        record={newRec}
                        rights={newRights}
                        sources={newSources}
                        compact
                      />
                    </>
                  ) : (
                    <div className="p-4 space-y-2">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-[#78350F]">
                        Ảnh đối chiếu hiện tại
                      </p>
                      <p className="text-xs text-[#57534E] leading-relaxed">
                        Chưa có dữ liệu đối chiếu tại địa điểm này.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
