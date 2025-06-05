async function loadDashboardStats() {
    const totalNovelsElement = document.getElementById('totalNovelsCount');
    const totalUsersElement = document.getElementById('totalUsersCount');
    const newUsersElement = document.getElementById('newUsersThisMonthCount');

    // Display initial loading status
    totalNovelsElement.textContent = 'Loading...';
    totalUsersElement.textContent = 'Loading...';
    newUsersElement.textContent = 'Loading...';

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in or your session has expired. Please log in again.');
        // Redirect to login page if no token
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/admin/dashboard-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('You do not have permission to access the admin page or your session has expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            } else {
                throw new Error(`Error loading statistics: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();

        totalNovelsElement.textContent = data.totalNovels;
        totalUsersElement.textContent = data.totalUsers;
        newUsersElement.textContent = data.newUsers;
    } catch (error) {
        console.error('Error loading dashboard statistics:', error);
        alert('Failed to load dashboard statistics. Please check the console for error details.');
        totalNovelsElement.textContent = '-';
        totalUsersElement.textContent = '-';
        newUsersElement.textContent = '-';
    }
}

document.addEventListener('DOMContentLoaded', loadDashboardStats);

// Logic for the Logout button on the Admin Dashboard page
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            // It's good practice to invalidate the session on the server side as well,
            // even if the client-side token is removed.
            await fetch('http://localhost:3000/api/logout', { method: 'POST' });
            localStorage.removeItem('token');
            alert('You have been logged out of the admin page.');
            window.location.href = '/'; // Redirect to home page after logout
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred during logout. Please try again.');
        }
    });
}