// Lấy ID từ URL
const urlParams = new URLSearchParams(window.location.search);
const novelId = parseInt(urlParams.get('id'));

// Hiển thị thông tin chi tiết
async function loadNovelDetails() {
  try {
    // Lấy chi tiết tiểu thuyết
    const novelResponse = await fetch(`http://localhost:3000/novels/${novelId}`);
    const novel = await novelResponse.json();

    if (!novelResponse.ok) {
      throw new Error('Novel not found');
    }

    document.getElementById('novel-cover').src = novel.cover;
    document.getElementById('novel-title').textContent = novel.title;
    document.getElementById('novel-author').textContent = `by ${novel.author}`;
    document.getElementById('novel-rating').textContent = `★ ${novel.rating}`;
    document.getElementById('novel-description').textContent = novel.description;

    // Cập nhật liên kết "Read Now" để dẫn đến chương đầu tiên
    document.getElementById('read-now-link').href = `read.html?id=${novel.id}&chapter=1`;

    // Lấy danh sách chương
    const chaptersResponse = await fetch(`http://localhost:3000/novels/${novelId}/chapters`);
    const chapters = await chaptersResponse.json();

    const chapterList = document.getElementById('chapter-list-items');
    chapters.forEach(chapter => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="read.html?id=${novel.id}&chapter=${chapter.chapter_number}">${chapter.title}</a>`;
      chapterList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading novel details:', error);
    document.querySelector('.novel-details').innerHTML = '<p>Novel not found.</p>';
  }
}

// Thêm sự kiện cho nút "Add to Favourites"
const addToFavouritesButton = document.querySelector('.add-to-favourites');
if (addToFavouritesButton) {
  addToFavouritesButton.addEventListener('click', async () => {
    alert(`Added to Favourites!`); // Cần thêm API để lưu danh sách yêu thích
  });
}

// Cập nhật giao diện
loadNovelDetails();