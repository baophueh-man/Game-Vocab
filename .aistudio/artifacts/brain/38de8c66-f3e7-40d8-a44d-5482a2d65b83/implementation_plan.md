# Tìm Kiếm Bộ Flashcard & Quản Lý Thư Mục (Folder) Tại Menu Chính

Nâng cấp trang thư viện chính (**My Library**) với thanh tìm kiếm đa năng (hỗ trợ tìm không dấu xuyên suốt tên bộ, mô tả và từ vựng bên trong) kết hợp hệ thống **Thư Mục (Folders)** giúp gom nhóm, phân loại và thu gọn danh sách các bộ flashcard một cách ngăn nắp.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Tổng hợp các tùy chọn đã xác nhận từ bạn:**
> 1. **Tìm kiếm toàn diện & Hỗ trợ gõ không dấu**: Tìm theo tên bộ flashcard, mô tả và cả từ vựng tiếng Anh / nghĩa tiếng Việt nằm bên trong bộ đó. Hỗ trợ chuẩn hóa tiếng Việt không dấu (ví dụ gõ `"dong vat"` vẫn tìm thấy `"Động vật"`).
> 2. **Phân loại vào Thư Mục (Add to Folder)**: Cho phép tạo các Folder (ví dụ: *Lớp 3*, *Lớp 4*, *Movers*, *Flyers*, *Kiểm tra học kỳ*...) và gắn nhanh bất kỳ bộ flashcard nào vào Folder để giao diện thư viện luôn gọn gàng, dễ tìm.

---

## 1. Overview & Core Concept

- **What It Does**: Cung cấp công cụ tìm kiếm tức thì và hệ thống phân loại theo Thư Mục ngay tại màn hình chính. Khi số lượng bộ flashcard tăng lên hàng chục hoặc hàng trăm bộ, giáo viên có thể gom chúng vào từng Folder theo lớp học/cấp độ và tìm lại bất kỳ bộ từ nào chỉ bằng vài ký tự.
- **Target Audience / Persona**: Giáo viên tiếng Anh và học sinh cần tra cứu nhanh bài học trên lớp hoặc tại nhà mà không phải cuộn trang tìm kiếm thủ công.
- **Key Value**: Giảm thời gian tìm bộ từ xuống dưới 1 giây; giữ màn hình chính luôn sạch sẽ, có tổ chức theo từng thư mục.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Tìm Kiếm Thông Minh (Instant Search & Word Match Preview)**:
   - Ô tìm kiếm nổi bật ngay dưới tiêu đề `My Library` kèm nút xóa nhanh (`X`) và bộ đếm số lượng kết quả tìm thấy.
   - Tự động đối chiếu từ khóa (không phân biệt hoa thường, có dấu hay không dấu) với: **Tên bộ từ**, **Mô tả**, **Tên Folder**, và **Danh sách từ vựng (`term` + `definition`)** bên trong.
   - Nếu tìm thấy từ khóa nằm trong từ vựng của một bộ, trên thẻ bộ flashcard đó sẽ xuất hiện dòng gợi ý nhỏ (ví dụ: `🔍 Khớp từ: "apple (quả táo)"`) để nhận biết ngay.
2. **Tổ Chức & Lọc Theo Thư Mục (Folder Bar & Quick Assign)**:
   - **Thanh Thư Mục (Folder Tabs)**: Hiển thị các tab ngang gọn gàng gồm: `📁 Tất cả (N)`, `📂 Chưa phân loại`, danh sách các Folder đã tạo (kèm số lượng bộ từ trong mỗi Folder), và nút `+ Tạo Folder mới`.
   - **Gắn Bộ Từ Vào Folder (1-Click Add to Folder)**:
     - Trên mỗi thẻ bộ flashcard có nhãn hiển thị Folder hiện tại (hoặc nút `📁 Chọn Folder`).
     - Bấm vào sẽ mở menu chọn nhanh Folder có sẵn, tạo Folder mới ngay tại chỗ, hoặc gỡ khỏi Folder.
   - **Quản Lý Folder**: Khi đang chọn một Folder, người dùng có thể bấm đổi tên Folder hoặc xóa Folder (khi xóa Folder, các bộ flashcard bên trong vẫn được giữ nguyên an toàn và chuyển về *Chưa phân loại*).
3. **Sắp Xếp Linh Hoạt**:
   - Menu chọn thứ tự hiển thị: *Mới nhất*, *Cũ nhất*, *Tên (A ➔ Z)*, hoặc *Số lượng từ (Nhiều ➔ Ít)*.

### Visual Identity & Theme
- **Aesthetic Direction**: Clean SaaS Workspace — Đồng bộ hoàn toàn với phong cách Indigo & Slate hiện tại của trang chủ.
- **Color Palette & Mood**:
  - Tab Folder đang chọn: `bg-indigo-600 text-white shadow-sm`.
  - Nhãn Folder trên thẻ bộ từ: `bg-indigo-50 text-indigo-700 border-indigo-200`.
  - Nhãn từ vựng khớp khi tìm kiếm: `bg-amber-50 text-amber-800 border-amber-200`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Lưu trường `folder` trực tiếp trên mỗi `WordSet` kết hợp danh sách Folder**
  - *Chosen Approach*: Bổ sung thuộc tính tùy chọn `folder?: string` vào cấu trúc `WordSet` và lưu qua hàm `saveSet()` hiện có (đồng bộ cả LocalStorage, IndexedDB và Firestore), đồng thời lưu danh sách các Folder rỗng mới tạo trong `localStorage`.
  - *Why*: Đảm bảo khi đồng bộ đám mây hoặc tải lại trang, phân loại Folder của từng bộ từ được giữ nguyên vẹn mà không làm thay đổi cấu trúc các bảng dữ liệu cũ.
- **Decision 2: Xóa Folder Không Xóa Bộ Từ Vựng**
  - *Chosen Approach*: Khi người dùng xóa một Folder, chỉ gỡ nhãn `folder` khỏi các bộ từ trong đó (chuyển về *Chưa phân loại*) chứ tuyệt đối không xóa mất bộ flashcard.
  - *Why*: Bảo vệ an toàn tuyệt đối cho dữ liệu giảng dạy của giáo viên.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Home View (My Library)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Search & Sort Toolbar                                               │
│     ├─ Search Input (Accent-Insensitive: Title / Desc / Folder / Words) │
│     ├─ Clear Button & Result Count Badge                                │
│     └─ Sort Selector (Newest | Oldest | Name A-Z | Word Count)          │
├─────────────────────────────────────────────────────────────────────────┤
│  2. Folder Navigation & Management Bar                                  │
│     ├─ Filter Pills: [Tất cả] [Chưa phân loại] [Folder A] [Folder B]... │
│     ├─ [+ Tạo Folder] Inline Modal / Popover                            │
│     └─ Active Folder Actions: [Đổi tên Folder] | [Xóa Folder]           │
├─────────────────────────────────────────────────────────────────────────┤
│  3. Filtered Flashcard Set Grid                                         │
│     ├─ Folder Badge & Quick "Chuyển Folder" Dropdown on each Card       │
│     ├─ Matched Vocabulary Highlight Pill (when searching inner words)   │
│     └─ Existing Card Actions (Play, Export ZIP, Duplicate, Share, Edit) │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Hàm Chuẩn Hóa Tiếng Việt (`normalizeSearchText`)**:
  - Chuyển chuỗi về chữ thường, loại bỏ dấu tiếng Việt (`NFD` + regex `[\u0300-\u036f]`, chuyển `đ/Đ` thành `d`) để so khớp chính xác cả khi gõ có dấu lẫn không dấu.
- **Cập Nhật Folder Cho Bộ Từ (`handleAssignFolder`)**:
  - Cập nhật `set.folder = folderName` trong state `sets` ngay lập tức để UI phản hồi tức thì, sau đó gọi `saveSet(updatedSet)` lưu bền vững xuống IndexedDB, LocalStorage và Firestore.
