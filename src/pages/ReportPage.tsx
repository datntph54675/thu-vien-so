import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, ArrowRight } from 'lucide-react';
import {
  ArchiveDatabase,
  MediaType,
  RightsStatus,
  UserRole,
} from '../types/archive';
import {
  computeArchiveStatistics,
  downloadCsvFile,
  getActiveSources,
  getRealCatalogRecords,
  getRecordRights,
  HISTORICAL_VERIFICATION_LABELS,
  PROVENANCE_TIER_LABELS,
  PUBLICATION_STATE_LABELS,
  RIGHTS_STATUS_LABELS,
} from '../services/archiveApi';
import { PageRoute } from '../components/Header';

interface ReportPageProps {
  db: ArchiveDatabase;
  currentRole: UserRole;
  onNavigate: (page: PageRoute) => void;
  onNotify: (msg: string) => void;
}

const RIGHTS_FILTER_OPTIONS: RightsStatus[] = [
  'permitted',
  'research_only',
  'permission_pending',
  'unverified',
  'prohibited',
];

export const ReportPage: React.FC<ReportPageProps> = ({
  db,
  currentRole,
  onNavigate,
  onNotify,
}) => {
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('');
  const [statusFilter, setStatusFilter] = useState<RightsStatus | ''>('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  const activeRecords = getRealCatalogRecords(db);
  const activeSources = getActiveSources(db);

  const filteredRecords = useMemo(() => {
    return activeRecords.filter((rec) => {
      if (typeFilter && rec.mediaType !== typeFilter) return false;
      const rights = getRecordRights(db, rec.id);
      if (statusFilter && rights?.rights_status !== statusFilter) return false;
      if (yearFrom && (rec.captureYear ?? 0) < Number(yearFrom)) return false;
      if (yearTo && (rec.captureYear ?? 9999) > Number(yearTo)) return false;
      return true;
    });
  }, [activeRecords, db, typeFilter, statusFilter, yearFrom, yearTo]);

  const isFiltered = Boolean(typeFilter || statusFilter || yearFrom || yearTo);
  const stats = computeArchiveStatistics(db, isFiltered ? filteredRecords : undefined);

  const statusTableRows: Array<{ status: RightsStatus; count: number; note: string }> = [
    {
      status: 'permitted',
      count: stats.permittedCount,
      note: 'Đã xác minh bản quyền & quyền riêng tư, hiển thị công khai',
    },
    {
      status: 'research_only',
      count: stats.researchOnlyCount,
      note: 'Chỉ phục vụ nghiên cứu nội bộ; không công khai tệp ảnh/tài liệu',
    },
    {
      status: 'permission_pending',
      count: stats.permissionPendingCount,
      note: 'Đang chờ văn bản chấp thuận từ chủ sở hữu quyền',
    },
    {
      status: 'unverified',
      count: stats.unverifiedRightsCount,
      note: 'Đang chờ kiểm chứng nguồn hoặc giấy phép, không tự mặc định miễn phí',
    },
    {
      status: 'prohibited',
      count: stats.prohibitedCount,
      note: 'Đóng hoàn toàn theo quy định bản quyền / quyền riêng tư',
    },
  ];

  // Public CSV exports exclude restricted/non-permitted records for guest/member/contributor
  const exportableRecords = filteredRecords.filter((rec) => {
    const rights = getRecordRights(db, rec.id);
    if (!rights || rights.rights_status === 'prohibited') return false;
    if (currentRole !== 'admin' && currentRole !== 'editor') {
      return rights.rights_status === 'permitted' && rec.publication_state === 'published';
    }
    return true;
  });

  const handleExportRecordsCsv = () => {
    downloadCsvFile(
      'danh-sach-ban-ghi-tu-lieu.csv',
      [
        'Mã tư liệu',
        'Tên tư liệu',
        'Loại hình',
        'Thời gian ghi nhận',
        'Địa phương',
        'Tác giả',
        'Đơn vị lưu giữ',
        'Phân loại dữ liệu',
        'Xác minh lịch sử',
        'Quyền sử dụng',
        'Trạng thái xuất bản',
        'URL nguồn gốc',
      ],
      exportableRecords.map((r) => {
        const rights = getRecordRights(db, r.id);
        return [
          r.code,
          r.title,
          r.mediaType,
          r.captureDateText,
          r.localityName,
          r.author,
          r.custodianOrgOrPerson,
          PROVENANCE_TIER_LABELS[r.data_provenance_tier],
          HISTORICAL_VERIFICATION_LABELS[r.historical_verification],
          rights ? RIGHTS_STATUS_LABELS[rights.rights_status] : 'Chưa xác minh',
          PUBLICATION_STATE_LABELS[r.publication_state],
          r.originUrl || '',
        ];
      })
    );
    onNotify(
      `Đã xuất ${exportableRecords.length} bản ghi ra CSV (đã tự động loại trừ tư liệu hạn chế công khai).`
    );
  };

  const handleExportSourcesCsv = () => {
    downloadCsvFile(
      'danh-sach-nguon-tham-khao.csv',
      ['Mã nguồn', 'Tên tài liệu', 'Đơn vị phát hành', 'Loại nguồn', 'Xác minh lịch sử', 'URL', 'Ghi chú quyền'],
      activeSources.map((s) => [
        s.code,
        s.title,
        s.authorOrPublisher,
        s.sourceType,
        HISTORICAL_VERIFICATION_LABELS[s.historicalVerification],
        s.url || '',
        s.usageRightsNote,
      ])
    );
    onNotify(`Đã xuất ${activeSources.length} nguồn tham khảo ra CSV.`);
  };

  const handleExportRightsCsv = () => {
    const allowedRows = filteredRecords
      .map((rec) => ({ rec, rights: getRecordRights(db, rec.id) }))
      .filter(({ rights }) => rights?.rights_status !== 'prohibited');

    downloadCsvFile(
      'bao-cao-quyen-cong-bo.csv',
      [
        'Mã tư liệu',
        'Tên tư liệu',
        'Chủ sở hữu quyền',
        'Giấy phép',
        'Trạng thái quyền sử dụng',
        'Bằng chứng',
        'Người xác minh',
      ],
      allowedRows.map(({ rec, rights }) => [
        rec.code,
        rec.title,
        rights?.rightsOwner || 'Chưa xác định',
        rights?.licenseType || '',
        rights ? RIGHTS_STATUS_LABELS[rights.rights_status] : 'Chưa xác minh',
        rights?.permissionEvidence || '',
        rights?.verifiedBy || '',
      ])
    );
    onNotify('Đã xuất báo cáo quyền công bố CSV (không bao gồm bản ghi bị cấm công bố).');
  };

  const handleExportSummaryCsv = () => {
    downloadCsvFile(
      'bao-cao-thong-ke-khoi-tu-lieu.csv',
      ['Chỉ tiêu thống kê', 'Số lượng', 'Ghi chú'],
      [
        ['Tổng số hồ sơ tư liệu thực tế', stats.totalRecords, 'Loại trừ dữ liệu minh họa và bản nháp AI'],
        ['Ảnh đã xác minh', stats.verifiedImageCount, 'mediaType=image + verified + permitted'],
        ['Tổng số ảnh', stats.imageCount, ''],
        ['Tổng số video', stats.videoCount, ''],
        ['Tổng số bản ghi âm', stats.audioCount, ''],
        ['Bản đồ & tài liệu lưu trữ', stats.mapDocumentCount, ''],
        ['Số địa phương', stats.localitiesCount, ''],
        ['Tổng số nguồn tham khảo (không trùng)', stats.totalSources, 'Đếm DISTINCT từ bảng sources'],
        ['Hồ sơ được phép công bố (permitted)', stats.permittedCount, ''],
        ['Hồ sơ đang chờ xác minh / cấp phép', stats.pendingVerificationCount, ''],
        ['Hồ sơ chỉ sử dụng nghiên cứu', stats.researchOnlyCount, ''],
        ['Hồ sơ không được phép công bố', stats.prohibitedCount, ''],
      ]
    );
    onNotify('Đã xuất báo cáo tổng hợp thống kê CSV.');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-[#D6CEBE] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
            Kiểm toán dữ liệu trực tiếp từ kho lưu trữ
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-1">
            Báo cáo khối tư liệu sưu tầm và số hóa
          </h1>
          <p className="text-sm text-[#57534E] mt-2 max-w-2xl leading-relaxed">
            Mọi chỉ số trên trang này được tính toán trực tiếp từ các hồ sơ tư liệu thực tế (không cộng bản nháp AI chưa kiểm duyệt hay dữ liệu minh họa).
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('sources')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C3D2E] hover:text-[#1C1917] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Xem danh mục nguồn & đầu mối tham khảo <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Bar */}
      <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-5 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-mono uppercase text-[#57534E]">
            Loại tư liệu
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MediaType | '')}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả loại</option>
            <option value="image">Ảnh</option>
            <option value="map_document">Bản đồ & tài liệu</option>
            <option value="video">Video</option>
            <option value="audio">Bản ghi âm</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-mono uppercase text-[#57534E]">
            Quyền sử dụng
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RightsStatus | '')}
            className="px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          >
            <option value="">Tất cả trạng thái</option>
            {RIGHTS_FILTER_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {RIGHTS_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-mono uppercase text-[#57534E]">Từ năm</label>
          <input
            type="number"
            placeholder="VD: 1885"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="w-28 px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-mono uppercase text-[#57534E]">Đến năm</label>
          <input
            type="number"
            placeholder="VD: 2026"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            className="w-28 px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
          />
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setTypeFilter('');
              setStatusFilter('');
              setYearFrom('');
              setYearTo('');
            }}
            className="px-3.5 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#EBE6DF] text-[#1C1917] cursor-pointer"
          >
            Đặt lại lọc báo cáo
          </button>
        )}
      </section>

      {/* 1. Stat Cards */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
          1. Chỉ số tổng hợp khối tư liệu
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Tổng số hồ sơ', val: stats.totalRecords },
            { label: 'Ảnh đã xác minh', val: stats.verifiedImageCount },
            { label: 'Tổng số video', val: stats.videoCount },
            { label: 'Tổng số bản ghi âm', val: stats.audioCount },
            { label: 'Bản đồ & tài liệu', val: stats.mapDocumentCount },
            { label: 'Số địa phương', val: stats.localitiesCount },
            { label: 'Nguồn tham khảo (Không trùng)', val: stats.totalSources },
            { label: 'Được phép công bố', val: stats.permittedCount },
            { label: 'Đang chờ xác minh', val: stats.pendingVerificationCount },
            { label: 'Thiếu tác giả / đơn vị lưu giữ', val: stats.missingAuthorOrCustodianCount },
          ].map((card) => (
            <div key={card.label} className="bg-[#FBF9F5] border border-[#D6CEBE] p-5">
              <p className="text-3xl font-serif font-semibold tabular-nums text-[#1C1917]">
                {card.val}
              </p>
              <p className="text-xs text-[#57534E] mt-1.5">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Publication Status Table + 3. Record vs Source Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
            2. Bảng thống kê 5 trạng thái quyền công bố
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D6CEBE] text-xs font-mono uppercase tracking-wider text-[#57534E]">
                  <th className="py-3 pr-4">Trạng thái bản quyền</th>
                  <th className="py-3 px-4 text-right">Số hồ sơ</th>
                  <th className="py-3 pl-4">Ghi chú áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3]">
                {statusTableRows.map((row) => (
                  <tr key={row.status}>
                    <td className="py-3 pr-4 font-medium text-[#1C1917]">
                      {RIGHTS_STATUS_LABELS[row.status]}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1C1917]">
                      {row.count}
                    </td>
                    <td className="py-3 pl-4 text-xs text-[#57534E]">{row.note}</td>
                  </tr>
                ))}
                <tr className="bg-[#F7F4EE] font-semibold">
                  <td className="py-3 pr-4 text-[#1C1917]">Tổng cộng hồ sơ kiểm kê</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#1C1917]">
                    {stats.totalRecords}
                  </td>
                  <td className="py-3 pl-4 text-xs text-[#57534E]">
                    Đã xác minh lịch sử: {stats.verifiedHistoricalCount} · Chờ xác minh: {stats.pendingVerificationCount} · Hạn chế công bố: {stats.restrictedTotalCount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-6">
          <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-3">
            <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
              3. Phân biệt số hồ sơ và số nguồn
            </h2>
            <ul className="space-y-2 text-xs text-[#44403C] leading-relaxed list-disc pl-4">
              <li>
                <strong>Hồ sơ tư liệu ({stats.totalRecords}):</strong> Từng đối tượng ảnh, bản đồ, văn bản, video hoặc bản ghi âm được biên mục riêng.
              </li>
              <li>
                <strong>Nguồn tham khảo ({stats.totalSources}):</strong> Từng đầu mối lưu trữ hoặc bộ sưu tập độc lập trong bảng <code className="font-mono">sources</code>.
              </li>
              <li>
                Quan hệ nhiều–nhiều (<code className="font-mono">record_sources</code>) hiện có{' '}
                <span className="font-mono tabular-nums font-medium">{db.record_sources.length}</span>{' '}
                liên kết, sử dụng <code className="font-mono">DISTINCT source_id</code> để không đếm trùng nguồn.
              </li>
            </ul>
          </div>

          <div className="bg-[#1C1917] text-[#FAF8F4] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#D4A76A]">
              <FileSpreadsheet className="w-4 h-4" />
              Xuất dữ liệu báo cáo CSV
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Các tệp xuất công khai tự động loại trừ những bản ghi bị hạn chế hoặc không được phép công bố.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportRecordsCsv}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-[#9A6B2F] hover:bg-[#B47B33] text-[#FAF8F4] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất danh sách bản ghi
              </button>
              <button
                type="button"
                onClick={handleExportSourcesCsv}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 border border-stone-600 text-[#FAF8F4] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất danh sách nguồn
              </button>
              <button
                type="button"
                onClick={handleExportRightsCsv}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 border border-stone-600 text-[#FAF8F4] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Báo cáo quyền công bố
              </button>
              <button
                type="button"
                onClick={handleExportSummaryCsv}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 border border-stone-600 text-[#FAF8F4] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Báo cáo thống kê
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
