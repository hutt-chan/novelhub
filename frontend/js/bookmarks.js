document.addEventListener("DOMContentLoaded", async function () {
  const bookmarkList = document.getElementById("bookmarkList");
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Hãy đăng nhập");
    window.location.href = "index.html";
    return;
  }
  try {
    // Lấy bookmark từ API backend
    const res = await fetch("http://localhost:3000/api/bookmarks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bookmarks = await res.json();
    if (!bookmarks.length) {
      bookmarkList.innerHTML = "<p>Chưa có truyện nào được đánh dấu.</p>";
      return;
    }
    bookmarkList.innerHTML = bookmarks
      .map(
        (item) => `
            <div class="novel-card bookmark-item">
                <div class="novel-cover" style="background-image: url('${
                  item.coverUrl || ""
                }');"></div>
                <div class="novel-info">
                    <div class="novel-title">${item.novelTitle}</div>
                    <div class="favorite-actions">
                      <a class="novel-link" href="novel.html?novel_id=${
                        item.novel_id
                      }">Xem truyện</a>
                      <button class="remove-bookmark-btn" data-id="${
                        item.novel_id
                      }">Bỏ đánh dấu</button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
    // Gán sự kiện cho nút Bỏ đánh dấu
    document.querySelectorAll(".remove-bookmark-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const novel_id = this.getAttribute("data-id");
        if (!token) return;
        await fetch(`http://localhost:3000/api/bookmarks/${novel_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        location.reload();
      });
    });
  } catch (e) {
    bookmarkList.innerHTML = "<p>Lỗi khi tải danh sách bookmark.</p>";
  }
});

document
  .getElementById("bookmarkBtn")
  .addEventListener("click", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Hãy đăng nhập");
      window.location.href = "index.html";
      return;
    }

    // Lấy thông tin truyện từ DOM
    const novel_id = getNovelIdSomehow(); // Hàm này bạn cần lấy từ URL hoặc biến JS
    const novelTitle = document.getElementById("novelTitle").textContent;
    const coverUrl = document
      .getElementById("novelCover")
      .style.backgroundImage.replace(/^url\(["']?/, "")
      .replace(/["']?\)$/, "");

    // Gửi lên server (nếu dùng API backend)
    try {
      const res = await fetch("http://localhost:3000/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ novel_id }),
      });
      if (res.ok) {
        alert("Đã đánh dấu truyện!");
      } else {
        const data = await res.json();
        alert(data.message || "Có lỗi xảy ra khi đánh dấu truyện.");
      }
    } catch (e) {
      alert("Có lỗi xảy ra khi đánh dấu truyện.");
    }

    // Nếu muốn lưu localStorage (tùy chọn)
    // let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    // if (!bookmarks.some(b => b.novel_id == novel_id)) {
    //     bookmarks.push({ novel_id, novelTitle, coverUrl });
    //     localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    // }
  });

function getNovelIdSomehow() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}