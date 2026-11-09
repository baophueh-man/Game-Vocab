# Thế Giới Phép Thuật MTQ: Magic Workshop & Evolution (Chuẩn Cơ Chế Listen MTQ)

Xây dựng chế độ trò chơi mới dựa trên đúng "công thức gây nghiện tích cực" của **Listen MTQ**: **Nghe phát âm chọn hình và nghĩa** kết hợp với **phản hồi nhân quả Đúng/Sai tức thì, hài hước**, **Chế độ Vô Tận (Infinite) lên cấp không giới hạn**, và được tối ưu hóa **siêu nhẹ 60 FPS cho máy cấu hình yếu**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Giải đáp câu hỏi: "Các game này có phù hợp cho máy cấu hình yếu không?"**
> **Câu trả lời là: Phù hợp 100% và nhẹ ngang ngửa với Listen MTQ!**
> * **Vì sao máy yếu chơi cực mượt?** Game **không** sử dụng thư viện 3D (WebGL), không dùng vòng lặp vật lý (Physics loop) hay hoạt ảnh rơi liên tục gây nóng máy. Toàn bộ nhân vật, ly trà sữa, trứng rồng, tòa tháp và thủy cung đều được vẽ bằng **Vector SVG nhẹ hoàn toàn tĩnh**, chỉ kích hoạt hiệu ứng co giãn (`transform: scale/translate`) trong 0.5 giây khi học sinh bấm chọn đáp án.
> * **Hỗ trợ chế độ Máy Siêu Yếu (`reduceMotion`)**: Tự động đồng bộ với cài đặt giảm chuyển động của ứng dụng để tắt các hiệu ứng phụ nếu chạy trên điện thoại/máy tính đời cũ.

- **Quyết định đã xác nhận 1 (Cơ chế câu hỏi)**: Tập trung vào **Nghe phát âm tiếng Anh ➔ Chọn thẻ Hình Ảnh & Nghĩa đúng** giống hệt trải nghiệm quen thuộc của Listen MTQ, kèm nút bật/tắt gợi ý chữ tiếng Anh linh hoạt.
- **Quyết định đã xác nhận 2 (Giữ chân học sinh chơi lâu)**: Tích hợp **Chế độ Vô Tận (Infinite Mode)** kết hợp **Lên Cấp (Level Up) không giới hạn**, không có đồng hồ đếm ngược gây áp lực, không bị xử thua (No Game Over).
- **Quyết định mở rộng (4 Chủ Đề Trong 1 Game)**: Thay vì chỉ bó hẹp 1 chủ đề, tương tự như thanh chọn 5 linh vật của Listen MTQ, học sinh có thể chuyển đổi linh hoạt giữa **4 Góc Chơi Nhân Quả** ngay trên thanh công cụ:
  1. 🧋 **Tiệm Trà Sữa & Bánh Kem (Boba & Bakery)**: Làm trà sữa trân châu & bánh ngọt phục vụ khách thú cưng.
  2. 🥚 **Đảo Ấp Trứng Rồng (Dragon Hatchery)**: Chiếu tia phép thuật ấp trứng nở thành Rồng Con và tiến hóa.
  3. 🏰 **Xây Lâu Đài Trên Mây (Sky Tower)**: Xếp các tầng lâu đài phép thuật cao vút lên tận vũ trụ.
  4. 🐠 **Thủy Cung Kho Báu (Deep Sea Aquarium)**: Câu cá quý hiếm & rương kim cương thả vào thủy cung.

---

## 1. Overview & Core Concept

- **What It Does**: Học sinh lắng nghe phát âm từ vựng tiếng Anh và chọn 1 trong 4 thẻ hình ảnh/nghĩa bên dưới. Mỗi lần chọn **Đúng**, một hành động thưởng vui nhộn diễn ra ngay trước mắt (topping bay vào ly trà sữa, trứng rồng nứt nở và lớn lên, tầng lâu đài mới ghép xuống, hoặc kéo lên cá vàng kho báu). Mỗi lần chọn **Sai**, một phản ứng hài hước không gây phạt xuất hiện (bỏ nhầm ớt cay làm khách phun khói, trứng bị đóng băng nhẹ, tầng gạch rung lắc, hoặc câu trúng chiếc ủng cũ), đồng thời làm nổi bật đáp án đúng để học sinh ghi nhớ từ ngay lập tức.
- **Target Audience / Persona**: Học sinh tiểu học, THCS và người học từ vựng yêu thích sự phản hồi thị giác sinh động, hài hước như Listen MTQ, chơi trên mọi thiết bị từ điện thoại cấu hình thấp, máy tính bảng đến máy tính phòng máy trường học.
- **Key Value**: Tạo động lực tự giác nghe đi nghe lại hàng trăm từ vựng trong thời gian dài nhờ vòng lặp "Nghe chuẩn ➔ Nhận thưởng tức thì ➔ Nâng cấp Cửa Tiệm / Tiến Hóa Cấp Độ" mà không sợ bị thua cuộc.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Vào Bàn Chơi Ngay Lập Tức (Zero-Friction Start)**:
   - Không cần qua màn hình chờ phức tạp, vào game là nghe phát âm từ đầu tiên ngay giống Listen MTQ.
   - Thanh điều khiển phía trên cho phép chọn nhanh 1 trong 4 Góc Chơi (🧋 *Trà Sữa*, 🥚 *Ấp Rồng*, 🏰 *Lâu Đài*, 🐠 *Thủy Cung*) và chế độ *Vô Tận (Infinite)* hoặc *Theo Bộ Từ*.
2. **Phản Hồi Chọn Đúng (Immediate Positive Feedback)**:
   - Phát âm thanh chiến thắng vui tai, vật phẩm thưởng bay vào khung cảnh trung tâm.
   - Thanh Tiến Độ Nâng Cấp tăng vọt (+20%). Khi đầy 100%, kích hoạt **Level Up (Thăng Cấp)**: cửa tiệm/rồng thần/lâu đài/thủy cung biến hình sang cấp độ rực rỡ hơn kèm pháo hoa chúc mừng.
   - Bong bóng lời thoại hiển thị câu khen ngợi ngộ nghĩnh (VD: *"Trân châu đường đen dẻo tuyệt cú mèo! Quán lên cấp rồi!"*, *"Rồng con mọc thêm đôi cánh lửa siêu ngầu!"*).
3. **Phản Hồi Chọn Sai (Clear & Encouraging Correction)**:
   - Thẻ chọn sai rung nhẹ và hiện dấu `❌`, đồng thời **thẻ Đáp Án Đúng tự động sáng viền xanh lá `✅`** kèm đọc lại phát âm chuẩn để học sinh nhìn và nhớ ngay.
   - Khung cảnh trung tâm diễn hoạt ảnh hài hước (khách hàng lè lưỡi vì cay 🌶️, rồng con hắt xì hơi 🤧, cần cẩu làm rơi viên gạch nhựa 🧱, hoặc câu trúng chiếc giày rách 🥾) kèm lời động viên ấm áp (*"Ái chà, nhầm vị ớt cay rồi! Nhìn thẻ màu xanh để nhớ từ đúng nha!"*).
   - Tự động chuyển sang câu tiếp theo sau 1.5 giây hoặc bấm nút *"Câu tiếp theo"*.

### Visual Identity & Theme
- **Aesthetic Direction**: Toybox Playful & Tactile Vector UI — Tươi sáng, sắc nét, bo góc mềm mại (`rounded-3xl`), tương phản cao giúp nhìn rõ hình ảnh từ vựng.
- **Color Palette & Mood**:
  - Nền tảng sáng sủa (`bg-amber-50/70`, `bg-sky-50/70` chuyển màu nhẹ theo góc chơi).
  - Phản hồi Đúng: Xanh ngọc lục bảo (`emerald-500`) kết hợp Vàng kim (`amber-400`).
  - Phản hồi Sai: Đỏ hồng cam (`rose-500`) nhưng giữ sắc thái vui tươi, không gây cảm giác nặng nề.
- **Typography & Hierarchy**:
  - Lời thoại nhân vật và cấp độ dùng chữ đậm (`font-extrabold`), kích thước rõ ràng.
  - Thẻ đáp án ưu tiên diện tích cho hình ảnh minh họa (`SmartImage`) và nghĩa tiếng Việt rõ nét.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Kiến trúc Đồ họa SVG Tĩnh + CSS Transform cho Máy Cấu Hình Yếu**
  - *Chosen Approach*: Sử dụng hình vẽ SVG nội tuyến (Inline SVG) kết hợp chuyển động ngắn hạn qua thuộc tính `transform` và `opacity` khi có sự kiện trả lời.
  - *Why*: Không tốn bộ nhớ RAM tải ảnh động nặng, không chạy `requestAnimationFrame` liên tục nền, đảm bảo 0% giật lag trên máy tính/điện thoại yếu.
  - *Alternatives Considered*: Dùng Canvas 2D vẽ liên tục 60 khung hình/giây hoặc ảnh GIF nặng — bị loại bỏ vì làm hao pin và giật lag trên máy yếu.
- **Decision 2: Cả 4 Góc Chơi (Trà Sữa, Ấp Rồng, Xây Tháp, Câu Cá) Tích Hợp Chung**
  - *Chosen Approach*: Cho phép học sinh bấm đổi qua lại giữa 4 góc chơi ngay trên thanh Header mà **không bị mất điểm số hay cấp độ (Level) đang tích lũy**.
  - *Why*: Học sinh chơi 50 câu ở Tiệm Trà Sữa xong có thể bấm sang Đảo Ấp Rồng hoặc Thủy Cung Kho Báu để đổi gió mà vẫn giữ nguyên Level 10 của mình, giúp kéo dài thời gian học gấp nhiều lần.
- **Decision 3: Bảo Toàn Nguyên Vẹn 100% Code Cũ**
  - *Chosen Approach*: Tạo module hoàn toàn độc lập và chỉ gắn thêm 1 thẻ mở game trong danh sách menu.
  - *Why*: Đảm bảo tuyệt đối không ảnh hưởng đến Listen MTQ hay bất kỳ tính năng hiện có nào của giáo viên và học sinh.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             GamePlayer View                             │
│  (Menu Grid Card: "Thế Giới Phép Thuật MTQ" ➔ mode === 'magicWorkshop') │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ props: { words, onExit }
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MagicWorkshopMtq (Standalone Game)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Top Control Bar                                                     │
│     ├─ Theme Switcher: [🧋 Trà Sữa] [🥚 Ấp Rồng] [🏰 Lâu Đài] [🐠 Thủy Cung]│
│     ├─ Mode Toggle: [∞ Vô Tận] / [Theo Lượt] & [Nút Gợi Ý Từ]           │
│     └─ Stats Pills: Score | Streak 🔥 | Level 👑                        │
├─────────────────────────────────────────────────────────────────────────┤
│  2. Interactive Stage & Audio Prompt Panel                              │
│     ├─ Dynamic SVG Stage (Boba Cup / Dragon Egg / Sky Tower / Aquarium) │
│     ├─ Funny Reaction Overlay (Treat Fly-in vs. Spicy/Splash Bloopers)  │
│     ├─ Speech Bubble (Lời khen ngợi hài hước / Lời nhắc nhở ấm áp)       │
│     ├─ Level & XP Progress Bar (0% ➔ 100% ➔ Level Up + Confetti)        │
│     └─ Giant Audio Speaker Button (Tự động đọc & bấm nghe lại từ vựng)  │
├─────────────────────────────────────────────────────────────────────────┤
│  3. 4-Card Visual Answer Grid (SmartImage + Meaning)                    │
│     ├─ Card State: Idle ➔ Correct (Green Glow ✅) / Wrong (Red Shake ❌)│
│     └─ Auto-Highlight Correct Answer on Mistake + Auto-Advance Timer    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Quản lý Câu hỏi & Âm thanh (`prepareNextQuestion`, `playCurrentWordAudio`)**:
  - Tự động chọn từ ngẫu nhiên trong danh sách `words` (ưu tiên không lặp lại ngay từ vừa hỏi) và trộn 3 phương án nhiễu.
  - Tự động phát âm tiếng Anh qua `speakEn` của `SettingsContext` ngay khi câu hỏi xuất hiện.
- **Xử lý Đúng / Sai (`handleSelectOption`)**:
  - Khi chọn **Đúng**: Tăng `score`, `streak`, cộng `+20` vào `progress`. Khi `progress >= 100`, tăng `level + 1`, mở khóa danh hiệu cấp độ mới và bắn pháo hoa `fireConfetti`.
  - Khi chọn **Sai**: Đặt `stageMood = 'blooper'` (hiển thị hoạt ảnh hài hước như trái ớt cay 🌶️ / đóng băng ❄️ / chiếc ủng rách 🥾), giữ nguyên cấp độ hiện tại (chỉ giảm nhẹ thanh tiến độ một chút), làm sáng thẻ đáp án đúng và tự động chuyển câu sau 1.5 giây.
