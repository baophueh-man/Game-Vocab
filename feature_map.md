# Feature Map - VocaGame & Worksheet Generator

Bản đồ tính năng cốt lõi của dự án và các khóa bảo vệ an toàn (Feature Protection Locks).

---

### [FEATURE-MAP: ID-01] Core Worksheet Vocab Engine & Word Allocation [LOCKED - DO NOT BREAK]
- **File**: `src/utils/worksheetVocabEngine.ts`
- **Mô tả**: Quản lý nạp từ vựng đơn/đa bộ thẻ (`loadFromMultipleWordSets`, `sampleFromDeckConfigs`), phân bổ từ vựng vào các section (`allocateWordSlotsToSections`, `reallocateWordsForSections`), điều phối hạn ngạch (`pickQuotaAwareRandomWordIndices`), và sắp xếp/xáo trộn thứ tự từ (`sortIndicesAlphabetically`, `shuffleWordIndices`, `reorderIndices`).
- **Ranh giới an toàn**: Không làm xáo trộn thuật toán Fisher-Yates, quota-aware round robin hoặc logic ánh xạ composite sections. Khi bổ sung merge `exampleSentence` trong `deduplicateWords`, phải bảo toàn tính bất biến và thứ tự ưu tiên của từ đầu tiên.

---

### [FEATURE-MAP: ID-02] Worksheet Single & Composite PDF Generation [LOCKED - DO NOT BREAK]
- **File**: `src/utils/worksheetGenerator.ts`
- **Mô tả**: Sinh tài liệu PDF chất lượng in ấn cao cho 20 loại bài tập ở cả khổ A4 và A5, hỗ trợ Spacing 0pt - 48pt, Chế độ Học sinh (Student) và Chế độ Đáp án (Answer Mode), phông chữ tiểu học (HP001, Linotte, KG Primary Dots, Andika, Farsan).
- **Ranh giới an toàn**: Không làm lệch layout, tràn trang hoặc vỡ tọa độ của bất kỳ loại bài tập nào (Types 1 - 20). Cơ chế `getFallbackSentenceForWord` chỉ cung cấp câu dự phòng ngữ pháp chuẩn khi từ vựng thực sự thiếu câu ví dụ.

---

### [FEATURE-MAP: ID-03] Worksheet UI & Quick-Add Integration [LOCKED - DO NOT BREAK]
- **File**: `src/pages/WorksheetGenerator.tsx`
- **Mô tả**: Giao diện tạo đề worksheet tương tác, xem trước tức thì (live preview), thanh công cụ chọn loại bài tập, quản lý template, thêm nhanh từ vựng (`handleApplyQuickAddWords`), và nạp từ vựng từ thư viện/YourHomework.
- **Ranh giới an toàn**: Đảm bảo nạp và cập nhật `exampleSentence` thông suốt khi người dùng áp dụng từ mới hoặc chuyển đổi giữa các bộ thẻ.

---

### [FEATURE-MAP: ID-04] Vocabulary Editor & Data Ingestion [LOCKED - DO NOT BREAK]
- **File**: `src/pages/Editor.tsx` & `server.ts`
- **Mô tả**: Bộ soạn thảo từ vựng, nhập/xuất Excel (`.xlsx`), JSON, Quick-Add, trích xuất dữ liệu YourHomework qua endpoint `/api/fetch-vocab`.
- **Ranh giới an toàn**: Nhận diện thông minh cột câu ví dụ trong file Excel 3 cột hoặc 4 cột; trích xuất toàn vẹn trường câu từ YourHomework API.

---

### [FEATURE-MAP: ID-05] Flashcard Storage, Packaging & Automated Sentence Recovery [LOCKED - DO NOT BREAK]
- **File**: `src/lib/storage.ts` & `src/utils/packageZip.ts`
- **Mô tả**: Lưu trữ bộ thẻ Flashcard trên IndexedDB/localStorage/Firestore (`getSets`, `getSetById`, `saveSet`), đóng gói/giải nén `.zip` (`exportWordSetPackage`, `importWordSetPackage`) và cơ chế tự động khôi phục 3 tầng (`recoverAndRepairWordSets`, `recoverAndRepairSingleSet`).
- **Ranh giới an toàn**: Bảo toàn 3 trường `phonetic`, `exampleSentence`, `exampleTranslation` trong ZIP và tự động khôi phục câu ví dụ cho toàn bộ thẻ thiếu câu trên cả 3 tầng lưu trữ.
