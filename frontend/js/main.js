let novels = [];

async function fetchNovels() {
    try {
        const response = await fetch('http://localhost:3000/api/novels');
        novels = await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu novels:', error);
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

    const isBookmarked = btn.classList.contains('active');
    try {
        if (isBookmarked) {
            await fetch(`http://localhost:3000/api/bookmarks/${novelId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            btn.classList.remove('active');
            btn.querySelector('i').classList.replace('fas', 'far');
        } else {
            await fetch('http://localhost:3000/api/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ novel_id: novelId })
            });
            btn.classList.add('active');
            btn.querySelector('i').classList.replace('far', 'fas');
        }
    } catch (error) {
        alert('Lỗi khi cập nhật bookmark. Vui lòng thử lại.');
    }
}

function openNovelModal(novelId) {
    const novel = novels.find(n => n.id == novelId);
    
    if (!novel) return;
    
    const novelModal = document.getElementById('novelModal');
    novelModal.setAttribute('data-novel-id', novelId);
    novelModal.querySelector('.modal-title').textContent = novel.title;
    novelModal.querySelector('.modal-cover').style.backgroundImage = `url('${novel.coverUrl}')`;
    novelModal.querySelector('.modal-author').textContent = `By ${novel.author}`;
    novelModal.querySelector('.view-count').textContent = novel.views;
    novelModal.querySelector('.rating').textContent = novel.rating;
    novelModal.querySelector('.chapter-count').textContent = novel.chapterCount;
    novelModal.querySelector('.modal-description').textContent = novel.description;
    
    const novelCard = document.querySelector(`.novel-card[data-id="${novelId}"]`);
    const bookmarkBtn = novelCard.querySelector('.bookmark-btn');
    const bookmarkModalBtn = novelModal.querySelector('.bookmark-modal-btn');
    
    if (bookmarkBtn.classList.contains('active')) {
        bookmarkModalBtn.innerHTML = '<i class="fas fa-bookmark"></i> Xóa Bookmark';
    } else {
        bookmarkModalBtn.innerHTML = '<i class="far fa-bookmark"></i> Thêm Bookmark';
    }
    
    const genresContainer = novelModal.querySelector('.modal-genres');
    genresContainer.innerHTML = '';
    novel.genres.forEach(genre => {
        const genreTag = document.createElement('div');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre;
        genresContainer.appendChild(genreTag);
    });
    
    const chapterList = novelModal.querySelector('.chapter-list');
    chapterList.innerHTML = '';
    novel.chapters.forEach(chapter => {
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item';
        chapterItem.innerHTML = `
            <div class="chapter-name">${chapter.name}</div>
            <div class="chapter-date">${chapter.date}</div>
        `;
        chapterList.appendChild(chapterItem);
    });
    
    openModal('novelModal');
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchNovels();
    await initAuth();

    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const novelId = this.closest('.novel-card').getAttribute('data-id');
            toggleBookmark(this, novelId);
        });
    });

    const novelModal = document.getElementById('novelModal');
    const novelModalClose = novelModal.querySelector('.modal-close');
    const bookmarkModalBtn = novelModal.querySelector('.bookmark-modal-btn');

    novelModalClose.addEventListener('click', () => closeModal('novelModal'));

    novelModal.addEventListener('click', function(e) {
        if (e.target === novelModal) {
            closeModal('novelModal');
        }
    });

    bookmarkModalBtn.addEventListener('click', async function() {
        const novelId = novelModal.getAttribute('data-novel-id');
        const novelCard = document.querySelector(`.novel-card[data-id="${novelId}"]`);
        const bookmarkBtn = novelCard.querySelector('.bookmark-btn');
        
        await toggleBookmark(bookmarkBtn, novelId);
        
        const icon = this.querySelector('i');
        if (icon.classList.contains('far')) {
            this.innerHTML = '<i class="fas fa-bookmark"></i> Xóa Bookmark';
        } else {
            this.innerHTML = '<i class="far fa-bookmark"></i> Thêm Bookmark';
        }
    });

    document.querySelectorAll('.novel-card').forEach(card => {
        card.addEventListener('click', function() {
            const novelId = this.getAttribute('data-id');
            openNovelModal(novelId);
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
});