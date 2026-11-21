export type UserRole =
  | 'guest'
  | 'member'
  | 'contributor'
  | 'editor'
  | 'admin';

export type MediaType = 'image' | 'video' | 'audio' | 'map_document';

export type ImageEra = 'xua' | 'nay' | 'tu_lieu';

/**
 * 5 trạng thái kiểm soát quyền công bố bắt buộc (Mục IV)
 */
export type RightsStatus =
  | 'permitted'
  | 'research_only'
  | 'permission_pending'
  | 'unverified'
  | 'prohibited';

/**
 * Mức độ xác minh thông tin lịch sử (Tách biệt khỏi quyền sử dụng)
 */
export type HistoricalVerificationStatus =
  | 'verified'
  | 'partial'
  | 'unverified';

/**
 * Trạng thái xuất bản trên cổng thông tin
 */
export type PublicationState = 'published' | 'hidden' | 'draft';

/**
 * Phân loại nguồn gốc dữ liệu (Mục I.8)
 */
export type DataProvenanceTier =
  | 'verified_real'
  | 'partial_real'
  | 'design_placeholder'
  | 'ai_suggested';

export type ModerationStage =
  | 'Tiếp nhận tư liệu'
  | 'Kiểm tra nguồn gốc'
  | 'Xác minh thông tin lịch sử'
  | 'Kiểm tra bản quyền'
  | 'Duyệt nội dung'
  | 'Xuất bản';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  locality: string;
  area: string;
  addressOrNote: string;
  coordinatesVerified: boolean;
  lat?: number;
  lng?: number;
  mapX: number; // Percentage 0-100 on local diagram
  mapY: number;
  description: string;
  sourceReference?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  recordId: string;
  fileType: MediaType;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  resolutionOrQuality: string;
  materialFormatState: string; // Bản gốc / Bản sao / Bản số hóa
  transcriptOrAudioNote?: string;
  created_at: string;
  updated_at: string;
}

export interface SourceRecord {
  id: string;
  code: string;
  title: string;
  authorOrPublisher: string;
  sourceType:
    | 'Cơ quan lưu trữ nhà nước'
    | 'Thư viện'
    | 'Bảo tàng'
    | 'Kho lưu trữ đại học'
    | 'Bộ sưu tập mở / Wikimedia Commons'
    | 'Ấn phẩm / Nghiên cứu';
  url?: string;
  publishedDate?: string;
  accessedDate?: string;
  relatedContent: string;
  usageRightsNote: string;
  historicalVerification: HistoricalVerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface RecordSourceLink {
  id: string;
  recordId: string;
  sourceId: string;
  directItemUrl?: string;
  citationNote: string;
  created_at: string;
  updated_at: string;
}

export interface RightsRecord {
  id: string;
  recordId: string;
  rightsOwner: string;
  licenseType: string;
  licenseUrl?: string;
  rights_status: RightsStatus;
  usageScope: string;
  attributionRequirement: string;
  permissionEvidence: string;
  privacyCleared: boolean;
  verifiedBy: string;
  verifiedAt: string;
  created_at: string;
  updated_at: string;
}

export interface MediaRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  localityName: string;
  locationId: string;
  specificPlace: string;
  categoryId: string;
  eraLabel: string;
  historicalPeriod: string;
  captureYear?: number;
  captureDateText: string;
  createdDateText: string;
  author: string;
  contributor: string;
  mediaType: MediaType;
  imageEra?: ImageEra;
  audiovisualSubType?:
    | 'Video lịch sử'
    | 'Phóng sự'
    | 'Phỏng vấn nhân chứng'
    | 'Lời kể người dân'
    | 'Bản ghi âm'
    | 'Âm thanh môi trường'
    | 'Tư liệu sự kiện';
  // Historical info
  historicalContext: string;
  relatedEvent: string;
  architectureOrSpaceNote: string;
  observedChanges: string;
  localSignificance: string;
  // Provenance info (15 mandatory fields coverage)
  custodianOrgOrPerson: string;
  collectionName: string;
  originUrl?: string;
  accessedDate?: string;
  materialFormatState?: string;
  referenceDocumentNote: string;
  receivedDate: string;
  enteredBy: string;
  // 3 separated status groups + provenance tier
  historical_verification: HistoricalVerificationStatus;
  publication_state: PublicationState;
  data_provenance_tier: DataProvenanceTier;
  moderationStage: ModerationStage;
  isArchived?: boolean;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  periodLabel: string;
  yearRange: string;
  title: string;
  summary: string;
  sourceIds: string[];
  recordIds: string[];
  created_at: string;
  updated_at: string;
}

export interface ComparisonPair {
  id: string;
  title: string;
  locationId: string;
  oldRecordId: string;
  newRecordId?: string;
  changeSummary: string;
  architecturalNotes: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  categoryFilter?: string;
  eraFilter?: ImageEra;
  mediaTypeFilter?: MediaType;
  coverRecordId?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricalStory {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  author: string;
  publishedDate: string;
  leadRecordId: string;
  excerpt: string;
  bodyParagraphs: string[];
  recordIds: string[];
  sourceIds: string[];
  verificationNote: string;
  created_at: string;
  updated_at: string;
}

export interface AiAnalysisDraft {
  id: string;
  analysisType: 'image_analysis' | 'document_analysis' | 'editorial_assist';
  title: string;
  relatedRecordId?: string;
  relatedSourceId?: string;
  inputSummary: string;
  outputJson: Record<string, unknown>;
  aiSuggested: true;
  data_provenance_tier: 'ai_suggested';
  modelUsed: string;
  status: 'draft' | 'reviewed' | 'rejected';
  reviewerNote?: string;
  createdBy: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewLog {
  id: string;
  recordId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'Duyệt'
    | 'Từ chối'
    | 'Yêu cầu bổ sung'
    | 'Chuyển chờ xác minh'
    | 'Tiếp nhận'
    | 'Cập nhật hồ sơ'
    | 'Cập nhật quyền công bố'
    | 'Ẩn tư liệu';
  stage: ModerationStage;
  previousRightsStatus?: RightsStatus;
  newRightsStatus?: RightsStatus;
  reasonNote: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceDirectory {
  id: string;
  name: string;
  managingOrganization: string;
  url: string;
  purpose: string;
  scopeNote: string;
  acquisitionState: string;
}

export interface LocalityConfig {
  localityName: string;
  administrativeRegion: string;
  projectTitle: string;
  curatorialStatement: string;
  emptyStateTest: boolean;
  updated_at: string;
}

export interface ArchiveDatabase {
  schemaVersion: number;
  localityConfig: LocalityConfig;
  users: User[];
  categories: Category[];
  locations: Location[];
  media_records: MediaRecord[];
  media_files: MediaFile[];
  sources: SourceRecord[];
  record_sources: RecordSourceLink[];
  rights_records: RightsRecord[];
  timelines: TimelineEntry[];
  comparisons: ComparisonPair[];
  collections: CollectionItem[];
  stories: HistoricalStory[];
  ai_analysis: AiAnalysisDraft[];
  review_logs: ReviewLog[];
  reference_directories: ReferenceDirectory[];
}

export interface ArchiveStatistics {
  totalRecords: number;
  verifiedImageCount: number;
  imageCount: number;
  videoCount: number;
  audioCount: number;
  mapDocumentCount: number;
  audiovisualCount: number;
  localitiesCount: number;
  totalLocations: number;
  totalSources: number;
  verifiedHistoricalCount: number;
  permittedCount: number;
  researchOnlyCount: number;
  permissionPendingCount: number;
  unverifiedRightsCount: number;
  prohibitedCount: number;
  restrictedTotalCount: number;
  pendingVerificationCount: number;
  missingSourceCount: number;
  missingAuthorOrCustodianCount: number;
}
