// novel.js
document.addEventListener('DOMContentLoaded', async () => {
    const novelId = new URLSearchParams(window.location.search).get('novel_id');
    if (!novelId) {
        alert('Novel ID not found!');
        window.location.href = 'index.html';
        return;
    }

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        // Lấy danh sách novels (chứa thông tin chi tiết của novel)
        const response = await fetch('http://localhost:3000/api/novels', { headers });
        const novels = await response.json();
        const novel = novels.find(n => n.id == novelId);

        if (!novel) {
            alert('Novel not found!');
            window.location.href = 'index.html';
            return;
        }

        // Cập nhật thông tin novel
        document.getElementById('novelTitle').textContent = novel.title;
        document.getElementById('novelAuthor').textContent = `By ${novel.author}`;
        document.getElementById('viewCount').textContent = novel.views;
        document.getElementById('rating').textContent = novel.rating;
        document.getElementById('chapterCount').textContent = novel.chapterCount;
        document.getElementById('favoriteCount').textContent = novel.favorite_count || 0;
        document.getElementById('novelCover').style.backgroundImage = `url(${novel.coverUrl})`;
        document.getElementById('novelDescription').textContent = novel.description;

        // Hiển thị genres
        const genresContainer = document.getElementById('novelGenres');
        novel.genres.forEach(genre => {
            const genreSpan = document.createElement('span');
            genreSpan.className = 'genre-tag';
            genreSpan.textContent = genre;
            genresContainer.appendChild(genreSpan);
        });

        // Hiển thị danh sách chương
        const chapterList = document.getElementById('chapterList');
        novel.chapters.forEach(chapter => {
            const chapterDiv = document.createElement('div');
            chapterDiv.className = 'chapter-item';
            chapterDiv.innerHTML = `
                <a href="chapter.html?novel_id=${novel.id}&chapter_id=${chapter.id}">${chapter.name}</a>
                <span>${new Date(chapter.date).toLocaleDateString()}</span>
            `;
            chapterList.appendChild(chapterDiv);
        });

        // Xử lý nút Start Reading
        document.getElementById('startReadingBtn').addEventListener('click', () => {
            if (novel.chapters.length > 0) {
                window.location.href = `chapter.html?novel_id=${novel.id}&chapter_id=${novel.chapters[0].id}`;
            }
        });

        // Xử lý Bookmark
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        bookmarkBtn.addEventListener('click', async () => {
            if (!token) {
                alert('Please sign in to bookmark!');
                return;
            }
            try {
                const method = novel.is_bookmarked ? 'DELETE' : 'POST';
                const url = novel.is_bookmarked ? `/api/bookmarks/${novel.id}` : '/api/bookmarks';
                await fetch(`http://localhost:3000${url}`, {
                    method,
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: method === 'POST' ? JSON.stringify({ novel_id: novel.id }) : null
                });
                novel.is_bookmarked = !novel.is_bookmarked;
                bookmarkBtn.querySelector('i').className = novel.is_bookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
                alert(novel.is_bookmarked ? 'Added to Bookmarks!' : 'Removed from Bookmarks!');
            } catch (error) {
                alert('Error updating bookmark!');
            }
        });

        // Xử lý Favorite
        const favoriteBtn = document.getElementById('favoriteBtn');
        favoriteBtn.addEventListener('click', async () => {
            if (!token) {
                alert('Please sign in to favorite!');
                return;
            }
            try {
                const method = novel.is_favorited ? 'DELETE' : 'POST';
                const url = novel.is_favorited ? `/api/favorites/${novel.id}` : '/api/favorites';
                await fetch(`http://localhost:3000${url}`, {
                    method,
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: method === 'POST' ? JSON.stringify({ novel_id: novel.id }) : null
                });
                novel.is_favorited = !novel.is_favorited;
                favoriteBtn.querySelector('i').className = novel.is_favorited ? 'fas fa-heart' : 'far fa-heart';
                alert(novel.is_favorited ? 'Added to Favorites!' : 'Removed from Favorites!');
            } catch (error) {
                alert('Error updating favorite!');
            }
        });

        // Xử lý Comment
        const commentForm = document.getElementById('commentForm');
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!token) {
                alert('Please sign in to comment!');
                return;
            }
            const content = document.getElementById('commentContent').value;
            const rating = document.getElementById('commentRating').value;
            try {
                await fetch('http://localhost:3000/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: JSON.stringify({ novel_id: novel.id, content, rating })
                });
                alert('Comment submitted!');
                commentForm.reset();
                // Tải lại comment (tùy chọn)
            } catch (error) {
                alert('Error submitting comment!');
            }
        });

    } catch (error) {
        console.error('Error loading novel:', error);
        alert('Error loading novel!');
    }
});