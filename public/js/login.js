// Login Form Logic
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to respective dashboard if already logged in
  const user = api.getCurrentUser();
  if (user) {
    redirectBasedOnRole(user.role);
  }

  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  try {
    showLoader();
    
    const response = await api.post('/auth/login', { email, password });
    
    if (response.success) {
      api.setToken(response.token);
      api.setCurrentUser(response.user);
      
      showToast('Logged in successfully!', 'success');
      
      // Redirect after toast animation
      setTimeout(() => {
        redirectBasedOnRole(response.user.role);
      }, 800);
    }
  } catch (error) {
    showToast(error.message || 'Login failed. Please check credentials.', 'error');
  } finally {
    hideLoader();
  }
}

function redirectBasedOnRole(role) {
  if (role === 'student') {
    window.location.href = '/student.html';
  } else if (role === 'teacher') {
    window.location.href = '/teacher.html';
  } else {
    window.location.href = '/index.html';
  }
}
