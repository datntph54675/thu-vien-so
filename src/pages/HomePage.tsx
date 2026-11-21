import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  ExternalLink,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { ArchiveDatabase, ArchiveStatistics, MediaType } from '../types/archive';
import {
  getRealCatalogRecords,
  getRecordRights,
  getRecordSources,
  isRecordPubliclyDisplayable,
} from '../services/archiveApi';
import { ResilientImage } from '../components/ResilientImage';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { PageRoute } from '../components/Header';

interface HomePageProps {
  db: ArchiveDatabase;
  stats: ArchiveStatistics;
  onNavigate: (page: PageRoute) => void;
  onOpenLibraryWithFilter: (opts: {
    categoryId?: string;
    imageEra?: string;
    mediaType?: MediaType;
  }) => void;
  onOpenRecord: (recordId: string) => void;
  onOpenStory: (storyId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  db,
  stats,
  onNavigate,
  onOpenLibraryWithFilter,
  onOpenRecord,
  onOpenStory,
}) => {
  const realRecords = getRealCatalogRecords(db);
  const [featuredCmpIndex, setFeaturedCmpIndex] = useState(0);

  const pairedComparisons = db.comparisons.filter((c) => {
    if (!c.newRecordId) return false;
    const oldR = realRecords.find((r) => r.id === c.oldRecordId);
    const newR = realRecords.find((r) => r.id === c.newRecordId);
    return (
      Boolean(oldR && isRecordPubliclyDisplayable(db, oldR)) &&
      Boolean(newR && isRecordPubliclyDisplayable(db, newR))
    );
  });
  const currentCmp = pairedComparisons[featuredCmpIndex] ?? pairedComparisons[0];

  const getMediaUrl = (recordId?: string) => {
    if (!recordId) return undefined;
    const rec = realRecords.find((r) => r.id === recordId);
    if (!rec || !isRecordPubliclyDisplayable(db, rec)) return undefined;
    return db.media_files.find((f) => f.recordId === recordId)?.url;
  };

  const getRecord = (recordId?: string) => {
    if (!recordId) return undefined;
    return realRecords.find((r) => r.id === recordId);
  };

  const buildCitationText = (recordId?: string) => {
    const rec = getRecord(recordId);
    if (!rec) return undefined;
    const rights = getRecordRights(db, rec.id);
    return `${rec.author} · ${rec.custodianOrgOrPerson} · ${rights?.licenseType || 'Chưa xác định'}`;
  };

  const getPrimarySourceUrl = (recordId?: string) => {
    const rec = getRecord(recordId);
    if (!rec) return undefined;
    const sources = getRecordSources(db, rec.id);
    return rec.originUrl || sources.find((s) => s.url)?.url;
  };

  const getCollectionCount = (
    categoryFilter?: string,
    eraFilter?: string,
    mediaTypeFilter?: MediaType
  ) => {
    if (realRecords.length === 0) return 0;
    return realRecords.filter((r) => {
      if (categoryFilter && r.categoryId === categoryFilter) return true;
      if (eraFilter && r.imageEra === eraFilter) return true;
      if (mediaTypeFilter && r.mediaType === mediaTypeFilter) return true;
      return false;
    }).length;
  };

  // Hero showcase: Verified Hà Nội pair (Cột cờ Hà Nội 1905 vs 2017, fallback Dong Xuan 1926 vs 2007)
  const heroOldRec = getRecord('rec-004') || getRecord('rec-006');
  const heroNewRec = getRecord('rec-005') || getRecord('rec-007');
  const heroOldRights = heroOldRec ? getRecordRights(db, heroOldRec.id) : undefined;
  const heroNewRights = heroNewRec ? getRecordRights(db, heroNewRec.id) : undefined;

  const oldRec = getRecord(currentCmp?.oldRecordId);
  const newRec = getRecord(currentCmp?.newRecordId);
  const cmpLocation = db.locations.find((l) => l.id === currentCmp?.locationId);

  const leadStory = db.stories[0];
  const leadStoryRec = getRecord(leadStory?.leadRecordId);
  const leadStoryRights = leadStoryRec ? getRecordRights(db, leadStoryRec.id) : undefined;

  return (
    <div>
      {/* 1. HERO BANNER */}
      <section className="bg-[#1C1917] text-[#FAF8F4] border-b border-stone-800">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Editorial Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#D4A76A]">
                  Di sản tư liệu bảo tàng số · Di sản tư liệu nghe nhìn
                </p>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold leading-[1.12] tracking-tight text-[#FAF8F4]">
                  {db.localityConfig.projectTitle}
                </h1>

                <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
                  {db.localityConfig.curatorialStatement}
                </p>

                <div className="pt-2 border-t border-stone-800 text-xs sm:text-sm text-stone-300 space-y-1">
                  <p>
                    <span className="text-stone-400">Địa phương nghiên cứu: </span>
                    <span className="font-medium text-[#FAF8F4]">
                      {db.localityConfig.localityName}
                    </span>
                  </p>
                  <p className="text-xs text-stone-400">
                    {db.localityConfig.administrativeRegion}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#9A6B2F] text-[#FAF8F4] hover:bg-[#B47B33] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Khám phá tư liệu
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('compare')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-stone-600 text-[#FAF8F4] hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  So sánh xưa và nay
                </button>
              </div>
            </div>

            {/* Dual Visual Showcase Column (Verified Real Archive Pair) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <figure className="flex flex-col border border-stone-700 bg-stone-900 overflow-hidden">
                <div className="relative flex-1 min-h-[240px]">
                  <ResilientImage
                    src={heroOldRec ? getMediaUrl(heroOldRec.id) : undefined}
                    alt={heroOldRec?.title || 'Ảnh tư liệu xưa'}
                    isRestricted={heroOldRec ? !isRecordPubliclyDisplayable(db, heroOldRec) : true}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-3.5 bg-[#151210] border-t border-stone-800 text-xs space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4A76A] block">
                    Tư liệu Xưa · {heroOldRec?.captureDateText || 'Chưa xác định'}
                  </span>
                  <span className="text-stone-100 font-medium block line-clamp-1">
                    {heroOldRec?.title || 'Chưa có tư liệu xác minh'}
                  </span>
                  <span className="text-[11px] text-stone-400 block line-clamp-1">
                    {heroOldRec?.author} · {heroOldRights?.licenseType}
                  </span>
                  {heroOldRec?.originUrl && (
                    <a
                      href={heroOldRec.originUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#D4A76A] hover:underline pt-0.5"
                    >
                      Xem nguồn gốc <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </figcaption>
              </figure>

              <figure className="flex flex-col border border-stone-700 bg-stone-900 overflow-hidden">
                <div className="relative flex-1 min-h-[240px]">
                  <ResilientImage
                    src={heroNewRec ? getMediaUrl(heroNewRec.id) : undefined}
                    alt={heroNewRec?.title || 'Ảnh hiện nay'}
                    isRestricted={heroNewRec ? !isRecordPubliclyDisplayable(db, heroNewRec) : true}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-3.5 bg-[#151210] border-t border-stone-800 text-xs space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4A76A] block">
                    Hiện trạng Nay · {heroNewRec?.captureDateText || 'Chưa xác định'}
                  </span>
                  <span className="text-stone-100 font-medium block line-clamp-1">
                    {heroNewRec?.title || 'Chưa có tư liệu xác minh'}
                  </span>
                  <span className="text-[11px] text-stone-400 block line-clamp-1">
                    {heroNewRec?.author} · {heroNewRights?.licenseType}
                  </span>
                  {heroNewRec?.originUrl && (
                    <a
                      href={heroNewRec.originUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#D4A76A] hover:underline pt-0.5"
                    >
                      Xem nguồn gốc <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THỐNG KÊ BẢO TÀNG (TÍNH TRỰC TIẾP TỪ DỮ LIỆU THỰC TẾ) */}
      <section className="bg-[#FBF9F5] border-b border-[#D6CEBE]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
                Thống kê trực tiếp từ danh mục tư liệu thực tế
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1">
                Hiện trạng kho lưu trữ tư liệu
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="text-xs font-medium text-[#5C3D2E] hover:text-[#1C1917] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Xem báo cáo thống kê chi tiết & xuất CSV
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 border border-[#D6CEBE] bg-[#F7F4EE]">
            {[
              { label: 'Tổng số hồ sơ', value: stats.totalRecords },
              { label: 'Ảnh đã xác minh', value: stats.verifiedImageCount },
              { label: 'Video', value: stats.videoCount },
              { label: 'Bản ghi âm', value: stats.audioCount },
              { label: 'Bản đồ & tài liệu', value: stats.mapDocumentCount },
              { label: 'Địa phương', value: stats.localitiesCount },
              { label: 'Nguồn tham khảo', value: stats.totalSources },
              { label: 'Được phép công bố', value: stats.permittedCount },
              { label: 'Đang chờ xác minh', value: stats.pendingVerificationCount },
            ].map((item, idx) => (
              <div
                key={item.label}
                className={`p-4 ${
                  idx > 0 ? 'border-t sm:border-t-0 border-[#D6CEBE] sm:border-l' : ''
                }`}
              >
                <p className="text-2xl font-serif font-semibold tabular-nums text-[#1C1917]">
                  {item.value}
                </p>
                <p className="text-[11px] text-[#57534E] mt-1.5 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#57534E] mt-3">
            Minh bạch dữ liệu: Số liệu chỉ thống kê hồ sơ tư liệu thực tế (không cộng bản nháp AI chưa kiểm duyệt hay dữ liệu minh họa). Trong {stats.totalRecords} hồ sơ hiện có, {stats.permittedCount} hồ sơ đã xác nhận đủ điều kiện công bố công khai và {stats.pendingVerificationCount} hồ sơ đang chờ xác minh hoặc cấp phép.
          </p>
        </div>
      </section>

      {/* 3. BỘ SƯU TẬP NỔI BẬT */}
      <section className="bg-[#F7F4EE] border-b border-[#D6CEBE]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
                Phân nhóm lưu trữ chuyên đề
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#1C1917] mt-1">
                Bộ sưu tập nổi bật
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C3D2E] hover:text-[#1C1917] cursor-pointer"
            >
              Mở toàn bộ thư viện tư liệu
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {db.collections.map((col) => {
              const count = getCollectionCount(
                col.categoryFilter,
                col.eraFilter,
                col.mediaTypeFilter
              );
              const coverRec = getRecord(col.coverRecordId);
              const coverUrl = coverRec ? getMediaUrl(coverRec.id) : undefined;
              const coverRights = coverRec ? getRecordRights(db, coverRec.id) : undefined;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() =>
                    onOpenLibraryWithFilter({
                      categoryId: col.categoryFilter,
                      imageEra: col.eraFilter,
                      mediaType: col.mediaTypeFilter,
                    })
                  }
                  className="group text-left bg-[#FBF9F5] border border-[#D6CEBE] hover:border-[#9A6B2F] transition-colors flex flex-col overflow-hidden cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#EBE6DF]">
                    <ResilientImage
                      src={coverUrl}
                      alt={coverRec?.title || col.title}
                      isRestricted={!coverUrl}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-xs text-[#57534E]">
                        {col.subtitle} ·{' '}
                        <span className="tabular-nums font-medium text-[#78350F]">
                          {count} bản ghi
                        </span>
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#1C1917] mt-1 group-hover:text-[#5C3D2E]">
                        {col.title}
                      </h3>
                      <p className="text-xs text-[#57534E] mt-2 leading-relaxed line-clamp-2">
                        {col.description}
                      </p>
                      {coverRec && (
                        <p className="text-[11px] text-[#78716C] mt-2 line-clamp-1">
                          Ảnh bìa: {coverRec.author} ({coverRights?.licenseType})
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F]">
                      Xem tư liệu <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SO SÁNH NỔI BẬT (XƯA & NAY) */}
      <section className="bg-[#FBF9F5] border-b border-[#D6CEBE]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
                Đối chiếu không gian cùng địa điểm
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#1C1917] mt-1">
                So sánh nổi bật: Xưa và Nay
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pairedComparisons.map((cmp, idx) => (
                <button
                  key={cmp.id}
                  type="button"
                  onClick={() => setFeaturedCmpIndex(idx)}
                  className={`px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    featuredCmpIndex === idx
                      ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                      : 'bg-[#F7F4EE] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
                  }`}
                >
                  Cặp đối chiếu 0{idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onNavigate('compare')}
                className="px-3.5 py-2 text-xs font-medium text-[#78350F] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Mở công cụ so sánh đầy đủ
              </button>
            </div>
          </div>

          {currentCmp && oldRec ? (
            <BeforeAfterSlider
              oldImageUrl={getMediaUrl(oldRec.id)}
              newImageUrl={getMediaUrl(newRec?.id)}
              oldLabel={oldRec.title}
              newLabel={newRec?.title}
              oldYearText={oldRec.captureDateText}
              newYearText={newRec?.captureDateText}
              oldCitation={buildCitationText(oldRec.id)}
              oldSourceUrl={getPrimarySourceUrl(oldRec.id)}
              newCitation={buildCitationText(newRec?.id)}
              newSourceUrl={getPrimarySourceUrl(newRec?.id)}
              locationName={cmpLocation?.name || 'Chưa xác định'}
              changeSummary={currentCmp.changeSummary}
              isOldRestricted={!isRecordPubliclyDisplayable(db, oldRec)}
              isNewRestricted={newRec ? !isRecordPubliclyDisplayable(db, newRec) : false}
            />
          ) : (
            <div className="border border-[#D6CEBE] bg-[#F7F4EE] p-10 text-center">
              <p className="text-sm text-[#57534E]">
                Chưa có cặp ảnh đối chiếu được xác nhận quyền công bố.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. DÒNG THỜI GIAN ĐỊA PHƯƠNG */}
      <section className="bg-[#1C1917] text-[#FAF8F4] border-b border-stone-800">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#D4A76A]">
                Trục thời gian có dẫn nguồn tham khảo
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#FAF8F4] mt-1">
                Dòng thời gian địa phương
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4A76A] hover:text-[#FAF8F4] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Xem bản đồ di sản địa phương
            </button>
          </div>

          {realRecords.length === 0 ? (
            <div className="border border-stone-700 p-8 text-center text-stone-400 text-sm">
              Chưa có dữ liệu dòng thời gian để hiển thị.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {db.timelines.map((tl, idx) => {
                const linkedSources = db.sources.filter((s) => tl.sourceIds.includes(s.id));
                return (
                  <article
                    key={tl.id}
                    className="bg-stone-900/80 border border-stone-800 p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-mono uppercase tracking-wider text-[#D4A76A]">
                        0{idx + 1}. {tl.periodLabel} · {tl.yearRange}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#FAF8F4] leading-snug">
                        {tl.title}
                      </h3>
                      <p className="text-sm text-stone-300 leading-relaxed">{tl.summary}</p>
                    </div>

                    <div className="pt-4 border-t border-stone-800 space-y-2">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                        Nguồn tham chiếu:
                      </p>
                      <p className="text-xs text-stone-300">
                        {linkedSources.map((s) => s.code).join(' · ') || 'Chưa gắn nguồn'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {tl.recordIds.map((rid) => {
                          const rec = realRecords.find((r) => r.id === rid);
                          if (!rec) return null;
                          return (
                            <button
                              key={rid}
                              type="button"
                              onClick={() => onOpenRecord(rid)}
                              className="text-xs text-[#D4A76A] hover:underline cursor-pointer"
                            >
                              {rec.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 6. CÂU CHUYỆN TỪ TƯ LIỆU */}
      <section className="bg-[#F7F4EE]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
                Biên soạn dựa trên tư liệu & nguồn kiểm chứng
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#1C1917] mt-1">
                Câu chuyện từ tư liệu
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stories')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C3D2E] hover:text-[#1C1917] cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Đọc tất cả câu chuyện
            </button>
          </div>

          {realRecords.length === 0 ? (
            <div className="border border-[#D6CEBE] bg-[#FBF9F5] p-10 text-center text-sm text-[#57534E]">
              Chưa có câu chuyện nào được liên kết với tư liệu thực tế.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Lead Story */}
              {leadStory && (
                <article className="lg:col-span-7 bg-[#FBF9F5] border border-[#D6CEBE] flex flex-col">
                  <div className="aspect-[16/10] overflow-hidden bg-[#EBE6DF]">
                    <ResilientImage
                      src={leadStoryRec ? getMediaUrl(leadStoryRec.id) : undefined}
                      alt={leadStoryRec?.title || leadStory.title}
                      isRestricted={!leadStoryRec || !isRecordPubliclyDisplayable(db, leadStoryRec)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {leadStoryRec && (
                    <div className="px-6 py-2.5 bg-[#F7F4EE] border-b border-[#E5DFD3] text-[11px] text-[#57534E] flex flex-wrap items-center justify-between gap-2">
                      <span>
                        Ảnh tư liệu: {leadStoryRec.code} · {leadStoryRec.custodianOrgOrPerson} ·{' '}
                        {leadStoryRights?.licenseType}
                      </span>
                      {leadStoryRec.originUrl && (
                        <a
                          href={leadStoryRec.originUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#9A6B2F] hover:underline font-medium"
                        >
                          Xem nguồn gốc <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <p className="text-xs text-[#57534E]">
                        {leadStory.theme} · {leadStory.publishedDate} ·{' '}
                        {leadStory.recordIds.length} bản ghi dẫn chiếu
                      </p>
                      <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                        {leadStory.title}
                      </h3>
                      <p className="text-sm text-[#44403C] leading-relaxed">{leadStory.excerpt}</p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenStory(leadStory.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9A6B2F] hover:text-[#5C3D2E] cursor-pointer"
                      >
                        Đọc bài viết chi tiết <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Secondary Stories */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {db.stories.slice(1).map((story) => (
                  <article
                    key={story.id}
                    className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 flex flex-col justify-between space-y-4 flex-1"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-[#57534E]">
                        {story.theme} · {story.recordIds.length} tư liệu · {story.sourceIds.length}{' '}
                        nguồn
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
                        {story.title}
                      </h3>
                      <p className="text-sm text-[#44403C] leading-relaxed line-clamp-3">
                        {story.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E5DFD3]">
                      <span className="text-xs text-[#78716C]">{story.verificationNote}</span>
                      <button
                        type="button"
                        onClick={() => onOpenStory(story.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F] hover:text-[#5C3D2E] shrink-0 cursor-pointer"
                      >
                        Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))}

                <div className="bg-[#EBE6DF] border border-[#D6CEBE] p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-[#78350F]">
                      Minh bạch nguồn gốc
                    </p>
                    <p className="text-sm font-medium text-[#1C1917] mt-1">
                      Đối chiếu {stats.totalSources} nguồn đã tiếp nhận &{' '}
                      {db.reference_directories.length} đầu mối lưu trữ chính thống
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('sources')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] hover:bg-[#5C3D2E] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Xem nguồn
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
