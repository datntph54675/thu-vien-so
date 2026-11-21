import React, { useState } from 'react';
import { Sparkles, FileText, Image as ImageIcon, PenTool, CheckCircle2, XCircle, Loader2, Save } from 'lucide-react';
import { AiAnalysisDraft, ArchiveDatabase, User } from '../types/archive';

interface AiContentStudioProps {
  db: ArchiveDatabase;
  currentUser: User;
  onSaveDraft: (draft: AiAnalysisDraft) => void;
  onUpdateDraft: (draftId: string, patch: Partial<AiAnalysisDraft>) => void;
  onApplyDraftToRecord: (recordId: string, description: string, keywords?: string[]) => void;
  onNotify: (msg: string) => void;
}

type StudioTab = 'image' | 'document' | 'editorial' | 'vault';

export const AiContentStudio: React.FC<AiContentStudioProps> = ({
  db,
  currentUser,
  onSaveDraft,
  onUpdateDraft,
  onApplyDraftToRecord,
  onNotify,
}) => {
  const [tab, setTab] = useState<StudioTab>('image');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Image analysis state
  const [selectedRecordIdForImg, setSelectedRecordIdForImg] = useState<string>(
    db.media_records.find((r) => {
      const f = db.media_files.find((mf) => mf.recordId === r.id);
      return (r.mediaType === 'image' || r.mediaType === 'map_document') && Boolean(f?.url);
    })?.id || ''
  );
  const [uploadedImgBase64, setUploadedImgBase64] = useState<string>('');
  const [uploadedImgMime, setUploadedImgMime] = useState<string>('image/jpeg');
  const [imgContextNote, setImgContextNote] = useState('');

  // 2. Document analysis state
  const [docUrl, setDocUrl] = useState('');
  const [docText, setDocText] = useState('');

  // 3. Editorial assist state
  const [editorialTask, setEditorialTask] = useState('Viết mô tả tư liệu');
  const [selectedRecordIdForEdit, setSelectedRecordIdForEdit] = useState<string>(
    db.media_records[0]?.id || ''
  );
  const [extraSourceNotes, setExtraSourceNotes] = useState('');

  // Vault inspection
  const [activeDraftId, setActiveDraftId] = useState<string>(db.ai_analysis[0]?.id || '');
  const [reviewerNoteInput, setReviewerNoteInput] = useState('');
  const [editedDraftText, setEditedDraftText] = useState('');

  const activeDraft =
    db.ai_analysis.find((d) => d.id === activeDraftId) || db.ai_analysis[0];

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImgMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImgBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDocText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const runImageAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const targetRecord = db.media_records.find((r) => r.id === selectedRecordIdForImg);
      const targetFile = db.media_files.find((f) => f.recordId === selectedRecordIdForImg);

      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImgBase64 || undefined,
          mimeType: uploadedImgMime,
          assetUrl: !uploadedImgBase64 ? targetFile?.url : undefined,
          contextNote: imgContextNote || targetRecord?.title || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể phân tích hình ảnh.');
      }

      const now = new Date().toISOString();
      const newDraft: AiAnalysisDraft = {
        id: `ai-${Date.now()}`,
        analysisType: 'image_analysis',
        title: `Phân tích ảnh: ${uploadedImgBase64 ? 'Ảnh tải lên mới' : targetRecord?.code || 'Tư liệu'}`,
        relatedRecordId: !uploadedImgBase64 ? selectedRecordIdForImg : undefined,
        inputSummary: imgContextNote || targetRecord?.title || 'Ảnh tải lên từ máy',
        outputJson: data.result,
        aiSuggested: true,
        data_provenance_tier: 'ai_suggested',
        modelUsed: data.model || 'gemini-4-hydrogen',
        status: 'draft',
        createdBy: currentUser.name,
        created_at: now,
        updated_at: now,
      };

      onSaveDraft(newDraft);
      setActiveDraftId(newDraft.id);
      setEditedDraftText(JSON.stringify(data.result, null, 2));
      setTab('vault');
      onNotify('Đã phân tích ảnh và tự động lưu bản nháp vào kho ai_analysis.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    } finally {
      setLoading(false);
    }
  };

  const runDocumentAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: docText,
          sourceUrl: docUrl,
          localityName: db.localityConfig.localityName,
          availableSources: db.sources.map((s) => ({ code: s.code, title: s.title })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể phân tích tài liệu.');
      }

      const now = new Date().toISOString();
      const newDraft: AiAnalysisDraft = {
        id: `ai-${Date.now()}`,
        analysisType: 'document_analysis',
        title: `Phân tích tài liệu: ${docUrl || docText.slice(0, 48)}...`,
        inputSummary: `URL: ${docUrl || 'Không'} | Độ dài văn bản: ${docText.length} ký tự`,
        outputJson: data.result,
        aiSuggested: true,
        data_provenance_tier: 'ai_suggested',
        modelUsed: data.model || 'gemini-4-hydrogen',
        status: 'draft',
        createdBy: currentUser.name,
        created_at: now,
        updated_at: now,
      };

      onSaveDraft(newDraft);
      setActiveDraftId(newDraft.id);
      setEditedDraftText(JSON.stringify(data.result, null, 2));
      setTab('vault');
      onNotify('Đã trích xuất tài liệu và lưu bản nháp vào kho ai_analysis.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    } finally {
      setLoading(false);
    }
  };

  const runEditorialAssist = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const rec = db.media_records.find((r) => r.id === selectedRecordIdForEdit);
      const linkedIds = db.record_sources
        .filter((rs) => rs.recordId === rec?.id)
        .map((rs) => rs.sourceId);
      const linkedSources = db.sources.filter((s) => linkedIds.includes(s.id));

      const recordMetadata = rec
        ? `Mã: ${rec.code}\nTiêu đề: ${rec.title}\nMô tả: ${rec.description}\nThời gian: ${rec.captureDateText}\nKiến trúc/Không gian: ${rec.architectureOrSpaceNote}\nThay đổi: ${rec.observedChanges}`
        : 'Không chọn bản ghi';

      const sourceNotes = [
        ...linkedSources.map((s) => `${s.code}: ${s.title} (${s.authorOrPublisher})`),
        extraSourceNotes,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/ai/editorial-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: editorialTask,
          recordTitle: rec?.title,
          recordMetadata,
          sourceNotes,
          localityName: db.localityConfig.localityName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo bản nháp biên soạn.');
      }

      const now = new Date().toISOString();
      const newDraft: AiAnalysisDraft = {
        id: `ai-${Date.now()}`,
        analysisType: 'editorial_assist',
        title: `${editorialTask}: ${rec?.code || 'Chuyên đề'}`,
        relatedRecordId: rec?.id,
        relatedSourceId: linkedSources[0]?.id,
        inputSummary: `Tác vụ: ${editorialTask} | Bản ghi: ${rec?.code || 'Tự do'}`,
        outputJson: data.result,
        aiSuggested: true,
        data_provenance_tier: 'ai_suggested',
        modelUsed: data.model || 'gemini-4-hydrogen',
        status: 'draft',
        createdBy: currentUser.name,
        created_at: now,
        updated_at: now,
      };

      onSaveDraft(newDraft);
      setActiveDraftId(newDraft.id);
      setEditedDraftText(JSON.stringify(data.result, null, 2));
      setTab('vault');
      onNotify('Đã tạo bản nháp biên soạn và lưu vào kho ai_analysis (chờ kiểm duyệt).');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditedDraft = () => {
    if (!activeDraft) return;
    try {
      const parsed = JSON.parse(editedDraftText || JSON.stringify(activeDraft.outputJson));
      onUpdateDraft(activeDraft.id, {
        outputJson: parsed,
        reviewerNote: reviewerNoteInput || activeDraft.reviewerNote,
      });
      onNotify('Đã lưu chỉnh sửa bản nháp AI.');
    } catch {
      onNotify('Nội dung JSON chỉnh sửa chưa đúng cú pháp.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1C1917] text-[#FAF8F4] p-5 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#D4A76A]">
            AI Content Studio · Kiểm soát bởi máy chủ (Gemini 4 Hydrogen)
          </p>
          <h2 className="font-serif text-2xl font-semibold mt-1">
            Trợ lý nghiên cứu và biên mục tư liệu
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            Mọi kết quả AI được lưu dạng bản nháp (aiSuggested = true) và tuyệt đối không tự động xuất bản khi chưa có bước kiểm duyệt của con người.
          </p>
        </div>
        <div className="text-xs font-mono text-[#D4A76A] tabular-nums shrink-0">
          Kho bản nháp: {db.ai_analysis.length}
        </div>
      </div>

      {/* Studio Mode Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D6CEBE] pb-4">
        {[
          { id: 'image' as StudioTab, label: '1. Phân tích ảnh', icon: ImageIcon },
          { id: 'document' as StudioTab, label: '2. Phân tích tài liệu', icon: FileText },
          { id: 'editorial' as StudioTab, label: '3. Hỗ trợ biên soạn', icon: PenTool },
          {
            id: 'vault' as StudioTab,
            label: `4. Kho lưu bản nháp AI (${db.ai_analysis.length})`,
            icon: Save,
          },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setErrorMsg(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border transition-colors cursor-pointer ${
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

      {errorMsg && (
        <div className="bg-[#9A3412]/10 border border-[#9A3412] p-4 text-xs text-[#9A3412]">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: IMAGE ANALYSIS */}
      {tab === 'image' && (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
              Phân tích hình ảnh khách quan
            </h3>
            <p className="text-xs text-[#57534E]">
              AI nhận diện đối tượng, kiến trúc, hoạt động, chất lượng ảnh và đề xuất từ khóa — không tự kết luận địa danh, năm chụp hay nhân vật.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#1C1917]">
                Chọn ảnh từ kho tư liệu hiện có
              </label>
              <select
                value={selectedRecordIdForImg}
                onChange={(e) => {
                  setSelectedRecordIdForImg(e.target.value);
                  setUploadedImgBase64('');
                }}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              >
                {db.media_records
                  .filter((r) => {
                    const f = db.media_files.find((mf) => mf.recordId === r.id);
                    return (r.mediaType === 'image' || r.mediaType === 'map_document') && Boolean(f?.url);
                  })
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.title}
                    </option>
                  ))}
              </select>

              <div className="pt-2">
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  Hoặc tải lên tệp ảnh mới từ máy
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="text-xs text-[#44403C]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#1C1917]">
                Ghi chú ngữ cảnh từ biên tập viên (nếu có)
              </label>
              <textarea
                rows={4}
                value={imgContextNote}
                onChange={(e) => setImgContextNote(e.target.value)}
                placeholder="VD: Ảnh mặt tiền nhà lồng chợ cần gợi ý từ khóa kiến trúc..."
                className="w-full p-3 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={runImageAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#9A6B2F] text-[#FAF8F4] hover:bg-[#B47B33] disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Đang phân tích & lưu bản nháp...' : 'Phân tích ảnh và lưu bản nháp'}
          </button>
        </div>
      )}

      {/* TAB 2: DOCUMENT ANALYSIS */}
      {tab === 'document' && (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
              Trích xuất thông tin tài liệu lịch sử
            </h3>
            <p className="text-xs text-[#57534E]">
              Trích xuất địa danh, nhân vật, mốc thời gian được nhắc trong văn bản và gợi ý liên kết với kho nguồn hiện có.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Đường dẫn URL tài liệu (nếu có)
              </label>
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Hoặc tải lên tệp văn bản (.txt, .md)
              </label>
              <input
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleDocumentFileUpload}
                className="text-xs text-[#44403C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C1917] mb-1">
              Nội dung văn bản tài liệu cần phân tích
            </label>
            <textarea
              rows={6}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Dán đoạn trích địa chí, biên bản phỏng vấn hoặc tài liệu lưu trữ vào đây..."
              className="w-full p-3 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={runDocumentAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#9A6B2F] text-[#FAF8F4] hover:bg-[#B47B33] disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? 'Đang trích xuất & lưu bản nháp...' : 'Phân tích tài liệu & lưu bản nháp'}
          </button>
        </div>
      )}

      {/* TAB 3: EDITORIAL ASSIST */}
      {tab === 'editorial' && (
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
              Hỗ trợ biên soạn nội dung bảo tàng (Bản nháp)
            </h3>
            <p className="text-xs text-[#57534E]">
              Biên soạn dựa trên hồ sơ tư liệu đã có. Mọi đầu ra đều lưu thành bản nháp chờ biên tập viên kiểm chứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Chọn loại sản phẩm biên soạn
              </label>
              <select
                value={editorialTask}
                onChange={(e) => setEditorialTask(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              >
                <option value="Viết mô tả tư liệu">Viết mô tả tư liệu</option>
                <option value="Đề xuất tiêu đề">Đề xuất tiêu đề</option>
                <option value="Tạo chú thích ảnh">Tạo chú thích ảnh</option>
                <option value="Soạn câu chuyện lịch sử">Soạn câu chuyện lịch sử</option>
                <option value="Đề xuất nội dung triển lãm">Đề xuất nội dung triển lãm</option>
                <option value="Tạo bản tóm tắt tư liệu">Tạo bản tóm tắt tư liệu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Gắn với bản ghi tư liệu
              </label>
              <select
                value={selectedRecordIdForEdit}
                onChange={(e) => setSelectedRecordIdForEdit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
              >
                {db.media_records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C1917] mb-1">
              Ghi chú nguồn bổ sung (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={extraSourceNotes}
              onChange={(e) => setExtraSourceNotes(e.target.value)}
              placeholder="Nhập thêm thông tin đã đối chiếu từ nguồn tham khảo..."
              className="w-full p-3 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={runEditorialAssist}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#9A6B2F] text-[#FAF8F4] hover:bg-[#B47B33] disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            {loading ? 'Đang biên soạn bản nháp...' : 'Tạo bản nháp biên soạn'}
          </button>
        </div>
      )}

      {/* TAB 4: AI DRAFTS VAULT */}
      {tab === 'vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-2.5">
            {db.ai_analysis.map((draft) => {
              const isSelected = activeDraft?.id === draft.id;
              return (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => {
                    setActiveDraftId(draft.id);
                    setEditedDraftText(JSON.stringify(draft.outputJson, null, 2));
                    setReviewerNoteInput(draft.reviewerNote || '');
                  }}
                  className={`w-full text-left p-4 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1917] text-[#FAF8F4] border-[#1C1917]'
                      : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EBE6DF]'
                  }`}
                >
                  <p
                    className={`text-[11px] font-mono ${
                      isSelected ? 'text-[#D4A76A]' : 'text-[#9A6B2F]'
                    }`}
                  >
                    {draft.status === 'draft'
                      ? 'BẢN NHÁP CHỜ DUYỆT'
                      : draft.status === 'reviewed'
                      ? 'ĐÃ KIỂM DUYỆT'
                      : 'ĐÃ LOẠI BỎ'}{' '}
                    · {draft.modelUsed}
                  </p>
                  <p className="font-medium text-sm mt-1">{draft.title}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSelected ? 'text-stone-300' : 'text-[#57534E]'
                    }`}
                  >
                    {draft.createdBy} · {draft.created_at.slice(0, 10)}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7 bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-4">
            {activeDraft ? (
              <>
                <div className="border-b border-[#E5DFD3] pb-3 space-y-1">
                  <p className="text-xs font-mono text-[#78350F]">
                    aiSuggested: true · Trạng thái: {activeDraft.status}
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
                    {activeDraft.title}
                  </h3>
                  <p className="text-xs text-[#57534E]">{activeDraft.inputSummary}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Nội dung kết quả AI (Có thể mở lại và chỉnh sửa)
                  </label>
                  <textarea
                    rows={11}
                    value={
                      editedDraftText || JSON.stringify(activeDraft.outputJson, null, 2)
                    }
                    onChange={(e) => setEditedDraftText(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-[#F7F4EE] border border-[#D6CEBE] text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Ghi chú kiểm duyệt của con người
                  </label>
                  <input
                    type="text"
                    value={reviewerNoteInput}
                    onChange={(e) => setReviewerNoteInput(e.target.value)}
                    placeholder="Nhập nhận xét kiểm chứng trước khi sử dụng..."
                    className="w-full px-3 py-2 text-xs bg-[#F7F4EE] border border-[#D6CEBE]"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveEditedDraft}
                    className="px-3.5 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F7F4EE] hover:bg-[#EBE6DF] cursor-pointer"
                  >
                    Lưu chỉnh sửa nháp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateDraft(activeDraft.id, {
                        status: 'reviewed',
                        reviewerNote:
                          reviewerNoteInput || `Đã kiểm duyệt bởi ${currentUser.name}`,
                      });
                      onNotify('Đã xác nhận kiểm duyệt bản nháp AI.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#14532D] text-[#FAF8F4] cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Xác nhận đã kiểm duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateDraft(activeDraft.id, {
                        status: 'rejected',
                        reviewerNote: reviewerNoteInput || 'Không sử dụng bản nháp này',
                      });
                      onNotify('Đã chuyển bản nháp sang trạng thái từ chối.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#9A3412] text-[#9A3412] cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Loại bỏ
                  </button>
                  {activeDraft.relatedRecordId && (
                    <button
                      type="button"
                      onClick={() => {
                        const out = activeDraft.outputJson as Record<string, unknown>;
                        const desc = String(
                          out.draftContent ||
                            out.architectureAndLandscape ||
                            out.summaryNote ||
                            ''
                        );
                        const kw = Array.isArray(out.suggestedKeywords)
                          ? (out.suggestedKeywords as string[])
                          : undefined;
                        if (desc) {
                          onApplyDraftToRecord(activeDraft.relatedRecordId!, desc, kw);
                        }
                      }}
                      className="px-3.5 py-2 text-xs font-medium bg-[#9A6B2F] text-[#FAF8F4] cursor-pointer"
                    >
                      Áp dụng vào hồ sơ {activeDraft.relatedRecordId}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#57534E]">Chưa có bản nháp AI nào được lưu.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
