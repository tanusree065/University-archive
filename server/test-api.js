const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('--- Starting Integration Tests ---');
  try {
    // 1. Register a student
    console.log('1. Registering student...');
    const regStudentRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Student',
        email: 'alice@test.edu',
        password: 'password123',
        role: 'student',
        department: 'Computer Science'
      })
    });
    const regStudentData = await regStudentRes.json();
    if (!regStudentData.success) throw new Error(regStudentData.message);
    console.log('Student registered successfully.');
    const studentToken = regStudentData.token;

    // 2. Register a teacher
    console.log('2. Registering teacher...');
    const regTeacherRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Smith',
        email: 'smith@test.edu',
        password: 'password123',
        role: 'teacher',
        department: 'Computer Science'
      })
    });
    const regTeacherData = await regTeacherRes.json();
    if (!regTeacherData.success) throw new Error(regTeacherData.message);
    console.log('Teacher registered successfully.');
    const teacherToken = regTeacherData.token;

    // 3. Login student
    console.log('3. Logging in student...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@test.edu',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(loginData.message);
    console.log('Student logged in successfully.');

    // 4. Student uploads project
    console.log('4. Student uploading project...');
    const uploadRes = await fetch(`${BASE_URL}/archive/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: 'AlphaGenome Integration Layer',
        description: 'Analyzing non-coding variant effects on expression and TF binding profiles.',
        technology: 'Node.js, Express, Mongoose',
        department: 'Computer Science',
        batch: '2026',
        year: '4th Year',
        githubLink: 'https://github.com/alice/alphagenome-layer'
      })
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error(uploadData.message);
    console.log('Project uploaded successfully. ID:', uploadData.data._id);
    const projectId = uploadData.data._id;

    // 5. Query projects as Guest (should be empty because it is Pending)
    console.log('5. Querying projects as Guest (should see 0)...');
    const guestQueryRes = await fetch(`${BASE_URL}/archive/documents`);
    const guestQueryData = await guestQueryRes.json();
    console.log('Guest saw projects count:', guestQueryData.data.length);
    if (guestQueryData.data.length !== 0) throw new Error('Guest should not see pending projects');

    // 6. Query projects as Student (should see 1, because it returns reviewed + own uploads)
    console.log('6. Querying projects as Student (should see 1)...');
    const studentQueryRes = await fetch(`${BASE_URL}/archive/documents`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentQueryData = await studentQueryRes.json();
    console.log('Student saw projects count:', studentQueryData.data.length);
    if (studentQueryData.data.length !== 1) throw new Error('Student should see their own pending project');

    // 7. Teacher reviews project
    console.log('7. Teacher reviewing project...');
    const reviewRes = await fetch(`${BASE_URL}/archive/review/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        marks: 95,
        teacherComment: 'Outstanding integration of advanced genetic analysis workflows!'
      })
    });
    const reviewData = await reviewRes.json();
    if (!reviewData.success) throw new Error(reviewData.message);
    console.log('Project reviewed successfully.');

    // 8. Query projects as Guest again (should now see 1 because it is Reviewed)
    console.log('8. Querying projects as Guest again (should see 1)...');
    const guestQuery2Res = await fetch(`${BASE_URL}/archive/documents`);
    const guestQuery2Data = await guestQuery2Res.json();
    console.log('Guest saw projects count:', guestQuery2Data.data.length);
    if (guestQuery2Data.data.length !== 1) throw new Error('Guest should see reviewed projects');
    console.log('Project title:', guestQuery2Data.data[0].title);
    console.log('Project grade:', guestQuery2Data.data[0].marks);

    console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (error) {
    console.error('--- TEST FAILED! ---', error.message);
    process.exit(1);
  }
}

runTests();
