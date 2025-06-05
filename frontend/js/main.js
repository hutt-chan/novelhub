let trafficChart;
let topFavoritesChart;

// Lấy các phần tử DOM liên quan đến biểu đồ.
const trafficChartCanvas = document.getElementById("trafficChart");
const timeframeSelect = document.getElementById("timeframe-select");
const loadingMessage = document.getElementById("loadingMessage"); /// Cho biểu đồ traffic

const topFavoritesChartCanvas = document.getElementById("topFavoritesChart");
const topFavoritesLoadingMessage = document.getElementById(
  "topFavoritesLoadingMessage"
); // Cho biểu đồ top favorites

// Hàm tiện ích: Hiển thị/Ẩn thông báo tải
function showLoading(element) {
  if (element) {
    element.style.display = "block";
  }
}

function hideLoading(element) {
  if (element) {
    element.style.display = "none";
  }
}

// Data fetching functions (Moved here) // Các hàm fetch data (Đã di chuyển vào đây)
async function fetchTrafficData(timeframe) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/traffic/get-views?timeframe=${timeframe}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error fetching view data: ${response.status} - ${errorText}`
      ); // Lỗi khi tải dữ liệu lượt xem
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch view data:", error); // Không thể tải dữ liệu lượt xem
    return [];
  }
}

async function fetchTopFavoritesData() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/novels/top-favorites"
    ); // Endpoint của bạn
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error fetching top favorite novels data: ${response.status} - ${errorText}`
      ); // Lỗi khi tải dữ liệu top truyện yêu thích
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch top favorite novels data:", error); // Không thể tải dữ liệu top truyện yêu thích
    return [];
  }
}

// Hàm xử lý dữ liệu cho biểu đồ Traffic
function processTrafficDataForChart(rawData, timeframe) {
  let labels = [];
  let data = [];
  const aggregatedData = {};

  rawData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  rawData.forEach((item) => {
    const date = new Date(item.timestamp);
    let key;

    switch (timeframe) {
      case "daily":
        key = date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        });
        break;
      case "weekly":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(
          date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1)
        );
        key = `Week ${startOfWeek.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        })}`; // Tuần
        break;
      case "monthly":
        key = date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        break;
      default:
        key = date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        });
        break;
    }
    aggregatedData[key] = (aggregatedData[key] || 0) + (item.view_count || 1);
  });

  for (const key in aggregatedData) {
    labels.push(key);
    data.push(aggregatedData[key]);
  }
  return { labels, data };
}

// Hàm khởi tạo/cập nhật biểu đồ Traffic
async function updateTrafficChart(timeframe) {
  if (!trafficChartCanvas) {
    console.warn(
      "Canvas element for traffic chart (ID: trafficChart) not found. Skipping chart update."
    );
    return;
  }

  showLoading(loadingMessage);
  const rawData = await fetchTrafficData(timeframe);
  hideLoading(loadingMessage);

  const { labels, data } = processTrafficDataForChart(rawData, timeframe);

  if (trafficChart) {
    trafficChart.destroy();
  }

  trafficChart = new Chart(trafficChartCanvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Visits", // Tổng Lượt Truy Cập
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Visits", padding: 10 }, // Số Lượt Truy Cập
          ticks: {
            precision: 0,
            padding: 5,
            color: "rgba(102, 102, 102, 1)",
            font: { size: 12, weight: "bold" },
          },
        },
        x: {
          title: { display: false },
          ticks: { autoSkip: true, maxRotation: 0, minRotation: 0, padding: 5 },
        },
      },
      plugins: {
        legend: { display: true, position: "top", labels: { padding: 20 } },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}
// Hàm khởi tạo/cập nhật biểu đồ Top Favorites
async function updateTopFavoritesChart() {
  if (!topFavoritesChartCanvas) {
    console.warn(
      "Canvas element for top favorites chart (ID: topFavoritesChart) not found. Skipping chart update."
    );
    return;
  }

  showLoading(topFavoritesLoadingMessage);
  const rawData = await fetchTopFavoritesData();
  hideLoading(topFavoritesLoadingMessage);

  const labels = rawData.map((item) => item.title);
  const data = rawData.map((item) => item.favorite_count);

  if (topFavoritesChart) {
    topFavoritesChart.destroy();
  }

  topFavoritesChart = new Chart(topFavoritesChartCanvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Favorites", // Số Lượt Yêu Thích
          data: data,
          backgroundColor: "rgba(153, 102, 255, 0.7)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "Number of Favorites", padding: 10 }, // Số Lượt Yêu Thích
          ticks: { precision: 0 },
        },
        y: {
          title: { display: false },
        },
      },
    },
  });
}

// Main initialization function for charts // Hàm khởi tạo chính cho các biểu đồ
function initCharts() {
  if (timeframeSelect) {
    updateTrafficChart(timeframeSelect.value);
    timeframeSelect.addEventListener("change", (event) => {
      updateTrafficChart(event.target.value);
    });
  } else {
    console.warn(
      "Timeframe select element (ID: timeframe-select) not found. Traffic chart will not be interactive."
    );
  }

  updateTopFavoritesChart();
}
// HẾT HÀM VÀ BIẾN TỪ chart-logic.js

let novels = [];
// HÀM THEO DÕI LƯỢT XEM TRANG
async function trackPageView() {
  const currentPath = window.location.pathname;
  try {
    const response = await fetch(
      "http://localhost:3000/api/traffic/track-view",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath }),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error tracking page view: ${response.status} - ${errorText}`
      ); // Lỗi khi theo dõi lượt xem
    }
    console.log("Page view recorded:", await response.text()); // Lượt xem đã được ghi lại
  } catch (error) {
    console.error("An error occurred while trying to record page view:", error); // Có lỗi khi cố gắng ghi lại lượt xem
  }
}

async function fetchNovels() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3000/api/novels", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok)
      throw new Error(`Failed to fetch novels: ${response.status}`);
    novels = await response.json();
    novels.forEach((novel) => {
      novel.is_favorited = novel.is_favorited || false;
      novel.is_bookmarked = novel.is_bookmarked || false;
      console.log("Chapters for novel", novel.id, novel.chapters);
    });
    console.log("Novels fetched:", novels);
  } catch (error) {
    console.error("Error fetching novels data:", error); // Lỗi khi lấy dữ liệu novels
  }
  return novels;
}

async function fetchFavorites() {
  if (typeof getIsLoggedIn === "function" && !getIsLoggedIn()) return [];
  try {
    const response = await fetch("http://localhost:3000/api/favorites", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!response.ok)
      throw new Error(`Failed to fetch favorites: ${response.status}`);
    const data = await response.json();
    console.log("Favorites response:", data);
    if (Array.isArray(data)) {
      return data;
    } else if (data.favorites && Array.isArray(data.favorites)) {
      return data.favorites;
    } else {
      console.warn("Unexpected favorites format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching favorites:", error); // Lỗi khi lấy favorites
    return [];
  }
}

async function fetchBookmarks() {
  // getIsLoggedIn() will be accessed from global auth.js // getIsLoggedIn() sẽ được truy cập từ auth.js toàn cục
  if (typeof getIsLoggedIn === "function" && !getIsLoggedIn()) return [];
  try {
    const response = await fetch("http://localhost:3000/api/bookmarks", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!response.ok)
      throw new Error(`Failed to fetch bookmarks: ${response.status}`);
    const data = await response.json();
    console.log("Bookmarks response:", data);
    if (Array.isArray(data)) {
      return data;
    } else if (data.bookmarks && Array.isArray(data.bookmarks)) {
      return data.bookmarks;
    } else {
      console.warn("Unexpected bookmarks format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching bookmarks:", error); // Lỗi khi lấy bookmarks
    return [];
  }
}

async function toggleBookmark(novelId) {
  if (typeof getIsLoggedIn === "function" && !getIsLoggedIn()) {
    alert("Please log in to bookmark!"); // Vui lòng đăng nhập để bookmark!
    return false;
  }

  const novel = novels.find((n) => n.id == novelId);
  const isBookmarked = novel.is_bookmarked;
  try {
    if (isBookmarked) {
      const response = await fetch(
        `http://localhost:3000/api/bookmarks/${novelId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok)
        throw new Error(`Failed to remove bookmark: ${response.status}`);
      if (novel) novel.is_bookmarked = false;
    } else {
      const bookmarks = await fetchBookmarks();
      if (bookmarks.some((b) => b.novel_id == novelId)) {
        console.log("Bookmark already exists for novelId:", novelId);
      } else {
        const response = await fetch("http://localhost:3000/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ novel_id: novelId }),
        });
        if (!response.ok)
          throw new Error(`Failed to add bookmark: ${response.status}`);
        if (novel) novel.is_bookmarked = true;
      }
    }
    return true;
  } catch (error) {
    console.error("Bookmark error:", error);
    alert(`Error updating bookmark: ${error.message}`); // Lỗi khi cập nhật bookmark
    return false;
  }
}

async function toggleFavorite(novelId) {
  if (typeof getIsLoggedIn === "function" && !getIsLoggedIn()) {
    alert("Please log in to add to favorites!"); // Vui lòng đăng nhập để thêm yêu thích!
    return false;
  }

  const novel = novels.find((n) => n.id == novelId);
  const isFavorited = novel.is_favorited;
  try {
    if (isFavorited) {
      const response = await fetch(
        `http://localhost:3000/api/favorites/${novelId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok)
        throw new Error(`Failed to remove favorite: ${response.status}`);
      if (novel) {
        novel.is_favorited = false;
        novel.favorite_count = parseInt(novel.favorite_count) - 1;
      }
    } else {
      const favorites = await fetchFavorites();
      if (favorites.some((f) => f.novel_id == novelId)) {
        console.log("Favorite already exists for novelId:", novelId);
      } else {
        const response = await fetch("http://localhost:3000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ novel_id: novelId }),
        });
        if (!response.ok)
          throw new Error(`Failed to add favorite: ${response.status}`);
        if (novel) {
          novel.is_favorited = true;
          novel.favorite_count = parseInt(novel.favorite_count) + 1;
        }
      }
    }
    return true;
  } catch (error) {
    console.error("Favorite error:", error);
    alert(`Error updating favorite: ${error.message}`); // Lỗi khi cập nhật favorite
    return false;
  }
}

function renderFavorites(favorites) {
  const container = document.querySelector("#favorites .novel-grid");
  const message = document.querySelector("#favorites .message");
  if (!container) {
    console.warn("Container for favorites not found.");
    return;
  }
  container.innerHTML = "";
  if (message) message.style.display = "none";

  if (favorites.length === 0) {
    if (message) {
      message.textContent = "No favorite novels yet."; // Chưa có truyện yêu thích nào.
      message.style.display = "flex";
    }
    return;
  }

  const favoritedNovelsData = novels.filter((novel) =>
    favorites.some((fav) => fav.novel_id === novel.id)
  );
  renderNovelCards(favoritedNovelsData, container, true);
}

function renderNovelCards(novelsToRender, container, showStats = false) {
  if (!container) {
    console.warn("Container for novel cards not found.");
    return;
  }
  container.innerHTML = "";
  if (!novelsToRender || novelsToRender.length === 0) {
    container.innerHTML = '<div class="no-novels">No novels to display</div>'; // Không có truyện nào để hiển thị
    return;
  }
  novelsToRender.forEach((novel) => {
    const novelCard = document.createElement("div");
    novelCard.className = "novel-card";
    novelCard.setAttribute("data-id", novel.id);
    novelCard.innerHTML = `
            <div class="novel-cover" style="background-image: url(${
              novel.coverUrl || "images/default-cover.jpg"
            })"></div>
            <div class="novel-info">
                <h3 class="novel-title">${novel.title}</h3>
                <p class="novel-author">By ${novel.author}</p>
                ${
                  showStats
                    ? `
                    <div class="novel-stats">
                        <span><i class="fas fa-eye"></i> ${
                          novel.views ? novel.views.toLocaleString() : 0
                        }</span>
                        <span><i class="fas fa-star"></i> ${
                          novel.rating || 0
                        }</span>
                        <span><i class="fas fa-heart"></i> ${
                          novel.favorite_count || 0
                        }</span>
                    </div>
                `
                    : ""
                }
            </div>
        `;
    novelCard.addEventListener("click", () => {
      window.location.href = `novel.html?novel_id=${novel.id}`;
    });
    container.appendChild(novelCard);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // GỌI HÀM INIT AUTH (từ auth.js được nhúng trước)
  if (typeof initAuth === "function") {
    // Kiểm tra để đảm bảo hàm tồn tại
    initAuth();
  } else {
    console.error(
      "initAuth function not found. Make sure auth.js is loaded before main.js."
    );
  }

  // GỌI HÀM THEO DÕI LƯỢT XEM
  trackPageView();

  await fetchNovels();

  const favorites = await fetchFavorites();
  const bookmarks = await fetchBookmarks();

  novels.forEach((novel) => {
    novel.is_favorited = favorites.some((f) => f.novel_id == novel.id);
    novel.is_bookmarked = bookmarks.some((b) => b.novel_id == novel.id);
  });

  const featuredNovels = [...novels]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);
  renderNovelCards(
    featuredNovels,
    document.querySelector("#weeklyFeatured"),
    true
  );

  const updatedNovels = [...novels]
    .sort((a, b) => {
      const aLatest = a.chapters?.[0]?.date || 0;
      const bLatest = b.chapters?.[0]?.date || 0;
      return new Date(bLatest) - new Date(aLatest);
    })
    .slice(0, 4);
  renderNovelCards(updatedNovels, document.querySelector("#newUpdates"), true);

  renderFavorites(favorites);

  // Event listeners for login/signup forms (using functions from auth.js) // Sự kiện cho form đăng nhập/đăng ký (sử dụng các hàm từ auth.js)
  document
    .getElementById("signinForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("signinEmail").value;
      const password = document.getElementById("signinPassword").value;
      if (typeof signIn === "function") await signIn(email, password);
    });

  document
    .getElementById("signupForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById(
        "signupConfirmPassword"
      ).value;
      if (typeof signUp === "function")
        await signUp(username, email, password, confirmPassword);
    });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      document.querySelector(".nav-link.active")?.classList.remove("active");
      this.classList.add("active");
    });
  });

  document.querySelectorAll(".auth-modal .modal-close").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".auth-modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  document.getElementById("switchToSignup")?.addEventListener("click", () => {
    closeModal("signinModal");
    openModal("signupModal");
  });

  document.getElementById("switchToSignin")?.addEventListener("click", () => {
    closeModal("signupModal");
    openModal("signinModal");
  });

  // GỌI HÀM KHỞI TẠO TÌM KIẾM
  initSearch();

  // GỌI HÀM KHỞI TẠO BIỂU ĐỒ (đã được di chuyển vào main.js)
  initCharts();
});

function openModal(modalId) {
  document.getElementById(modalId)?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove("active");
  document.body.style.overflow = "";
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.classList.remove("active");
  });
  document.body.style.overflow = "";
}

// Search novels by name or author // Tìm kiếm tiểu thuyết theo tên hoặc tác giả
function searchNovels(query) {
  if (!query || query.length < 2) return [];
  const lowerQuery = query.toLowerCase();
  return novels
    .filter(
      (novel) =>
        novel.title.toLowerCase().includes(lowerQuery) ||
        novel.author.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 7);
}

// Render search suggestion list // Render danh sách gợi ý tìm kiếm
function renderSearchResults(results, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!results.length) {
    container.innerHTML = '<div class="no-results">No results found</div>'; // Không tìm thấy kết quả
    return;
  }
  results.forEach((novel) => {
    console.log("Novel:", novel);
    if (!novel.id) {
      console.error("Novel missing id:", novel);
      return;
    }
    const resultItem = document.createElement("div");
    resultItem.className = "search-result-item";
    resultItem.innerHTML = `
            <div class="search-result-cover" style="background-image: url(${
              novel.coverUrl || "images/default-cover.jpg"
            })"></div>
            <div class="search-result-info">
                <h3 class="search-result-title">${novel.title}</h3>
                <p class="search-result-author">By ${novel.author}</p>
            </div>
        `;
    resultItem.addEventListener("mousedown", () => {
      console.log("Clicked novel:", novel.id);
      window.location.href = `novel.html?novel_id=${novel.id}`;
      container.innerHTML = "";
      document.getElementById("searchInput").value = "";
    });
    container.appendChild(resultItem);
  });
}

// Add search event listener // Thêm sự kiện tìm kiếm
function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  let searchTimeout;

  if (!searchInput || !searchResults) {
    console.warn(
      "Search input or results container not found. Search functionality disabled."
    );
    return;
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    searchTimeout = setTimeout(() => {
      if (query.length < 2) {
        searchResults.classList.remove("active");
        searchResults.innerHTML = "";
        return;
      }
      const results = searchNovels(query);
      renderSearchResults(results, searchResults);
      searchResults.classList.add("active");
    }, 300);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.length >= 2) {
      searchResults.classList.add("active");
    }
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      searchResults.classList.remove("active");
    }, 300);
  });

  document.querySelector(".search-btn")?.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      const results = searchNovels(query);
      renderSearchResults(results, searchResults);
      searchResults.classList.add("active");
    }
  });
}