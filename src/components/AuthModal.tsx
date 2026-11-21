import React from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { User, UserRole } from '../types/archive';
import { ROLE_LABELS } from '../services/archiveApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users: User[];
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  guest: 'Xem các tư liệu, cặp so sánh, bản đồ và câu chuyện đã được phê duyệt công khai.',
  member: 'Khám phá kho công khai, chia sẻ liên kết hồ sơ và tham khảo thư mục nguồn.',
  contributor: 'Tạo hồ sơ tiếp nhận tư liệu mới, tải tệp lên hàng chờ kiểm duyệt.',
  editor: 'Kiểm định nguồn gốc, phân loại quyền công bố, duyệt nội dung và sử dụng AI Content Studio.',
  admin: 'Toàn quyền cấu hình địa phương nghiên cứu, quản lý người dùng, xuất báo cáo và phê duyệt xuất bản.',
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectRole,
  onLogout,
}) => {
  if (!isOpen) return null;

  const activeRole: UserRole = currentUser?.role ?? 'guest';

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[#FBF9F5] border border-[#D6CEBE] max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5DFD3] pb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
              Phân quyền truy cập hệ thống (Chuyển vai trò kiểm thử)
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#1C1917] mt-1">
              Chọn vai trò làm việc
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đăng nhập"
            className="p-2 text-[#57534E] hover:text-[#1C1917] border border-transparent hover:border-[#D6CEBE] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#F1ECE2] border border-[#D6CEBE] p-4 flex items-start gap-3 text-xs text-[#44403C] leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-[#78350F] shrink-0 mt-0.5" />
          <p>
            Đây là cơ chế đăng nhập và phân quyền mô phỏng phục vụ giai đoạn trình diễn giao diện React. Khi triển khai thực tế với Laravel & MySQL, xác thực và phân quyền phải được kiểm soát chặt chẽ tại máy chủ.
          </p>
        </div>

        <div className="space-y-2.5">
          {(['guest', 'member', 'contributor', 'editor', 'admin'] as UserRole[]).map((role) => {
            const matchedUser = users.find((u) => u.role === role);
            const isSelected = activeRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  onSelectRole(role);
                  onClose();
                }}
                className={`w-full text-left p-4 border transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                    : 'bg-[#F7F4EE] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EBE6DF]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{ROLE_LABELS[role]}</span>
                    {matchedUser && (
                      <span
                        className={`text-xs ${
                          isSelected ? 'text-[#D4A76A]' : 'text-[#57534E]'
                        }`}
                      >
                        · {matchedUser.name}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isSelected ? 'text-stone-300' : 'text-[#57534E]'
                    }`}
                  >
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#D4A76A] shrink-0 mt-1" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E5DFD3]">
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="text-xs font-medium text-[#78350F] hover:underline cursor-pointer"
          >
            Đăng xuất về Khách truy cập
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F7F4EE] hover:bg-[#EBE6DF] text-[#1C1917] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
