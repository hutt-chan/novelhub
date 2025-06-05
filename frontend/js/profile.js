// js/profile.js (updated)
let user = null;

async function fetchUserProfile() {
    if (!window.isLoggedIn) return null;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to fetch profile: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

function renderProfile() {
    const profileMessage = document.querySelector('.profile-message');
    const profileContent = document.querySelector('.profile-content');

    if (!window.isLoggedIn || !user) {
        profileMessage.style.display = 'block';
        profileContent.style.display = 'none';
        return;
    }

    profileMessage.style.display = 'none';
    profileContent.style.display = 'block';

    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileJoinedDate').textContent = new Date(user.created_at).toLocaleDateString('vi-VN');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Khởi tạo trạng thái đăng nhập
    await window.initAuth();
    user = await fetchUserProfile();
    renderProfile();

    // Xử lý form cập nhật profile
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('newUsername').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();

        if (!newUsername && !newPassword) {
            alert('Please provide a new username or password!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const body = {};
            if (newUsername) body.username = newUsername;
            if (newPassword) body.password = newPassword;

            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to update profile: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            alert(data.message);
            profileForm.reset();

            // Cập nhật lại thông tin hiển thị nếu username thay đổi
            if (newUsername) {
                user.username = newUsername;
                window.currentUser.username = newUsername; // Update global state
                window.updateAuthUI(); // Refresh auth UI
                renderProfile();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message);
        }
    });
});