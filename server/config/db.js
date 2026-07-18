const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/university-archive';
  try {
    console.log(`Connecting to Local MongoDB at ${uri}...`);
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Local MongoDB connection failed: ${error.message}`);
    console.log('Attempting to launch in-memory MongoDB server fallback...');
    
    try {
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoMS = await MongoMemoryServer.create();
      const memoryUri = mongoMS.getUri();
      
      console.log(`Starting in-memory DB at URI: ${memoryUri}`);
      const conn = await mongoose.connect(memoryUri);
      console.log(`MongoDB Connected (In-Memory Database): ${conn.connection.host}`);
    } catch (memError) {
      console.error(`MongoDB In-Memory fallback failed: ${memError.message}`);
      console.error('Please ensure a local MongoDB server is running on port 27017 or that mongodb-memory-server is installed.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
