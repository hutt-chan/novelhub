document.addEventListener('DOMContentLoaded', async function() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    const novelListSection = document.getElementById('novelListSection');
    const novelGrid = document.getElementById('novelGrid');
    const selectedGenreTitle = document.getElementById('selectedGenreTitle');
    const noNovelsMessage = document.getElementById('noNovelsMessage');

    let genres = [];
    let novels = [];

    async function fetchNovels() {
        try {
            const res = await fetch('http://localhost:3000/api/novels');
            novels = await res.json();
        } catch (e) {
            novels = [];
        }
    }

    function getGenresWithCount() {
        const genreMap = {};
        novels.forEach(novel => {
            (novel.genres || []).forEach(genre => {
                if (!genreMap[genre]) genreMap[genre] = 0;
                genreMap[genre]++;
            });
        });
        return Object.entries(genreMap).map(([name, count]) => ({ name, count }));
    }

    function renderCategories() {
        const genreList = getGenresWithCount();
        categoriesGrid.innerHTML = genreList.map(g => `
            <div class="category-card" data-genre="${g.name}">
                <div class="category-title">${g.name}</div>
                <div class="category-count">${g.count} novels</div>
            </div>
        `).join('');
        categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', function() {
                const genre = this.getAttribute('data-genre');
                showNovelsByGenre(genre);
            });
        });
    }

    function showNovelsByGenre(genre) {
        const filtered = novels.filter(novel => (novel.genres || []).includes(genre));
        selectedGenreTitle.textContent = `${genre} (${filtered.length} novels)`;
        if (!filtered.length) {
            novelGrid.innerHTML = '';
            noNovelsMessage.style.display = 'block';
        } else {
            noNovelsMessage.style.display = 'none';
            novelGrid.innerHTML = filtered.map(novel => `
                <div class="novel-card" data-id="${novel.id}">
                    <div class="novel-cover" style="background-image: url('${novel.coverUrl || ''}');"></div>
                    <div class="novel-info">
                        <h3 class="novel-title">${novel.title}</h3>
                        <p class="novel-author">By ${novel.author}</p>
                        <div class="novel-stats">
                            <span><i class="fas fa-eye"></i> ${novel.views || 0}</span>
                            <span><i class="fas fa-star"></i> ${novel.rating || 0}</span>
                            <span><i class="fas fa-book"></i> ${novel.chapterCount || 0}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            novelGrid.querySelectorAll('.novel-card').forEach(card => {
                card.addEventListener('click', function() {
                    const novelId = this.getAttribute('data-id');
                    window.location.href = `novel.html?novel_id=${novelId}`;
                });
            });
        }
        novelListSection.style.display = 'block';
        novelListSection.scrollIntoView({ behavior: 'smooth' });
    }

    await fetchNovels();
    renderCategories();
});
