let user = null;

async function fetchUserProfile() {
    if (!window.isLoggedIn) {
        console.log('User not logged in, showing sign-in message');
        return null;
    }
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch profile: ${response.status}`);
        const data = await response.json();
        console.log('User profile fetched:', data);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        alert(`Error fetching profile: ${error.message}`);
        return null;
    }
}

function renderProfile() {
    const profileMessage = document.querySelector('.profile-message');
    const profileContent = document.querySelector('.profile-content');
    const loading = document.querySelector('.loading');

    loading.style.display = 'none';
    profileMessage.style.display = 'none';
    profileContent.style.display = 'none';

    if (!window.isLoggedIn || !user) {
        profileMessage.textContent = 'Please sign in to view your profile.';
        profileMessage.style.display = 'block';
        return;
    }

    profileContent.style.display = 'block';
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileJoinedDate').textContent = new Date(user.created_at).toLocaleDateString();
}

async function updateProfile(username, password, confirmPassword) {
    if (password && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const body = {};
        if (username) body.username = username;
        if (password) body.password = password;

        if (Object.keys(body).length === 0) {
            alert('Please provide a new username or password to update.');
            return;
        }

        const response = await fetch('http://localhost:3000/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        alert('Profile updated successfully!');
        if (username) user.username = username;
        renderProfile();
    } catch (error) {
        console.error('Update profile error:', error);
        alert(`Error updating profile: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await window.initAuth(); // Gọi initAuth từ global scope

    const loading = document.querySelector('.loading');
    loading.style.display = 'block';

    user = await fetchUserProfile();
    renderProfile();

    document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('updateUsername').value.trim();
        const password = document.getElementById('updatePassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        await updateProfile(username, password, confirmPassword);
        document.getElementById('updateProfileForm').reset();
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await window.logout(); // Gọi logout từ global scope
        window.location.reload();
    });
});