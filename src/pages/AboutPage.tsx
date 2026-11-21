import React from 'react';
import { ArchiveDatabase } from '../types/archive';

interface AboutPageProps {
  db: ArchiveDatabase;
}

const TABLES_14 = [
  { name: '1. users', desc: 'Người dùng & 5 vai trò phân quyền (Khách, Thành viên, Đóng góp, Biên tập, Quản trị).' },
  { name: '2. locations', desc: 'Địa danh, phân khu, tọa độ WGS84 xác thực và nguồn định vị.' },
  { name: '3. media_records', desc: 'Hồ sơ trung tâm cho từng ảnh, bản đồ, tài liệu, video hoặc bản ghi âm.' },
  { name: '4. media_files', desc: 'Tệp phương tiện số hóa, thông số kỹ thuật, tình trạng bản gốc/số hóa.' },
  { name: '5. sources', desc: 'Nguồn tham khảo độc lập (cơ quan lưu trữ, thư viện, bảo tàng, Wikimedia Commons).' },
  { name: '6. record_sources', desc: 'Bảng liên kết nhiều–nhiều giữa tư liệu và nguồn để truy xuất đa nguồn không đếm trùng.' },
  { name: '7. rights_records', desc: 'Chủ sở hữu quyền, giấy phép, bằng chứng pháp lý và 5 trạng thái quyền công bố.' },
  { name: '8. timelines', desc: 'Mốc thời gian lịch sử gắn trực tiếp với nguồn dẫn chứng và mã hồ sơ.' },
  { name: '9. comparisons', desc: 'Cặp ảnh Xưa – Nay cùng địa điểm kèm nguồn gốc độc lập hai phía.' },
  { name: '10. collections', desc: '7 bộ sưu tập chuyên đề trưng bày nổi bật trên trang chủ.' },
  { name: '11. stories', desc: 'Bài viết kể chuyện lịch sử dẫn chiếu trực tiếp bản ghi và nguồn xác thực.' },
  { name: '12. ai_analysis', desc: 'Kho lưu bản nháp phân tích AI (ai_suggested) chờ con người kiểm duyệt.' },
  { name: '13. review_logs', desc: 'Nhật ký kiểm duyệt & thay đổi trạng thái quyền công bố theo thời gian.' },
  { name: '14. categories', desc: 'Danh mục phân loại chủ đề tư liệu địa phương.' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ db }) => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <header className="border-b border-[#D6CEBE] pb-8 space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A6B2F]">
          Dự án Di sản Tư liệu Nghe nhìn & Bảo tàng Số
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1C1917] leading-tight">
          Giới thiệu dự án: {db.localityConfig.projectTitle}
        </h1>
        <p className="text-base text-[#44403C] leading-relaxed max-w-3xl">
          {db.localityConfig.curatorialStatement}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
            Nguyên tắc khoa học và pháp lý
          </h2>
          <ul className="space-y-2.5 text-sm text-[#44403C] leading-relaxed list-disc pl-5">
            <li>
              <strong>Không bịa đặt thông tin lịch sử:</strong> Địa danh, tác giả, niên đại và nguồn gốc chỉ ghi nhận theo căn cứ từ đơn vị lưu trữ; thông tin chưa có nguồn được đánh dấu rõ là <em>Chưa xác định</em> hoặc <em>Chưa có tư liệu xác minh</em>.
            </li>
            <li>
              <strong>Tách biệt 3 lớp trạng thái:</strong> Hệ thống quản lý độc lập <em>Quyền sử dụng</em> (5 mức từ permitted đến prohibited), <em>Xác minh lịch sử</em> và <em>Trạng thái xuất bản</em>.
            </li>
            <li>
              <strong>Phân biệt 4 loại dữ liệu:</strong> Tư liệu thực tế đã xác minh; tư liệu thực tế chưa xác minh đầy đủ; dữ liệu minh họa thiết kế; và nội dung do AI đề xuất.
            </li>
            <li>
              <strong>Không tự mặc định quyền công bố:</strong> Chỉ tư liệu xác nhận <code className="font-mono text-xs">permitted</code> + <code className="font-mono text-xs">published</code> mới hiển thị tệp gốc công khai.
            </li>
          </ul>
        </section>

        <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
            Quy trình kiểm duyệt 6 bước
          </h2>
          <ol className="space-y-2.5 text-sm text-[#44403C] leading-relaxed list-decimal pl-5">
            <li>Tiếp nhận tư liệu (Ảnh, Bản đồ, Tài liệu, Video, Bản ghi âm).</li>
            <li>Kiểm tra nguồn gốc (Xác định cơ quan lưu giữ, tác giả, đường dẫn gốc, ngày truy cập).</li>
            <li>Xác minh thông tin lịch sử (Đối chiếu bối cảnh, địa danh, năm ghi nhận).</li>
            <li>Kiểm tra bản quyền & quyền riêng tư (Phân loại 5 trạng thái quyền công bố).</li>
            <li>Duyệt nội dung bởi Biên tập viên / Quản trị viên và ghi nhật ký thay đổi.</li>
            <li>Xuất bản công khai hoặc ẩn/giữ phạm vi nghiên cứu nội bộ có kiểm soát.</li>
          </ol>
        </section>
      </div>

      <section className="bg-[#FBF9F5] border border-[#D6CEBE] p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#9A6B2F]">
            Kiến trúc cơ sở dữ liệu chuẩn hóa
          </p>
          <h2 className="font-serif text-2xl font-semibold text-[#1C1917] mt-1">
            Cấu trúc 14 bảng dữ liệu của hệ thống
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TABLES_14.map((tb) => (
            <div key={tb.name} className="p-4 bg-[#F7F4EE] border border-[#E5DFD3] space-y-1">
              <p className="font-mono text-xs font-semibold text-[#78350F]">{tb.name}</p>
              <p className="text-xs text-[#44403C] leading-relaxed">{tb.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
