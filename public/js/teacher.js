// Teacher Dashboard Logic
let allProjects = [];
let pendingQueue = [];
let reviewedQueue = [];
let activeTab = 'pending'; // 'pending' or 'reviewed'
let currentReviewId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Enforce Teacher role guard
  if (!enforceGuard(['teacher'])) return;

  // Load dashboard queues
  loadDashboardData();

  // Setup tab listeners
  const tabPending = document.getElementById('tab-pending');
  const tabReviewed = document.getElementById('tab-reviewed');

  if (tabPending && tabReviewed) {
    tabPending.addEventListener('click', () => {
      switchTab('pending');
    });
    tabReviewed.addEventListener('click', () => {
      switchTab('reviewed');
    });
  }

  // Attach submit handler for review form
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }
});

// Switch view tabs
function switchTab(tab) {
  activeTab = tab;
  const tabPending = document.getElementById('tab-pending');
  const tabReviewed = document.getElementById('tab-reviewed');

  if (tab === 'pending') {
    tabPending.className = "px-6 py-3.5 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400 transition-all focus:outline-none";
    tabReviewed.className = "px-6 py-3.5 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-white transition-all focus:outline-none";
  } else {
    tabPending.className = "px-6 py-3.5 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-white transition-all focus:outline-none";
    tabReviewed.className = "px-6 py-3.5 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400 transition-all focus:outline-none";
  }

  renderQueue();
}

// Fetch all projects for the teacher
async function loadDashboardData() {
  const loading = document.getElementById('queue-loading');
  const empty = document.getElementById('queue-empty');
  const queueList = document.getElementById('projects-queue');

  if (queueList) queueList.innerHTML = '';
  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');

  try {
    // Teachers are allowed to fetch all projects
    const response = await api.get('/archive/documents');

    if (response.success) {
      allProjects = response.data;
      
      // Separate projects
      pendingQueue = allProjects.filter(p => p.status === 'Pending');
      reviewedQueue = allProjects.filter(p => p.status === 'Reviewed');
      
      // Update statistics
      document.getElementById('stat-pending').textContent = pendingQueue.length;
      document.getElementById('stat-reviewed').textContent = reviewedQueue.length;

      renderQueue();
    }
  } catch (error) {
    showToast(error.message || 'Failed to load project archives', 'error');
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

// Render active tab queue
function renderQueue() {
  const container = document.getElementById('projects-queue');
  const empty = document.getElementById('queue-empty');
  if (!container) return;

  container.innerHTML = '';

  const activeQueue = activeTab === 'pending' ? pendingQueue : reviewedQueue;

  if (activeQueue.length === 0) {
    const emptyTitle = document.getElementById('empty-title');
    const emptySubtitle = document.getElementById('empty-subtitle');

    if (activeTab === 'pending') {
      emptyTitle.textContent = 'Assessment Queue Clear';
      emptySubtitle.textContent = 'No pending project submissions need evaluation.';
    } else {
      emptyTitle.textContent = 'No Archives Graded';
      emptySubtitle.textContent = 'You have not evaluated any project archives yet.';
    }
    
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  activeQueue.forEach(project => {
    // Date formatting
    const formattedDate = new Date(project.uploadDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const isReviewed = project.status === 'Reviewed';

    // Badge styling
    const badgeColor = isReviewed 
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';

    // Build buttons and details
    let actionButtons = '';
    let gradeDisplay = '';

    if (isReviewed) {
      gradeDisplay = `
        <div class="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-emerald-300 text-xs">
          <span>Marks: <strong class="text-sm font-black">${project.marks}/100</strong></span>
          ${project.teacherComment ? `<span>Feedback: <span class="italic text-gray-400">"${project.teacherComment}"</span></span>` : ''}
        </div>
      `;
      actionButtons = `
        <button onclick="openReviewModal('${project._id}')" class="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors">
          Re-evaluate
        </button>
      `;
    } else {
      actionButtons = `
        <button onclick="openReviewModal('${project._id}')" class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all">
          Grade & Review
        </button>
      `;
    }

    // Always append Delete option for teachers
    actionButtons += `
      <button onclick="deleteProjectEntry('${project._id}')" class="px-3.5 py-2 text-xs font-semibold text-red-400 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 rounded-lg transition-colors ml-2">
        Delete
      </button>
    `;

    const item = document.createElement('div');
    item.className = 'glass-panel p-6 rounded-xl bg-slate-900/40 border-white/5';
    
    item.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="text-[9px] uppercase font-bold tracking-wider text-indigo-400">${project.department}</span>
            <span class="text-[9px] uppercase font-bold text-gray-500">Batch: ${project.batch} &bull; Year: ${project.year}</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full capitalize ${badgeColor}">${project.status}</span>
          </div>
          
          <h3 class="text-lg font-bold text-white leading-snug">${project.title}</h3>
          <p class="text-xs text-gray-400 leading-relaxed">${project.description}</p>
          
          <div class="flex items-center gap-1.5 flex-wrap pt-2">
            ${project.technology.map(tech => `<span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-gray-400 border border-white/5">${tech}</span>`).join('')}
          </div>

          <div class="pt-2 flex items-center gap-4 text-[11px] text-gray-500">
            <span>Uploaded By: <strong class="text-gray-300 font-medium">${project.uploadedBy?.name || 'Anonymous'}</strong> (${project.uploadedBy?.email || 'N/A'})</span>
            <span>Date: ${formattedDate}</span>
          </div>

          ${gradeDisplay}
        </div>
        
        <div class="flex md:flex-col items-stretch justify-end gap-2.5 shrink-0 self-stretch md:self-auto">
          ${project.githubLink ? `<a href="${project.githubLink}" target="_blank" class="text-xs text-center font-medium text-gray-400 hover:text-white transition-colors underline mb-2">Open Repository ↗</a>` : ''}
          <div class="flex justify-end gap-2">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

// Evaluation Modal Controls
function openReviewModal(id) {
  currentReviewId = id;
  const project = allProjects.find(p => p._id === id);
  if (!project) return;

  const modal = document.getElementById('review-modal');
  if (!modal) return;

  // Set project details in modal
  document.getElementById('review-project-dept').textContent = project.department;
  document.getElementById('review-project-title').textContent = project.title;
  document.getElementById('review-project-desc').textContent = project.description;

  // Pre-fill review if it's already graded
  const marksInput = document.getElementById('review-marks');
  const commentInput = document.getElementById('review-comment');

  if (project.status === 'Reviewed') {
    marksInput.value = project.marks;
    commentInput.value = project.teacherComment;
  } else {
    marksInput.value = '';
    commentInput.value = '';
  }

  modal.classList.remove('hidden');
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentReviewId = null;
}

// Submit Assessment Form
async function handleReviewSubmit(e) {
  e.preventDefault();

  if (!currentReviewId) return;

  const marks = document.getElementById('review-marks').value;
  const teacherComment = document.getElementById('review-comment').value.trim();

  try {
    showLoader();
    
    const response = await api.put(`/archive/review/${currentReviewId}`, {
      marks,
      teacherComment
    });

    if (response.success) {
      showToast('Project evaluated successfully!', 'success');
      closeReviewModal();
      loadDashboardData(); // Refresh list
    }
  } catch (error) {
    showToast(error.message || 'Evaluation submission failed. Please try again.', 'error');
  } finally {
    hideLoader();
  }
}

// Delete project entry from archives
async function deleteProjectEntry(id) {
  if (!confirm('Are you absolutely sure you want to permanently delete this project archive entry?')) {
    return;
  }

  try {
    showLoader();
    const response = await api.delete(`/archive/${id}`);
    
    if (response.success) {
      showToast('Project deleted successfully!', 'success');
      loadDashboardData(); // Refresh list
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete project.', 'error');
  } finally {
    hideLoader();
  }
}
