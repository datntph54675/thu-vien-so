import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { User } from '../types/archive';
import { hasAdminAccess, ROLE_LABELS } from '../services/archiveApi';

export type PageRoute =
  | 'home'
  | 'library'
  | 'detail'
  | 'compare'
  | 'map'
  | 'audiovisual'
  | 'stories'
  | 'sources'
  | 'report'
  | 'about'
  | 'admin';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

const NAV_ITEMS: Array<{ id: PageRoute; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'library', label: 'Bộ sưu tập' },
  { id: 'compare', label: 'So sánh' },
  { id: 'map', label: 'Bản đồ' },
  { id: 'audiovisual', label: 'Nghe nhìn' },
  { id: 'stories', label: 'Câu chuyện' },
  { id: 'report', label: 'Báo cáo' },
  { id: 'about', label: 'Giới thiệu' },
];

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onOpenAuth,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageRoute) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#D6CEBE]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#1C1917] hover:text-[#5C3D2E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Bảo Tàng Tư Liệu Số
        </button>

        {/* Zone 2: Clean Typography Nav Links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden xl:flex items-center gap-6 text-[13px] font-medium text-[#44403C]"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              currentPage === item.id ||
              (item.id === 'library' && currentPage === 'detail') ||
              (item.id === 'report' && currentPage === 'sources');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  active
                    ? 'text-[#1C1917] border-[#9A6B2F] font-semibold'
                    : 'border-transparent hover:text-[#1C1917] hover:border-[#D6CEBE]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser && hasAdminAccess(currentUser.role) && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`hidden sm:inline-flex items-center px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage === 'admin'
                  ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                  : 'bg-[#F7F4EE] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EBE6DF]'
              }`}
            >
              Quản trị & AI
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAuth}
            className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] hover:bg-[#5C3D2E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {currentUser ? `${ROLE_LABELS[currentUser.role]}` : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Mở menu điều hướng"
            className="xl:hidden p-2 border border-[#D6CEBE] text-[#1C1917] hover:bg-[#EBE6DF] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#FBF9F5] border-t border-[#D6CEBE] px-4 py-4 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NAV_ITEMS.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-2.5 text-left text-sm font-medium border cursor-pointer ${
                    active
                      ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                      : 'bg-[#F7F4EE] text-[#292524] border-[#E5DFD3] hover:bg-[#EBE6DF]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleNav('sources')}
              className={`px-3 py-2.5 text-left text-sm font-medium border cursor-pointer ${
                currentPage === 'sources'
                  ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                  : 'bg-[#F7F4EE] text-[#292524] border-[#E5DFD3] hover:bg-[#EBE6DF]'
              }`}
            >
              Nguồn tham khảo
            </button>
            {currentUser && hasAdminAccess(currentUser.role) && (
              <button
                type="button"
                onClick={() => handleNav('admin')}
                className={`px-3 py-2.5 text-left text-sm font-medium border cursor-pointer ${
                  currentPage === 'admin'
                    ? 'bg-[#9A6B2F] text-[#FAF8F4] border-[#9A6B2F]'
                    : 'bg-[#EBE6DF] text-[#1C1917] border-[#D6CEBE]'
                }`}
              >
                Quản trị & AI Studio
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
