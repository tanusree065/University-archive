// Index Page Logic: Fetching, Search, Filters, and Modal display
let projectsData = [];
let selectedProjectId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  fetchProjects();

  // Setup search listeners with debounce
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleFilterChange, 300));
  }

  // Setup dropdown filter listener
  const deptFilter = document.getElementById('dept-filter');
  if (deptFilter) {
    deptFilter.addEventListener('change', handleFilterChange);
  }

  // Setup tech filter input listener
  const techFilter = document.getElementById('tech-filter');
  if (techFilter) {
    techFilter.addEventListener('input', debounce(handleFilterChange, 300));
  }

  // Setup clear filters button
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearFilters);
  }
});

// Debounce helper to prevent excessive API requests
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Fetch projects from the API
async function fetchProjects() {
  const grid = document.getElementById('projects-grid');
  const loading = document.getElementById('projects-loading');
  const empty = document.getElementById('projects-empty');

  if (grid) grid.innerHTML = '';
  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');

  try {
    const searchVal = document.getElementById('search-input')?.value.trim() || '';
    const deptVal = document.getElementById('dept-filter')?.value || '';
    const techVal = document.getElementById('tech-filter')?.value.trim() || '';

    // Construct URL with query parameters
    let endpoint = '/archive/documents';
    const params = [];
    if (searchVal) params.push(`search=${encodeURIComponent(searchVal)}`);
    if (deptVal) params.push(`department=${encodeURIComponent(deptVal)}`);
    if (techVal) params.push(`technology=${encodeURIComponent(techVal)}`);
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }

    const response = await api.get(endpoint);
    
    if (response.success) {
      projectsData = response.data;
      updateProjectCount(projectsData.length);
      
      if (projectsData.length === 0) {
        if (empty) empty.classList.remove('hidden');
      } else {
        renderProjects(projectsData);
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to fetch project archives', 'error');
    if (empty) empty.classList.remove('hidden');
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

// Update search filters
function handleFilterChange() {
  fetchProjects();
}

// Reset filters
function clearFilters() {
  const searchInput = document.getElementById('search-input');
  const deptFilter = document.getElementById('dept-filter');
  const techFilter = document.getElementById('tech-filter');

  if (searchInput) searchInput.value = '';
  if (deptFilter) deptFilter.value = '';
  if (techFilter) techFilter.value = '';

  fetchProjects();
}

// Clicking a quick tech tag
function setTechFilter(techName) {
  const techFilter = document.getElementById('tech-filter');
  if (techFilter) {
    techFilter.value = techName;
    fetchProjects();
  }
}

function updateProjectCount(count) {
  const countBadge = document.getElementById('project-count');
  if (countBadge) {
    countBadge.textContent = count;
  }
}

// Render project cards
function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = '';

  projects.forEach((project, index) => {
    // Description preview
    const descSnippet = project.description.length > 100 
      ? project.description.substring(0, 100) + '...'
      : project.description;

    // Tech pills rendering (show max 3 tags on cards)
    const techPills = project.technology.slice(0, 3).map(tech => 
      `<span class="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-gray-300 border border-white/5 hover:border-indigo-500/30 transition-colors">${tech}</span>`
    ).join('');

    const hasMoreTech = project.technology.length > 3 
      ? `<span class="text-[11px] text-indigo-400 font-medium">+${project.technology.length - 3}</span>`
      : '';

    // Date formatting
    const formattedDate = new Date(project.uploadDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const isReviewed = project.status === 'Reviewed';
    const gradeBadge = isReviewed && project.marks !== null
      ? `<span class="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">Grade: ${project.marks}</span>`
      : `<span class="absolute top-4 right-4 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>`;

    const card = document.createElement('div');
    // Animate item insertion with slide up
    card.className = 'glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/50 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 relative';
    card.style.animation = `float 3s ease-in-out infinite`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      <div>
        ${gradeBadge}
        <!-- Department -->
        <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-2 block">${project.department}</span>
        <!-- Title -->
        <h3 class="text-lg font-bold text-white mb-2 leading-snug hover:text-indigo-300 transition-colors">${project.title}</h3>
        <!-- Description -->
        <p class="text-sm text-gray-400 mb-4 line-clamp-3">${descSnippet}</p>
      </div>
      <div>
        <!-- Tech tags -->
        <div class="flex items-center gap-1.5 flex-wrap mb-4">
          ${techPills}
          ${hasMoreTech}
        </div>
        <!-- Footer info -->
        <div class="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-500">
          <span>Uploaded: ${formattedDate}</span>
          <span class="font-medium text-gray-400 hover:text-white transition-colors">Details →</span>
        </div>
      </div>
    `;

    // Click triggers modal
    card.addEventListener('click', () => {
      openModal(project._id);
    });

    grid.appendChild(card);
  });
}

// Modal open/close controls
async function openModal(id) {
  selectedProjectId = id;
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  try {
    showLoader();
    const response = await api.get(`/archive/document/${id}`);
    
    if (response.success) {
      const project = response.data;
      
      // Inject Modal content
      document.getElementById('modal-dept-badge').textContent = project.department;
      document.getElementById('modal-title').textContent = project.title;
      document.getElementById('modal-description').textContent = project.description;
      
      // Render all technology tags
      const techList = document.getElementById('modal-tech-list');
      techList.innerHTML = project.technology.map(tech => 
        `<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-gray-300 border border-white/5">${tech}</span>`
      ).join('');

      // Metadata
      document.getElementById('modal-uploader').textContent = project.uploadedBy?.name || 'Anonymous';
      document.getElementById('modal-date').textContent = new Date(project.uploadDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      document.getElementById('modal-batch').textContent = project.batch;
      document.getElementById('modal-year').textContent = project.year;

      // Github link
      const githubContainer = document.getElementById('modal-github-container');
      if (project.githubLink) {
        githubContainer.innerHTML = `
          <a href="${project.githubLink}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors">
            💻 Open on GitHub
          </a>
        `;
      } else {
        githubContainer.innerHTML = `
          <span class="text-xs text-gray-500 italic">No Repository Provided</span>
        `;
      }

      // Evaluation Grading
      const gradeContainer = document.getElementById('modal-grade-container');
      const commentsSection = document.getElementById('modal-comments-section');
      
      if (project.status === 'Reviewed' && project.marks !== null) {
        gradeContainer.innerHTML = `
          <span class="text-xs text-gray-400 font-semibold uppercase tracking-wide">Faculty Grade:</span>
          <span class="text-2xl font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">${project.marks}/100</span>
        `;
        
        if (project.teacherComment) {
          commentsSection.classList.remove('hidden');
          document.getElementById('modal-comments').textContent = `"${project.teacherComment}"`;
        } else {
          commentsSection.classList.add('hidden');
        }
      } else {
        gradeContainer.innerHTML = `
          <span class="text-xs text-gray-400 font-semibold uppercase tracking-wide">Status:</span>
          <span class="text-sm font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">Pending Assessment</span>
        `;
        commentsSection.classList.add('hidden');
      }

      // Display Modal with transition
      modal.classList.remove('hidden');
    }
  } catch (error) {
    showToast(error.message || 'Failed to retrieve project details', 'error');
  } finally {
    hideLoader();
  }
}

function closeModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  selectedProjectId = null;
}
