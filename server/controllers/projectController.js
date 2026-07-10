const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

// Helper to determine user role if token exists (optional authentication)
const getOptionalUser = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123_university_archive');
      return decoded;
    } catch (err) {
      // Ignore token validation failure and treat as guest
      return null;
    }
  }
  return null;
};

// @desc    Get all projects (with search & filtering)
// @route   GET /api/archive/documents
// @access  Public (Optional Auth for teacher visibility)
exports.getProjects = async (req, res, next) => {
  try {
    const { search, department, technology } = req.query;
    const query = {};

    // 1. Role-based Visibility
    // Students and guests should only see Reviewed projects.
    // Teachers should see all projects (Pending + Reviewed).
    const user = getOptionalUser(req);
    if (!user) {
      query.status = 'Reviewed';
    } else if (user.role === 'student') {
      // Students see reviewed projects OR their own uploaded projects (even pending ones)
      query.$or = [
        { status: 'Reviewed' },
        { uploadedBy: user.id }
      ];
    }

    // 2. Department Filter
    if (department) {
      query.department = department;
    }

    // 3. Technology Filter
    if (technology) {
      // Matches case-insensitive exact tag or partial
      query.technology = { $in: [new RegExp(`^${technology}$`, 'i')] };
    }

    // 4. Text Search (matches title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch and populate uploader information (omitting password)
    const projects = await Project.find(query)
      .populate('uploadedBy', 'name email department')
      .sort({ uploadDate: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/archive/document/:id
// @access  Public
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('uploadedBy', 'name email department');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Access control: only teachers can view pending projects
    if (project.status === 'Pending') {
      const user = getOptionalUser(req);
      if (!user || user.role !== 'teacher') {
        // If the uploader is requesting their own pending project, allow it
        if (!user || user.id !== project.uploadedBy._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view pending projects'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload project
// @route   POST /api/archive/upload
// @access  Private (Student only)
exports.uploadProject = async (req, res, next) => {
  try {
    const { title, description, technology, department, batch, year, githubLink } = req.body;

    // Split technologies by comma if passed as string, and trim
    let techArray = [];
    if (Array.isArray(technology)) {
      techArray = technology;
    } else if (typeof technology === 'string') {
      techArray = technology.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0);
    }

    const project = await Project.create({
      title,
      description,
      technology: techArray,
      department,
      batch,
      year,
      githubLink: githubLink || '',
      uploadedBy: req.user.id,
      status: 'Pending' // Explicitly set to Pending
    });

    res.status(201).json({
      success: true,
      message: 'Project uploaded successfully and is pending review',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review project (grade and comment)
// @route   PUT /api/archive/review/:id
// @access  Private (Teacher only)
exports.reviewProject = async (req, res, next) => {
  try {
    const { marks, teacherComment } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide marks'
      });
    }

    const numericMarks = Number(marks);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a number between 0 and 100'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.marks = numericMarks;
    project.teacherComment = teacherComment || '';
    project.status = 'Reviewed';

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project reviewed successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/archive/:id
// @access  Private (Teacher only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students who have submitted a project
// @route   GET /api/archive/students
// @access  Private (Teacher only)
exports.getSubmittedStudents = async (req, res, next) => {
  try {
    const User = require('../models/User');

    // Find unique uploadedBy user IDs from projects
    const studentIds = await Project.distinct('uploadedBy');

    // Find users with these IDs who are students
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    }).select('name email department');

    // Add submission count to each student
    const studentsWithCount = await Promise.all(
      students.map(async (student) => {
        const count = await Project.countDocuments({ uploadedBy: student._id });
        return {
          ...student.toObject(),
          submissionCount: count
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithCount.length,
      data: studentsWithCount
    });
  } catch (error) {
    next(error);
  }
};
