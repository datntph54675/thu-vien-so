import React, { useState } from 'react';
import { ImageOff, Lock } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  isRestricted?: boolean;
  restrictionLabel?: string;
  emptyLabel?: string;
  aspectClass?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  isRestricted = false,
  restrictionLabel = 'Chưa có hình ảnh được xác nhận quyền công bố',
  emptyLabel = 'Chưa có hình ảnh được xác nhận quyền công bố',
  aspectClass = '',
}) => {
  const [failed, setFailed] = useState(false);

  if (isRestricted) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-[#EBE6DF] text-[#5C3D2E] border border-[#D6CEBE] p-6 text-center ${aspectClass} ${className}`}
      >
        <Lock className="w-6 h-6 mb-2 text-[#78350F]" strokeWidth={1.5} />
        <p className="text-xs font-medium tracking-wide uppercase text-[#5C3D2E]">
          {restrictionLabel}
        </p>
        <p className="text-xs text-[#57534E] mt-1 max-w-[26ch]">
          Nội dung hình ảnh được ẩn cho tới khi hoàn tất xác minh bản quyền và quyền công bố.
        </p>
      </div>
    );
  }

  if (!src || failed) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-[#EBE6DF] text-[#57534E] border border-[#D6CEBE] p-6 text-center ${aspectClass} ${className}`}
      >
        <ImageOff className="w-6 h-6 mb-2 text-[#78716C]" strokeWidth={1.5} />
        <p className="text-xs font-medium text-[#44403C] line-clamp-2">{alt}</p>
        <p className="text-[11px] text-[#78716C] mt-1">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
