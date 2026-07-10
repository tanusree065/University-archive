// Registration Form Logic
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to respective dashboard if already logged in
  const user = api.getCurrentUser();
  if (user) {
    redirectBasedOnRole(user.role);
  }

  const roleSelect = document.getElementById('role');
  const deptContainer = document.getElementById('department-container');
  const deptInput = document.getElementById('department');

  // Toggle department field based on selected role
  if (roleSelect && deptContainer) {
    roleSelect.addEventListener('change', () => {
      const selectedRole = roleSelect.value;
      if (selectedRole === 'student' || selectedRole === 'teacher') {
        deptContainer.classList.remove('hidden');
        deptInput.setAttribute('required', 'true');
      } else {
        deptContainer.classList.add('hidden');
        deptInput.removeAttribute('required');
        deptInput.value = '';
      }
    });
  }

  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', handleRegister);
  }
});

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const department = document.getElementById('department').value.trim();

  // Basic Validation
  if (!name || !email || !password || !role) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'error');
    return;
  }

  if ((role === 'student' || role === 'teacher') && !department) {
    showToast('Department is required for students and teachers', 'error');
    return;
  }

  const payload = {
    name,
    email,
    password,
    role,
    department: role === 'guest' ? undefined : department
  };

  try {
    showLoader();
    
    const response = await api.post('/auth/register', payload);
    
    if (response.success) {
      // Set session info
      api.setToken(response.token);
      api.setCurrentUser(response.user);
      
      showToast('Registration successful! Logging in...', 'success');
      
      // Redirect after toast animation
      setTimeout(() => {
        redirectBasedOnRole(response.user.role);
      }, 800);
    }
  } catch (error) {
    showToast(error.message || 'Registration failed. Please try again.', 'error');
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
