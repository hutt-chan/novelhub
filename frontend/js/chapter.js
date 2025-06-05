// Lấy novel_id và chapter_id từ URL
const getParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get("novel_id");
  const chapterId = urlParams.get("chapter_id");
  console.log("URL Params:", { novelId, chapterId });
  return { novelId, chapterId };
};

// Gọi API lấy nội dung chương
async function fetchChapter(novelId, chapterId, token) {
  console.log("Fetching chapter:", { novelId, chapterId });
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(
      `http://localhost:3000/api/chapters/${novelId}/${chapterId}`,
      { headers }
    );
    console.log("Chapter response status:", response.status);
    if (!response.ok)
      throw new Error(`Không thể tải chương: ${response.status}`);
    const data = await response.json();
    console.log("Chapter data:", data);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy chương:", error);
    return null;
  }
}

// Gọi API lấy danh sách chương
async function fetchChapterList(novelId, token) {
  console.log("Fetching chapter list for novelId:", novelId);
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(
      `http://localhost:3000/api/novels/${novelId}/chapters`,
      { headers }
    );
    console.log("Chapter list response status:", response.status);
    if (!response.ok)
      throw new Error(`Không thể tải danh sách chương: ${response.status}`);
    const data = await response.json();
    console.log("Chapter list data:", data);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chương:", error);
    return [];
  }
}

// Cập nhật nút điều hướng trước/sau
function updateNavigation(novelId, chapterId, chapters) {
  const prevBtn = document.getElementById("prevChapter");
  const nextBtn = document.getElementById("nextChapter");

  // Ép kiểu chapterId thành số
  const chapterIdNum = parseInt(chapterId);
  console.log("updateNavigation:", {
    novelId,
    chapterId,
    chapterIdNum,
    chapters,
  });

  // Kiểm tra nút có tồn tại không
  if (!prevBtn || !nextBtn) {
    console.error("Navigation buttons not found:", { prevBtn, nextBtn });
    return;
  }

  // Tìm chỉ số chương hiện tại
  const currentIndex = chapters.findIndex((ch) => ch.id === chapterIdNum);
  console.log("Current chapter index:", currentIndex);

  // Cập nhật nút Chương trước
  if (currentIndex > 0) {
    prevBtn.disabled = false;
    prevBtn.onclick = () => {
      const prevChapterId = chapters[currentIndex - 1].id;
      console.log("Navigating to previous chapter:", prevChapterId);
      window.location.href = `chapter.html?novel_id=${novelId}&chapter_id=${prevChapterId}`;
    };
  } else {
    prevBtn.disabled = true;
    console.log("No previous chapter");
  }

  // Cập nhật nút Chương sau
  if (currentIndex < chapters.length - 1 && currentIndex !== -1) {
    nextBtn.disabled = false;
    nextBtn.onclick = () => {
      const nextChapterId = chapters[currentIndex + 1].id;
      console.log("Navigating to next chapter:", nextChapterId);
      window.location.href = `chapter.html?novel_id=${novelId}&chapter_id=${nextChapterId}`;
    };
  } else {
    nextBtn.disabled = true;
    console.log("No next chapter");
  }
}

// Highlight nav-link trong sidebar
function highlightNavLink() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    if (link.href.includes("index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Khởi tạo trang
async function init() {
  await initAuth();
  const token = localStorage.getItem("token");
  const { novelId, chapterId } = getParams();

  const chapterText = document.querySelector(".chapter-text");
  if (!novelId || !chapterId || chapterId === "undefined") {
    console.log("Invalid params:", { novelId, chapterId });
    chapterText.className = "chapter-text error";
    chapterText.textContent = "Thiếu thông tin tiểu thuyết hoặc chương";
    return;
  }

  document.getElementById("backBtn").href = `novel.html?novel_id=${novelId}`;
  highlightNavLink();

  const chapter = await fetchChapter(novelId, chapterId, token);
  if (chapter) {
    document.querySelector(".chapter-title").textContent = chapter.name;
    chapterText.className = "chapter-text";
    chapterText.textContent = chapter.content || "Nội dung chương hiện chưa có";
    // Lưu lịch sử đọc vào database nếu đã đăng nhập
    if (token) {
      fetch("http://localhost:3000/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ novel_id: novelId, chapter_id: chapterId }),
      });
    }
    // Lưu lịch sử đọc vào localStorage
    const history = JSON.parse(localStorage.getItem("readHistory") || "[]");
    const now = new Date().toISOString();
    // Xóa bản ghi cũ nếu đã có
    const filtered = history.filter(
      (item) => !(item.novelId == novelId && item.chapterId == chapterId)
    );
    filtered.unshift({
      novelId,
      chapterId,
      novelTitle: chapter.novelTitle || "",
      chapterTitle: chapter.name,
      coverUrl: chapter.coverURL || "",
      time: now,
    });
    // Giới hạn tối đa 50 bản ghi
    localStorage.setItem("readHistory", JSON.stringify(filtered.slice(0, 50)));
  } else {
    chapterText.className = "chapter-text error";
    chapterText.textContent = "Không thể tải nội dung chương";
  }

  const chapters = await fetchChapterList(novelId, token);
  if (chapters.length) {
    updateNavigation(novelId, chapterId, chapters);
  } else {
    console.log("No chapters found for novelId:", novelId);
    // Không ghi đè nội dung chương nếu đã tải được
    chapterText.className = chapter ? "chapter-text" : "chapter-text error";
    if (!chapter) {
      chapterText.textContent = "Không có danh sách chương";
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
