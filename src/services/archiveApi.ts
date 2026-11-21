import {
  ArchiveDatabase,
  ArchiveStatistics,
  DataProvenanceTier,
  HistoricalVerificationStatus,
  MediaRecord,
  PublicationState,
  RightsRecord,
  RightsStatus,
  SourceRecord,
  UserRole,
} from '../types/archive';

const STORAGE_KEY = 'local_heritage_museum_archive_v2_verified';

export const API_ENDPOINTS_BLUEPRINT = {
  records: '/api/v1/media-records',
  sources: '/api/v1/sources',
  rights: '/api/v1/rights-records',
  comparisons: '/api/v1/comparisons',
  reviews: '/api/v1/review-logs',
  aiDrafts: '/api/v1/ai-analysis',
  reports: '/api/v1/reports/inventory',
};

export const RIGHTS_STATUS_LABELS: Record<RightsStatus, string> = {
  permitted: 'Đã xác nhận được phép công bố',
  research_only: 'Chỉ được sử dụng cho nghiên cứu',
  permission_pending: 'Đang chờ cấp phép',
  unverified: 'Chưa xác minh quyền sử dụng',
  prohibited: 'Không được phép công bố',
};

export const HISTORICAL_VERIFICATION_LABELS: Record<HistoricalVerificationStatus, string> = {
  verified: 'Đã xác minh thông tin lịch sử',
  partial: 'Tư liệu thực tế (Chưa xác minh đầy đủ)',
  unverified: 'Chưa có tư liệu xác minh',
};

export const PUBLICATION_STATE_LABELS: Record<PublicationState, string> = {
  published: 'Đã xuất bản công khai',
  hidden: 'Tạm ẩn khỏi công chúng',
  draft: 'Bản nháp nội bộ',
};

export const PROVENANCE_TIER_LABELS: Record<DataProvenanceTier, string> = {
  verified_real: 'Tư liệu thực tế đã xác minh',
  partial_real: 'Tư liệu thực tế (Chưa xác minh đầy đủ)',
  design_placeholder: 'Dữ liệu minh họa phục vụ thiết kế',
  ai_suggested: 'Nội dung do AI đề xuất',
};

export function loadArchiveFromStorage(seedData: ArchiveDatabase): ArchiveDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }
    const parsed = JSON.parse(raw) as ArchiveDatabase;
    if (
      !parsed ||
      parsed.schemaVersion !== seedData.schemaVersion ||
      !Array.isArray(parsed.media_records) ||
      !parsed.localityConfig
    ) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }
    return parsed;
  } catch {
    return seedData;
  }
}

export function saveArchiveToStorage(db: ArchiveDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetArchiveStorage(seedData: ArchiveDatabase): ArchiveDatabase {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  } catch {
    // Ignore storage errors
  }
  return seedData;
}

export function getActiveRecords(db: ArchiveDatabase): MediaRecord[] {
  if (db.localityConfig.emptyStateTest) {
    return [];
  }
  return db.media_records.filter((r) => !r.isArchived);
}

/**
 * Chỉ các tư liệu thực tế (không phải placeholder thiết kế) mới được tính vào thống kê bảo tàng
 */
export function getRealCatalogRecords(db: ArchiveDatabase): MediaRecord[] {
  return getActiveRecords(db).filter((r) => r.data_provenance_tier !== 'design_placeholder');
}

export function getActiveSources(db: ArchiveDatabase): SourceRecord[] {
  if (db.localityConfig.emptyStateTest) {
    return [];
  }
  return db.sources;
}

export function getRecordRights(db: ArchiveDatabase, recordId: string): RightsRecord | undefined {
  return db.rights_records.find((r) => r.recordId === recordId);
}

export function getRecordSources(db: ArchiveDatabase, recordId: string): SourceRecord[] {
  const sourceIds = new Set(
    db.record_sources.filter((rs) => rs.recordId === recordId).map((rs) => rs.sourceId)
  );
  return db.sources.filter((s) => sourceIds.has(s.id));
}

export function isRecordMissingAuthorOrCustodian(record: MediaRecord): boolean {
  const emptyVal = (v?: string) =>
    !v ||
    !v.trim() ||
    v === 'Chưa xác định' ||
    v === 'Chưa được nguồn cung cấp';
  return emptyVal(record.author) || emptyVal(record.custodianOrgOrPerson);
}

export function isRecordMissingSource(db: ArchiveDatabase, record: MediaRecord): boolean {
  const linked = getRecordSources(db, record.id);
  return linked.length === 0 || !record.originUrl;
}

/**
 * Quy tắc IV.1 & IV.2:
 * Chỉ tư liệu có rights_status === 'permitted', publication_state === 'published',
 * không phải placeholder và privacyCleared === true mới được đưa tệp gốc lên khu vực công khai.
 */
export function isRecordPubliclyDisplayable(db: ArchiveDatabase, record: MediaRecord): boolean {
  const rights = getRecordRights(db, record.id);
  if (!rights) return false;
  return (
    rights.rights_status === 'permitted' &&
    record.publication_state === 'published' &&
    record.data_provenance_tier !== 'design_placeholder' &&
    rights.privacyCleared
  );
}

export function canUserAccessMediaFile(
  db: ArchiveDatabase,
  record: MediaRecord,
  role: UserRole
): boolean {
  const file = db.media_files.find((f) => f.recordId === record.id);
  if (!file || !file.url) return false;
  if (isRecordPubliclyDisplayable(db, record)) {
    return true;
  }
  const rights = getRecordRights(db, record.id);
  if (!rights) return false;
  if (role === 'admin' || role === 'editor') {
    return rights.rights_status !== 'prohibited' || role === 'admin';
  }
  return false;
}

export function computeArchiveStatistics(
  db: ArchiveDatabase,
  filteredRecords?: MediaRecord[]
): ArchiveStatistics {
  if (db.localityConfig.emptyStateTest) {
    return {
      totalRecords: 0,
      verifiedImageCount: 0,
      imageCount: 0,
      videoCount: 0,
      audioCount: 0,
      mapDocumentCount: 0,
      audiovisualCount: 0,
      localitiesCount: 0,
      totalLocations: 0,
      totalSources: 0,
      verifiedHistoricalCount: 0,
      permittedCount: 0,
      researchOnlyCount: 0,
      permissionPendingCount: 0,
      unverifiedRightsCount: 0,
      prohibitedCount: 0,
      restrictedTotalCount: 0,
      pendingVerificationCount: 0,
      missingSourceCount: 0,
      missingAuthorOrCustodianCount: 0,
    };
  }

  const records = filteredRecords ?? getRealCatalogRecords(db);
  const recordIds = new Set(records.map((r) => r.id));

  let uniqueSourceIds: Set<string>;
  if (!filteredRecords) {
    uniqueSourceIds = new Set(db.sources.map((s) => s.id));
  } else {
    uniqueSourceIds = new Set(
      db.record_sources
        .filter((link) => recordIds.has(link.recordId))
        .map((link) => link.sourceId)
    );
  }

  const uniqueLocationIds = new Set(records.map((r) => r.locationId));
  const uniqueLocalities = new Set(records.map((r) => r.localityName).filter(Boolean));

  let imageCount = 0;
  let verifiedImageCount = 0;
  let videoCount = 0;
  let audioCount = 0;
  let mapDocumentCount = 0;
  let verifiedHistoricalCount = 0;
  let permittedCount = 0;
  let researchOnlyCount = 0;
  let permissionPendingCount = 0;
  let unverifiedRightsCount = 0;
  let prohibitedCount = 0;
  let pendingVerificationCount = 0;
  let missingSourceCount = 0;
  let missingAuthorOrCustodianCount = 0;

  for (const record of records) {
    const rights = getRecordRights(db, record.id);
    const rStatus: RightsStatus = rights?.rights_status ?? 'unverified';

    if (record.mediaType === 'image') {
      imageCount += 1;
      if (record.historical_verification === 'verified' && rStatus === 'permitted') {
        verifiedImageCount += 1;
      }
    }
    if (record.mediaType === 'video') videoCount += 1;
    if (record.mediaType === 'audio') audioCount += 1;
    if (record.mediaType === 'map_document') mapDocumentCount += 1;

    if (record.historical_verification === 'verified') {
      verifiedHistoricalCount += 1;
    }
    if (
      record.historical_verification !== 'verified' ||
      rStatus === 'unverified' ||
      rStatus === 'permission_pending'
    ) {
      pendingVerificationCount += 1;
    }

    if (isRecordMissingSource(db, record)) missingSourceCount += 1;
    if (isRecordMissingAuthorOrCustodian(record)) missingAuthorOrCustodianCount += 1;

    switch (rStatus) {
      case 'permitted':
        permittedCount += 1;
        break;
      case 'research_only':
        researchOnlyCount += 1;
        break;
      case 'permission_pending':
        permissionPendingCount += 1;
        break;
      case 'unverified':
        unverifiedRightsCount += 1;
        break;
      case 'prohibited':
        prohibitedCount += 1;
        break;
    }
  }

  return {
    totalRecords: records.length,
    verifiedImageCount,
    imageCount,
    videoCount,
    audioCount,
    mapDocumentCount,
    audiovisualCount: videoCount + audioCount,
    localitiesCount: uniqueLocalities.size,
    totalLocations: uniqueLocationIds.size,
    totalSources: uniqueSourceIds.size,
    verifiedHistoricalCount,
    permittedCount,
    researchOnlyCount,
    permissionPendingCount,
    unverifiedRightsCount,
    prohibitedCount,
    restrictedTotalCount:
      researchOnlyCount + permissionPendingCount + unverifiedRightsCount + prohibitedCount,
    pendingVerificationCount,
    missingSourceCount,
    missingAuthorOrCustodianCount,
  };
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsvFile(filename: string, headers: string[], rows: unknown[][]): void {
  const bom = '\uFEFF';
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  guest: 'Khách truy cập',
  member: 'Thành viên',
  contributor: 'Người đóng góp tư liệu',
  editor: 'Biên tập viên',
  admin: 'Quản trị viên',
};

export function hasAdminAccess(role: UserRole): boolean {
  return role === 'admin' || role === 'editor' || role === 'contributor';
}

export function canModerateAndPublish(role: UserRole): boolean {
  return role === 'admin' || role === 'editor';
}

export function canManageUsersAndConfig(role: UserRole): boolean {
  return role === 'admin';
}
