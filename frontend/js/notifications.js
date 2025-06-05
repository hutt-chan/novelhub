document.addEventListener('DOMContentLoaded', function() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationList = document.getElementById('notificationList');
  const notificationBadge = document.getElementById('notificationBadge');

  async function fetchNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
      const res = await fetch('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  }

  function renderNotifications(notifications) {
    notificationList.innerHTML = '';
    if (!notifications.length) {
      notificationList.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.7rem; padding: 2rem 0; color: #7f8c8d;">
          <i class="fas fa-bell" style="font-size: 2.5rem; color: #bdc3c7;"></i>
          <div style="font-size: 1.08rem;">No notifications.</div>
        </div>
      `;
      notificationBadge.style.display = 'none';
      return;
    }
    notifications.forEach(n => {
      const div = document.createElement('div');
      div.className = 'notification-item' + (n.is_read ? ' read' : '');
      div.textContent = n.message;
      div.style.cursor = 'pointer';
      div.addEventListener('click', async function() {
        if (!n.is_read) {
          const token = localStorage.getItem('token');
          await fetch(`http://localhost:3000/api/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          });
          n.is_read = 1;
          div.classList.add('read');
          notificationBadge.textContent = notifications.filter(x => !x.is_read).length;
          if (notificationBadge.textContent === '0') notificationBadge.style.display = 'none';
        }
      });
      notificationList.appendChild(div);
    });
    // Đếm số chưa đọc
    const unread = notifications.filter(n => !n.is_read).length;
    notificationBadge.textContent = unread;
    notificationBadge.style.display = unread ? 'inline-block' : 'none';
  }

  let notificationsCache = [];

  async function updateNotifications() {
    const notifications = await fetchNotifications();
    notificationsCache = notifications;
    renderNotifications(notifications);
  }

  notificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationDropdown.style.display = notificationDropdown.style.display === 'block' ? 'none' : 'block';
    if (notificationDropdown.style.display === 'block') {
      updateNotifications();
    }
  });

  document.addEventListener('click', function(e) {
    if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
      notificationDropdown.style.display = 'none';
    }
  });

  // Tải thông báo khi vào trang
  updateNotifications();

  // Có thể setInterval để tự động cập nhật badge mỗi 60s
  setInterval(updateNotifications, 60000);

  // Thêm CSS cho .notification-item.read nếu chưa có
  const style = document.createElement('style');
  style.innerHTML = `.notification-item.read { opacity: 0.6; background: #f4f4f4; }`;
  document.head.appendChild(style);
}); 