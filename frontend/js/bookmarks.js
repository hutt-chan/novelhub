import { isLoggedIn, signIn, signUp } from './auth.js';

let novels = [];
let favorites = [];

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
        });
        console.log('Novels fetched:', novels);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu novels:', error);
    }
}

async function fetchFavorites() {
    if (!isLoggedIn) {
        console.log('User not logged in, returning empty favorites');
        return [];
    }
    try {
        const token = localStorage.getItem('token');
        console.log('Fetching favorites with token:', token);
        const response = await fetch('http://localhost:3000/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch favorites: ${response.status}`);
        const data = await response.json();
        console.log('Favorites response:', data);
        return Array.isArray(data) ? data : [];
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
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Lỗi khi lấy bookmarks:', error);
        return [];
    }
}

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

async function toggleBookmark(btn, novelId) {
    if (!isLoggedIn) {
        alert('Vui lòng đăng nhập để bookmark!');
        return;
    }

    const novel = novels.find(n => n.id == novelId);
    const isBookmarked = novel?.is_bookmarked || btn.classList.contains('active');
    try {
        const method = isBookmarked ? 'DELETE' : 'POST';
        const url = isBookmarked ? `http://localhost:3000/api/bookmarks/${novelId}` : 'http://localhost:3000/api/bookmarks';
        const body = method === 'POST' ? JSON.stringify({ novel_id: novelId }) : null;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body
        });
        if (!response.ok) throw new Error(`Failed to ${isBookmarked ? 'remove' : 'add'} bookmark: ${response.status}`);

        btn.classList.toggle('active', !isBookmarked);
        btn.querySelector('i').classList.toggle('fas', !isBookmarked);
        btn.querySelector('i').classList.toggle('far', isBookmarked);
        if (novel) novel.is_bookmarked = !isBookmarked;

        // Cập nhật modal
        const novelModal = document.getElementById('novelModal');
        if (novelModal.getAttribute('data-novel-id') == novelId) {
            const bookmarkModalBtn = novelModal.querySelector('.bookmark-modal-btn');
            bookmarkModalBtn.innerHTML = novel.is_bookmarked
                ? '<i class="fas fa-bookmark"></i> Xóa Bookmark'
                : '<i class="far fa-bookmark"></i> Thêm Bookmark';
        }
    } catch (error) {
        console.error('Bookmark error:', error);
        alert(`Lỗi khi cập nhật bookmark: ${error.message}`);
    }
}

async function toggleFavorite(btn, novelId) {
    if (!isLoggedIn) {
        alert('Vui lòng đăng nhập để thêm yêu thích!');
        return;
    }

    const novel = novels.find(n => n.id == novelId);
    const isFavorited = novel?.is_favorited || btn.classList.contains('active');
    try {
        const method = isFavorited ? 'DELETE' : 'POST';
        const url = isFavorited ? `http://localhost:3000/api/favorites/${novelId}` : 'http://localhost:3000/api/favorites';
        const body = method === 'POST' ? JSON.stringify({ novel_id: novelId }) : null;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body
        });
        if (!response.ok) throw new Error(`Failed to ${isFavorited ? 'remove' : 'add'} favorite: ${response.status}`);

        btn.classList.toggle('active', !isFavorited);
        btn.querySelector('i').classList.toggle('fas', !isFavorited);
        btn.querySelector('i').classList.toggle('far', isFavorited);
        if (novel) {
            novel.is_favorited = !isFavorited;
            novel.favorite_count += isFavorited ? -1 : 1;
            if (!isFavorited) favorites.push(novel);
            else favorites = favorites.filter(f => f.id != novelId);
        }

        // Cập nhật modal
        const novelModal = document.getElementById('novelModal');
        if (novelModal.getAttribute('data-novel-id') == novelId && novel) {
            const modalFavoriteCount = novelModal.querySelector('.favorite-count');
            const favoriteModalBtn = novelModal.querySelector('.favorite-modal-btn');
            if (modalFavoriteCount) modalFavoriteCount.textContent = novel.favorite_count;
            favoriteModalBtn.innerHTML = novel.is_favorited
                ? '<i class="fas fa-heart"></i> Xóa Yêu Thích'
                : '<i class="far fa-heart"></i> Thêm Yêu Thích';
        }

        renderFavorites();
    } catch (error) {
        console.error('Favorite error:', error);
        alert(`Lỗi khi cập nhật yêu thích: ${error.message}`);
    }
}

function renderFavorites() {
    const container = document.querySelector('#favorites .novel-grid');
    const message = document.querySelector('#favorites .favorites-message');
    const loading = document.querySelector('#favorites .loading');
    container.innerHTML = '';
    message.style.display = 'none';
    loading.style.display = 'none';

    if (!isLoggedIn) {
        message.textContent = 'Please sign in to view your favorites.';
        message.style.display = 'block';
        return;
    }

    if (favorites.length === 0) {
        message.textContent = 'No favorites yet.';
        message.style.display = 'block';
        return;
    }

    favorites.forEach(novel => {
        const card = document.createElement('div');
        card.className = 'novel-card';
        card.setAttribute('data-id', novel.id);
        card.innerHTML = `
            <div class="novel-cover" style="background-image: url('${novel.coverUrl}');">
                <button class="bookmark-btn ${novel.is_bookmarked ? 'active' : ''}">
                    <i class="${novel.is_bookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                </button>
                <button class="favorite-btn ${novel.is_favorited ? 'active' : ''}">
                    <i class="${novel.is_favorited ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="remove-favorite-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="novel-info">
                <h3 class="novel-title">${novel.title}</h3>
                <p class="novel-author">By ${novel.author}</p>
                <div class="novel-stats">
                    <span><i class="fas fa-eye"></i> ${novel.views.toLocaleString()}</span>
                    <span><i class="fas fa-star"></i> ${novel.rating || 0}</span>
                    <span><i class="fas fa-heart"></i> <span class="favorite-count">${novel.favorite_count}</span></span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    container.querySelectorAll('.novel-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.bookmark-btn') && !e.target.closest('.favorite-btn') && !e.target.closest('.remove-favorite-btn')) {
                const novelId = this.getAttribute('data-id');
                openNovelModal(novelId);
            }
        });
    });

    container.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const novelId = this.closest('.novel-card').getAttribute('data-id');
            toggleBookmark(this, novelId);
        });
    });

    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const novelId = this.closest('.novel-card').getAttribute('data-id');
            toggleFavorite(this, novelId);
        });
    });

    container.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const novelId = this.closest('.novel-card').getAttribute('data-id');
            const favoriteBtn = this.closest('.novel-card').querySelector('.favorite-btn');
            toggleFavorite(favoriteBtn, novelId);
        });
    });
}

function openNovelModal(novelId) {
    const novel = novels.find(n => n.id == novelId);
    if (!novel) return;

    const novelModal = document.getElementById('novelModal');
    novelModal.setAttribute('data-novel-id', novelId);
    novelModal.querySelector('.modal-title').textContent = novel.title;
    novelModal.querySelector('.modal-cover').style.backgroundImage = `url('${novel.coverUrl}')`;
    novelModal.querySelector('.modal-author').textContent = `By ${novel.author}`;
    novelModal.querySelector('.view-count').textContent = novel.views.toLocaleString();
    novelModal.querySelector('.chapter-count').textContent = novel.chapterCount;
    novelModal.querySelector('.favorite-count').textContent = novel.favorite_count || 0;
    novelModal.querySelector('.modal-description').textContent = novel.description || 'No description available';

    const bookmarkModalBtn = novelModal.querySelector('.bookmark-modal-btn');
    const favoriteModalBtn = novelModal.querySelector('.favorite-modal-btn');

    bookmarkModalBtn.innerHTML = novel.is_bookmarked
        ? '<i class="fas fa-bookmark"></i> Xóa Bookmark'
        : '<i class="far fa-bookmark"></i> Thêm Bookmark';
    favoriteModalBtn.innerHTML = novel.is_favorited
        ? '<i class="fas fa-heart"></i> Xóa Yêu Thích'
        : '<i class="far fa-heart"></i> Thêm Yêu Thích';

    const genresContainer = novelModal.querySelector('.modal-genres');
    genresContainer.innerHTML = '';
    (novel.genres || []).forEach(genre => {
        const genreTag = document.createElement('div');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre;
        genresContainer.appendChild(genreTag);
    });

    const chapterList = novelModal.querySelector('.chapter-list');
    chapterList.innerHTML = '';
    if (!novel.chapters || novel.chapters.length === 0) {
        chapterList.innerHTML = '<div class="chapter-item">No chapters available</div>';
    } else {
        novel.chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item';
            chapterItem.innerHTML = `
                <div class="chapter-name">${chapter.name}</div>
                <div class="chapter-date">${new Date(chapter.date).toLocaleDateString()}</div>
            `;
            chapterList.appendChild(chapterItem);
        });
    }

    const commentList = novelModal.querySelector('.comment-list');
    const commentMessage = novelModal.querySelector('.comment-message');
    commentList.innerHTML = '';
    commentMessage.style.display = 'block';
    commentMessage.textContent = 'No comments yet.';

    openModal('novelModal');
}

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();

    const loading = document.querySelector('#favorites .loading');
    loading.style.display = 'block';

    await fetchNovels();
    const favoriteIds = await fetchFavorites();
    const bookmarks = await fetchBookmarks();

    console.log('Favorite IDs:', favoriteIds);
    console.log('Novels:', novels);

    novels.forEach(novel => {
        novel.is_favorited = favoriteIds.some(f => f.novel_id == novel.id);
        novel.is_bookmarked = bookmarks.some(b => b.novel_id == novel.id);
    });

    favorites = novels.filter(novel => novel.is_favorited);
    console.log('Filtered favorites:', favorites);

    renderFavorites();

    const novelModal = document.getElementById('novelModal');
    const novelModalClose = novelModal.querySelector('.modal-close');
    const bookmarkModalBtn = novelModal.querySelector('.bookmark-modal-btn');
    const favoriteModalBtn = novelModal.querySelector('.favorite-modal-btn');

    novelModalClose.addEventListener('click', () => closeModal('novelModal'));

    novelModal.addEventListener('click', function(e) {
        if (e.target === novelModal) {
            closeModal('novelModal');
        }
    });

    bookmarkModalBtn.addEventListener('click', async function() {
        const novelId = novelModal.getAttribute('data-novel-id');
        const novelCard = document.querySelector(`.novel-card[data-id="${novelId}"]`);
        const bookmarkBtn = novelCard?.querySelector('.bookmark-btn');
        if (bookmarkBtn) await toggleBookmark(bookmarkBtn, novelId);
    });

    favoriteModalBtn.addEventListener('click', async function() {
        const novelId = novelModal.getAttribute('data-novel-id');
        const novelCard = document.querySelector(`.novel-card[data-id="${novelId}"]`);
        const favoriteBtn = novelCard?.querySelector('.favorite-btn');
        if (favoriteBtn) await toggleFavorite(favoriteBtn, novelId);
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

    document.getElementById('signinForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;
        await signIn(email, password);
        if (isLoggedIn) {
            loading.style.display = 'block';
            const favoriteIds = await fetchFavorites();
            const bookmarks = await fetchBookmarks();
            novels.forEach(novel => {
                novel.is_favorited = favoriteIds.some(f => f.novel_id == novel.id);
                novel.is_bookmarked = bookmarks.some(b => b.novel_id == novel.id);
            });
            favorites = novels.filter(novel => novel.is_favorited);
            renderFavorites();
        }
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

    document.getElementById('commentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const content = document.getElementById('commentContent').value;
        if (!isLoggedIn) {
            alert('Vui lòng đăng nhập để bình luận!');
            return;
        }
        const commentList = document.querySelector('.comment-list');
        const commentMessage = document.querySelector('.comment-message');
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        commentItem.innerHTML = `
            <div class="comment-author">You</div>
            <div class="comment-content">${content}</div>
            <div class="comment-date">${new Date().toLocaleString()}</div>
        `;
        commentList.appendChild(commentItem);
        commentMessage.style.display = 'none';
        document.getElementById('commentContent').value = '';
    });
});