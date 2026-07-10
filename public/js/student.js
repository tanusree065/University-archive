// Student Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
  // Enforce Student role guard
  if (!enforceGuard(['student'])) return;

  // Load submissions list
  loadSubmissions();

  // Attach submit handler
  const form = document.getElementById('upload-form');
  if (form) {
    form.addEventListener('submit', handleUploadSubmit);
  }
});

// Fetch and render the student's own submissions
async function loadSubmissions() {
  const container = document.getElementById('submissions-list');
  const loading = document.getElementById('submissions-loading');
  const empty = document.getElementById('submissions-empty');

  if (container) container.innerHTML = '';
  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');

  try {
    const user = api.getCurrentUser();
    // Fetch all documents. The API has been configured to return Reviewed ones + our own uploads.
    const response = await api.get('/archive/documents');

    if (response.success) {
      // Filter out only the projects uploaded by this student
      const myProjects = response.data.filter(p => {
        const uploaderId = p.uploadedBy?._id || p.uploadedBy;
        return uploaderId === user.id;
      });

      if (myProjects.length === 0) {
        if (empty) empty.classList.remove('hidden');
      } else {
        renderSubmissions(myProjects);
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to load submissions', 'error');
    if (empty) empty.classList.remove('hidden');
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

// Render submissions list
function renderSubmissions(projects) {
  const container = document.getElementById('submissions-list');
  if (!container) return;

  container.innerHTML = '';

  projects.forEach(project => {
    const isReviewed = project.status === 'Reviewed';
    
    // Status Badge
    const statusBadge = isReviewed
      ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Reviewed</span>`
      : `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">Pending Review</span>`;

    // Grade Banner
    const gradeSection = isReviewed && project.marks !== null
      ? `<div class="mt-3 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 text-xs rounded-lg flex items-center justify-between text-emerald-300">
          <span>Marks Awarded:</span>
          <span class="font-extrabold text-sm">${project.marks} / 100</span>
         </div>`
      : '';

    // Teacher feedback
    const feedbackSection = isReviewed && project.teacherComment
      ? `<div class="mt-2 text-xs italic text-gray-400 border-l-2 border-purple-500/40 pl-3 py-1">
          <strong>Reviewer Feedback:</strong> "${project.teacherComment}"
         </div>`
      : '';

    // Tech stack pills
    const techPills = project.technology.map(tech => 
      `<span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-gray-400 border border-white/5">${tech}</span>`
    ).join('');

    const item = document.createElement('div');
    item.className = 'glass-panel p-5 rounded-xl bg-slate-900/40 border-white/5';
    
    item.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <span class="text-[9px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">${project.department} &bull; Batch ${project.batch}</span>
          <h3 class="text-base font-bold text-white mb-2">${project.title}</h3>
          <p class="text-xs text-gray-400 line-clamp-2 mb-3">${project.description}</p>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${techPills}
          </div>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          ${statusBadge}
          ${project.githubLink ? `<a href="${project.githubLink}" target="_blank" class="text-xs text-gray-400 hover:text-white transition-colors underline">Code link ↗</a>` : ''}
        </div>
      </div>
      ${gradeSection}
      ${feedbackSection}
    `;

    container.appendChild(item);
  });
}

// Handle Form Submission
async function handleUploadSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const technology = document.getElementById('technology').value.trim();
  const department = document.getElementById('department').value;
  const batch = document.getElementById('batch').value.trim();
  const year = document.getElementById('year').value;
  const githubLink = document.getElementById('githubLink').value.trim();

  // Basic validate
  if (!title || !description || !technology || !department || !batch || !year) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const payload = {
    title,
    description,
    technology,
    department,
    batch,
    year,
    githubLink: githubLink || undefined
  };

  try {
    showLoader();
    
    const response = await api.post('/archive/upload', payload);
    
    if (response.success) {
      showToast('Project uploaded successfully for faculty review!', 'success');
      
      // Reset form fields
      document.getElementById('upload-form').reset();
      
      // Reload lists
      loadSubmissions();
    }
  } catch (error) {
    showToast(error.message || 'Submission failed. Please try again.', 'error');
  } finally {
    hideLoader();
  }
}
