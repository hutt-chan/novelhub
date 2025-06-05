document.addEventListener("DOMContentLoaded", async function () {
  const historyList = document.getElementById("historyList");
  const token = localStorage.getItem("token");
  if (!token) {
    historyList.style.display = 'block';
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/api/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const history = await res.json();
    if (!history.length) {
      historyList.innerHTML = "<p>Chưa có lịch sử đọc.</p>";
      return;
    }
    historyList.innerHTML = history
      .map(
        (item) => `
            <div class="novel-card history-item" style="cursor:default;">
                <div class="novel-cover" style="background-image: url('${
                  item.coverUrl || ""
                }'); background-size: cover; background-position: center;"></div>
                <div class="novel-info">
                    <div class="novel-title"><i class="fas fa-book"></i> ${
                      item.novelTitle
                    }</div>
                    <div class="chapter-title"><i class="fas fa-file-alt"></i> <a href="chapter.html?novel_id=${
                      item.novel_id
                    }&chapter_id=${item.chapter_id}">${
          item.chapterTitle
        }</a></div>
                    <div class="read-time"><i class="far fa-clock"></i> ${new Date(
                      item.read_at
                    ).toLocaleString("vi-VN")}</div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (e) {
    historyList.innerHTML = "<p>Lỗi khi tải lịch sử đọc.</p>";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  function toggleHistoryUI() {
    const isLoggedIn = window.isLoggedIn || localStorage.getItem("token");
    const msg = document.querySelector(".history-message");
    const content = document.querySelector(".history-content");
    if (!isLoggedIn) {
      msg.style.display = "block";
      content.style.display = "none";
    } else {
      msg.style.display = "none";
      content.style.display = "block";
    }
  }
  toggleHistoryUI();
  window.addEventListener("loginStateChanged", toggleHistoryUI);
});