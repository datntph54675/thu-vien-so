import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function createAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSafeErrorMessage(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403')) {
    return {
      status: 403,
      message: 'API key chưa hợp lệ hoặc thiếu quyền truy cập. Vui lòng kiểm tra cấu hình trong mục Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Hệ thống đang chạm giới hạn tần suất gọi Gemini API. Vui lòng thử lại sau ít phút.',
    };
  }
  return {
    status: 500,
    message: `Không thể xử lý yêu cầu phân tích AI: ${raw}`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.json({ ok: true, aiConfigured: hasKey });
  });

  app.post('/api/ai/analyze-image', async (req, res) => {
    const ai = createAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa phát hiện GEMINI_API_KEY trên máy chủ. Vui lòng cấu hình khóa trong Settings > Secrets để kích hoạt phân tích AI.',
      });
    }

    try {
      const { imageBase64, mimeType, assetUrl, contextNote } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        assetUrl?: string;
        contextNote?: string;
      };

      let resolvedBase64 = imageBase64 || '';
      let resolvedMime = mimeType || 'image/jpeg';

      if (!resolvedBase64 && assetUrl && assetUrl.startsWith('/archive-media/')) {
        const cleanRel = assetUrl.replace(/^\/+/, '');
        const safePath = path.resolve(__dirname, 'public', cleanRel);
        const allowedPublicDir = path.resolve(__dirname, 'public/archive-media');
        if (safePath.startsWith(allowedPublicDir) && fs.existsSync(safePath)) {
          const buf = fs.readFileSync(safePath);
          resolvedBase64 = buf.toString('base64');
          resolvedMime = safePath.endsWith('.png')
            ? 'image/png'
            : safePath.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';
        }
      }

      if (!resolvedBase64) {
        return res.status(400).json({ error: 'Vui lòng cung cấp tệp hình ảnh hoặc chọn tư liệu ảnh hợp lệ để phân tích.' });
      }

      const pureBase64 = resolvedBase64.includes(',') ? resolvedBase64.split(',')[1] : resolvedBase64;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMime,
                data: pureBase64,
              },
            },
            {
              text: `Hãy phân tích hình ảnh tư liệu này phục vụ biên mục bảo tàng số bằng tiếng Việt. Ghi chú ngữ cảnh từ biên tập viên (nếu có): ${contextNote || 'Không có'}.`,
            },
          ],
        },
        config: {
          systemInstruction:
            'Bạn là trợ lý biên mục di sản tư liệu bảo tàng số Việt Nam. Chỉ mô tả khách quan những gì thực sự quan sát thấy trong ảnh (đối tượng, kiến trúc, cảnh quan, hoạt động, chất lượng ảnh) và đề xuất từ khóa, chủ đề biên mục. TUYỆT ĐỐI KHÔNG tự suy đoán hay khẳng định địa danh cụ thể, năm chụp chính xác, danh tính nhân vật hoặc sự kiện lịch sử nếu không có thông tin xác thực đi kèm.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visibleObjects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Các đối tượng nhìn thấy trực tiếp trong ảnh',
              },
              architectureAndLandscape: {
                type: Type.STRING,
                description: 'Mô tả kiến trúc, không gian, vật liệu và cảnh quan quan sát được',
              },
              humanActivities: {
                type: Type.STRING,
                description: 'Mô tả trang phục, phương tiện hoặc hoạt động sinh hoạt nhìn thấy (không suy đoán danh tính)',
              },
              suggestedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Từ khóa gợi ý cho thư viện tư liệu',
              },
              suggestedThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Chủ đề lưu trữ gợi ý',
              },
              imageQualityNotes: {
                type: Type.STRING,
                description: 'Nhận xét khách quan về độ nét, ánh sáng, độ tương phản, tình trạng vật lý của bản ảnh',
              },
              cautionNote: {
                type: Type.STRING,
                description: 'Khuyến cáo những thông tin chưa thể xác định từ ảnh (địa danh, năm chụp, nhân vật, sự kiện) cần chuyên gia đối chiếu',
              },
            },
            required: [
              'visibleObjects',
              'architectureAndLandscape',
              'humanActivities',
              'suggestedKeywords',
              'suggestedThemes',
              'imageQualityNotes',
              'cautionNote',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ result: parsed, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const safe = getSafeErrorMessage(err);
      return res.status(safe.status).json({ error: safe.message });
    }
  });

  app.post('/api/ai/analyze-document', async (req, res) => {
    const ai = createAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa phát hiện GEMINI_API_KEY trên máy chủ. Vui lòng cấu hình khóa trong Settings > Secrets để kích hoạt phân tích AI.',
      });
    }

    try {
      const { documentText, sourceUrl, localityName, availableSources } = req.body as {
        documentText?: string;
        sourceUrl?: string;
        localityName?: string;
        availableSources?: Array<{ code: string; title: string }>;
      };

      if (!documentText?.trim() && !sourceUrl?.trim()) {
        return res.status(400).json({ error: 'Vui lòng nhập nội dung văn bản hoặc đường dẫn tài liệu cần trích xuất.' });
      }

      const sourceListText = (availableSources || [])
        .map((s) => `${s.code}: ${s.title}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Địa phương nghiên cứu đang cấu hình: ${localityName || 'Chưa xác định'}\nURL tài liệu tham chiếu: ${sourceUrl || 'Không cung cấp'}\nDanh sách nguồn hiện có trong kho:\n${sourceListText || 'Chưa có'}\n\nNội dung tài liệu cần phân tích:\n${documentText || '(Chỉ cung cấp URL, không có toàn văn; hãy nêu rõ giới hạn không thể tự đọc nội dung ngoài văn bản được cung cấp)'}`,
        config: {
          systemInstruction:
            'Bạn là chuyên gia phân tích tư liệu lịch sử địa phương. Chỉ trích xuất các thông tin có thực trong văn bản người dùng cung cấp. Không bịa đặt mốc thời gian, địa danh hay nhân vật không xuất hiện trong văn bản. Nếu chỉ có URL mà không có nội dung văn bản, phải nêu rõ cần nhập nội dung văn bản để trích xuất chính xác.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              localityRelevance: {
                type: Type.STRING,
                description: 'Tóm tắt các thông tin liên quan đến địa phương được nhắc tới trong văn bản',
              },
              extractedTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    periodOrYear: { type: Type.STRING },
                    factFromText: { type: Type.STRING },
                  },
                  required: ['periodOrYear', 'factFromText'],
                },
                description: 'Các mốc thời gian xuất hiện trực tiếp trong tài liệu',
              },
              mentionedPlaces: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              mentionedFiguresOrOrgs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedSourceLinks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Đề xuất liên kết với các mã nguồn hiện có dựa trên chủ đề tương đồng',
              },
              verificationGaps: {
                type: Type.STRING,
                description: 'Các điểm còn thiếu căn cứ cần đối chiếu thêm trước khi xuất bản',
              },
            },
            required: [
              'localityRelevance',
              'extractedTimeline',
              'mentionedPlaces',
              'mentionedFiguresOrOrgs',
              'suggestedSourceLinks',
              'verificationGaps',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ result: parsed, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const safe = getSafeErrorMessage(err);
      return res.status(safe.status).json({ error: safe.message });
    }
  });

  app.post('/api/ai/editorial-assist', async (req, res) => {
    const ai = createAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa phát hiện GEMINI_API_KEY trên máy chủ. Vui lòng cấu hình khóa trong Settings > Secrets để kích hoạt hỗ trợ biên soạn.',
      });
    }

    try {
      const { taskType, recordTitle, recordMetadata, sourceNotes, localityName } = req.body as {
        taskType: string;
        recordTitle?: string;
        recordMetadata?: string;
        sourceNotes?: string;
        localityName?: string;
      };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Loại biên soạn yêu cầu: ${taskType}\nĐịa phương nghiên cứu: ${localityName || 'Chưa cấu hình'}\nTên tư liệu: ${recordTitle || 'Chưa đặt tên'}\nDữ liệu hồ sơ đã xác nhận:\n${recordMetadata || 'Chưa có'}\nNguồn đối chiếu:\n${sourceNotes || 'Chưa có'}`,
        config: {
          systemInstruction:
            'Bạn là biên tập viên bảo tàng tư liệu số. Hãy biên soạn bản nháp tiếng Việt trang trọng, chuẩn mực học thuật dựa HOÀN TOÀN trên dữ liệu hồ sơ đã cung cấp. Không tự thêm sự kiện, ngày tháng hoặc nhân vật lịch sử ngoài dữ liệu đầu vào. Mọi kết quả chỉ là bản nháp đề xuất chờ con người kiểm duyệt.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTitles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 phương án tiêu đề chuẩn bảo tàng',
              },
              draftCaption: {
                type: Type.STRING,
                description: 'Chú thích ảnh / tư liệu ngắn gọn',
              },
              draftContent: {
                type: Type.STRING,
                description: 'Nội dung bản nháp chi tiết theo loại biên soạn được chọn',
              },
              summaryNote: {
                type: Type.STRING,
                description: 'Bản tóm tắt ngắn 2-3 câu cho danh mục triển lãm',
              },
              humanReviewChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Các điểm biên tập viên cần kiểm chứng trước khi phê duyệt xuất bản',
              },
            },
            required: ['suggestedTitles', 'draftCaption', 'draftContent', 'summaryNote', 'humanReviewChecklist'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ result: parsed, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const safe = getSafeErrorMessage(err);
      return res.status(safe.status).json({ error: safe.message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Museum Archive server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
