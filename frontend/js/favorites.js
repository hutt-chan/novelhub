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

        const data = await response.json();
        btn.classList.toggle('active', !isFavorited);
        btn.querySelector('i').classList.toggle('fas', !isFavorited);
        btn.querySelector('i').classList.toggle('far', isFavorited);
        if (novel) {
            novel.is_favorited = !isFavorited;
            novel.favorite_count += isFavorited ? -1 : 1;
            if (!isFavorited) favorites.push(novel);
            else favorites = favorites.filter(f => f.id != novelId);
        }

        // Tải lại danh sách yêu thích từ server
        favorites = await fetchFavorites().then(favs => {
            return novels.filter(n => favs.some(f => f.novel_id == n.id));
        });
        renderFavorites();

        // Cập nhật modal nếu đang mở
        const novelModal = document.getElementById('novelModal');
        if (novelModal.getAttribute('data-novel-id') == novelId && novel) {
            const modalFavoriteCount = novelModal.querySelector('.favorite-count');
            const favoriteModalBtn = novelModal.querySelector('.favorite-modal-btn');
            if (modalFavoriteCount) modalFavoriteCount.textContent = novel.favorite_count;
            favoriteModalBtn.innerHTML = novel.is_favorited
                ? '<i class="fas fa-heart"></i> Xóa Yêu Thích'
                : '<i class="far fa-heart"></i> Thêm Yêu Thích';
        }
    } catch (error) {
        console.error('Favorite error:', error);
        alert(`Lỗi khi cập nhật yêu thích: ${error.message}`);
    }
}