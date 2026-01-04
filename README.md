# AutoEditPy - AI Video Editor Generator

AutoEditPy là một ứng dụng web sử dụng AI (Google Gemini) để tự động viết mã Python cho việc xử lý video. Bạn chỉ cần nhập yêu cầu bằng ngôn ngữ tự nhiên (ví dụ: "Tải video từ YouTube, cắt 10 giây đầu, thêm nhạc nền và hiệu ứng zoom"), ứng dụng sẽ tạo ra script Python hoàn chỉnh để thực hiện việc đó.

![App Screenshot](https://via.placeholder.com/800x450?text=AutoEditPy+Interface)

## ✨ Tính năng chính

*   **Tạo Script tự động:** Sử dụng Gemini 1.5/2.0 để viết code Python chính xác.
*   **Hỗ trợ đa thư viện:** MoviePy (mặc định), FFmpeg, OpenCV, yt-dlp.
*   **Công cụ UI trực quan:**
    *   Kéo thả file video cục bộ.
    *   Công cụ Zoom/Pan (Ken Burns effect).
    *   Công cụ Cắt (Trim/Cut).
    *   Chèn phụ đề (Text/SRT).
    *   Xử lý âm thanh (Volume, Mute, Replace).
    *   Hiệu ứng chuyển cảnh (Crossfade, Fade to Black, Slide).
*   **Giải thích mã:** AI giải thích cách hoạt động của script bằng tiếng Việt.

## 🚀 Cách chạy Web App (Giao diện)

Bạn có thể chạy ứng dụng này trên máy tính cá nhân để tạo mã.

### Yêu cầu
*   Node.js (v18 trở lên)
*   API Key của Google Gemini (Lấy tại [aistudio.google.com](https://aistudio.google.com/))

### Cài đặt

1.  **Clone repo này về máy:**
    ```bash
    git clone https://github.com/your-username/AutoEditPy.git
    cd AutoEditPy
    ```

2.  **Cài đặt thư viện:**
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Cấu hình API Key:**
    *   Tạo file `.env` ở thư mục gốc.
    *   Thêm dòng sau vào file:
        ```env
        API_KEY=your_google_gemini_api_key_here
        ```
    *(Lưu ý: Không up file .env lên GitHub để bảo mật key)*

4.  **Chạy ứng dụng:**
    ```bash
    npm start
    ```
    Truy cập `http://localhost:1234` (hoặc port hiển thị trên terminal).

## 🐍 Cách chạy Script Python (Xử lý Video)

Sau khi Web App tạo ra mã Python, bạn cần chạy mã đó để thực sự chỉnh sửa video.

### Cách 1: Chạy trên máy tính (Khuyên dùng)
1.  Cài đặt Python 3.10 trở lên.
2.  Cài đặt các thư viện cần thiết (Web App sẽ liệt kê ở đầu script):
    ```bash
    pip install moviepy yt-dlp opencv-python numpy
    ```
    *(Lưu ý: Với MoviePy v1.0.3, bạn có thể cần cài thêm ImageMagick để chèn text)*
3.  Tạo file `edit.py`, dán code vào và chạy:
    ```bash
    python edit.py
    ```

### Cách 2: Chạy trên Google Colab (Không cần cài đặt)
1.  Truy cập [Google Colab](https://colab.research.google.com/).
2.  Tạo Notebook mới.
3.  Copy code từ Web App dán vào cell code.
4.  Thêm dấu `!` trước các lệnh cài đặt thư viện ở đầu (ví dụ: `!pip install moviepy`).
5.  Upload video lên Colab và nhấn nút Play.

## 📦 Triển khai lên Internet (Deploy)

Để bạn bè có thể truy cập Web App này:

1.  Đẩy code lên **GitHub**.
2.  Truy cập [Vercel.com](https://vercel.com) hoặc [Netlify.com](https://netlify.com).
3.  Import repo từ GitHub.
4.  Trong phần **Environment Variables** (Biến môi trường) của Vercel/Netlify, thêm:
    *   Name: `API_KEY`
    *   Value: `Mã_Key_Gemini_Của_Bạn`
5.  Nhấn **Deploy**.

---
**Lưu ý:** Ứng dụng này chỉ tạo ra *mã lệnh (script)*. Việc xử lý video nặng diễn ra tại nơi bạn chạy script Python, không phải trên trình duyệt web.
