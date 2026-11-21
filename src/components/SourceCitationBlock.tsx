import React from 'react';
import { ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MediaRecord, RightsRecord, SourceRecord } from '../types/archive';
import { RIGHTS_STATUS_LABELS } from '../services/archiveApi';

interface SourceCitationBlockProps {
  record: MediaRecord;
  rights?: RightsRecord;
  sources: SourceRecord[];
  compact?: boolean;
}

export const SourceCitationBlock: React.FC<SourceCitationBlockProps> = ({
  record,
  rights,
  sources,
  compact = false,
}) => {
  const primaryUrl = record.originUrl || sources.find((s) => s.url)?.url;
  const fallbackVal = (v?: string, emptyMsg = 'Chưa xác định') =>
    v && v.trim() ? v : emptyMsg;

  const isPermitted = rights?.rights_status === 'permitted';

  if (compact) {
    return (
      <div className="bg-[#F7F4EE] border-t border-[#E5DFD3] px-4 py-3 text-xs space-y-1.5">
        <p className="text-[#44403C]">
          <span className="text-[#78716C]">Tác giả / Cung cấp:</span>{' '}
          <span className="font-medium text-[#1C1917]">{fallbackVal(record.author)}</span>
        </p>
        <p className="text-[#44403C]">
          <span className="text-[#78716C]">Đơn vị lưu giữ:</span>{' '}
          <span className="font-medium text-[#1C1917]">
            {fallbackVal(record.custodianOrgOrPerson, 'Chưa được nguồn cung cấp')}
          </span>
        </p>
        <p className="text-[#44403C]">
          <span className="text-[#78716C]">Giấy phép:</span>{' '}
          <span className={isPermitted ? 'text-[#14532D] font-medium' : 'text-[#9A3412] font-medium'}>
            {fallbackVal(rights?.licenseType, 'Chưa xác định quyền sử dụng')}
          </span>
        </p>
        {primaryUrl ? (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#9A6B2F] hover:text-[#1C1917] font-medium pt-0.5"
          >
            Xem nguồn gốc tư liệu
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[11px] text-[#78716C] block pt-0.5">
            Chưa có đường dẫn nguồn trực tiếp
          </span>
        )}
      </div>
    );
  }

  return (
    <section
      aria-label="Thông tin nguồn và bản quyền tư liệu"
      className="bg-[#FBF9F5] border border-[#D6CEBE] p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DFD3] pb-3">
        <div className="flex items-center gap-2">
          {isPermitted ? (
            <ShieldCheck className="w-4 h-4 text-[#14532D]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#9A3412]" />
          )}
          <h3 className="font-serif text-base font-semibold text-[#1C1917]">
            Thông tin nguồn tư liệu & bản quyền
          </h3>
        </div>
        <span
          className={`text-[11px] font-mono font-medium ${
            isPermitted ? 'text-[#14532D]' : 'text-[#9A3412]'
          }`}
        >
          {rights ? RIGHTS_STATUS_LABELS[rights.rights_status] : 'Chưa xác minh quyền sử dụng'}
        </span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
        <div>
          <dt className="text-[#78716C]">Tên tư liệu</dt>
          <dd className="text-[#1C1917] font-medium mt-0.5">{record.title}</dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Tác giả / Người tạo lập</dt>
          <dd className="text-[#1C1917] font-medium mt-0.5">{fallbackVal(record.author)}</dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Đơn vị lưu giữ / Cung cấp</dt>
          <dd className="text-[#1C1917] font-medium mt-0.5">
            {fallbackVal(record.custodianOrgOrPerson, 'Chưa được nguồn cung cấp')}
          </dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Năm / Niên đại tư liệu</dt>
          <dd className="text-[#1C1917] mt-0.5">{fallbackVal(record.captureDateText)}</dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Giấy phép / Căn cứ công bố</dt>
          <dd className="text-[#1C1917] mt-0.5">
            {fallbackVal(rights?.licenseType, 'Chưa xác định')}
          </dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Phạm vi sử dụng</dt>
          <dd className="text-[#1C1917] mt-0.5">
            {fallbackVal(rights?.usageScope, 'Chưa được cấp phép công khai')}
          </dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Tình trạng bản tư liệu</dt>
          <dd className="text-[#1C1917] mt-0.5">
            {fallbackVal(record.materialFormatState, 'Chưa có thông tin')}
          </dd>
        </div>
        <div>
          <dt className="text-[#78716C]">Ngày truy cập nguồn</dt>
          <dd className="text-[#1C1917] font-mono mt-0.5">
            {fallbackVal(record.accessedDate || sources[0]?.accessedDate, 'Chưa ghi nhận')}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[#78716C]">Yêu cầu ghi công & Ghi chú bản quyền</dt>
          <dd className="text-[#44403C] mt-0.5">
            {fallbackVal(rights?.attributionRequirement, 'Cần trích dẫn đầy đủ nguồn gốc và tác giả theo quy định.')}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[#78716C]">Nguồn gốc trực tiếp</dt>
          <dd className="text-[#1C1917] break-all mt-0.5">
            {primaryUrl || 'Chưa có đường dẫn nguồn trực tiếp'}
          </dd>
        </div>
      </dl>

      {primaryUrl && (
        <div className="pt-2 border-t border-[#E5DFD3] flex flex-wrap items-center justify-between gap-3">
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#1C1917] text-[#FAF8F4] hover:bg-[#5C3D2E] transition-colors"
          >
            XEM NGUỒN TƯ LIỆU GỐC
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {rights?.licenseUrl && (
            <a
              href={rights.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9A6B2F] hover:underline"
            >
              Xem văn bản giấy phép ({rights.licenseType})
            </a>
          )}
        </div>
      )}
    </section>
  );
};
