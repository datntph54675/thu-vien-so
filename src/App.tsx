import React, { useEffect, useMemo, useState } from 'react';
import { ArchiveDatabase, MediaType, User, UserRole } from './types/archive';
import { INITIAL_VERIFIED_ARCHIVE } from './data/verifiedArchive';
import {
  computeArchiveStatistics,
  loadArchiveFromStorage,
  resetArchiveStorage,
  saveArchiveToStorage,
} from './services/archiveApi';
import { Header, PageRoute } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { ComparePage } from './pages/ComparePage';
import { MapPage } from './pages/MapPage';
import { AudiovisualPage } from './pages/AudiovisualPage';
import { StoriesPage } from './pages/StoriesPage';
import { SourcesPage } from './pages/SourcesPage';
import { ReportPage } from './pages/ReportPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  const [db, setDb] = useState<ArchiveDatabase>(() =>
    loadArchiveFromStorage(INITIAL_VERIFIED_ARCHIVE)
  );
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('rec-001');
  const [selectedComparisonId, setSelectedComparisonId] = useState<string>('cmp-001');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('st-001');
  const [libraryFilterPreset, setLibraryFilterPreset] = useState<{
    categoryId?: string;
    imageEra?: string;
    mediaType?: MediaType;
  }>({});

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    saveArchiveToStorage(db);
  }, [db]);

  // Support shared URL ?record=rec-xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recParam = params.get('record');
    if (recParam && db.media_records.some((r) => r.id === recParam)) {
      setSelectedRecordId(recParam);
      setCurrentPage('detail');
    }
  }, [db.media_records]);

  const showNotice = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4200);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const navigate = (page: PageRoute) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    navigate('detail');
  };

  const handleOpenCompare = (comparisonId: string) => {
    setSelectedComparisonId(comparisonId);
    navigate('compare');
  };

  const handleOpenStory = (storyId: string) => {
    setSelectedStoryId(storyId);
    navigate('stories');
  };

  const handleOpenLibraryWithFilter = (opts: {
    categoryId?: string;
    imageEra?: string;
    mediaType?: MediaType;
  }) => {
    setLibraryFilterPreset(opts);
    navigate('library');
  };

  const handleSelectRole = (role: UserRole) => {
    if (role === 'guest') {
      setCurrentUser(null);
      if (currentPage === 'admin') {
        navigate('home');
      }
      showNotice('Đang trải nghiệm với vai trò Khách truy cập.');
      return;
    }
    const found = db.users.find((u) => u.role === role) || {
      id: `usr-${role}`,
      name: `Người dùng (${role})`,
      email: `${role}@baotangso.local`,
      role,
      organization: 'Bảo tàng Tư liệu Số',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCurrentUser(found);
    showNotice(`Đã chuyển sang vai trò: ${found.name}`);
  };

  const stats = useMemo(() => computeArchiveStatistics(db), [db]);
  const activeRole: UserRole = currentUser?.role ?? 'guest';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-[#1C1917]">
      <Header
        currentPage={currentPage}
        onNavigate={navigate}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Empty State Test Notice (only when toggled in Admin) */}
      {db.localityConfig.emptyStateTest && (
        <div className="bg-[#EBE6DF] border-b border-[#D6CEBE] px-4 py-2 text-center text-xs text-[#44403C]">
          <span>
            <strong>CHẾ ĐỘ KIỂM THỬ DỮ LIỆU TRỐNG:</strong> Hệ thống đang hiển thị trạng thái 0 bản ghi.
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            db={db}
            stats={stats}
            onNavigate={navigate}
            onOpenLibraryWithFilter={handleOpenLibraryWithFilter}
            onOpenRecord={handleOpenRecord}
            onOpenStory={handleOpenStory}
          />
        )}

        {currentPage === 'library' && (
          <LibraryPage
            db={db}
            currentRole={activeRole}
            initialCategoryId={libraryFilterPreset.categoryId}
            initialImageEra={libraryFilterPreset.imageEra}
            initialMediaType={libraryFilterPreset.mediaType}
            onOpenRecord={handleOpenRecord}
            onNotify={showNotice}
          />
        )}

        {currentPage === 'detail' && (
          <RecordDetailPage
            db={db}
            recordId={selectedRecordId}
            currentRole={activeRole}
            onBack={() => navigate('library')}
            onOpenRecord={handleOpenRecord}
            onOpenCompare={handleOpenCompare}
            onNotify={showNotice}
          />
        )}

        {currentPage === 'compare' && (
          <ComparePage
            db={db}
            currentRole={activeRole}
            initialComparisonId={selectedComparisonId}
            onOpenRecord={handleOpenRecord}
          />
        )}

        {currentPage === 'map' && (
          <MapPage db={db} currentRole={activeRole} onOpenRecord={handleOpenRecord} />
        )}

        {currentPage === 'audiovisual' && (
          <AudiovisualPage
            db={db}
            currentRole={activeRole}
            onOpenRecord={handleOpenRecord}
          />
        )}

        {currentPage === 'stories' && (
          <StoriesPage
            db={db}
            currentRole={activeRole}
            initialStoryId={selectedStoryId}
            onOpenRecord={handleOpenRecord}
          />
        )}

        {currentPage === 'sources' && <SourcesPage db={db} onNavigate={navigate} />}

        {currentPage === 'report' && (
          <ReportPage
            db={db}
            currentRole={activeRole}
            onNavigate={navigate}
            onNotify={showNotice}
          />
        )}

        {currentPage === 'about' && <AboutPage db={db} />}

        {currentPage === 'admin' && (
          <AdminPage
            db={db}
            currentUser={currentUser}
            onUpdateDb={(updater) => setDb((prev) => updater(prev))}
            onResetArchive={() => {
              const reset = resetArchiveStorage(INITIAL_VERIFIED_ARCHIVE);
              setDb(reset);
              showNotice('Đã khôi phục toàn bộ kho dữ liệu tư liệu thực tế ban đầu.');
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNotify={showNotice}
          />
        )}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="bg-[#1C1917] text-stone-300 border-t border-stone-800 mt-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <p className="font-serif text-xl font-semibold text-[#FAF8F4]">
              {db.localityConfig.projectTitle}
            </p>
            <p className="text-xs text-stone-400 leading-relaxed max-w-md">
              {db.localityConfig.curatorialStatement}
            </p>
            <p className="text-xs text-[#D4A76A]">
              Địa phương: {db.localityConfig.localityName}
            </p>
          </div>

          <div className="md:col-span-4 space-y-2.5 text-xs">
            <p className="font-mono uppercase tracking-wider text-stone-400">
              Khám phá & Kiểm toán
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('library')}
                className="text-left hover:text-[#FAF8F4] cursor-pointer"
              >
                Thư viện tư liệu
              </button>
              <button
                type="button"
                onClick={() => navigate('compare')}
                className="text-left hover:text-[#FAF8F4] cursor-pointer"
              >
                So sánh Xưa & Nay
              </button>
              <button
                type="button"
                onClick={() => navigate('map')}
                className="text-left hover:text-[#FAF8F4] cursor-pointer"
              >
                Bản đồ di sản
              </button>
              <button
                type="button"
                onClick={() => navigate('audiovisual')}
                className="text-left hover:text-[#FAF8F4] cursor-pointer"
              >
                Tư liệu nghe nhìn
              </button>
              <button
                type="button"
                onClick={() => navigate('sources')}
                className="text-left hover:text-[#FAF8F4] cursor-pointer"
              >
                Nguồn tham khảo
              </button>
              <button
                type="button"
                onClick={() => navigate('report')}
                className="text-left hover:text-[#FAF8F4] cursor-pointer"
              >
                Báo cáo khối tư liệu
              </button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5 text-xs">
            <p className="font-mono uppercase tracking-wider text-stone-400">
              Quản trị hệ thống
            </p>
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => navigate('about')}
                className="hover:text-[#FAF8F4] cursor-pointer"
              >
                Giới thiệu & Cấu trúc 14 bảng
              </button>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hover:text-[#FAF8F4] cursor-pointer"
              >
                Đăng nhập / Chuyển vai trò
              </button>
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="text-[#D4A76A] hover:underline cursor-pointer"
              >
                Quản trị viên & AI Content Studio
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-stone-800 px-4 py-4 text-center text-[11px] text-stone-400">
          Di sản tư liệu bảo tàng số · Di sản tư liệu nghe nhìn · Số hóa và kiểm chứng nguồn gốc tư liệu địa phương
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        users={db.users}
        onSelectRole={handleSelectRole}
        onLogout={() => handleSelectRole('guest')}
      />

      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-[#1C1917] text-[#FAF8F4] border border-[#9A6B2F] px-4 py-3 text-xs shadow-xl max-w-sm"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
