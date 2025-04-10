// Hàm hiển thị danh sách tiểu thuyết
async function displayNovels(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID ${containerId} not found`);
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/novels');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const novels = await response.json();
  
      if (!novels || novels.length === 0) {
        container.innerHTML = '<p>No novels found.</p>';
        return;
      }
  
      novels.forEach(novel => {
        const card = document.createElement('a');
        card.className = 'novel-card';
        card.href = `novel.html?id=${novel.id}`;
        card.innerHTML = `
          <img src="${novel.cover}" alt="${novel.title}">
          <div class="novel-info">
            <h3>${novel.title}</h3>
            <div class="rating">★ ${novel.rating}</div>
            <div class="author">by ${novel.author}</div>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching novels:', error);
      container.innerHTML = `<p>Error loading novels: ${error.message}</p>`;
    }
  }
  
  // Thay đổi tiêu đề dựa trên trạng thái đăng nhập
  function updateTitles() {
    const recommendTitle = document.querySelector('.recommend-title');
    const newUpdateTitle = document.querySelector('.new-update-title');
    const isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn')) || false;
  
    if (recommendTitle && newUpdateTitle) {
      if (isLoggedIn) {
        recommendTitle.textContent = 'Recommended for You';
        newUpdateTitle.textContent = 'New Updates for You';
      } else {
        recommendTitle.textContent = 'Recommend';
        newUpdateTitle.textContent = 'New Update';
      }
    }
  }
  //XỬ LÝ FORM SIGN IN
  // Khai báo các biến ở đầu file để tránh xung đột
  const signInButton = document.querySelector('.sign-in');
  const closeButton = document.querySelector('.close');
  const loginForm = document.getElementById('login-form');
  
  // Hiển thị modal khi nhấp vào nút "Sign in"
  if (signInButton) {
    signInButton.addEventListener('click', () => {
      document.getElementById('login-modal').style.display = 'flex';
    });
  } else {
    console.warn('Sign-in button not found in the DOM');
  }
  
  // Đóng modal khi nhấp vào dấu X
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      document.getElementById('login-modal').style.display = 'none';
      document.getElementById('error-message').style.display = 'none';
    });
  } else {
    console.warn('Close button not found in the DOM');
  }
  
  // Xử lý khi người dùng gửi form đăng nhập
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('error-message');
  
      try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
  
        if (response.ok) {
          // Lưu vào localStorage
          localStorage.setItem('isLoggedIn', JSON.stringify(true));
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('role', JSON.stringify(data.user.role));
          // Log để kiểm tra
          console.log('Stored isLoggedIn:', localStorage.getItem('isLoggedIn'));
          console.log('Stored user:', localStorage.getItem('user'));
          console.log('Stored role:', localStorage.getItem('role'));
          // Đóng modal và cập nhật giao diện
          document.getElementById('login-modal').style.display = 'none';
          updateAuthUI();
          updateTitles();
        } else {
          errorMessage.textContent = data.message || 'Đăng nhập thất bại';
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        errorMessage.textContent = 'Có lỗi xảy ra khi đăng nhập';
        errorMessage.style.display = 'block';
      }
    });
  }
  
  // Hiển thị tiểu thuyết và cập nhật giao diện
  displayNovels('recommend-grid');
  displayNovels('new-update-grid');
  updateTitles();

 //XỬ LÍ FORM SIGN UP
 // Khai báo các biến liên quan đến Sign-up
const signUpButton = document.querySelector('.sign-up');
const signupForm = document.getElementById('signup-form');
const signupLink = document.getElementById('signup-link');
const signinLink = document.getElementById('signin-link');
const closeButtons = document.querySelectorAll('.close');

// Mở modal Sign-up khi nhấp nút "Sign up"
if (signUpButton) {
  signUpButton.addEventListener('click', () => {
    document.getElementById('signup-modal').style.display = 'flex';
  });
}

// Chuyển từ Sign-in sang Sign-up
if (signupLink) {
  signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('signup-modal').style.display = 'flex';
  });
}

// Chuyển từ Sign-up sang Sign-in
if (signinLink) {
  signinLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-modal').style.display = 'none';
    document.getElementById('login-modal').style.display = 'flex';
  });
}

// Đóng modal khi nhấp vào nút "X"
closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('signup-modal').style.display = 'none';
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => (msg.style.display = 'none'));
  });
});

// Xử lý form Sign-up
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorMessage = document.getElementById('signup-error-message');

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        signupForm.reset(); // Xóa form
        document.getElementById('signup-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'flex';
      } else {
        errorMessage.textContent = data.message || 'Đăng ký thất bại';
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      errorMessage.textContent = 'Có lỗi xảy ra khi đăng ký';
      errorMessage.style.display = 'block';
    }
  });
}