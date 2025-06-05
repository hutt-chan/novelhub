window.isLoggedIn = false;
window.currentUser = null;

/**
 * Khởi tạo trạng thái xác thực bằng cách kiểm tra token và thông tin người dùng trong localStorage
 * và xác thực lại với API backend.
 */
async function initAuth() {
  const token = localStorage.getItem("token");
  const currentUserString = localStorage.getItem("currentUser");

  if (token && currentUserString) {
    try {
      const response = await fetch("http://localhost:3000/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.user) {
        window.currentUser = data.user;
        window.isLoggedIn = true;
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        console.log(
          "initAuth: User authenticated successfully.",
          window.currentUser
        );
      } else {
        console.error(
          "initAuth: Token không hợp lệ, hết hạn hoặc lỗi API:",
          data.message || "Unknown error"
        );
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        window.isLoggedIn = false;
        window.currentUser = null;
      }
    } catch (error) {
      console.error(
        "initAuth: Lỗi khi kiểm tra token hoặc parse currentUser:",
        error
      );
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      window.isLoggedIn = false;
      window.currentUser = null;
    }
  } else {
    console.log("initAuth: No token or currentUser found in localStorage.");
    window.isLoggedIn = false;
    window.currentUser = null;
  }
  updateAuthUI();
}

/**
 * Cập nhật giao diện người dùng dựa trên trạng thái xác thực.
 * Tìm và tương tác với các phần tử có id 'authContainer' và class 'nav-links'.
 */
function updateAuthUI() {
  const authContainer = document.getElementById("authContainer");
  const nav = document.querySelector(".nav-links"); // Giả sử .nav-links là nơi chứa các link điều hướng

  if (!authContainer || !nav) {
    console.warn(
      "updateAuthUI: authContainer hoặc .nav-links không tồn tại - bỏ qua cập nhật UI cho trang chủ."
    );
    return; // Không làm gì nếu các phần tử UI chính không có (như trên trang admin)
  }

  // Xóa link "Quản trị" cũ (nếu có) để tránh trùng lặp khi updateAuthUI chạy nhiều lần
  const existingAdminLink = nav.querySelector('a[href="/admin.html"]');
  if (existingAdminLink) {
    existingAdminLink.remove();
  }

  // Dùng window.isLoggedIn và window.currentUser
  if (window.isLoggedIn && window.currentUser) {
    authContainer.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${window.currentUser.username
                  .charAt(0)
                  .toUpperCase()}</div>
                <span class="user-name">${window.currentUser.username} (${
      window.currentUser.role === "admin" ? "Admin" : "User"
    })</span>
            </div>
            <button class="auth-btn logout-btn" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                Log Out
            </button>
        `;
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    // Dùng window.currentUser để hiển thị link Admin nếu có quyền
    if (window.currentUser.role === "admin") {
      const adminLink = document.createElement("a");
      adminLink.className = "nav-link"; // Hoặc class phù hợp với CSS của bạn
      adminLink.href = "/admin.html";
      adminLink.innerHTML = '<i class="fas fa-cog"></i> Quản lý'; // Thay Manage bằng Quản lý
      nav.appendChild(adminLink);
    }
  } else {
    authContainer.innerHTML = `
            <button class="auth-btn signin-btn" id="signinBtn">
                <i class="fas fa-sign-in-alt"></i>
                Log In
            </button>
            <button class="auth-btn signup-btn" id="signupBtn">
                <i class="fas fa-user-plus"></i>
                Sign In
            </button>
        `;
    const signinBtn = document.getElementById("signinBtn");
    const signupBtn = document.getElementById("signupBtn");
    if (signinBtn) {
      signinBtn.addEventListener("click", () => openModal("signinModal"));
    }
    if (signupBtn) {
      signupBtn.addEventListener("click", () => openModal("signupModal"));
    }
  }

  // Điều khiển hiển thị các nút và form yêu cầu đăng nhập trên trang chính
  document
    .querySelectorAll(
      ".bookmark-btn, .favorite-btn, .bookmark-modal-btn, .favorite-modal-btn"
    )
    .forEach((btn) => {
      btn.style.display = window.isLoggedIn ? "block" : "none"; // Sử dụng window.isLoggedIn
    });
  const commentForm = document.getElementById("commentForm");
  if (commentForm) {
    commentForm.style.display = window.isLoggedIn ? "block" : "none"; // Sử dụng window.isLoggedIn
  }
}

/**
 * Xử lý đăng nhập người dùng.
 * @param {string} email - Email của người dùng.
 * @param {string} password - Mật khẩu của người dùng.
 */
async function signIn(email, password) {
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      console.error("Sign In Error:", data.error);
      return;
    }
    localStorage.setItem("token", data.token);
    // Lưu cả đối tượng user vào localStorage để có thể truy cập role sau này
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    // CẬP NHẬT CÁC THUỘC TÍNH CỦA WINDOW SAU KHI ĐĂNG NHẬP THÀNH CÔNG
    window.currentUser = data.user;
    window.isLoggedIn = true;

    updateAuthUI(); // Cập nhật giao diện
    closeAllModals(); // Đóng tất cả các modal
    alert(`Chào mừng trở lại, ${window.currentUser.username}!`);
    // Chuyển hướng người dùng dựa trên vai trò
    if (window.currentUser.role === "admin") {
      window.location.href = "admin.html"; // Chuyển hướng đến trang admin
    } else {
      window.location.href = "index.html"; // Chuyển hướng đến trang chủ hoặc trang người dùng
    }
  } catch (error) {
    alert("Lỗi khi đăng nhập. Vui lòng thử lại.");
    console.error("Sign In Network Error:", error);
  }
}

/**
 * Xử lý đăng ký người dùng mới.
 * @param {string} username - Tên người dùng.
 * @param {string} email - Email.
 * @param {string} password - Mật khẩu.
 * @param {string} confirmPassword - Xác nhận mật khẩu.
 */
async function signUp(username, email, password, confirmPassword) {
  // Sửa lỗi cú pháp: kiểm tra sự tồn tại của biến.
  if (!username || !email || !password || !confirmPassword) {
    alert("Vui lòng điền đầy đủ thông tin");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu không khớp");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      console.error("Sign Up Error:", data.error);
      return;
    }
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    closeModal("signupModal");
    openModal("signinModal"); // Mở modal đăng nhập sau khi đăng ký thành công
  } catch (error) {
    alert("Lỗi khi đăng ký. Vui lòng thử lại.");
    console.error("Sign Up Network Error:", error);
  }
}

/**
 * Xử lý đăng xuất người dùng.
 */
async function logout() {
  try {
    await fetch("http://localhost:3000/api/logout", { method: "POST" });

    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    window.currentUser = null;
    window.isLoggedIn = false;

    updateAuthUI();
    alert("Bạn đã đăng xuất");
    window.location.href = "index.html";
  } catch (error) {
    alert("Lỗi khi đăng xuất. Vui lòng thử lại.");
    console.error("Logout Error:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    window.currentUser = null;
    window.isLoggedIn = false;
    updateAuthUI();
    window.location.href = "index.html";
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
    const closeBtn = modal.querySelector(".close-button");
    if (closeBtn) {
      closeBtn.onclick = () => closeModal(modalId);
    }
    window.onclick = (event) => {
      if (event.target == modal) {
        closeModal(modalId);
      }
    };
  } else {
    console.warn(`Modal with ID "${modalId}" not found.`);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", initAuth);