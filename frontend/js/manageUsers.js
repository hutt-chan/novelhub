// frontend/js/manageUsers.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM has been fully loaded. Initializing manageUsers.js');

    // Get necessary DOM elements
    const usersTableBody = document.getElementById('usersTableBody');
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const closeButton = userModal.querySelector('.close-button'); // Get close button from inside the modal
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    const userIdInput = document.getElementById('userId');
    const modalUsernameInput = document.getElementById('modalUsername');
    const modalEmailInput = document.getElementById('modalEmail');
    const modalPasswordInput = document.getElementById('modalPassword');
    const modalRoleSelect = document.getElementById('modalRole');
    const passwordHelpText = userForm.querySelector('.password-help-text');

    // Elements for filters
    const userRoleFilterSelect = document.getElementById('userRoleFilter');
    const usernameSearchInput = document.getElementById('usernameSearchInput');
    const applyUserFiltersBtn = document.getElementById('applyUserFilters');
    const resetUserFiltersBtn = document.getElementById('resetUserFilters');

    // Get Logout button (if not handled by main.js)
    const logoutButton = document.getElementById('logoutBtn');

    // Base URL for your APIs
    const API_BASE_URL = 'http://localhost:3000/api';

    // Function to get token from localStorage (assuming it's available globally or defined here)
    const getToken = () => localStorage.getItem('token');

    // Function to display messages to the user (assuming it's available globally or using alert)
    // If you have a better showMessage() function in main.js, use that instead of alert.
    const showMessage = (message, type = 'info') => {
        alert(message);
    };

    // Function to load user list from API
    const loadUsers = async (filters = {}) => {
        console.log('Loading user list with filters:', filters);
        try {
            const token = getToken();
            if (!token) {
                showMessage('You need to log in to view users.');
                window.location.href = '/login.html';
                return;
            }

            let url = `${API_BASE_URL}/users`; // General API route to get all users
            const queryParams = new URLSearchParams();

            if (filters.role) {
                queryParams.append('role', filters.role);
            }
            if (filters.username_search) {
                queryParams.append('username_search', filters.username_search);
            }

            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    showMessage('Session expired or you do not have permission. Please log in again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login.html';
                }
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const users = await response.json();
            usersTableBody.innerHTML = ''; // Clear old rows

            if (users.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found.</td></tr>';
                return;
            }

            users.forEach(user => {
                const row = usersTableBody.insertRow();
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td class="actions-cell">
                        <button class="action-button btn-edit" data-id="${user.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-button btn-delete" data-id="${user.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                `;
            });

            // Attach events to Edit and Delete buttons
            document.querySelectorAll('.btn-edit').forEach(button => {
                button.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.id));
            });
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => deleteUser(e.currentTarget.dataset.id));
            });

        } catch (error) {
            console.error('Error loading users:', error);
            showMessage('Could not load user list. Please try again. Error: ' + error.message);
        }
    };

    // Open add new user modal
    addUserBtn.addEventListener('click', () => {
        console.log('Add New User button clicked.');
        modalTitle.textContent = 'Add New User';
        userIdInput.value = ''; // Clear ID to indicate add mode
        userForm.reset(); // Reset all form fields
        modalPasswordInput.required = true; // Password is required when adding new user
        passwordHelpText.style.display = 'none'; // Hide password help text
        userModal.classList.add('active'); // Show modal
        console.log('Add New User modal displayed.');
    });

    // Close modal when clicking the close button (x)
    closeButton.addEventListener('click', () => {
        console.log('Close modal button clicked.');
        userModal.classList.remove('active');
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === userModal) {
            console.log('Clicked outside modal.');
            userModal.classList.remove('active');
        }
    });

    // Open edit user modal and populate data
    const openEditModal = async (userId) => {
        console.log('Calling openEditModal for user ID:', userId);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/users/detail/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Response from user detail API:', response.status, response.ok);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Could not fetch user information');
            }
            const user = await response.json();
            console.log('User data received:', user);

            // Populate modal form fields
            modalTitle.textContent = 'Edit User';
            userIdInput.value = user.id;
            modalUsernameInput.value = user.username;
            modalEmailInput.value = user.email;
            modalRoleSelect.value = user.role;
            modalPasswordInput.value = ''; // Do not pre-fill old password
            modalPasswordInput.required = false; // Password is not required when editing
            passwordHelpText.style.display = 'block'; // Show password help text

            userModal.classList.add('active'); // Show modal
            console.log('Edit User modal displayed and populated.');
        } catch (error) {
            console.error('Error opening edit user modal:', error);
            showMessage('Could not load user information for editing. Error: ' + error.message);
        }
    };

    // Handle form submission (add or edit user)
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submission event triggered.');

        const userId = userIdInput.value;
        const username = modalUsernameInput.value;
        const email = modalEmailInput.value;
        const password = modalPasswordInput.value;
        const role = modalRoleSelect.value;

        const userData = { username, email, role };
        if (password) { // Only add password to payload if user enters it
            userData.password = password;
        }
        const token = getToken();

        try {
            let response;
            if (userId) {
                // Edit user
                console.log('Sending UPDATE user request for ID:', userId, userData);
                response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                // Add new user
                console.log('Sending ADD NEW user request:', userData);
                response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(userData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred while saving the user.');
            }

            showMessage(`User successfully ${userId ? 'updated' : 'added'}!`);
            userModal.classList.remove('active'); // Close modal
            loadUsers(); // Reload user list
        } catch (error) {
            console.error('Error saving user:', error);
            showMessage('Error: ' + error.message);
        }
    });

    // Delete user
    const deleteUser = async (userId) => {
        console.log('Calling deleteUser for ID:', userId);
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred while deleting the user.');
            }

            showMessage('User successfully deleted!');
            loadUsers(); // Reload user list
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('Error: ' + error.message);
        }
    };

    // Handle click event for "Apply Filters" button
    applyUserFiltersBtn.addEventListener('click', () => {
        console.log('Apply Filters button clicked.');
        const role = userRoleFilterSelect.value;
        const usernameSearch = usernameSearchInput.value.trim();
        loadUsers({ role: role, username_search: usernameSearch });
    });

    // Handle click event for "Reset Filters" button
    resetUserFiltersBtn.addEventListener('click', () => {
        console.log('Reset Filters button clicked.');
        userRoleFilterSelect.value = '';
        usernameSearchInput.value = '';
        loadUsers(); // Reload all users
    });

    // --- Logout button logic (if not handled by main.js) ---
    // This logic is placed here as per your request not to modify main.js
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('manageUsers.js: Logout button clicked.');
            localStorage.removeItem('token'); // Clear token from localStorage
            localStorage.removeItem('user'); // Clear user info from localStorage
            alert('You have been logged out successfully!'); // Inform the user
            window.location.href = 'index.html'; // Redirect to login page
        });
    } else {
        console.warn('manageUsers.js: Logout button (ID: logoutBtn) not found.');
    }
    loadUsers();
});