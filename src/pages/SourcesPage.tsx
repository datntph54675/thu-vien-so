import React, { useState } from 'react';
import { ExternalLink, Info, ArrowRight } from 'lucide-react';
import { ArchiveDatabase } from '../types/archive';
import {
  getActiveSources,
  HISTORICAL_VERIFICATION_LABELS,
} from '../services/archiveApi';
import { PageRoute } from '../components/Header';

interface SourcesPageProps {
  db: ArchiveDatabase;
  onNavigate: (page: PageRoute) => void;
}

export const SourcesPage: React.FC<SourcesPageProps> = ({ db, onNavigate }) => {
  const [tab, setTab] = useState<'acquired' | 'directories'>('acquired');
  const activeSources = getActiveSources(db);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#D6CEBE] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
            Quản trị nguồn gốc & Đạo đức học thuật
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-1">
            Nguồn tư liệu và đầu mối tham khảo
          </h1>
          <p className="text-sm text-[#57534E] mt-2 max-w-2xl leading-relaxed">
            Hệ thống tách biệt rõ ràng giữa các nguồn đã tiếp nhận trong kho dữ liệu và danh bạ 10 đầu mối lưu trữ chính thống ưu tiên đối chiếu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('report')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C3D2E] hover:text-[#1C1917] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Xem báo cáo thống kê khối tư liệu <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mandatory Distinction Notice */}
      <div className="bg-[#F1ECE2] border border-[#D6CEBE] p-5 flex items-start gap-3 text-xs sm:text-sm text-[#44403C] leading-relaxed">
        <Info className="w-5 h-5 text-[#78350F] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#1C1917]">
            Nguyên tắc phân biệt nguồn tham khảo và quyền sử dụng:
          </p>
          <p className="mt-1">
            Mọi nguồn tư liệu hiển thị bên dưới đều gắn liên kết kiểm tra trực tiếp. Danh sách đầu mối định hướng giúp tra cứu bổ sung và KHÔNG mặc định cho phép công bố khi chưa kiểm định từng tệp ảnh hoặc tài liệu cụ thể.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D6CEBE] pb-4">
        <button
          type="button"
          onClick={() => setTab('acquired')}
          className={`px-4 py-2 text-xs font-medium border transition-colors cursor-pointer ${
            tab === 'acquired'
              ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
              : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
          }`}
        >
          Nguồn đã tiếp nhận trong cơ sở dữ liệu ({activeSources.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('directories')}
          className={`px-4 py-2 text-xs font-medium border transition-colors cursor-pointer ${
            tab === 'directories'
              ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
              : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
          }`}
        >
          Đầu mối tham khảo chính thống & chuyên môn ({db.reference_directories.length})
        </button>
      </div>

      {tab === 'acquired' ? (
        activeSources.length === 0 ? (
          <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-12 text-center">
            <h2 className="font-serif text-2xl text-[#1C1917]">
              Chưa có nguồn tham khảo tiếp nhận
            </h2>
            <p className="text-sm text-[#57534E] mt-2">Danh sách nguồn đang trống (0 nguồn).</p>
          </div>
        ) : (
          <div className="bg-[#FBF9F5] border border-[#D6CEBE] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#EBE6DF] border-b border-[#D6CEBE] text-xs font-mono uppercase tracking-wider text-[#44403C]">
                  <th className="py-3.5 px-4">Mã nguồn</th>
                  <th className="py-3.5 px-4">Tên tài liệu / Bộ nguồn</th>
                  <th className="py-3.5 px-4">Đơn vị phát hành</th>
                  <th className="py-3.5 px-4">Loại nguồn</th>
                  <th className="py-3.5 px-4">Quyền sử dụng</th>
                  <th className="py-3.5 px-4 text-right">Bản ghi liên kết</th>
                  <th className="py-3.5 px-4">Xác minh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3]">
                {activeSources.map((src) => {
                  const linkedCount = db.record_sources.filter(
                    (rs) => rs.sourceId === src.id
                  ).length;
                  return (
                    <tr key={src.id} className="hover:bg-[#F7F4EE]">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#78350F] whitespace-nowrap">
                        {src.code}
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <p className="font-medium text-[#1C1917]">{src.title}</p>
                        <p className="text-xs text-[#57534E]">{src.relatedContent}</p>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#9A6B2F] hover:underline"
                          >
                            Mở nguồn gốc <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#44403C]">
                        {src.authorOrPublisher}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#44403C] whitespace-nowrap">
                        {src.sourceType}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#44403C]">
                        {src.usageRightsNote}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#1C1917]">
                        {linkedCount}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                        {HISTORICAL_VERIFICATION_LABELS[src.historicalVerification]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {db.reference_directories.map((dir, i) => (
            <article
              key={dir.id}
              className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-[#9A6B2F]">
                  {String(i + 1).padStart(2, '0')}. {dir.managingOrganization}
                </p>
                <h2 className="font-serif text-xl font-semibold text-[#1C1917]">{dir.name}</h2>
                <p className="text-sm text-[#44403C] leading-relaxed">{dir.purpose}</p>
                <p className="text-xs text-[#57534E]">Phạm vi: {dir.scopeNote}</p>
              </div>
              <div className="pt-3 border-t border-[#E5DFD3] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#78350F] font-medium">{dir.acquisitionState}</span>
                <a
                  href={dir.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#9A6B2F] hover:underline font-mono"
                >
                  {dir.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
