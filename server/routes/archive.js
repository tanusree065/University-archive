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

router.get('/documents', getProjects);


router.get('/document/:id', getProjectById);


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


router.delete('/:id', protect, authorize('teacher'), deleteProject);


router.get('/students', protect, authorize('teacher'), getSubmittedStudents);

module.exports = router;
