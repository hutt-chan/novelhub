// novel.js
document.addEventListener("DOMContentLoaded", async () => {
  const novelId = new URLSearchParams(window.location.search).get("novel_id");
  if (!novelId) {
    alert("Novel ID not found!");
    window.location.href = "index.html";
    return;
  }

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    // Lấy danh sách novels (chứa thông tin chi tiết của novel)
    const response = await fetch("http://localhost:3000/api/novels", {
      headers,
    });
    const novels = await response.json();
    const novel = novels.find((n) => n.id == novelId);

    if (!novel) {
      alert("Novel not found!");
      window.location.href = "index.html";
      return;
    }

    // Cập nhật thông tin novel
    document.getElementById("novelTitle").textContent = novel.title;
    document.getElementById("novelAuthor").textContent = `By ${novel.author}`;
    document.getElementById("viewCount").textContent = novel.views;
    document.getElementById("rating").textContent = novel.rating;
    document.getElementById("chapterCount").textContent = novel.chapterCount;
    document.getElementById("favoriteCount").textContent =
      novel.favorite_count || 0;
    document.getElementById(
      "novelCover"
    ).style.backgroundImage = `url(${novel.coverUrl})`;
    document.getElementById("novelDescription").textContent = novel.description;

    // Hiển thị genres
    const genresContainer = document.getElementById("novelGenres");
    novel.genres.forEach((genre) => {
      const genreSpan = document.createElement("span");
      genreSpan.className = "genre-tag";
      genreSpan.textContent = genre;
      genresContainer.appendChild(genreSpan);
    });

    // Sắp xếp chương
    const sortedChapters = [...novel.chapters].sort((a, b) => {
      const getNum = (title) => parseInt(title.match(/\d+/)?.[0] || 0);
      return getNum(a.name) - getNum(b.name);
    });

    // Hiển thị chương (sắp xếp theo thứ tự mong muốn)
    sortedChapters.forEach((chapter) => {
      const chapterDiv = document.createElement("div");
      chapterDiv.className = "chapter-item";
      chapterDiv.innerHTML = `
                <a href="chapter.html?novel_id=${novel.id}&chapter_id=${
        chapter.id
      }">${chapter.name}</a>
                <span>${new Date(chapter.date).toLocaleDateString()}</span>
            `;
      chapterList.appendChild(chapterDiv);
    });

    // Nút Start Reading → chương đầu tiên
    document.getElementById("startReadingBtn").addEventListener("click", () => {
      if (sortedChapters.length > 0) {
        const firstChapter = sortedChapters[0];
        window.location.href = `chapter.html?novel_id=${novel.id}&chapter_id=${firstChapter.id}`;
      }
    });

    // Xử lý Bookmark
    const bookmarkBtn = document.getElementById("bookmarkBtn");
    if (!bookmarkBtn) return;

    bookmarkBtn.addEventListener("click", async function () {
      if (!token) {
        alert("Please sign in to bookmark!");
        window.location.href = "index.html";
        return;
      }

      // Lấy thông tin truyện từ DOM hoặc biến JS
      const params = new URLSearchParams(window.location.search);
      const novel_id = params.get("novel_id");
      const novelTitle =
        document.getElementById("novelTitle")?.textContent || "";
      const coverUrl =
        document
          .getElementById("novelCover")
          ?.style.backgroundImage.replace(/^url\(["']?/, "")
          .replace(/["']?\)$/, "") || "";

      // Gửi lên server (API backend)
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
          alert("Bookmarked!");
        } else {
          const data = await res.json();
          alert(data.message || "Error bookmarking novel.");
        }
      } catch (e) {
        alert("Error bookmarking novel.");
      }
    });

    // Xử lý Favorite
    const favoriteBtn = document.getElementById("favoriteBtn");
    favoriteBtn.addEventListener("click", async () => {
      if (!token) {
        alert("Please sign in to favorite!");
        return;
      }
      try {
        const method = novel.is_favorited ? "DELETE" : "POST";
        const url = novel.is_favorited
          ? `/api/favorites/${novel.id}`
          : "/api/favorites";
        await fetch(`http://localhost:3000${url}`, {
          method,
          headers: { "Content-Type": "application/json", ...headers },
          body:
            method === "POST" ? JSON.stringify({ novel_id: novel.id }) : null,
        });
        novel.is_favorited = !novel.is_favorited;
        favoriteBtn.querySelector("i").className = novel.is_favorited
          ? "fas fa-heart"
          : "far fa-heart";
        alert(
          novel.is_favorited ? "Added to Favorites!" : "Removed from Favorites!"
        );
        // Lưu vào localStorage
        let favs = JSON.parse(localStorage.getItem("favoriteNovels") || "[]");
        if (novel.is_favorited) {
          // Thêm nếu chưa có
          if (!favs.some((n) => n.id == novel.id)) {
            favs.unshift({
              id: novel.id,
              title: novel.title,
              coverUrl: novel.coverUrl,
              author: novel.author,
              description: novel.description,
              rating: novel.rating,
              views: novel.views,
              chapterCount: novel.chapterCount,
            });
          }
        } else {
          // Xóa nếu bỏ thích
          favs = favs.filter((n) => n.id != novel.id);
        }
        localStorage.setItem("favoriteNovels", JSON.stringify(favs));
      } catch (error) {
        alert("Error updating favorite!");
      }
    });

   
    // ... (Phần code trước đó giữ nguyên)

// Hàm lấy và hiển thị comment
async function fetchComments(novelId) {
    try {
        const res = await fetch(`http://localhost:3000/api/comments/${novelId}`);
        if (!res.ok) throw new Error("Failed to load comments");
        const data = await res.json();
        const commentList = document.getElementById("commentList");
        commentList.innerHTML = "";
        if (!data.comments || !data.comments.length) {
            commentList.innerHTML = "<p>No comments yet.</p>";
            return;
        }
        data.comments.forEach((c) => {
            const div = document.createElement("div");
            div.className = "comment-item";
            div.innerHTML = `
                <div class="comment-user">${c.username}</div>
                <div class="comment-rating">Rating: ${c.rating}/5 <i class="fas fa-star"></i></div>
                <div class="comment-content">${c.content}</div>
                <div class="comment-date">${new Date(c.created_at).toLocaleString("en-US")}</div>
            `;
            commentList.appendChild(div);
        });
    } catch (e) {
        document.getElementById("commentList").innerHTML = "<p>Error loading comments.</p>";
    }
}

// Xử lý form gửi bình luận
const commentForm = document.getElementById('commentForm');
if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!token) {
            alert("Please sign in to comment!");
            return;
        }
        const content = document.getElementById('commentContent').value.trim();
        const rating = document.getElementById('commentRating').value; // Lấy giá trị rating
        if (!content) {
            alert("Please enter your comment!");
            return;
        }
        if (!rating || rating < 1 || rating > 5) {
            alert("Please select a rating from 1 to 5!");
            return;
        }
        try {
            const response = await fetch(
                `http://localhost:3000/api/comments/${novelId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...headers },
                    body: JSON.stringify({ content, rating }),
                }
            );
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    if (response.status === 404) {
                        errorData.error = "API endpoint not found";
                    }
                }
                throw new Error(
                    `Failed to submit comment: ${response.status} - ${errorData.error || "Unknown error"}`
                );
            }
            const data = await response.json();
            alert("Comment and rating submitted!");
            commentForm.reset();
            await fetchComments(novelId);
            // Cập nhật lại rating trung bình trong modal
            const novelResponse = await fetch(`http://localhost:3000/api/novels/${novelId}`, { headers });
            const updatedNovel = await novelResponse.json();
            document.getElementById("rating").textContent = updatedNovel.rating;
        } catch (error) {
            alert(`Error submitting comment: ${error.message}`);
        }
    });
} else {
    console.error("Comment form not found");
}

// Tải bình luận ban đầu
await fetchComments(novelId);
  } catch (error) {
    console.error("Error loading novel:", error);
    alert("Error loading novel!");
  }
});