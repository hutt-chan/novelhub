async function toggleFavorite(btn, novelId) {
  if (!isLoggedIn) {
    alert("Please sign in to add favorite!");
    return;
  }

  const novel = novels.find((n) => n.id == novelId);
  const isFavorited = novel?.is_favorited || btn.classList.contains("active");
  try {
    const method = isFavorited ? "DELETE" : "POST";
    const url = isFavorited
      ? `http://localhost:3000/api/favorites/${novelId}`
      : "http://localhost:3000/api/favorites";
    const body =
      method === "POST" ? JSON.stringify({ novel_id: novelId }) : null;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body,
    });
    if (!response.ok)
      throw new Error(
        `Failed to ${isFavorited ? "remove" : "add"} favorite: ${
          response.status
        }`
      );

    const favs = await fetchFavorites();
    favs.forEach((fav) => {
      const n = novels.find((nv) => nv.id == fav.novel_id);
      if (n) n.favorite_count = fav.favorite_count;
    });
    btn.classList.toggle("active", !isFavorited);
    btn.querySelector("i").classList.toggle("fas", !isFavorited);
    btn.querySelector("i").classList.toggle("far", isFavorited);
    if (novel) {
      novel.is_favorited = !isFavorited;
    }
    renderFavorites();

    // Update modal if open
    const novelModal = document.getElementById("novelModal");
    if (novelModal.getAttribute("data-novel-id") == novelId && novel) {
      const modalFavoriteCount = novelModal.querySelector(".favoriteCount");
      const favoriteModalBtn = novelModal.querySelector(".favorite-modal-btn");
      if (modalFavoriteCount)
        modalFavoriteCount.textContent = novel.favorite_count;
      favoriteModalBtn.innerHTML = novel.is_favorited
        ? '<i class="fas fa-heart"></i> Remove from Favorites'
        : '<i class="far fa-heart"></i> Add to Favorites';
    }
  } catch (error) {
    console.error("Favorite error:", error);
    alert(`Error updating favorite: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const favoriteList = document.getElementById("favoriteList");
  const token = localStorage.getItem("token");
  if (!token) {
    favoriteList.style.display = 'block';
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/api/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const favorites = await res.json();
    if (!favorites.length) {
      favoriteList.innerHTML = "<p>No favorite novels yet.</p>";
      return;
    }
    favoriteList.innerHTML = favorites
      .map(
        (item) => `
            <div class="novel-card favorite-item">
                <div class="novel-cover" style="background-image: url('${
                  item.coverUrl || ""
                }');"></div>
                <div class="novel-info">
                    <div class="novel-title">${item.novelTitle}</div>
                    <div class="favorite-actions">
                      <a class="novel-link" href="novel.html?novel_id=${
                        item.novel_id
                      }">View Novel</a>
                      <button class="remove-favorite-btn" data-id="${
                        item.novel_id
                      }">Remove</button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
    // Add event for Remove button
    document.querySelectorAll(".remove-favorite-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const novel_id = this.getAttribute("data-id");
        if (!token) return;
        await fetch(`http://localhost:3000/api/favorites/${novel_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        location.reload();
      });
    });
  } catch (e) {
    favoriteList.innerHTML = "<p>Error loading favorites list.</p>";
  }
});

document.addEventListener('DOMContentLoaded', function() {
  function toggleFavoritesUI() {
    const isLoggedIn = window.isLoggedIn || localStorage.getItem('token');
    const msg = document.querySelector('.favorites-message');
    const content = document.querySelector('.favorites-content');
    if (!isLoggedIn) {
      msg.style.display = 'block';
      content.style.display = 'none';
    } else {
      msg.style.display = 'none';
      content.style.display = 'block';
    }
  }
  toggleFavoritesUI();
  window.addEventListener('loginStateChanged', toggleFavoritesUI);
});