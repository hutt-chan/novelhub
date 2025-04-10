// Đọc trạng thái đăng nhập từ localStorage
const isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn')) || false;
const user = JSON.parse(localStorage.getItem('user')) || { username: "Guest", avatar: "assets/images/avatar.png" };

// Thay đổi giao diện dựa trên trạng thái đăng nhập
function updateAuthUI() {
  const authButtons = document.querySelector('.auth-buttons');
  const userInfo = document.querySelector('.user-info');
  const profileItem = document.querySelector('.profile-item');

  if (authButtons && userInfo && profileItem) {
    if (isLoggedIn) {
      authButtons.style.display = 'none';
      userInfo.style.display = 'flex';
      profileItem.style.display = 'block';
      const usernameElement = document.querySelector('.username');
      if (usernameElement) {
        usernameElement.textContent = user.username;
      }
    } else {
      authButtons.style.display = 'flex';
      userInfo.style.display = 'none';
      profileItem.style.display = 'none';
    }
  } else {
    console.warn('One or more auth elements not found in the DOM');
  }
}

// Giả lập sự kiện Sign out
const signOutButton = document.querySelector('.sign-out');
if (signOutButton) {
  signOutButton.addEventListener('click', () => {
    alert('Signed out!');
    localStorage.setItem('isLoggedIn', JSON.stringify(false));
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
}

// Gọi hàm cập nhật giao diện
updateAuthUI();