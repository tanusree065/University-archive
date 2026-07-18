const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  technology: {
    type: [String],
    required: [true, 'Technology tags are required'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one technology tag is required'
    }
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  batch: {
    type: String,
    required: [true, 'Batch is required'],
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    trim: true
  },
  githubLink: {
    type: String,
    trim: true,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed'],
    default: 'Pending'
  },
  teacherComment: {
    type: String,
    default: ''
  },
  marks: {
    type: Number,
    min: [0, 'Marks cannot be less than 0'],
    max: [100, 'Marks cannot exceed 100'],
    default: null
  }
});


ProjectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Project', ProjectSchema);
