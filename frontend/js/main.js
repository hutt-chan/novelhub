let novels = [];

async function fetchNovels() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/novels', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error(`Failed to fetch novels: ${response.status}`);
        novels = await response.json();
        novels.forEach(novel => {
            novel.is_favorited = novel.is_favorited || false;
            novel.is_bookmarked = novel.is_bookmarked || false;
            console.log('Chapters for novel', novel.id, novel.chapters);
        });
        console.log('Novels fetched:', novels);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu novels:', error);
    }
}

async function fetchFavorites() {
    if (!isLoggedIn) return [];
    try {
        const response = await fetch('http://localhost:3000/api/favorites', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch favorites: ${response.status}`);
        const data = await response.json();
        console.log('Favorites response:', data);
        if (Array.isArray(data)) {
            return data;
        } else if (data.favorites && Array.isArray(data.favorites)) {
            return data.favorites;
        } else {
            console.warn('Unexpected favorites format:', data);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy favorites:', error);
        return [];
    }
}

async function fetchBookmarks() {
    if (!isLoggedIn) return [];
    try {
        const response = await fetch('http://localhost:3000/api/bookmarks', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch bookmarks: ${response.status}`);
        const data = await response.json();
        console.log('Bookmarks response:', data);
        if (Array.isArray(data)) {
            return data;
        } else if (data.bookmarks && Array.isArray(data.bookmarks)) {
            return data.bookmarks;
        } else {
            console.warn('Unexpected bookmarks format:', data);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy bookmarks:', error);
        return [];
    }
}

async function toggleBookmark(novelId) {
    if (!isLoggedIn) {
        alert('Vui lòng đăng nhập để bookmark!');
        return false;
    }

    const novel = novels.find(n => n.id == novelId);
    const isBookmarked = novel.is_bookmarked;
    try {
        if (isBookmarked) {
            const response = await fetch(`http://localhost:3000/api/bookmarks/${novelId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error(`Failed to remove bookmark: ${response.status}`);
            if (novel) novel.is_bookmarked = false;
        } else {
            const bookmarks = await fetchBookmarks();
            if (bookmarks.some(b => b.novel_id == novelId)) {
                console.log('Bookmark already exists for novelId:', novelId);
            } else {
                const response = await fetch('http://localhost:3000/api/bookmarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ novel_id: novelId })
                });
                if (!response.ok) throw new Error(`Failed to add bookmark: ${response.status}`);
                if (novel) novel.is_bookmarked = true;
            }
        }
        return true;
    } catch (error) {
        console.error('Bookmark error:', error);
        alert(`Lỗi khi cập nhật bookmark: ${error.message}`);
        return false;
    }
}

async function toggleFavorite(novelId) {
    if (!isLoggedIn) {
        alert('Vui lòng đăng nhập để thêm yêu thích!');
        return false;
    }

    const novel = novels.find(n => n.id == novelId);
    const isFavorited = novel.is_favorited;
    try {
        if (isFavorited) {
            const response = await fetch(`http://localhost:3000/api/favorites/${novelId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error(`Failed to remove favorite: ${response.status}`);
            if (novel) {
                novel.is_favorited = false;
                novel.favorite_count = parseInt(novel.favorite_count) - 1;
            }
        } else {
            const favorites = await fetchFavorites();
            if (favorites.some(f => f.novel_id == novelId)) {
                console.log('Favorite already exists for novelId:', novelId);
            } else {
                const response = await fetch('http://localhost:3000/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ novel_id: novelId })
                });
                if (!response.ok) throw new Error(`Failed to add favorite: ${response.status}`);
                if (novel) {
                    novel.is_favorited = true;
                    novel.favorite_count = parseInt(novel.favorite_count) + 1;
                }
            }
        }
        return true;
    } catch (error) {
        console.error('Favorite error:', error);
        alert(`Lỗi khi cập nhật favorite: ${error.message}`);
        return false;
    }
}

function renderFavorites(favorites) {
    const container = document.querySelector('#favorites .novel-grid');
    const message = document.querySelector('#favorites .message');
    container.innerHTML = '';
    if (message) message.style.display = 'none';

    if (favorites.length === 0) {
        if (message) {
            message.textContent = 'No favorites yet.';
            message.style.display = 'flex';
        }
        return;
    }

    renderNovelCards(favorites, container, true);
}

function renderNovelCards(novels, container, showStats = false) {
    if (!container) {
        console.error('Container is null. Cannot render novel cards.');
        return; // Thoát hàm nếu container không tồn tại
    }
    
    container.innerHTML = '';
    if (!novels.length) {
        container.innerHTML = '<div class="no-novels">No novels available</div>';
        return;
    }
    novels.forEach(novel => {
        const novelCard = document.createElement('div');
        novelCard.className = 'novel-card';
        novelCard.setAttribute('data-id', novel.id);
        novelCard.innerHTML = `
            <div class="novel-cover" style="background-image: url(${novel.coverUrl})"></div>
            <div class="novel-info">
                <h3 class="novel-title">${novel.title}</h3>
                <p class="novel-author">By ${novel.author}</p>
                ${showStats ? `
                    <div class="novel-stats">
                        <span><i class="fas fa-eye"></i> ${novel.views.toLocaleString()}</span>
                        <span><i class="fas fa-star"></i> ${novel.rating || 0}</span>
                        <span><i class="fas fa-heart"></i> ${novel.favorite_count || 0}</span>
                    </div>
                ` : ''}
            </div>
        `;
        novelCard.addEventListener('click', () => {
            window.location.href = `novel.html?novel_id=${novel.id}`;
        });
        container.appendChild(novelCard);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    await fetchNovels();

    const favorites = await fetchFavorites();
    const bookmarks = await fetchBookmarks();

    novels.forEach(novel => {
        novel.is_favorited = favorites.some(f => f.novel_id == novel.id);
        novel.is_bookmarked = bookmarks.some(b => b.novel_id == novel.id);
    });

    const featuredNovels = novels
        .sort((a, b) => b.views - a.views)
        .slice(0, 4);
    renderNovelCards(featuredNovels, document.querySelector('#weeklyFeatured'), true);

    const updatedNovels = novels
        .sort((a, b) => {
            const aLatest = a.chapters?.[0]?.date || 0;
            const bLatest = b.chapters?.[0]?.date || 0;
            return new Date(bLatest) - new Date(aLatest);
        })
        .slice(0, 4);
    renderNovelCards(updatedNovels, document.querySelector('#newUpdates'), true);

    renderFavorites(favorites);

    document.getElementById('signinForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;
        await signIn(email, password);
    });

    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        await signUp(username, email, password, confirmPassword);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-link.active')?.classList.remove('active');
            this.classList.add('active');
        });
    });

    document.querySelectorAll('.auth-modal .modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.auth-modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    document.getElementById('switchToSignup').addEventListener('click', () => {
        closeModal('signinModal');
        openModal('signupModal');
    });

    document.getElementById('switchToSignin').addEventListener('click', () => {
        closeModal('signupModal');
        openModal('signinModal');
    });
});

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}


// Tìm kiếm tiểu thuyết theo tên hoặc tác giả
function searchNovels(query) {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return novels.filter(novel =>
        novel.title.toLowerCase().includes(lowerQuery) ||
        novel.author.toLowerCase().includes(lowerQuery)
    ).slice(0, 7); // Giới hạn 7 kết quả
}

// Render danh sách gợi ý tìm kiếm
function renderSearchResults(results, container) {
    container.innerHTML = '';
    if (!results.length) {
        container.innerHTML = '<div class="no-results">Không tìm thấy kết quả</div>';
        return;
    }
    results.forEach(novel => {
        console.log('Novel:', novel); // Debug dữ liệu novel
        if (!novel.id) {
            console.error('Novel missing id:', novel);
            return;
        }
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="search-result-cover" style="background-image: url(${novel.coverUrl || 'default-cover.jpg'})"></div>
            <div class="search-result-info">
                <h3 class="search-result-title">${novel.title}</h3>
                <p class="search-result-author">By ${novel.author}</p>
            </div>
        `;
        // resultItem.addEventListener('click', () => {
        //     console.log('Clicked novel:', novel.id); // Debug click
        //     window.location.href = `novel.html?novel_id=${novel.id}`;
        //     container.innerHTML = '';
        //     document.getElementById('searchInput').value = '';
        // });
        resultItem.addEventListener('mousedown', () => { // Dùng mousedown thay click
        console.log('Clicked novel:', novel.id);
        window.location.href = `novel.html?novel_id=${novel.id}`;
        container.innerHTML = '';
        document.getElementById('searchInput').value = '';
        });
        container.appendChild(resultItem);
    });
}

// Thêm sự kiện tìm kiếm
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        searchTimeout = setTimeout(() => {
            if (query.length < 2) {
                searchResults.classList.remove('active');
                searchResults.innerHTML = '';
                return;
            }
            const results = searchNovels(query);
            renderSearchResults(results, searchResults);
            searchResults.classList.add('active');
        }, 300); // Debounce 300ms
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            searchResults.classList.add('active');
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            searchResults.classList.remove('active');
        }, 300); // Delay để click vào gợi ý
    });

    document.querySelector('.search-btn').addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            const results = searchNovels(query);
            renderSearchResults(results, searchResults);
            searchResults.classList.add('active');
        }
    });
}

// Gọi initSearch trong DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    await fetchNovels();

    const favorites = await fetchFavorites();
    const bookmarks = await fetchBookmarks();

    novels.forEach(novel => {
        novel.is_favorited = favorites.some(f => f.novel_id == novel.id);
        novel.is_bookmarked = bookmarks.some(b => b.novel_id == novel.id);
    });

    const featuredNovels = novels
        .sort((a, b) => b.views - a.views)
        .slice(0, 4);
    renderNovelCards(featuredNovels, document.querySelector('#weeklyFeatured'), true);

    const updatedNovels = novels
        .sort((a, b) => {
            const aLatest = a.chapters?.[0]?.date || 0;
            const bLatest = b.chapters?.[0]?.date || 0;
            return new Date(bLatest) - new Date(aLatest);
        })
        .slice(0, 4);
    renderNovelCards(updatedNovels, document.querySelector('#newUpdates'), true);

    renderFavorites(favorites);

    initSearch(); // Khởi tạo tìm kiếm

    // ... phần còn lại của DOMContentLoaded ...
});