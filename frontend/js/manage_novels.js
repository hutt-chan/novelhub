document.addEventListener('DOMContentLoaded', async () => {
    const novelsTableBody = document.getElementById('novelsTableBody');
    const addNewNovelBtn = document.getElementById('addNewNovelBtn');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const messageBox = document.getElementById('messageBox');
    const logoutButton = document.getElementById('logoutButton'); // Giữ lại tham chiếu đến nút logout

    // Tham chiếu đến modal thêm truyện
    const addNovelModal = document.getElementById('addNovelModal');
    const addNovelForm = document.getElementById('addNovelForm');
    const addNovelTitleInput = document.getElementById('addNovelTitle');
    const addNovelAuthorInput = document.getElementById('addNovelAuthor');
    const addNovelDescriptionInput = document.getElementById('addNovelDescription');
    const addNovelCoverUrlInput = document.getElementById('addNovelCoverUrl');
    const addNovelChaptersInput = document.getElementById('addNovelChapters');
    const addGenresSelect = document.getElementById('addGenres');

    // Tham chiếu đến modal chỉnh sửa truyện
    const editNovelModal = document.getElementById('editNovelModal');
    const editNovelForm = document.getElementById('editNovelForm');
    const editNovelIdInput = document.getElementById('editNovelId');
    const editNovelTitleInput = document.getElementById('editNovelTitle');
    const editNovelAuthorInput = document.getElementById('editNovelAuthor');
    const editNovelDescriptionInput = document.getElementById('editNovelDescription');
    const editNovelCoverUrlInput = document.getElementById('editNovelCoverUrl');
    const editNovelChaptersInput = document.getElementById('editNovelChapters');
    const editGenresSelect = document.getElementById('editGenres');

    // Các phần tử lọc truyện
    const filterGenreSelect = document.getElementById('filterGenre');
    const filterDateInput = document.getElementById('filterDate');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');


    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type} active`;
        messageBox.style.display = 'block';

        setTimeout(() => {
            messageBox.classList.remove('active');
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 500);
        }, 3000);
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 300);
    }

    function getToken() {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('You are not logged in or your session has expired. Redirecting...', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
            return null;
        }
        return token;
    }

    /**
     * Lấy danh sách tất cả thể loại từ API backend.
     */
    async function fetchGenres() {
        const token = getToken();
        if (!token) return [];

        try {
            const response = await fetch('http://localhost:3000/api/admin/genres', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to load genre list.');
            }
            const genres = await response.json();
            return genres;
        } catch (error) {
            console.error('Error loading genres:', error);
            showMessage('Failed to load genre list.', 'error');
            return [];
        }
    }

    /**
     * Đổ dữ liệu thể loại vào các select box (Add và Edit).
     */
    async function populateGenresSelects() {
        const genres = await fetchGenres();
        addGenresSelect.innerHTML = '';
        editGenresSelect.innerHTML = '';

        if (genres.length === 0) {
            const noOption = document.createElement('option');
            noOption.value = '';
            noOption.textContent = 'No genres available';
            noOption.disabled = true;
            addGenresSelect.appendChild(noOption);
            editGenresSelect.appendChild(noOption.cloneNode(true));
            return;
        }

        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            addGenresSelect.appendChild(option);

            const optionEdit = option.cloneNode(true);
            editGenresSelect.appendChild(optionEdit);
        });
    }

    /**
     * Đổ dữ liệu thể loại vào select box lọc (filterGenreSelect).
     */
    async function populateFilterGenresSelect() {
        const genres = await fetchGenres();
        filterGenreSelect.innerHTML = '<option value="">All Genres</option>';

        if (genres.length === 0) {
            return;
        }

        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            filterGenreSelect.appendChild(option);
        });
    }


    async function fetchNovels() {
        const token = getToken();
        if (!token) return;

        try {
            // Cập nhật colspan thành 6 vì có 6 cột trong bảng
            novelsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading novels...</td></tr>';

            // Xây dựng URL với các tham số tìm kiếm và lọc
            let apiUrl = 'http://localhost:3000/api/admin/novels';
            const params = new URLSearchParams();

            const searchTerm = searchInput.value.trim();
            const selectedFilterGenre = filterGenreSelect.value;
            const selectedFilterDate = filterDateInput.value;

            if (searchTerm) {
                params.append('search', searchTerm);
            }
            if (selectedFilterGenre) {
                params.append('genreId', selectedFilterGenre);
            }
            if (selectedFilterDate) {
                params.append('date', selectedFilterDate);
            }

            if (params.toString()) {
                apiUrl += `?${params.toString()}`;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const novels = await response.json();
            renderNovels(novels);

        } catch (error) {
            console.error('Error fetching novels:', error);
            // Cập nhật colspan thành 6
            novelsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">Failed to load novels. Please check the server.</td></tr>';
            showMessage('Error loading novels: ' + error.message, 'error');
        }
    }

    function renderNovels(novels) {
        novelsTableBody.innerHTML = '';
        if (novels.length === 0) {
            // Cập nhật colspan thành 6
            novelsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No novels found. Click "Add New Novel" to get started!</td></tr>';
            return;
        }

        novels.forEach(novel => {
            const row = novelsTableBody.insertRow();
            const genresDisplay = novel.genres ? novel.genres.map(g => g.name).join(', ') : 'N/A';
            row.innerHTML = `
                <td>${novel.id}</td>
                <td>${novel.title}</td>
                <td>${novel.author}</td>
                <td>${novel.chapterCount || 0}</td>
                <td>${genresDisplay}</td>
                <td>
                   <div class="action-buttons-wrapper">
                        <button class="btn btn-edit" data-id="${novel.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-delete" data-id="${novel.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </div>
                </td>
            `;
        });
        setupNovelActionButtons();
    }

    /**
     * Gắn event listeners cho các nút Edit và Delete.
     */
    function setupNovelActionButtons() {
        // Đã sửa từ .edit-btn thành .btn-edit để khớp với HTML
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.onclick = (event) => openEditModal(event.currentTarget.dataset.id);
        });
        // Đã sửa từ .delete-btn thành .btn-delete để khớp với HTML
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = (event) => deleteNovel(event.currentTarget.dataset.id);
        });
    }


    // --- Search ---
    searchButton.addEventListener('click', () => {
        fetchNovels();
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    // --- Filter novels ---
    applyFiltersBtn.addEventListener('click', () => {
        fetchNovels();
    });

    resetFiltersBtn.addEventListener('click', () => {
        filterGenreSelect.value = '';
        filterDateInput.value = '';
        searchInput.value = '';
        fetchNovels();
    });

    // --- Add novel ---
    addNewNovelBtn.addEventListener('click', () => {
        addNovelForm.reset();
        Array.from(addGenresSelect.options).forEach(option => {
            option.selected = false;
        });
        addNovelModal.style.display = 'flex';
        addNovelModal.classList.add('active');
    });

    addNovelForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = getToken();
        if (!token) return;

        const selectedGenres = Array.from(addGenresSelect.selectedOptions).map(option => parseInt(option.value));

        const novelData = {
            title: addNovelTitleInput.value.trim(),
            author: addNovelAuthorInput.value.trim(),
            description: addNovelDescriptionInput.value.trim(),
            coverUrl: addNovelCoverUrlInput.value.trim(),
            chapterCount: parseInt(addNovelChaptersInput.value) || 0,
            genres: selectedGenres
        };

        if (!novelData.title || !novelData.author) {
            showMessage('Title and Author cannot be empty.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/admin/novels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(novelData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            closeModal(addNovelModal);
            showMessage('Novel added successfully!', 'success');
            fetchNovels();
        } catch (error) {
            console.error('Error adding novel:', error);
            showMessage('Error adding novel: ' + error.message, 'error');
        }
    });

    // --- Edit novel ---
    async function openEditModal(id) {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/novels/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const novelToEdit = await response.json();
            populateEditForm(novelToEdit);

        } catch (error) {
            console.error('Error fetching novel for editing:', error);
            showMessage('Error loading novel information for editing: ' + error.message, 'error');
        }
    }

    /**
     * Điền dữ liệu truyện vào form chỉnh sửa.
     * @param {Object} novelToEdit - Đối tượng truyện cần điền vào form.
     */
    function populateEditForm(novelToEdit) {
        editNovelIdInput.value = novelToEdit.id;
        editNovelTitleInput.value = novelToEdit.title;
        editNovelAuthorInput.value = novelToEdit.author;
        editNovelDescriptionInput.value = novelToEdit.description || '';
        editNovelCoverUrlInput.value = novelToEdit.coverUrl || '';
        editNovelChaptersInput.value = novelToEdit.chapterCount || 0;
        const currentGenreIds = novelToEdit.genres ? novelToEdit.genres.map(g => g.id) : [];

        Array.from(editGenresSelect.options).forEach(option => {
            option.selected = currentGenreIds.includes(parseInt(option.value));
        });

        editNovelModal.style.display = 'flex';
        editNovelModal.classList.add('active');
    }

    editNovelForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = getToken();
        if (!token) return;

        const id = editNovelIdInput.value;

        const selectedGenres = Array.from(editGenresSelect.selectedOptions).map(option => parseInt(option.value));

        const novelData = {
            title: editNovelTitleInput.value.trim(),
            author: editNovelAuthorInput.value.trim(),
            description: editNovelDescriptionInput.value.trim(),
            coverUrl: editNovelCoverUrlInput.value.trim(),
            chapterCount: parseInt(editNovelChaptersInput.value) || 0,
            genres: selectedGenres
        };

        if (!novelData.title || !novelData.author) {
            showMessage('Title and Author cannot be empty.', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/novels/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(novelData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            closeModal(editNovelModal);
            showMessage('Novel updated successfully!', 'success');
            fetchNovels();
        } catch (error) {
            console.error('Error updating novel:', error);
            showMessage('Error updating novel: ' + error.message, 'error');
        }
    });

    // --- Delete novel ---
    async function deleteNovel(id) {
        const token = getToken();
        if (!token) return;

        // Thay thế confirm() bằng window.confirm() để tuân thủ quy tắc
        if (!window.confirm('Are you sure you want to delete this novel? This action cannot be undone!')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/novels/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showMessage('Novel deleted successfully!', 'success');
            fetchNovels();
        } catch (error) {
            console.error('Error deleting novel:', error);
            showMessage('Error deleting novel: ' + error.message, 'error');
        }
    }

    // --- Logout 
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await fetch('http://localhost:3000/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } catch (error) {
                console.warn('Error calling logout API, but token will still be removed:', error);
            } finally {
                localStorage.removeItem('token');
                showMessage('Logged out successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }

    // --- Handle closing modals when clicking outside or on close button ---
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.dataset.modal;
            closeModal(document.getElementById(modalId));
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === addNovelModal) {
            closeModal(addNovelModal);
        }
        if (event.target === editNovelModal) {
            closeModal(editNovelModal);
        }
    });

    // Call initialization functions when DOM is fully loaded
    await populateGenresSelects();
    await populateFilterGenresSelect();
    fetchNovels();
});