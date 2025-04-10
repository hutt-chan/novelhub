window.updateAuthUI = function() {
  // Hàm helper để parse an toàn
  const safeParse = (value, defaultValue) => {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Parse error:', error);
      return defaultValue;
    }
  };

  const isLoggedIn = safeParse(localStorage.getItem('isLoggedIn'), false);
  const user = safeParse(localStorage.getItem('user'), { username: "Guest", avatar: "assets/images/avatar.png" });
  const role = safeParse(localStorage.getItem('role'), 'reader');

  const authButtons = document.querySelector('.auth-buttons');
  const userInfo = document.querySelector('.user-info');
  const profileItem = document.querySelector('.profile-item');
  const manageNovelsItem = document.querySelector('.manage-novels-item');

  if (authButtons && userInfo && profileItem) {
    if (isLoggedIn) {
      authButtons.style.display = 'none';
      userInfo.style.display = 'flex';
      profileItem.style.display = 'block';
      const usernameElement = document.querySelector('.username');
      if (usernameElement) {
        usernameElement.textContent = user.username;
      }

      if (role === 'admin' && manageNovelsItem) {
        manageNovelsItem.style.display = 'block';
      } else if (manageNovelsItem) {
        manageNovelsItem.style.display = 'none';
      }
    } else {
      authButtons.style.display = 'flex';
      userInfo.style.display = 'none';
      profileItem.style.display = 'none';
      if (manageNovelsItem) manageNovelsItem.style.display = 'none';
    }
  }
};

// Xử lý Sign out
const signOutButton = document.querySelector('.sign-out');
if (signOutButton) {
  signOutButton.addEventListener('click', () => {
    alert('Signed out!');
    localStorage.setItem('isLoggedIn', JSON.stringify(false));
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.updateAuthUI();
    window.location.href = 'index.html';
  });
}

window.updateAuthUI();