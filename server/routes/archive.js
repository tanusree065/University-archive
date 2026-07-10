const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getProjects,
  getProjectById,
  uploadProject,
  reviewProject,
  deleteProject,
  getSubmittedStudents
} = require('../controllers/projectController');

const router = express.Router();

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/archive/documents
// @desc    Get all projects (public with optional search & filters)
// @access  Public
router.get('/documents', getProjects);

// @route   GET /api/archive/document/:id
// @desc    Get project details by ID
// @access  Public
router.get('/document/:id', getProjectById);

// @route   POST /api/archive/upload
// @desc    Upload project metadata
// @access  Private (Student only)
router.post(
  '/upload',
  protect,
  authorize('student'),
  [
    body('title', 'Project title is required').notEmpty().trim(),
    body('description', 'Project description is required').notEmpty().trim(),
    body('technology', 'Technology tags are required').notEmpty(),
    body('department', 'Department is required').notEmpty().trim(),
    body('batch', 'Batch is required').notEmpty().trim(),
    body('year', 'Year is required').notEmpty().trim(),
    body('githubLink', 'GitHub link must be a valid URL if provided').optional({ checkFalsy: true }).isURL()
  ],
  validate,
  uploadProject
);

// @route   PUT /api/archive/review/:id
// @desc    Review/Grade a pending project submission
// @access  Private (Teacher only)
router.put(
  '/review/:id',
  protect,
  authorize('teacher'),
  [
    body('marks', 'Marks are required and must be between 0 and 100').notEmpty().isInt({ min: 0, max: 100 }),
    body('teacherComment').optional().trim()
  ],
  validate,
  reviewProject
);

// @route   DELETE /api/archive/:id
// @desc    Delete project submission
// @access  Private (Teacher only)
router.delete('/:id', protect, authorize('teacher'), deleteProject);

// @route   GET /api/archive/students
// @desc    Get list of students who submitted projects
// @access  Private (Teacher only)
router.get('/students', protect, authorize('teacher'), getSubmittedStudents);

module.exports = router;
