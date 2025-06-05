document.addEventListener("DOMContentLoaded", async function () {
  const bookmarkList = document.getElementById("bookmarkList");
  const token = localStorage.getItem("token");
  if (!token) {
    bookmarkList.style.display = 'block';
    return;
  }
  try {
    // Get bookmarks from backend API
    const res = await fetch("http://localhost:3000/api/bookmarks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bookmarks = await res.json();
    if (!bookmarks.length) {
      bookmarkList.innerHTML = "<p>No bookmarks yet.</p>";
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
                      }">View Novel</a>
                      <button class="remove-bookmark-btn" data-id="${
                        item.novel_id
                      }">Remove</button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
    // Add event for Remove button
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
    bookmarkList.innerHTML = "<p>Error loading bookmarks list.</p>";
  }
});

document.getElementById("bookmarkBtn")?.addEventListener("click", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please sign in to bookmark!");
    window.location.href = "index.html";
    return;
  }

  // Get novel info from DOM
  const novel_id = getNovelIdSomehow();
  const novelTitle = document.getElementById("novelTitle").textContent;
  const coverUrl = document
    .getElementById("novelCover")
    .style.backgroundImage.replace(/^url\(["']?/, "")
    .replace(/["']?\)$/, "");

  // Send to server (if using backend API)
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

function getNovelIdSomehow() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

document.addEventListener('DOMContentLoaded', function() {
  function toggleBookmarkUI() {
    const isLoggedIn = window.isLoggedIn || localStorage.getItem('token');
    const msg = document.querySelector('.bookmark-message');
    const content = document.querySelector('.bookmark-content');
    if (!isLoggedIn) {
      msg.style.display = 'block';
      content.style.display = 'none';
    } else {
      msg.style.display = 'none';
      content.style.display = 'block';
    }
  }
  toggleBookmarkUI();
  window.addEventListener('loginStateChanged', toggleBookmarkUI);
});