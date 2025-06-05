// frontend/js/manageChapters.js
document.addEventListener("DOMContentLoaded", () => {
  // Lấy các phần tử DOM cần thiết từ HTML bằng ID của chúng
  const chaptersTableBody = document.getElementById("chaptersTableBody");
  const addChapterBtn = document.getElementById("addChapterBtn");
  const chapterModal = document.getElementById("chapterModal");
  const closeButton = document.querySelector(".modal .close-button");
  const chapterForm = document.getElementById("chapterForm");
  const modalTitle = document.getElementById("modalTitle");
  const chapterIdInput = document.getElementById("chapterId");
  const modalNovelIdInput = document.getElementById("modalNovelId");
  const modalChapterNameInput = document.getElementById("modalChapterName");
  const modalChapterDateInput = document.getElementById("modalChapterDate");
  const modalChapterContentInput = document.getElementById(
    "modalChapterContent"
  );

  const novelIdFilterInput = document.getElementById("novelIdFilter");
  const applyChapterFiltersBtn = document.getElementById("applyChapterFilters");
  const resetChapterFiltersBtn = document.getElementById("resetChapterFilters");

  const API_BASE_URL = "http://localhost:3000/api";

  const getToken = () => localStorage.getItem("token");

  const showMessage = (message, type = "info") => {
    alert(message);
  };

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadChapters = async (filters = {}) => {
    try {
      const token = getToken();
      if (!token) {
        showMessage("You need to log in to view chapters.");
        window.location.href = "/login.html";
        return;
      }

      let url = `${API_BASE_URL}/chapters`;
      const queryParams = new URLSearchParams();

      if (filters.novel_id) {
        queryParams.append("novel_id", filters.novel_id);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showMessage(
            "Login session expired or you do not have permission. Please log in again."
          );
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login.html";
        }
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const chapters = await response.json();
      chaptersTableBody.innerHTML = "";

      if (chapters.length === 0) {
        chaptersTableBody.innerHTML =
          '<tr><td colspan="6" style="text-align: center;">No chapters found.</td></tr>';
        return;
      }

      chapters.forEach((chapter) => {
        const row = chaptersTableBody.insertRow();
        row.innerHTML = `
                    <td>${chapter.id}</td>
                    <td>${chapter.novel_id}</td>
                    <td>${chapter.name}</td>
                    <td>${
                      chapter.date
                        ? new Date(chapter.date).toLocaleString()
                        : "N/A"
                    }</td>
                    <td>${chapter.content_summary || ""}</td>
                    <td class="actions-cell">
                        <button class="action-button btn-edit" data-id="${
                          chapter.id
                        }"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-button btn-delete" data-id="${
                          chapter.id
                        }"><i class="fas fa-trash-alt"></i> Delete </button>
                    </td>
                `;
      });

      document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", (e) => {
          openEditModal(e.currentTarget.dataset.id);
        });
      });
      document.querySelectorAll(".btn-delete").forEach((button) => {
        button.addEventListener("click", (e) => {
          deleteChapter(e.currentTarget.dataset.id);
        });
      });
    } catch (error) {
      console.error("Error loading chapters:", error);
      showMessage(
        "Failed to load chapter list. Please try again. Error: " + error.message
      );
    }
  };

  addChapterBtn.addEventListener("click", () => {
    modalTitle.textContent = "Add New Chapter";
    chapterIdInput.value = "";
    chapterForm.reset();
    modalChapterDateInput.value = formatDateTimeLocal(new Date());
    chapterModal.classList.add("active");
  });

  closeButton.addEventListener("click", () => {
    chapterModal.classList.remove("active");
  });

  window.addEventListener("click", (event) => {
    if (event.target === chapterModal) {
      chapterModal.classList.remove("active");
    }
  });

  const openEditModal = async (chapterId) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/chapters/detail/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Detailed error from backend:", errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      const chapter = await response.json();

      modalTitle.textContent = "Edit Chapter";
      chapterIdInput.value = chapter.id;
      modalNovelIdInput.value = chapter.novel_id;
      modalChapterNameInput.value = chapter.name;
      modalChapterDateInput.value = formatDateTimeLocal(chapter.date);
      modalChapterContentInput.value = chapter.content;
      chapterModal.classList.add("active");
    } catch (error) {
      console.error("Error opening edit modal:", error);
      showMessage(
        "Failed to load chapter information for editing. Error: " +
          error.message
      );
    }
  };

  chapterForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const chapterId = chapterIdInput.value;
    const novel_id = modalNovelIdInput.value;
    const name = modalChapterNameInput.value;
    const date = modalChapterDateInput.value;
    const content = modalChapterContentInput.value;

    const chapterData = {
      novel_id: parseInt(novel_id),
      name,
      date,
      content,
    };
    const token = getToken();

    try {
      let response;
      if (chapterId) {
        response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(chapterData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/chapters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(chapterData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "An error occurred while saving the chapter."
        );
      }

      showMessage(`Chapter ${chapterId ? "updated" : "added"} successfully!`);
      chapterModal.classList.remove("active");
      loadChapters();
    } catch (error) {
      console.error("Error saving chapter:", error);
      showMessage("Error: " + error.message);
    }
  });

  const deleteChapter = async (chapterId) => {
    if (!confirm("Are you sure you want to delete this chapter?")) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "An error occurred while deleting the chapter."
        );
      }

      showMessage("Chapter deleted successfully!");
      loadChapters();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      showMessage("Error: " + error.message);
    }
  };

  applyChapterFiltersBtn.addEventListener("click", () => {
    const novelId = novelIdFilterInput.value;
    loadChapters({ novel_id: novelId });
  });

  resetChapterFiltersBtn.addEventListener("click", () => {
    novelIdFilterInput.value = "";
    loadChapters();
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("You have been logged out successfully!");
      window.location.href = "index.html";
    });
  } else {
    console.warn("Logout button (ID: logoutBtn) not found.");
  }

  loadChapters();
});