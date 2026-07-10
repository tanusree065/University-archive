// Shared UI utilities: Toast notifications, navbar injection, loaders, and auth guards

// 1. Toast Notifications System
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} glass-panel`;
  
  // Set icons based on type
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span class="text-lg">${icon}</span>
    <span class="font-medium text-sm text-white">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// 2. Dynamic Navigation Bar
function injectNavbar() {
  const user = api.getCurrentUser();
  const navContainer = document.getElementById('navbar-container');
  if (!navContainer) return;

  let authLinks = '';
  let dashboardLinks = '';

  if (user) {
    const roleBadgeColor = 
      user.role === 'teacher' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
      user.role === 'student' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
      'bg-slate-500/20 text-slate-300 border border-slate-500/40';

    dashboardLinks = `
      <a href="/index.html" class="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Browse</a>
      ${user.role === 'student' ? `<a href="/student.html" class="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Student Panel</a>` : ''}
      ${user.role === 'teacher' ? `<a href="/teacher.html" class="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Teacher Queue</a>` : ''}
    `;

    authLinks = `
      <div class="flex items-center gap-4">
        <div class="hidden sm:flex flex-col items-end">
          <span class="text-sm font-medium text-gray-200">${user.name}</span>
          <span class="text-xs px-2 py-0.5 rounded-full mt-0.5 capitalize ${roleBadgeColor}">${user.role}</span>
        </div>
        <button id="logout-btn" class="px-4 py-2 text-xs font-semibold text-white bg-red-600/30 border border-red-500/50 hover:bg-red-600/50 rounded-lg transition-all duration-200">
          Logout
        </button>
      </div>
    `;
  } else {
    dashboardLinks = `
      <a href="/index.html" class="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Browse</a>
    `;

    authLinks = `
      <div class="flex items-center gap-3">
        <a href="/login.html" class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</a>
        <a href="/register.html" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/25 transition-all">Register</a>
      </div>
    `;
  }

  navContainer.innerHTML = `
    <nav class="glass-panel sticky top-0 z-50 px-6 py-4 mx-auto max-w-7xl rounded-2xl mt-4 border-white/5 bg-slate-900/60 backdrop-blur-md">
      <div class="flex items-center justify-between">
        <a href="/index.html" class="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent text-glow">
          🎓 UniArchive
        </a>
        <div class="flex items-center gap-8">
          <div class="hidden md:flex items-center gap-6">
            ${dashboardLinks}
          </div>
          ${authLinks}
        </div>
      </div>
      <!-- Mobile links navigation -->
      <div class="md:hidden flex justify-around mt-4 pt-3 border-t border-white/5">
        ${dashboardLinks}
      </div>
    </nav>
  `;

  // Attach logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => api.logout());
  }
}

// 3. Loading Overlay System
function showLoader() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300';
    loader.innerHTML = `
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-semibold text-indigo-300">Processing Request...</p>
      </div>
    `;
    document.body.appendChild(loader);
  }
}

function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.add('opacity-0');
    setTimeout(() => loader.remove(), 300);
  }
}

// 4. Role Guards for Dashboard Pages
function enforceGuard(allowedRoles = []) {
  const user = api.getCurrentUser();
  if (!user) {
    showToast('Please login to access this dashboard', 'error');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
    return false;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    showToast('Unauthorized access', 'error');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1000);
    return false;
  }
  return true;
}

// Automatically inject navbar if element is present
document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
});
