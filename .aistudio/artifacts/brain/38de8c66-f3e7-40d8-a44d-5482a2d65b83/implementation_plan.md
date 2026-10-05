# Chế Độ Game Trắc Nghiệm Sút Bóng: Penalty Shootout Quiz

Xây dựng chế độ trò chơi trắc nghiệm tương tác đề tài sút phạt luân lưu (Penalty Shootout). Người chơi lắng nghe phát âm tiếng Anh, quan sát các thẻ hình ảnh bên dưới và chọn đáp án chính xác. Nếu trả lời đúng, quả bóng sẽ bay xoáy thẳng vào góc chết khung thành (GOAL!). Nếu trả lời sai, thủ môn sẽ bay người bắt dính bóng hoặc cản phá ngoạn mục (SAVED!).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Toàn bộ các lựa chọn đã được người dùng xác nhận thông qua câu hỏi khảo sát ở Phase 1:
> - **Dạng câu hỏi**: Nghe phát âm tiếng Anh, chọn thẻ hình ảnh đúng (kèm nghĩa/từ vựng hỗ trợ).
> - **Cơ chế sút bóng**: Bấm chọn thẻ đáp án ở hàng điều khiển bên dưới; ngay lập tức bóng sẽ được sút tự động về phía khung thành với quỹ đạo tương ứng (vào lưới nếu Đúng, bị thủ môn chụp nếu Sai).
> - **Thể thức thi đấu & Tính điểm**: Loạt sút luân lưu tiêu chuẩn 5 quả hoặc 10 quả (có nút chọn chuyển đổi nhanh 5 quả / 10 quả), bảng điểm điện tử ghi nhận từng quả (⚽ bàn thắng / ❌ cản phá), tổng kết có cúp vàng vô địch, hiệu ứng confetti và danh sách từ vựng cần ôn lại.
> - **Nguyên tắc an toàn (Zero Regression)**: Không sửa đổi hoặc can thiệp vào bất kỳ logic hay code cũ nào của các game khác. Chế độ mới được đóng gói độc lập trong `src/components/games/PenaltyShootoutQuiz.tsx` và chỉ đăng ký thêm 1 mode vào `GamePlayer.tsx`.

---

## 1. Overview & Core Concept

- **Tên trò chơi**: Penalty Shootout Quiz (Sút Luân Lưu Tiếng Anh).
- **Mục tiêu**: Vừa rèn luyện khả năng nghe phản xạ nhận diện từ vựng qua hình ảnh, vừa tạo cảm xúc kịch tính như đang bước vào loạt sút 11m quyết định tại một trận chung kết bóng đá.
- **Đối tượng**: Học sinh, trẻ em, và người học tiếng Anh ở mọi lứa tuổi yêu thích bóng đá và trò chơi vận động trực quan.
- **Giá trị cốt lõi**:
  - Tăng hứng thú luyện nghe từ vựng gấp nhiều lần so với bài tập trắc nghiệm thông thường.
  - Phản hồi thị giác tức thì (kinh điển: tiếng sút bóng sút vào lưới rung lên vs. tiếng thủ môn bắt bóng).
  - Tùy chọn 5 hoặc 10 lượt sút tạo nhịp chơi ngắn gọn, dễ chinh phục cúp vàng và chơi lại nhiều lần.

---

## 2. User Experience & Visual Design

### 2.1. Không Gian & Giao Diện Sân Cỏ (Stadium Arena)
- **Sân vận động chân thực**:
  - Nửa trên màn hình là góc nhìn tiền đạo nhìn về khung thành 11m (Penalty Spot View): nền cỏ xanh kẻ sọc chuẩn giải đấu quốc tế, khung thành màu trắng với lưới mắt cáo 3D, vạch 16m50 và chấm phạt đền màu trắng.
  - Phía sau khung thành là khán đài đông nghẹt cổ động viên với cờ và ánh đèn pha sân vận động rực sáng.
- **Nhân vật & Quả bóng**:
  - Thủ môn hoạt hình linh hoạt: đứng nhún nhảy ở giữa khung thành trước khi sút. Khi người chơi chọn đáp án, thủ môn sẽ phản xạ:
    - *Nếu Đúng*: Thủ môn đoán sai hướng hoặc bay người với tay không tới, bóng găm thẳng vào góc lưới! Lưới rung lên, chữ "GOAL! ⚽" bùng nổ hoành tráng cùng âm thanh còi vang và tiếng reo hò cuồng nhiệt.
    - *Nếu Sai*: Thủ môn bay người ôm gọn trái bóng hoặc đấm bóng ra ngoài! Hiệu ứng "SAVED! 🧤" xuất hiện với âm thanh tiếc nuối và tiếng vỗ tay khích lệ.
  - Trái bóng da đen trắng cổ điển (Telstar-style) đặt ngay chấm phạt đền, có hiệu ứng xoay (rotate) và phóng to/thu nhỏ (scale) theo độ sâu 3D khi sút về phía khung thành.

### 2.2. Khu Vực Điều Khiển & Thẻ Hình Ảnh (Bottom Control Zone)
- **Bảng tỷ số điện tử trên cao (Stadium Scoreboard)**:
  - Hiển thị số quả sút hiện tại (Ví dụ: `Lượt 3/5` hoặc `Lượt 7/10`).
  - Dãy chấm penalty tracker trực quan: các biểu tượng ⚽ (vào) và ❌ (hỏng) cho từng lượt sút.
  - Nút chuyển nhanh giữa thể thức **5 Quả** và **10 Quả**.
- **Khu vực phát âm & gợi ý**:
  - Nút loa phát âm to rõ ràng ở giữa: bấm vào để nghe lại từ tiếng Anh bất cứ lúc nào.
  - Thanh sóng âm equalizer nhảy múa khi giọng đọc đang phát.
  - Nút bật/tắt hiển thị phiên âm hoặc gợi ý từ vựng (cho người mới bắt đầu).
- **Hàng 4 thẻ đáp án (4 Option Cards)**:
  - 4 thẻ hình ảnh trực quan tương ứng với 4 hướng sút (Góc cao trái, Góc thấp trái, Góc cao phải, Góc thấp phải).
  - Mỗi thẻ hiển thị hình ảnh minh họa chất lượng cao (`SmartImage`), tên nghĩa tiếng Việt rõ ràng.
  - Khi hover/touch: thẻ nâng nhẹ, viền phát sáng màu cỏ sân vận động.
  - Khi bấm chọn: thẻ khóa lại, bóng lao về hướng sút tương ứng ngay tức thì.

### 2.3. Màn Hình Vinh Danh & Trao Cúp (Celebration & Victory Modal)
- Khi kết thúc 5 hoặc 10 lượt sút:
  - **Tỷ số tổng kết**: Ví dụ `4/5 Bàn Thắng (80%)` hoặc `10/10 Perfect Hat-trick!`.
  - **Danh hiệu bóng đá**:
    - 100%: 🏆 Siêu Tiền Đạo Vàng (Golden Striker)
    - 80% - 99%: 🥇 Chân Sút Xuất Sắc (Master Finisher)
    - 60% - 79%: 🥈 Cầu Thủ Triển Vọng (Rising Star)
    - < 60%: 🥉 Tiếp Tục Rèn Luyện (Keep Training!)
  - Bắn pháo hoa rực rỡ (Confetti) khi đạt tỷ lệ cao.
  - Danh sách từ vựng đã nghe kèm nút nghe lại từng từ để ôn tập sau trận đấu.
  - Nút **"Đá Lượt Mới (Replay)"** và **"Quay Về Menu"**.

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Hoạt ảnh Canvas/SVG vs. CSS Transitions**:
  - *Lựa chọn*: Kết hợp SVG sân vận động/khung thành độ phân giải cao + Framer Motion (`motion/react`) cho quả bóng và thủ môn.
  - *Lý do*: Đảm bảo độ mượt mà 60fps tuyệt đối trên cả điện thoại di động lẫn máy tính bàn, không gây tải nặng CPU, không xung đột với canvas WebGL khác trong app.
- **Quyết định 2: Hỗ trợ trường hợp từ vựng chưa có ảnh (`imageUrl`)**:
  - *Lựa chọn*: Tích hợp fallback tự động với icon minh họa và nghĩa tiếng Việt định dạng thẻ bóng đá bắt mắt, không bao giờ để xảy ra tình trạng vỡ layout hoặc ảnh rỗng.
- **Quyết định 3: Tách biệt hoàn toàn mã nguồn (Zero Regression)**:
  - *Lựa chọn*: Viết mới hoàn toàn `src/components/games/PenaltyShootoutQuiz.tsx`.
  - *Trong `GamePlayer.tsx`*: Chỉ thêm 1 dòng import, bổ sung `'penaltyQuiz'` vào `GameMode` union, thêm 1 thẻ game card ở menu và 1 dòng render `{mode === 'penaltyQuiz' && <PenaltyShootoutQuiz words={set.words} onExit={() => setMode('menu')} />}`. Toàn bộ code cũ của các game khác giữ nguyên 100%.

---

## 4. Technical Architecture & Data Strategy

### 4.1. Kiến Trúc Luồng Dữ Liệu & Thành Phần

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GamePlayer.tsx                                  │
│  - Chế độ chọn game: thêm 'penaltyQuiz' (Sút Phạt Trắc Nghiệm)        │
│  - Truyền words: WordSet['words'] và callback onExit()                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 PenaltyShootoutQuiz.tsx (Component Mới)                 │
├────────────────────────────────────────────────────────────────────────┤
│  [Trạng Thái Trò Chơi - Game State Machine]                            │
│  - matchLength: 5 | 10 (Số lượt sút)                                  │
│  - currentShotIndex: number (Quả thứ mấy)                              │
│  - penaltyHistory: ('goal' | 'miss')[] (Lịch sử loạt sút)             │
│  - currentTarget: Word (Từ vựng cần nghe & đoán)                       │
│  - options: Word[] (4 đáp án trắc nghiệm)                              │
│  - ballState: 'ready' | 'shooting' | 'scored' | 'saved'                │
│  - shotDirection: 'top-left' | 'bottom-left' | 'top-right' | ...       │
│  - keeperAction: 'idle' | 'dive-left' | 'dive-right' | 'dive-center'   │
├────────────────────────────────────────────────────────────────────────┤
│  [Visual Elements]                                                     │
│  1. Header HUD: Bảng điểm điện tử sân cỏ, tỷ số, nút 5/10 quả, loa     │
│  2. Stadium Arena: Sân cỏ 3D, khung thành, thủ môn di động, quả bóng   │
│  3. Interactive Deck: 4 thẻ tranh trắc nghiệm ở chân màn hình          │
│  4. Victory Modal: Trao cúp vàng, tổng kết kết quả, danh sách từ ôn tập│
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Trạng Thái Hoạt Ảnh Sút Bóng (Ball & Keeper Animation Trajectory)
- Khi người chơi chạm vào 1 thẻ:
  1. `ballState` chuyển sang `'shooting'`, bóng tính toán tọa độ vector bay từ chấm 11m `(x: 50%, y: 85%)` tới góc khung thành mục tiêu `(x: targetX, y: targetY)`, đồng thời xoay 720 độ và thu nhỏ kích thước (tạo hiệu ứng xa dần).
  2. Thủ môn phản xạ:
     - Nếu câu trả lời **Đúng**: Thủ môn bay sang góc ngược lại hoặc phản xạ chậm hơn một nhịp; bóng tung lưới; lưới rung lắc; phát âm thanh `correct` và tiếng còi; bảng điểm cập nhật quả bóng vàng ⚽.
     - Nếu câu trả lời **Sai**: Thủ môn bay chính xác vào góc bóng bay tới, chặn đứng quả bóng; bóng bật ngược ra; phát âm thanh `incorrect` và hiệu ứng "SAVED 🧤"; bảng điểm cập nhật dấu ❌.
  3. Sau 1.5 giây ăn mừng/tiếc nuối, tự động chuyển sang lượt sút tiếp theo và phát âm từ vựng mới.

---

## 5. Kế Hoạch Các Bước Thực Hiện (Execution Steps)

1. **Bước 1**: Tạo file component `src/components/games/PenaltyShootoutQuiz.tsx` với đầy đủ logic phát âm (`useSettings().speakEn`), hiệu ứng đồ họa khung thành, thủ môn SVG hoạt họa, trái bóng sút 3D, 4 thẻ hình ảnh đáp án, bảng tỷ số sút luân lưu 5/10 quả, và màn hình trao cúp chiến thắng.
2. **Bước 2**: Đăng ký chế độ `penaltyQuiz` vào `src/pages/GamePlayer.tsx` một cách tối giản nhất (thêm kiểu `GameMode`, thêm thẻ GameCard thể thao sút bóng và nhánh render). Tuyệt đối không thay đổi bất kỳ dòng code cũ nào khác.
3. **Bước 3**: Kiểm tra biên dịch qua `compile_applet` và rà soát cú pháp qua `lint_applet` để đảm bảo hệ thống hoạt động hoàn hảo, không có lỗi runtime.
