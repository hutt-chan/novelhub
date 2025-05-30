let isLoggedIn = false;
let currentUser = null;

async function initAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('http://localhost:3000/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.user) {
                currentUser = data.user;
                isLoggedIn = true;
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra token:', error);
            localStorage.removeItem('token');
        }
    }
    updateAuthUI();
}

function updateAuthUI() {
    const authContainer = document.getElementById('authContainer');
    const nav = document.querySelector('.nav-links');

    // Xóa link "Quản trị" cũ (nếu có)
    const existingAdminLink = nav.querySelector('a[href="#admin"]');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }

    if (isLoggedIn && currentUser) {
        authContainer.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${currentUser.username.charAt(0).toUpperCase()}</div>
                <span class="user-name">${currentUser.username} (${currentUser.role === 'admin' ? 'Admin' : 'User'})</span>
            </div>
            <button class="auth-btn logout-btn" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                Đăng xuất
            </button>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        if (currentUser.role === 'admin') {
            const adminLink = document.createElement('a');
            adminLink.className = 'nav-link';
            adminLink.href = '#admin';
            adminLink.innerHTML = '<i class="fas fa-cog"></i> <span>Quản trị</span>';
            adminLink.addEventListener('click', () => {
                alert('Chuyển đến trang quản trị (chưa triển khai giao diện)');
            });
            nav.appendChild(adminLink);
        }
    } else {
        authContainer.innerHTML = `
            <button class="auth-btn signin-btn" id="signinBtn">
                <i class="fas fa-sign-in-alt"></i>
                Đăng nhập
            </button>
            <button class="auth-btn signup-btn" id="signupBtn">
                <i class="fas fa-user-plus"></i>
                Đăng ký
            </button>
        `;
        const signinBtn = document.getElementById('signinBtn');
        const signupBtn = document.getElementById('signupBtn');
        if (signinBtn) {
            signinBtn.addEventListener('click', () => openModal('signinModal'));
        }
        if (signupBtn) {
            signupBtn.addEventListener('click', () => openModal('signupModal'));
        }
    }

    // Điều khiển hiển thị các nút và form yêu cầu đăng nhập
    document.querySelectorAll('.bookmark-btn, .favorite-btn, .bookmark-modal-btn, .favorite-modal-btn').forEach(btn => {
        btn.style.display = isLoggedIn ? 'block' : 'none';
    });
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.style.display = isLoggedIn ? 'block' : 'none';
    }
}

async function signIn(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        localStorage.setItem('token', data.token);
        currentUser = data.user;
        isLoggedIn = true;
        updateAuthUI();
        closeAllModals();
        alert(`Chào mừng trở lại, ${currentUser.username}!`);
    } catch (error) {
        alert('Lỗi khi đăng nhập. Vui lòng thử lại.');
    }
}

async function signUp(username, email, password, confirmPassword) {
    if (!username || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Mật khẩu không khớp');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        closeModal('signupModal');
        openModal('signinModal');
    } catch (error) {
        alert('Lỗi khi đăng ký. Vui lòng thử lại.');
    }
}

async function logout() {
    try {
        await fetch('http://localhost:3000/api/logout', { method: 'POST' });
        localStorage.removeItem('token');
        currentUser = null;
        isLoggedIn = false;
        updateAuthUI();
        alert('Bạn đã đăng xuất');
    } catch (error) {
        alert('Lỗi khi đăng xuất. Vui lòng thử lại.');
    }
}