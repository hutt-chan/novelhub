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
        // Lấy danh sách novels
        const response = await fetch('http://localhost:3000/api/novels', { headers });
        if (!response.ok) throw new Error(`Không thể tải danh sách tiểu thuyết: ${response.status}`);
        const novels = await response.json();
        const novel = novels.find(n => n.id === parseInt(novelId));

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

        // Sắp xếp và hiển thị chương
        const sortedChapters = [...novel.chapters].sort((a, b) => {
            const getNum = (title) => parseInt(title.match(/\d+/)?.[0] || 0);
            return getNum(a.name) - getNum(b.name);
        });

        const chapterList = document.getElementById('chapterList');
        if (chapterList) {
            sortedChapters.forEach(chapter => {
                const chapterDiv = document.createElement('div');
                chapterDiv.className = 'chapter-item';
                chapterDiv.innerHTML = `
                    <a href="chapter.html?novel_id=${novel.id}&chapter_id=${chapter.id}">${chapter.name}</a>
                    <span>${new Date(chapter.date).toLocaleDateString()}</span>
                `;
                chapterList.appendChild(chapterDiv);
            });
        }

        // Nút Start Reading
        document.getElementById('startReadingBtn').addEventListener('click', () => {
            if (sortedChapters.length > 0) {
                const firstChapter = sortedChapters[0];
                window.location.href = `chapter.html?novel_id=${novel.id}&chapter_id=${firstChapter.id}`;
            }
        });

        // Xử lý Bookmark
        // const bookmarkBtn = document.getElementById('bookmarkBtn');
        // bookmarkBtn.addEventListener('click', async () => {
        //     if (!token) {
        //         alert('Please sign in to bookmark!');
        //         return;
        //     }
        //     try {
        //         const method = novel.is_bookmarked ? 'DELETE' : 'POST';
        //         const url = novel.is_bookmarked ? `/api/bookmarks/${novel.id}` : '/api/bookmarks';
        //         const response = await fetch(`http://localhost:3000${url}`, {
        //             method,
        //             headers: { 'Content-Type': 'application/json', ...headers },
        //             body: method === 'POST' ? JSON.stringify({ novel_id: novel.id }) : null
        //         });
        //         if (!response.ok) throw new Error(`Bookmark failed: ${response.status}`);
        //         novel.is_bookmarked = !novel.is_bookmarked;
        //         bookmarkBtn.querySelector('i').className = novel.is_bookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
        //         alert(novel.is_bookmarked ? 'Added to Bookmarks!' : 'Removed from Bookmarks!');
        //     } catch (error) {
        //         console.error('Error updating bookmark:', error);
        //         alert('Error updating bookmark!');
        //     }
        // });

        // Xử lý Favorite
        // const favoriteBtn = document.getElementById('favoriteBtn');
        // favoriteBtn.addEventListener('click', async () => {
        //     if (!token) {
        //         alert('Please sign in to favorite!');
        //         return;
        //     }
        //     try {
        //         const method = novel.is_favorited ? 'DELETE' : 'POST';
        //         const url = novel.is_favorited ? `/api/favorites/${novel.id}` : '/api/favorites';
        //         const response = await fetch(`http://localhost:3000${url}`, {
        //             method,
        //             headers: { 'Content-Type': 'application/json', ...headers },
        //             body: method === 'POST' ? JSON.stringify({ novel_id: novel.id }) : null
        //         });
        //         if (!response.ok) throw new Error(`Favorite failed: ${response.status}`);
        //         novel.is_favorited = !novel.is_favorited;
        //         favoriteBtn.querySelector('i').className = novel.is_favorited ? 'fas fa-heart' : 'far fa-heart';
        //         alert(novel.is_favorited ? 'Added to Favorites!' : 'Removed from Favorites!');
        //     } catch (error) {
        //         console.error('Error updating favorite:', error);
        //         alert('Error updating favorite!');
        //     }
        // });

        // Hàm lấy và hiển thị comment
        async function fetchComments(novelId) {
            try {
                console.log('Fetching comments for novelId:', novelId); // Dòng ~124
                const response = await fetch(`http://localhost:3000/api/comments/${novelId}`, { headers });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Không thể tải bình luận: ${response.status} - ${errorData.error || 'Unknown error'}`);
                }
                const data = await response.json();
                console.log('Comments data:', data); // Dòng ~131
                
                const commentsContainer = document.getElementById('commentList');
                if (!commentsContainer) {
                    console.error('Comment list element not found');
                    return;
                }
                
                commentsContainer.innerHTML = '';
                const comments = Array.isArray(data.comments) ? data.comments : [];
                if (comments.length === 0) {
                    commentsContainer.innerHTML = '<p>Chưa có bình luận nào.</p>';
                    return;
                }
                
                comments.forEach(comment => { // Dòng ~142
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment-item';
                    commentDiv.innerHTML = `
                        <strong>${comment.username}</strong> - <em>${new Date(comment.created_at).toLocaleString('vi-VN')}</em>
                        <p>${comment.content}</p>
                    `;
                    commentsContainer.appendChild(commentDiv);
                });
            } catch (error) {
                console.error('Error loading comments:', error); // Dòng ~152
                const commentsContainer = document.getElementById('commentList');
                if (commentsContainer) {
                    commentsContainer.innerHTML = '<p>Lỗi khi tải bình luận.</p>';
                }
            }
        }

       // Xử lý form gửi bình luận
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!token) {
                    alert('Vui lòng đăng nhập để bình luận!');
                    return;
                }
                const content = document.getElementById('commentContent').value.trim();
                if (!content) {
                    alert('Vui lòng nhập nội dung bình luận!');
                    return;
                }
                try {
                    console.log('Submitting comment:', { novelId, content });
                    const response = await fetch(`http://localhost:3000/api/comments/${novelId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...headers },
                        body: JSON.stringify({ content })
                    });
                    console.log('POST comment response status:', response.status);
                    if (!response.ok) {
                        let errorData = {};
                        try {
                            errorData = await response.json();
                        } catch (e) {
                            console.error('Failed to parse error response:', e);
                            if (response.status === 404) {
                                errorData.error = 'API endpoint không tồn tại';
                            }
                        }
                        throw new Error(`Không thể gửi bình luận: ${response.status} - ${errorData.error || 'Unknown error'}`);
                    }
                    const data = await response.json();
                    console.log('POST comment response:', data);
                    alert('Bình luận đã được gửi!');
                    commentForm.reset();
                    await fetchComments(novelId);
                } catch (error) {
                    console.error('Error submitting comment:', error);
                    alert(`Lỗi khi gửi bình luận: ${error.message}`);
                }
            });
        } else {
            console.error('Comment form not found');
        }

        // Tải bình luận ban đầu
        await fetchComments(novelId);

    } catch (error) {
        console.error('Error loading novel:', error);
        alert('Error loading novel!');
    }
});