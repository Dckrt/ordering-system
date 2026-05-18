// ============================================================
// frontend/js/nav-mobile.js
// Shared mobile hamburger nav — include in every HTML page
// AFTER app.js:  <script src="js/nav-mobile.js"></script>
// ============================================================

(function () {
  function initMobileNav() {
    const header = document.querySelector('.header .container.header-content');
    const nav    = document.querySelector('.nav');
    if (!header || !nav) return;

    // ── Build hamburger button ──
    const hamburger = document.createElement('button');
    hamburger.className  = 'nav-hamburger';
    hamburger.id         = 'nav-hamburger';
    hamburger.innerHTML  = '<i class="fas fa-bars"></i>';
    hamburger.title      = 'Menu';
    hamburger.setAttribute('aria-label', 'Open menu');
    nav.appendChild(hamburger);

    // ── Build mobile overlay ──
    const overlay = document.createElement('div');
    overlay.className = 'nav-mobile';
    overlay.id        = 'nav-mobile';

    const page = window.location.pathname.split('/').pop() || 'index.html';
    const isAdmin = page.includes('admin') ||
      window.location.pathname.includes('/admin/');

    const user = (() => {
      try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
    })();

    const userName = user
      ? (user.full_name || user.FULL_NAME || 'Account').split(' ')[0]
      : null;

    const base = window.location.pathname.includes('/admin/') ? '../' : './';

    // Nav links config
    const links = [
      { href: base + 'index.html',   icon: 'fa-house',        label: 'Home'    },
      { href: base + 'menu.html',    icon: 'fa-utensils',     label: 'Menu'    },
      { href: base + 'about.html',   icon: 'fa-circle-info',  label: 'About'   },
      { href: base + 'contact.html', icon: 'fa-envelope',     label: 'Contact' },
      { href: base + 'orders.html',  icon: 'fa-list-check',   label: 'My Orders' },
    ];

    // Unread notif count
    const notifCount = document.getElementById('notif-count');
    const unread = notifCount ? (parseInt(notifCount.textContent) || 0) : 0;

    overlay.innerHTML = `
      <div class="nav-mobile-panel" id="nav-mobile-panel">
        <div class="nav-mobile-header">
          <span><i class="fas fa-utensils" style="margin-right:8px;"></i>Batangas Premium Naga</span>
          <button class="nav-mobile-close" id="nav-mobile-close" aria-label="Close menu">
            <i class="fas fa-times"></i>
          </button>
        </div>

        ${user ? `
        <div style="padding:14px 20px;background:#fafafa;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#f97316);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0;">
            ${(user.full_name||user.FULL_NAME||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#111;">${user.full_name||user.FULL_NAME||'User'}</div>
            <div style="font-size:11px;color:#9ca3af;">${user.email||user.EMAIL||''}</div>
          </div>
        </div>` : ''}

        <div class="nav-mobile-links">
          ${links.map(l => `
            <a href="${l.href}" class="${l.href.includes(page) ? 'active' : ''}">
              <i class="fas ${l.icon}" style="width:18px;color:#dc2626;"></i>
              ${l.label}
            </a>`).join('')}

          ${unread > 0 ? `
          <a href="${base}orders.html" onclick="closeNav()">
            <i class="fas fa-bell" style="width:18px;color:#dc2626;"></i>
            Notifications
            <span style="margin-left:auto;background:#dc2626;color:white;font-size:10px;font-weight:700;border-radius:999px;padding:2px 7px;">${unread}</span>
          </a>` : ''}

          <div class="nav-mobile-divider"></div>

          ${user && (user.role === 'admin' || user.ROLE === 'admin') ? `
          <a href="${base}admin/dashboard.html">
            <i class="fas fa-shield-halved" style="width:18px;color:#1d4ed8;"></i>
            Admin Panel
          </a>` : ''}

          ${user ? `
          <a href="${base}profile.html">
            <i class="fas fa-user" style="width:18px;color:#dc2626;"></i>
            My Profile
          </a>
          <div class="nav-mobile-divider"></div>
          <button onclick="Auth.logout()" style="color:#dc2626!important;font-weight:600;">
            <i class="fas fa-sign-out-alt" style="width:18px;color:#dc2626;"></i>
            Sign Out
          </button>` : `
          <a href="${base}login.html" style="color:#dc2626;font-weight:700;">
            <i class="fas fa-right-to-bracket" style="width:18px;color:#dc2626;"></i>
            Sign In / Register
          </a>`}
        </div>

        <div style="padding:12px 20px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;text-align:center;">
          © 2026 Batangas Premium Naga
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // ── Open / Close ──
    function openNav() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      hamburger.innerHTML = '<i class="fas fa-times"></i>';
    }

    window.closeNav = function () {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    };

    hamburger.addEventListener('click', () => {
      overlay.classList.contains('open') ? closeNav() : openNav();
    });

    document.getElementById('nav-mobile-close')?.addEventListener('click', closeNav);

    // Close on overlay click (outside panel)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeNav();
    });

    // Close on nav link click
    overlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeNav);
    });

    // Close on ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeNav();
    });
  }

  // Run after DOM + NavInit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();