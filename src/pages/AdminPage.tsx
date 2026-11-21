import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  SlidersHorizontal,
  Settings,
  Users,
  RotateCcw,
  Sparkles,
  Database,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import {
  AiAnalysisDraft,
  ArchiveDatabase,
  DataProvenanceTier,
  HistoricalVerificationStatus,
  MediaRecord,
  MediaType,
  ModerationStage,
  PublicationState,
  RightsStatus,
  SourceRecord,
  User,
  UserRole,
} from '../types/archive';
import {
  canManageUsersAndConfig,
  canModerateAndPublish,
  getRecordRights,
  getRecordSources,
  hasAdminAccess,
  HISTORICAL_VERIFICATION_LABELS,
  isRecordMissingAuthorOrCustodian,
  isRecordMissingSource,
  PROVENANCE_TIER_LABELS,
  PUBLICATION_STATE_LABELS,
  RIGHTS_STATUS_LABELS,
  ROLE_LABELS,
} from '../services/archiveApi';
import { AiContentStudio } from '../components/AiContentStudio';

interface AdminPageProps {
  db: ArchiveDatabase;
  currentUser: User | null;
  onUpdateDb: (updater: (prev: ArchiveDatabase) => ArchiveDatabase) => void;
  onResetArchive: () => void;
  onOpenAuth: () => void;
  onNotify: (msg: string) => void;
}

type AdminTab = 'records' | 'sources' | 'moderation' | 'ai' | 'config';

type AdminFilterKey =
  | 'all'
  | 'verified'
  | 'unverified_hist'
  | 'permitted'
  | 'permission_pending'
  | 'research_only'
  | 'prohibited'
  | 'missing_source'
  | 'missing_author_custodian';

const ADMIN_FILTERS: Array<{ id: AdminFilterKey; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'verified', label: 'Đã xác minh' },
  { id: 'unverified_hist', label: 'Chưa xác minh' },
  { id: 'permitted', label: 'Được phép công bố' },
  { id: 'permission_pending', label: 'Chờ cấp phép' },
  { id: 'research_only', label: 'Chỉ sử dụng nghiên cứu' },
  { id: 'prohibited', label: 'Không được phép công bố' },
  { id: 'missing_source', label: 'Thiếu nguồn tham khảo' },
  { id: 'missing_author_custodian', label: 'Thiếu thông tin tác giả hoặc đơn vị lưu giữ' },
];

const RIGHTS_OPTIONS: RightsStatus[] = [
  'permitted',
  'research_only',
  'permission_pending',
  'unverified',
  'prohibited',
];

const HIST_VERIF_OPTIONS: HistoricalVerificationStatus[] = [
  'verified',
  'partial',
  'unverified',
];

const PUB_STATE_OPTIONS: PublicationState[] = ['published', 'hidden', 'draft'];

const STAGES: ModerationStage[] = [
  'Tiếp nhận tư liệu',
  'Kiểm tra nguồn gốc',
  'Xác minh thông tin lịch sử',
  'Kiểm tra bản quyền',
  'Duyệt nội dung',
  'Xuất bản',
];

export const AdminPage: React.FC<AdminPageProps> = ({
  db,
  currentUser,
  onUpdateDb,
  onResetArchive,
  onOpenAuth,
  onNotify,
}) => {
  const [tab, setTab] = useState<AdminTab>('records');
  const [adminFilter, setAdminFilter] = useState<AdminFilterKey>('all');

  // Record Create/Edit Form State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recTitle, setRecTitle] = useState('');
  const [recDesc, setRecDesc] = useState('');
  const [recLocality, setRecLocality] = useState(db.localityConfig.localityName);
  const [recLocationId, setRecLocationId] = useState(db.locations[0]?.id || 'loc-dongxuan');
  const [recCategoryId, setRecCategoryId] = useState(db.categories[0]?.id || 'cat-xua');
  const [recMediaType, setRecMediaType] = useState<MediaType>('image');
  const [recEra, setRecEra] = useState<'xua' | 'nay' | 'tu_lieu'>('xua');
  const [recDateText, setRecDateText] = useState('');
  const [recAuthor, setRecAuthor] = useState('');
  const [recCustodian, setRecCustodian] = useState('');
  const [recOriginUrl, setRecOriginUrl] = useState('');
  const [recAccessedDate, setRecAccessedDate] = useState(new Date().toISOString().slice(0, 10));
  const [recFormatState, setRecFormatState] = useState('Bản số hóa từ lưu trữ gốc');
  const [recProvenanceTier, setRecProvenanceTier] =
    useState<DataProvenanceTier>('partial_real');
  const [recSourceIds, setRecSourceIds] = useState<string[]>(
    db.sources[0]?.id ? [db.sources[0].id] : []
  );
  const [recMediaUrl, setRecMediaUrl] = useState('');

  // Pair Before/After State
  const [pairOldId, setPairOldId] = useState('');
  const [pairNewId, setPairNewId] = useState('');
  const [pairTitle, setPairTitle] = useState('');

  // Source Form State
  const [srcCode, setSrcCode] = useState('');
  const [srcTitle, setSrcTitle] = useState('');
  const [srcPublisher, setSrcPublisher] = useState('');
  const [srcType, setSrcType] =
    useState<SourceRecord['sourceType']>('Cơ quan lưu trữ nhà nước');
  const [srcUrl, setSrcUrl] = useState('');
  const [srcRightsNote, setSrcRightsNote] = useState('');

  // Moderation & Rights State
  const [modRecordId, setModRecordId] = useState<string>(db.media_records[0]?.id || '');
  const [modStage, setModStage] = useState<ModerationStage>('Kiểm tra bản quyền');
  const [modRightsStatus, setModRightsStatus] = useState<RightsStatus>('unverified');
  const [modHistVerif, setModHistVerif] =
    useState<HistoricalVerificationStatus>('unverified');
  const [modPubState, setModPubState] = useState<PublicationState>('hidden');
  const [modRightsOwner, setModRightsOwner] = useState('');
  const [modLicense, setModLicense] = useState('');
  const [modLicenseUrl, setModLicenseUrl] = useState('');
  const [modUsageScope, setModUsageScope] = useState('');
  const [modAttribution, setModAttribution] = useState('');
  const [modEvidence, setModEvidence] = useState('');
  const [modPrivacyCleared, setModPrivacyCleared] = useState(false);
  const [modReason, setModReason] = useState('');

  // Locality Config Form State
  const [localityName, setLocalityName] = useState(db.localityConfig.localityName);
  const [adminRegion, setAdminRegion] = useState(db.localityConfig.administrativeRegion);
  const [curatorialNote, setCuratorialNote] = useState(db.localityConfig.curatorialStatement);

  const visibleRecords = useMemo(() => {
    const active = db.media_records.filter((r) => !r.isArchived);
    return active.filter((rec) => {
      const rights = getRecordRights(db, rec.id);
      const rStatus = rights?.rights_status ?? 'unverified';
      switch (adminFilter) {
        case 'verified':
          return rec.historical_verification === 'verified';
        case 'unverified_hist':
          return rec.historical_verification !== 'verified';
        case 'permitted':
          return rStatus === 'permitted';
        case 'permission_pending':
          return rStatus === 'permission_pending';
        case 'research_only':
          return rStatus === 'research_only';
        case 'prohibited':
          return rStatus === 'prohibited';
        case 'missing_source':
          return isRecordMissingSource(db, rec);
        case 'missing_author_custodian':
          return isRecordMissingAuthorOrCustodian(rec);
        default:
          return true;
      }
    });
  }, [db, adminFilter]);

  if (!currentUser || !hasAdminAccess(currentUser.role)) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#1C1917]">
          Khu vực Quản trị & Biên tập tư liệu
        </h1>
        <p className="text-sm text-[#57534E] max-w-lg mx-auto">
          Chức năng này chỉ hiển thị cho vai trò Người đóng góp tư liệu, Biên tập viên hoặc Quản trị viên.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-5 py-2.5 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] cursor-pointer"
        >
          Đăng nhập với vai trò quản trị
        </button>
      </div>
    );
  }

  const canModerate = canModerateAndPublish(currentUser.role);
  const isAdmin = canManageUsersAndConfig(currentUser.role);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRecMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSourceSelection = (sid: string) => {
    setRecSourceIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const resetRecordForm = () => {
    setEditingRecordId(null);
    setRecTitle('');
    setRecDesc('');
    setRecLocality(db.localityConfig.localityName);
    setRecDateText('');
    setRecAuthor('');
    setRecCustodian('');
    setRecOriginUrl('');
    setRecFormatState('Bản số hóa từ lưu trữ gốc');
    setRecMediaUrl('');
  };

  const startEditRecord = (rec: MediaRecord) => {
    setEditingRecordId(rec.id);
    setRecTitle(rec.title);
    setRecDesc(rec.description);
    setRecLocality(rec.localityName);
    setRecLocationId(rec.locationId);
    setRecCategoryId(rec.categoryId);
    setRecMediaType(rec.mediaType);
    setRecEra(rec.imageEra || 'xua');
    setRecDateText(rec.captureDateText);
    setRecAuthor(rec.author);
    setRecCustodian(rec.custodianOrgOrPerson);
    setRecOriginUrl(rec.originUrl || '');
    setRecAccessedDate(rec.accessedDate || new Date().toISOString().slice(0, 10));
    setRecFormatState(rec.materialFormatState || '');
    setRecProvenanceTier(rec.data_provenance_tier);
    const linked = getRecordSources(db, rec.id).map((s) => s.id);
    setRecSourceIds(linked);
    const f = db.media_files.find((mf) => mf.recordId === rec.id);
    setRecMediaUrl(f?.url || '');
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) {
      onNotify('Vui lòng nhập tên tư liệu.');
      return;
    }

    const now = new Date().toISOString();
    const locObj = db.locations.find((l) => l.id === recLocationId);

    if (editingRecordId) {
      onUpdateDb((prev) => {
        const filteredLinks = prev.record_sources.filter(
          (rs) => rs.recordId !== editingRecordId
        );
        const newLinks = recSourceIds.map((sid, i) => ({
          id: `rs-${Date.now()}-${i}`,
          recordId: editingRecordId,
          sourceId: sid,
          directItemUrl: recOriginUrl.trim() || undefined,
          citationNote: 'Liên kết nguồn cập nhật từ trang Quản trị',
          created_at: now,
          updated_at: now,
        }));

        return {
          ...prev,
          media_records: prev.media_records.map((r) =>
            r.id === editingRecordId
              ? {
                  ...r,
                  title: recTitle.trim(),
                  description: recDesc.trim() || r.description,
                  localityName: recLocality.trim() || prev.localityConfig.localityName,
                  locationId: recLocationId,
                  specificPlace: locObj?.name || r.specificPlace,
                  categoryId: recCategoryId,
                  mediaType: recMediaType,
                  imageEra:
                    recMediaType === 'image' || recMediaType === 'map_document'
                      ? recEra
                      : undefined,
                  captureDateText: recDateText.trim() || 'Chưa xác định',
                  author: recAuthor.trim() || 'Chưa xác định',
                  custodianOrgOrPerson: recCustodian.trim() || 'Chưa được nguồn cung cấp',
                  originUrl: recOriginUrl.trim() || undefined,
                  accessedDate: recAccessedDate.trim() || undefined,
                  materialFormatState: recFormatState.trim() || 'Chưa xác định',
                  data_provenance_tier: recProvenanceTier,
                  updated_at: now,
                }
              : r
          ),
          media_files: prev.media_files.map((f) =>
            f.recordId === editingRecordId
              ? {
                  ...f,
                  fileType: recMediaType,
                  url: recMediaUrl,
                  thumbnailUrl: recMediaUrl,
                  materialFormatState: recFormatState.trim() || f.materialFormatState,
                  updated_at: now,
                }
              : f
          ),
          record_sources: [...newLinks, ...filteredLinks],
          review_logs: [
            {
              id: `rev-${Date.now()}`,
              recordId: editingRecordId,
              actorName: currentUser.name,
              actorRole: currentUser.role,
              action: 'Cập nhật hồ sơ',
              stage: 'Kiểm tra nguồn gốc',
              reasonNote: `Cập nhật thông tin biên mục & ${recSourceIds.length} nguồn tham khảo.`,
              created_at: now,
              updated_at: now,
            },
            ...prev.review_logs,
          ],
        };
      });
      onNotify('Đã cập nhật hồ sơ tư liệu và lưu nhật ký.');
      resetRecordForm();
      return;
    }

    const newId = `rec-${Date.now()}`;
    const nextNumber = String(db.media_records.length + 1).padStart(3, '0');
    const newCode = `HN-MOI-${nextNumber}`;

    const newRecord: MediaRecord = {
      id: newId,
      code: newCode,
      title: recTitle.trim(),
      description: recDesc.trim() || 'Hồ sơ mới tiếp nhận, chờ bổ sung mô tả chi tiết.',
      localityName: recLocality.trim() || db.localityConfig.localityName,
      locationId: recLocationId,
      specificPlace: locObj?.name || 'Chưa xác định',
      categoryId: recCategoryId,
      eraLabel: recEra === 'nay' ? 'Hiện tại' : 'Giai đoạn trước',
      historicalPeriod: 'Đang chờ xác minh thời kỳ',
      captureDateText: recDateText.trim() || 'Chưa xác định',
      createdDateText: now.slice(0, 10),
      author: recAuthor.trim() || 'Chưa xác định',
      contributor: currentUser.name,
      mediaType: recMediaType,
      imageEra:
        recMediaType === 'image' || recMediaType === 'map_document' ? recEra : undefined,
      historicalContext: '',
      relatedEvent: '',
      architectureOrSpaceNote: '',
      observedChanges: '',
      localSignificance: '',
      custodianOrgOrPerson: recCustodian.trim() || 'Chưa được nguồn cung cấp',
      collectionName: 'Tiếp nhận mới',
      originUrl: recOriginUrl.trim() || undefined,
      accessedDate: recAccessedDate.trim() || now.slice(0, 10),
      materialFormatState: recFormatState.trim() || 'Chưa xác định',
      referenceDocumentNote: 'Chờ kiểm tra đối chiếu nguồn.',
      receivedDate: now.slice(0, 10),
      enteredBy: currentUser.name,
      historical_verification: 'unverified',
      publication_state: 'draft',
      data_provenance_tier: recProvenanceTier,
      moderationStage: 'Tiếp nhận tư liệu',
      keywords: [],
      created_at: now,
      updated_at: now,
    };

    const newLinks = recSourceIds.map((sid, idx) => ({
      id: `rs-${Date.now()}-${idx}`,
      recordId: newId,
      sourceId: sid,
      directItemUrl: recOriginUrl.trim() || undefined,
      citationNote: 'Nguồn đính kèm khi tiếp nhận',
      created_at: now,
      updated_at: now,
    }));

    onUpdateDb((prev) => ({
      ...prev,
      media_records: [newRecord, ...prev.media_records],
      media_files: [
        {
          id: `mf-${Date.now()}`,
          recordId: newId,
          fileType: recMediaType,
          url: recMediaUrl,
          thumbnailUrl: recMediaUrl,
          resolutionOrQuality: recMediaUrl
            ? 'Tệp mới tiếp nhận (Chờ kiểm định)'
            : 'Chưa có tệp xác minh',
          materialFormatState: recFormatState.trim() || 'Chưa xác định',
          created_at: now,
          updated_at: now,
        },
        ...prev.media_files,
      ],
      record_sources: [...newLinks, ...prev.record_sources],
      rights_records: [
        {
          id: `rg-${Date.now()}`,
          recordId: newId,
          rightsOwner: 'Chưa xác định',
          licenseType: 'Chưa xác định giấy phép',
          rights_status: 'unverified',
          usageScope: 'Tạm ẩn cho tới khi hoàn tất kiểm định bản quyền',
          attributionRequirement: 'Chưa xác định',
          permissionEvidence: 'Chưa có bằng chứng',
          privacyCleared: false,
          verifiedBy: 'Chưa xác minh',
          verifiedAt: 'Chưa có',
          created_at: now,
          updated_at: now,
        },
        ...prev.rights_records,
      ],
      review_logs: [
        {
          id: `rev-${Date.now()}`,
          recordId: newId,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: 'Tiếp nhận',
          stage: 'Tiếp nhận tư liệu',
          newRightsStatus: 'unverified',
          reasonNote:
            'Tạo hồ sơ mới ở trạng thái unverified & draft; không tự động cho phép công bố.',
          created_at: now,
          updated_at: now,
        },
        ...prev.review_logs,
      ],
    }));

    onNotify(
      `Đã tiếp nhận bản ghi ${newCode} ở trạng thái Chưa xác minh quyền sử dụng (ẩn khỏi công khai).`
    );
    resetRecordForm();
  };

  const handleHideRecordQuick = (recordId: string) => {
    if (!canModerate) {
      onNotify('Chỉ Biên tập viên hoặc Quản trị viên mới có quyền ẩn tư liệu.');
      return;
    }
    const now = new Date().toISOString();
    const prevRights = getRecordRights(db, recordId);
    onUpdateDb((prev) => ({
      ...prev,
      media_records: prev.media_records.map((r) =>
        r.id === recordId ? { ...r, publication_state: 'hidden', updated_at: now } : r
      ),
      review_logs: [
        {
          id: `rev-${Date.now()}`,
          recordId,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: 'Ẩn tư liệu',
          stage: 'Kiểm tra bản quyền',
          previousRightsStatus: prevRights?.rights_status,
          newRightsStatus: prevRights?.rights_status,
          reasonNote: 'Tạm ẩn tư liệu khỏi khu vực công khai để kiểm tra lại nguồn/bản quyền.',
          created_at: now,
          updated_at: now,
        },
        ...prev.review_logs,
      ],
    }));
    onNotify('Đã chuyển trạng thái xuất bản sang Tạm ẩn khỏi công chúng và ghi nhật ký.');
  };

  const handleArchiveRecord = (recordId: string) => {
    if (!canModerate) {
      onNotify('Chỉ Biên tập viên hoặc Quản trị viên mới có quyền lưu trữ ẩn bản ghi.');
      return;
    }
    onUpdateDb((prev) => ({
      ...prev,
      media_records: prev.media_records.map((r) =>
        r.id === recordId ? { ...r, isArchived: true, publication_state: 'hidden' } : r
      ),
    }));
    onNotify('Đã chuyển bản ghi vào kho lưu trữ nội bộ.');
  };

  const handlePairComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairOldId) {
      onNotify('Vui lòng chọn ảnh xưa.');
      return;
    }
    const oldRec = db.media_records.find((r) => r.id === pairOldId);
    const newRec = db.media_records.find((r) => r.id === pairNewId);
    if (!oldRec) return;
    if (newRec && oldRec.locationId !== newRec.locationId) {
      onNotify(
        'Vi phạm quy tắc bảo tàng: Không được ghép cặp hai bức ảnh thuộc hai địa điểm khác nhau!'
      );
      return;
    }
    const now = new Date().toISOString();
    onUpdateDb((prev) => ({
      ...prev,
      comparisons: [
        {
          id: `cmp-${Date.now()}`,
          title: pairTitle.trim() || `Đối chiếu: ${oldRec.title}`,
          locationId: oldRec.locationId,
          oldRecordId: oldRec.id,
          newRecordId: newRec?.id || undefined,
          changeSummary: 'Cặp đối chiếu được ghép nối từ trang Quản trị.',
          architecturalNotes: 'Cần bổ sung ghi chú kiến trúc chi tiết.',
          created_at: now,
          updated_at: now,
        },
        ...prev.comparisons,
      ],
    }));
    onNotify('Đã tạo cặp đối chiếu Xưa – Nay mới cùng địa điểm.');
    setPairTitle('');
  };

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srcTitle.trim() || !srcCode.trim()) {
      onNotify('Vui lòng nhập mã nguồn và tên tài liệu nguồn.');
      return;
    }
    const now = new Date().toISOString();
    const newSrc: SourceRecord = {
      id: `src-${Date.now()}`,
      code: srcCode.trim().toUpperCase(),
      title: srcTitle.trim(),
      authorOrPublisher: srcPublisher.trim() || 'Chưa xác định',
      sourceType: srcType,
      url: srcUrl.trim() || undefined,
      accessedDate: now.slice(0, 10),
      relatedContent: 'Nguồn mới bổ sung qua trang Quản trị',
      usageRightsNote: srcRightsNote.trim() || 'Chưa xác định quyền sử dụng',
      historicalVerification: 'partial',
      created_at: now,
      updated_at: now,
    };
    onUpdateDb((prev) => ({
      ...prev,
      sources: [newSrc, ...prev.sources],
    }));
    onNotify(`Đã thêm nguồn tham khảo ${newSrc.code}.`);
    setSrcCode('');
    setSrcTitle('');
    setSrcPublisher('');
    setSrcUrl('');
    setSrcRightsNote('');
  };

  const selectRecordForModeration = (rid: string) => {
    setModRecordId(rid);
    const rec = db.media_records.find((r) => r.id === rid);
    const rights = getRecordRights(db, rid);
    if (rec) {
      setModStage(rec.moderationStage);
      setModHistVerif(rec.historical_verification);
      setModPubState(rec.publication_state);
    }
    if (rights) {
      setModRightsStatus(rights.rights_status);
      setModRightsOwner(rights.rightsOwner);
      setModLicense(rights.licenseType);
      setModLicenseUrl(rights.licenseUrl || '');
      setModUsageScope(rights.usageScope);
      setModAttribution(rights.attributionRequirement);
      setModEvidence(rights.permissionEvidence);
      setModPrivacyCleared(rights.privacyCleared);
    }
  };

  const applyModerationDecision = (
    action: 'Duyệt' | 'Cập nhật quyền công bố' | 'Ẩn tư liệu' | 'Từ chối'
  ) => {
    if (!canModerate) {
      onNotify('Vai trò hiện tại không có quyền phê duyệt hoặc đổi trạng thái công bố.');
      return;
    }

    const targetRec = db.media_records.find((r) => r.id === modRecordId);
    const prevRights = getRecordRights(db, modRecordId);
    const hasLinkedOrOrigin =
      Boolean(targetRec?.originUrl) || getRecordSources(db, modRecordId).length > 0;

    const now = new Date().toISOString();
    let finalRightsStatus: RightsStatus = modRightsStatus;
    let finalHistVerif: HistoricalVerificationStatus = modHistVerif;
    let finalPubState: PublicationState = modPubState;
    let finalStage: ModerationStage = modStage;

    if (action === 'Ẩn tư liệu') {
      finalPubState = 'hidden';
    } else if (action === 'Từ chối') {
      finalRightsStatus = 'prohibited';
      finalPubState = 'hidden';
      finalStage = 'Kiểm tra bản quyền';
    } else {
      // Strict safeguard: cannot mark permitted without license, evidence, source, and privacyCleared
      if (
        finalRightsStatus === 'permitted' &&
        (!modLicense.trim() ||
          modLicense.includes('Chưa') ||
          !modEvidence.trim() ||
          modEvidence.includes('Chưa') ||
          !hasLinkedOrOrigin ||
          !modPrivacyCleared)
      ) {
        onNotify(
          'Quy tắc pháp lý bắt buộc: Thiếu giấy phép, bằng chứng cấp phép, nguồn tham chiếu hoặc chưa xác nhận quyền riêng tư — hệ thống giữ ở trạng thái Chưa xác minh quyền sử dụng.'
        );
        finalRightsStatus = 'unverified';
        finalPubState = 'hidden';
        finalStage = 'Kiểm tra bản quyền';
      } else if (action === 'Duyệt' && finalRightsStatus === 'permitted') {
        finalPubState = 'published';
        finalStage = 'Xuất bản';
      }
      if (finalRightsStatus !== 'permitted' && finalPubState === 'published') {
        finalPubState = 'hidden';
      }
    }

    onUpdateDb((prev) => ({
      ...prev,
      media_records: prev.media_records.map((r) =>
        r.id === modRecordId
          ? {
              ...r,
              historical_verification: finalHistVerif,
              publication_state: finalPubState,
              moderationStage: finalStage,
              updated_at: now,
            }
          : r
      ),
      rights_records: prev.rights_records.map((rg) =>
        rg.recordId === modRecordId
          ? {
              ...rg,
              rightsOwner: modRightsOwner.trim() || rg.rightsOwner,
              rights_status: finalRightsStatus,
              licenseType: modLicense.trim() || rg.licenseType,
              licenseUrl: modLicenseUrl.trim() || undefined,
              usageScope: modUsageScope.trim() || rg.usageScope,
              attributionRequirement: modAttribution.trim() || rg.attributionRequirement,
              permissionEvidence: modEvidence.trim() || rg.permissionEvidence,
              privacyCleared: modPrivacyCleared,
              verifiedBy: currentUser.name,
              verifiedAt: now.slice(0, 10),
              updated_at: now,
            }
          : rg
      ),
      review_logs: [
        {
          id: `rev-${Date.now()}`,
          recordId: modRecordId,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action,
          stage: finalStage,
          previousRightsStatus: prevRights?.rights_status,
          newRightsStatus: finalRightsStatus,
          reasonNote:
            modReason.trim() ||
            `${action}: Quyền=${RIGHTS_STATUS_LABELS[finalRightsStatus]} | Xuất bản=${PUBLICATION_STATE_LABELS[finalPubState]}`,
          created_at: now,
          updated_at: now,
        },
        ...prev.review_logs,
      ],
    }));

    setModReason('');
    onNotify(`Đã lưu quyết định "${action}" và ghi nhật ký thay đổi quyền.`);
  };

  const handleSaveLocalityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onNotify('Chỉ Quản trị viên mới có quyền thay đổi cấu hình địa phương.');
      return;
    }
    onUpdateDb((prev) => ({
      ...prev,
      localityConfig: {
        ...prev.localityConfig,
        localityName: localityName.trim() || prev.localityConfig.localityName,
        administrativeRegion: adminRegion.trim(),
        curatorialStatement: curatorialNote.trim(),
        updated_at: new Date().toISOString(),
      },
    }));
    onNotify('Đã cập nhật cấu hình địa phương nghiên cứu.');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#D6CEBE] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
            Quản trị bảo tàng số · Vai trò: {ROLE_LABELS[currentUser.role]} ({currentUser.name})
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-1">
            Bảng điều khiển Quản trị & Kiểm định Nguồn
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenAuth}
          className="px-4 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#EBE6DF] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Chuyển vai trò làm việc
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D6CEBE] pb-4">
        {[
          { id: 'records' as AdminTab, label: 'Quản lý tư liệu & Lọc kiểm toán', icon: Database },
          { id: 'sources' as AdminTab, label: 'Quản lý nguồn tham khảo', icon: SlidersHorizontal },
          { id: 'moderation' as AdminTab, label: 'Quyền công bố & Nhật ký', icon: ShieldCheck },
          { id: 'ai' as AdminTab, label: 'AI Content Studio', icon: Sparkles },
          { id: 'config' as AdminTab, label: 'Cấu hình địa phương & Người dùng', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                  : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RECORDS & 8 MANDATORY ADMIN FILTERS */}
      {tab === 'records' && (
        <div className="space-y-8">
          {/* 8 Mandatory Admin Audit Filters */}
          <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-4 space-y-2.5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#78350F]">
              Bộ lọc kiểm tra & kiểm định hồ sơ ({visibleRecords.length} bản ghi khớp)
            </p>
            <div className="flex flex-wrap gap-2">
              {ADMIN_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAdminFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    adminFilter === f.id
                      ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                      : 'bg-[#F7F4EE] text-[#44403C] border-[#D6CEBE] hover:bg-[#EBE6DF]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create / Edit Form */}
            <form
              onSubmit={handleSaveRecord}
              className="lg:col-span-5 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4"
            >
              <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
                {editingRecordId ? 'Chỉnh sửa hồ sơ tư liệu' : 'Tiếp nhận tư liệu thực tế mới'}
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  Tên tư liệu *
                </label>
                <input
                  type="text"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="VD: Ảnh mặt tiền..."
                  className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  value={recDesc}
                  onChange={(e) => setRecDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Loại hình</label>
                  <select
                    value={recMediaType}
                    onChange={(e) => setRecMediaType(e.target.value as MediaType)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    <option value="image">Ảnh tư liệu</option>
                    <option value="map_document">Bản đồ & tài liệu</option>
                    <option value="video">Video</option>
                    <option value="audio">Bản ghi âm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Phân kỳ</label>
                  <select
                    value={recEra}
                    onChange={(e) => setRecEra(e.target.value as 'xua' | 'nay' | 'tu_lieu')}
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    <option value="xua">Ảnh xưa</option>
                    <option value="nay">Ảnh hiện nay</option>
                    <option value="tu_lieu">Tài liệu & bản đồ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Địa phương</label>
                  <input
                    type="text"
                    value={recLocality}
                    onChange={(e) => setRecLocality(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Địa danh</label>
                  <select
                    value={recLocationId}
                    onChange={(e) => setRecLocationId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    {db.locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Chủ đề</label>
                  <select
                    value={recCategoryId}
                    onChange={(e) => setRecCategoryId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    {db.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Phân loại nguồn dữ liệu</label>
                  <select
                    value={recProvenanceTier}
                    onChange={(e) =>
                      setRecProvenanceTier(e.target.value as DataProvenanceTier)
                    }
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    <option value="verified_real">Tư liệu thực tế đã xác minh</option>
                    <option value="partial_real">Tư liệu thực tế chưa xác minh đủ</option>
                    <option value="ai_suggested">Nội dung do AI đề xuất</option>
                    <option value="design_placeholder">Dữ liệu minh họa thiết kế</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Thời gian / Niên đại</label>
                  <input
                    type="text"
                    value={recDateText}
                    onChange={(e) => setRecDateText(e.target.value)}
                    placeholder="VD: 1926 hoặc Chưa xác định"
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tác giả / Người chụp</label>
                  <input
                    type="text"
                    value={recAuthor}
                    onChange={(e) => setRecAuthor(e.target.value)}
                    placeholder="Chưa xác định"
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Đơn vị lưu giữ / Cung cấp
                  </label>
                  <input
                    type="text"
                    value={recCustodian}
                    onChange={(e) => setRecCustodian(e.target.value)}
                    placeholder="Chưa được nguồn cung cấp"
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ngày truy cập nguồn</label>
                  <input
                    type="date"
                    value={recAccessedDate}
                    onChange={(e) => setRecAccessedDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Đường dẫn gốc trực tiếp tới trang tư liệu
                </label>
                <input
                  type="url"
                  value={recOriginUrl}
                  onChange={(e) => setRecOriginUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Gắn nhiều nguồn tham khảo ({recSourceIds.length} nguồn đã chọn)
                </label>
                <div className="max-h-32 overflow-y-auto border border-[#D6CEBE] bg-[#F7F4EE] p-2 space-y-1">
                  {db.sources.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recSourceIds.includes(s.id)}
                        onChange={() => toggleSourceSelection(s.id)}
                      />
                      <span className="font-mono text-[11px] text-[#78350F]">{s.code}</span>
                      <span className="truncate">{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Tệp media đã được cấp phép (tải lên hoặc URL)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs mb-2 block"
                />
                <input
                  type="text"
                  value={recMediaUrl}
                  onChange={(e) => setRecMediaUrl(e.target.value)}
                  placeholder="/archive-media/... hoặc URL hợp lệ"
                  className="w-full px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editingRecordId ? 'Lưu cập nhật' : 'Tiếp nhận hồ sơ'}
                </button>
                {editingRecordId && (
                  <button
                    type="button"
                    onClick={resetRecordForm}
                    className="px-4 py-2 text-xs border border-[#D6CEBE] cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* Existing Records Table + Pair Creator */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#FBF9F5] border border-[#D6CEBE] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#EBE6DF] border-b border-[#D6CEBE] font-mono uppercase text-[#44403C]">
                      <th className="py-3 px-3">Mã</th>
                      <th className="py-3 px-3">Tên tư liệu & Xuất xứ</th>
                      <th className="py-3 px-3">Quyền & Xuất bản</th>
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD3]">
                    {visibleRecords.map((rec) => {
                      const rights = getRecordRights(db, rec.id);
                      const srcCount = getRecordSources(db, rec.id).length;
                      return (
                        <tr key={rec.id} className="hover:bg-[#F7F4EE]">
                          <td className="py-2.5 px-3 font-mono text-[#78350F] whitespace-nowrap align-top">
                            {rec.code}
                          </td>
                          <td className="py-2.5 px-3 align-top space-y-0.5">
                            <p className="font-medium text-[#1C1917]">{rec.title}</p>
                            <p className="text-[11px] text-[#57534E]">
                              Tác giả: {rec.author} · Lưu giữ: {rec.custodianOrgOrPerson} ·{' '}
                              {srcCount} nguồn
                            </p>
                          </td>
                          <td className="py-2.5 px-3 align-top space-y-0.5">
                            <p
                              className={`font-medium ${
                                rights?.rights_status === 'permitted'
                                  ? 'text-[#14532D]'
                                  : 'text-[#9A3412]'
                              }`}
                            >
                              {rights
                                ? RIGHTS_STATUS_LABELS[rights.rights_status]
                                : 'Chưa xác minh'}
                            </p>
                            <p className="text-[11px] text-[#57534E]">
                              {HISTORICAL_VERIFICATION_LABELS[rec.historical_verification]} ·{' '}
                              {PUBLICATION_STATE_LABELS[rec.publication_state]}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap align-top space-x-2">
                            <button
                              type="button"
                              onClick={() => startEditRecord(rec)}
                              className="inline-flex items-center gap-1 text-[#5C3D2E] hover:text-[#1C1917] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Sửa
                            </button>
                            {canModerate && rec.publication_state === 'published' && (
                              <button
                                type="button"
                                onClick={() => handleHideRecordQuick(rec.id)}
                                className="inline-flex items-center gap-1 text-[#78350F] hover:text-[#1C1917] cursor-pointer"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Ẩn
                              </button>
                            )}
                            {canModerate && (
                              <button
                                type="button"
                                onClick={() => handleArchiveRecord(rec.id)}
                                className="inline-flex items-center gap-1 text-[#9A3412] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Lưu trữ
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pair Before / After */}
              <form
                onSubmit={handlePairComparison}
                className="bg-[#FBF9F5] border border-[#D6CEBE] p-5 space-y-4"
              >
                <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                  Gắn cặp ảnh Xưa và Nay (Bắt buộc cùng địa điểm)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={pairOldId}
                    onChange={(e) => setPairOldId(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    <option value="">Chọn ảnh xưa...</option>
                    {db.media_records
                      .filter((r) => r.mediaType === 'image' && !r.isArchived)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} ({r.locationId})
                        </option>
                      ))}
                  </select>
                  <select
                    value={pairNewId}
                    onChange={(e) => setPairNewId(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    <option value="">Chọn ảnh hiện nay (tùy chọn)...</option>
                    {db.media_records
                      .filter((r) => r.mediaType === 'image' && !r.isArchived)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} ({r.locationId})
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    value={pairTitle}
                    onChange={(e) => setPairTitle(e.target.value)}
                    placeholder="Tên cặp đối chiếu..."
                    className="px-2.5 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-[#9A6B2F] text-[#FAF8F4] cursor-pointer"
                >
                  Tạo cặp đối chiếu
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOURCES */}
      {tab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateSource}
            className="lg:col-span-4 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4"
          >
            <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
              Thêm nguồn tham khảo mới
            </h2>
            <div>
              <label className="block text-xs font-medium mb-1">Mã nguồn *</label>
              <input
                type="text"
                value={srcCode}
                onChange={(e) => setSrcCode(e.target.value)}
                placeholder="VD: NGUON-NLV-01"
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tên tài liệu / Nguồn *</label>
              <input
                type="text"
                value={srcTitle}
                onChange={(e) => setSrcTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tác giả / Đơn vị phát hành</label>
              <input
                type="text"
                value={srcPublisher}
                onChange={(e) => setSrcPublisher(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Loại nguồn</label>
              <select
                value={srcType}
                onChange={(e) =>
                  setSrcType(e.target.value as SourceRecord['sourceType'])
                }
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              >
                <option value="Cơ quan lưu trữ nhà nước">Cơ quan lưu trữ nhà nước</option>
                <option value="Thư viện">Thư viện</option>
                <option value="Bảo tàng">Bảo tàng</option>
                <option value="Kho lưu trữ đại học">Kho lưu trữ đại học</option>
                <option value="Bộ sưu tập mở / Wikimedia Commons">
                  Bộ sưu tập mở / Wikimedia Commons
                </option>
                <option value="Ấn phẩm / Nghiên cứu">Ấn phẩm / Nghiên cứu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">URL nguồn</label>
              <input
                type="url"
                value={srcUrl}
                onChange={(e) => setSrcUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ghi chú quyền sử dụng</label>
              <input
                type="text"
                value={srcRightsNote}
                onChange={(e) => setSrcRightsNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] cursor-pointer"
            >
              Lưu nguồn tham khảo
            </button>
          </form>

          <div className="lg:col-span-8 bg-[#FBF9F5] border border-[#D6CEBE] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EBE6DF] border-b border-[#D6CEBE] font-mono uppercase text-[#44403C]">
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Tên tài liệu & URL</th>
                  <th className="py-3 px-4">Đơn vị phát hành</th>
                  <th className="py-3 px-4 text-right">Bản ghi liên kết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3]">
                {db.sources.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-mono text-[#78350F]">{s.code}</td>
                    <td className="py-3 px-4 space-y-1">
                      <p className="font-medium text-[#1C1917]">{s.title}</p>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#9A6B2F] hover:underline"
                        >
                          {s.url} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#57534E]">{s.authorOrPublisher}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {db.record_sources.filter((rs) => rs.sourceId === s.id).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MODERATION & PUBLICATION RIGHTS */}
      {tab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-[#FBF9F5] border border-[#D6CEBE] p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-[#1C1917]">
              Chọn hồ sơ cần kiểm duyệt bản quyền
            </h2>
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {db.media_records
                .filter((r) => !r.isArchived)
                .map((rec) => {
                  const rights = getRecordRights(db, rec.id);
                  const active = rec.id === modRecordId;
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => selectRecordForModeration(rec.id)}
                      className={`w-full text-left p-3 border text-xs transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                          : 'bg-[#F7F4EE] text-[#1C1917] border-[#E5DFD3] hover:bg-[#EBE6DF]'
                      }`}
                    >
                      <div className="flex justify-between gap-2 font-mono text-[11px]">
                        <span className={active ? 'text-[#D4A76A]' : 'text-[#78350F]'}>
                          {rec.code}
                        </span>
                        <span>{PUBLICATION_STATE_LABELS[rec.publication_state]}</span>
                      </div>
                      <p className="font-medium mt-1">{rec.title}</p>
                      <p className={`mt-1 ${active ? 'text-stone-300' : 'text-[#57534E]'}`}>
                        {rights
                          ? RIGHTS_STATUS_LABELS[rights.rights_status]
                          : 'Chưa xác minh quyền sử dụng'}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
              <div className="border-b border-[#E5DFD3] pb-3">
                <p className="text-xs font-mono uppercase text-[#9A6B2F]">
                  Kiểm soát bản quyền tách biệt · Không tự động cấp phép khi thiếu bằng chứng
                </p>
                <h2 className="font-serif text-xl font-semibold text-[#1C1917] mt-1">
                  Cập nhật Quyền sử dụng, Xác minh lịch sử & Xuất bản
                </h2>
              </div>

              {!canModerate && (
                <p className="text-xs text-[#9A3412] bg-[#9A3412]/10 p-3 border border-[#9A3412]">
                  Vai trò Người đóng góp chỉ được xem trạng thái. Cần vai trò Biên tập viên hoặc Quản trị viên để phê duyệt.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Quyền sử dụng (rights_status)
                  </label>
                  <select
                    value={modRightsStatus}
                    onChange={(e) => setModRightsStatus(e.target.value as RightsStatus)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    {RIGHTS_OPTIONS.map((op) => (
                      <option key={op} value={op}>
                        {RIGHTS_STATUS_LABELS[op]} ({op})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Xác minh lịch sử (historical_verification)
                  </label>
                  <select
                    value={modHistVerif}
                    onChange={(e) =>
                      setModHistVerif(e.target.value as HistoricalVerificationStatus)
                    }
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    {HIST_VERIF_OPTIONS.map((hv) => (
                      <option key={hv} value={hv}>
                        {HISTORICAL_VERIFICATION_LABELS[hv]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Trạng thái xuất bản (publication_state)
                  </label>
                  <select
                    value={modPubState}
                    onChange={(e) => setModPubState(e.target.value as PublicationState)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    {PUB_STATE_OPTIONS.map((ps) => (
                      <option key={ps} value={ps}>
                        {PUBLICATION_STATE_LABELS[ps]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Bước quy trình</label>
                  <select
                    value={modStage}
                    onChange={(e) => setModStage(e.target.value as ModerationStage)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Chủ sở hữu quyền</label>
                  <input
                    type="text"
                    value={modRightsOwner}
                    onChange={(e) => setModRightsOwner(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Giấy phép sử dụng</label>
                  <input
                    type="text"
                    value={modLicense}
                    onChange={(e) => setModLicense(e.target.value)}
                    placeholder="VD: Public Domain hoặc CC BY-SA 4.0"
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    URL văn bản giấy phép (nếu có)
                  </label>
                  <input
                    type="url"
                    value={modLicenseUrl}
                    onChange={(e) => setModLicenseUrl(e.target.value)}
                    placeholder="https://creativecommons.org/..."
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Bằng chứng cho phép sử dụng
                  </label>
                  <input
                    type="text"
                    value={modEvidence}
                    onChange={(e) => setModEvidence(e.target.value)}
                    placeholder="Link Wikimedia Commons / Công văn đồng ý..."
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Phạm vi sử dụng & Ghi công</label>
                <input
                  type="text"
                  value={modUsageScope}
                  onChange={(e) => setModUsageScope(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={modPrivacyCleared}
                  onChange={(e) => setModPrivacyCleared(e.target.checked)}
                />
                Xác nhận không vi phạm quyền riêng tư / hình ảnh cá nhân nhạy cảm
              </label>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Lý do / Ghi chú nhật ký thay đổi
                </label>
                <textarea
                  rows={2}
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="Ghi rõ căn cứ cấp phép, thay đổi trạng thái hoặc lý do tạm ẩn..."
                  className="w-full p-2.5 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={!canModerate}
                  onClick={() => applyModerationDecision('Duyệt')}
                  className="px-4 py-2 text-xs font-medium bg-[#14532D] text-[#FAF8F4] disabled:opacity-40 cursor-pointer"
                >
                  Duyệt & Lưu quyền công bố
                </button>
                <button
                  type="button"
                  disabled={!canModerate}
                  onClick={() => applyModerationDecision('Cập nhật quyền công bố')}
                  className="px-4 py-2 text-xs font-medium bg-[#9A6B2F] text-[#FAF8F4] disabled:opacity-40 cursor-pointer"
                >
                  Lưu thay đổi trạng thái
                </button>
                <button
                  type="button"
                  disabled={!canModerate}
                  onClick={() => applyModerationDecision('Ẩn tư liệu')}
                  className="px-4 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F7F4EE] disabled:opacity-40 cursor-pointer"
                >
                  Ẩn tư liệu khi có sai sót
                </button>
                <button
                  type="button"
                  disabled={!canModerate}
                  onClick={() => applyModerationDecision('Từ chối')}
                  className="px-4 py-2 text-xs font-medium bg-[#9A3412] text-[#FAF8F4] disabled:opacity-40 cursor-pointer"
                >
                  Không được phép công bố (prohibited)
                </button>
              </div>
            </div>

            {/* Audit Review Logs */}
            <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-3">
              <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                Nhật ký thay đổi quyền & kiểm duyệt ({db.review_logs.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {db.review_logs.slice(0, 15).map((log) => (
                  <div key={log.id} className="p-3 bg-[#F7F4EE] border border-[#E5DFD3] text-xs">
                    <div className="flex justify-between font-mono text-[11px] text-[#78350F]">
                      <span>
                        {log.action} · {log.stage}
                        {log.newRightsStatus ? ` → ${log.newRightsStatus}` : ''}
                      </span>
                      <span>{log.created_at.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-[#1C1917] mt-1">{log.reasonNote}</p>
                    <p className="text-[#57534E] mt-0.5">
                      Thực hiện: {log.actorName} ({ROLE_LABELS[log.actorRole]})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI CONTENT STUDIO */}
      {tab === 'ai' && (
        <AiContentStudio
          db={db}
          currentUser={currentUser}
          onSaveDraft={(draft: AiAnalysisDraft) => {
            onUpdateDb((prev) => ({
              ...prev,
              ai_analysis: [draft, ...prev.ai_analysis],
            }));
          }}
          onUpdateDraft={(draftId, patch) => {
            onUpdateDb((prev) => ({
              ...prev,
              ai_analysis: prev.ai_analysis.map((d) =>
                d.id === draftId ? { ...d, ...patch, updated_at: new Date().toISOString() } : d
              ),
            }));
          }}
          onApplyDraftToRecord={(recordId, description, keywords) => {
            onUpdateDb((prev) => ({
              ...prev,
              media_records: prev.media_records.map((r) =>
                r.id === recordId
                  ? {
                      ...r,
                      description,
                      keywords: keywords && keywords.length > 0 ? keywords : r.keywords,
                      updated_at: new Date().toISOString(),
                    }
                  : r
              ),
            }));
            onNotify('Đã chép nội dung kiểm duyệt từ bản nháp AI vào hồ sơ tư liệu.');
          }}
          onNotify={onNotify}
        />
      )}

      {/* TAB 5: CONFIG & USERS */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveLocalityConfig}
            className="lg:col-span-6 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4"
          >
            <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
              Cấu hình địa phương nghiên cứu
            </h2>
            <p className="text-xs text-[#57534E]">
              Tên địa phương nghiên cứu được cấu hình tập trung tại đây để bảo đảm tính nhất quán trên toàn bộ bảo tàng số.
            </p>

            <div>
              <label className="block text-xs font-medium mb-1">Tên địa phương nghiên cứu</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={localityName}
                onChange={(e) => setLocalityName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Đơn vị hành chính / Vùng</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={adminRegion}
                onChange={(e) => setAdminRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Tuyên ngôn giám tuyển</label>
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={curatorialNote}
                onChange={(e) => setCuratorialNote(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#F7F4EE] border border-[#D6CEBE] disabled:opacity-60"
              />
            </div>

            <div className="pt-2 border-t border-[#E5DFD3] space-y-2.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={db.localityConfig.emptyStateTest}
                  onChange={(e) =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      localityConfig: {
                        ...prev.localityConfig,
                        emptyStateTest: e.target.checked,
                      },
                    }))
                  }
                />
                Bật chế độ kiểm thử trạng thái rỗng (Hiển thị 0 bản ghi trên toàn website)
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={!isAdmin}
                className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FAF8F4] disabled:opacity-40 cursor-pointer"
              >
                Lưu cấu hình địa phương
              </button>
              <button
                type="button"
                disabled={!isAdmin}
                onClick={onResetArchive}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F7F4EE] disabled:opacity-40 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục kho dữ liệu chuẩn gốc
              </button>
            </div>
          </form>

          {/* Users & Roles */}
          <div className="lg:col-span-6 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9A6B2F]" />
              <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
                Quản lý người dùng & Phân quyền
              </h2>
            </div>

            <div className="space-y-3">
              {db.users.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 bg-[#F7F4EE] border border-[#E5DFD3] flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-medium text-[#1C1917]">{u.name}</p>
                    <p className="text-[#57534E]">
                      {u.email} · {u.organization}
                    </p>
                  </div>
                  <select
                    disabled={!isAdmin}
                    value={u.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      onUpdateDb((prev) => ({
                        ...prev,
                        users: prev.users.map((usr) =>
                          usr.id === u.id ? { ...usr, role: nextRole } : usr
                        ),
                      }));
                      onNotify(
                        `Đã cập nhật vai trò của ${u.name} thành ${ROLE_LABELS[nextRole]}.`
                      );
                    }}
                    className="px-2.5 py-1.5 bg-[#FBF9F5] border border-[#D6CEBE] text-xs disabled:opacity-50"
                  >
                    <option value="member">Thành viên</option>
                    <option value="contributor">Người đóng góp tư liệu</option>
                    <option value="editor">Biên tập viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
