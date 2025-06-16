const express = require("express");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig'); 
require('dotenv').config();


const app = express();
const session = require("express-session");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const { adminModel } = require("./model/adminModel");
const { studentLoginModel } = require("./model/studentLoginModel");
const { teacherLoginModel } = require("./model/teacherLoginModel");
const {mappingModel} = require("./model/mappingModel");
const {creditsMarModel} = require("./model/creditsMarModel");
const {creditsMoocsModel} = require("./model/creditsMoocsModel");
const bcrypt = require("bcrypt");

const multer = require("multer");
const csvtojson = require("csvtojson");

app.use(
  session({
    secret: "s3cr3t_k3y_#9876!",  // 🔹 Replace with a strong secret key
    resave: false,  // 🔹 Prevents session from being saved if unchanged
    saveUninitialized: false,  // 🔹 Avoids storing empty sessions
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // 🔹 Session expires in 1 day
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.engine("ejs", ejsMate);
require("dotenv").config();

const jwt = require("jsonwebtoken");

const cors = require("cors");
const { userInfo } = require("os");

app.use(express.json());
app.use(cors());

//connection

const url = process.env.MONGO_URL;




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);



  mongoose.connect(url);
  console.log("DB Connected");
});

app.get("/", (req, res) => {
  res.send("./listings/home.ejs")
});

app.get("/home", (req, res) => {
  res.render("./listings/home.ejs");
});

const checkAuth = (req, res, next) => {
  let { token } = req.query;

  if (token === "abcd") {
    next();
  }
  throw new Error("ACCESSED DENIED");
};

app.get("/home/studentLogin", (req, res) => {
  res.render("./listings/studentLogin.ejs");
});
app.get("/home/teacherLogin", (req, res) => {
  res.render("./listings/teacherLogin.ejs");
});
app.get("/home/adminLogin", (req, res) => {
  res.render("./listings/adminLogin.ejs");
});

//Admin Login Authorization :

app.post("/home/adminLogin/adminPage", async (req, res, next) => {
  const { Username, Password } = req.body;

  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.json({ message: "All fields are required" });
    }
    const Admin = await adminModel.findOne({ Username });

    if (!Admin) {
      return res.json({ message: "Incorrect password or email" });
    }

    const auth = await bcrypt.compare(req.body.Password, Admin.Password);

    if (!auth) {
      return res.json({ message: "Incorrect password or email" });
    }
    //  const token = createSecretToken(Admin._id);
    //  res.cookie("token", token, {
    //    withCredentials: true,
    //    httpOnly: false,
    //  });
    res.render("./listings/adminDashboard.ejs");
    next();
  } catch (error) {
    console.error(error);
  }
});

//Student Login Authorization :


app.post("/home/studentLogin/studentPage", async (req, res, next) => {
  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.json({ message: "All fields are required" });
    }

    const Student = await studentLoginModel.findOne({ Username });

    if (!Student) {
      return res.json({ message: "Incorrect username or password" });
    }

    const auth = await bcrypt.compare(Password, Student.Password);

    if (!auth) {
      return res.json({ message: "Incorrect username or password" });
    }

    // Store student ID in session
    req.session.studentId = Student._id;
    req.session.name=Student.name;
    console.log(req.session.name , req.session.studentId);
    // Optionally use JWT instead of session:
    // const token = createSecretToken(Student._id);
    // res.cookie("token", token, { withCredentials: true, httpOnly: true });

        let { id } = req.session.studentId;

    let StudentProfile = await studentLoginModel.findById(Student._id);

    res.render("./listings/studentDashboard.ejs",{StudentProfile});
    next();
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Middleware to ensure student is logged in
const ensureAuth = (req, res, next) => {

  console.log("ensureCheck");
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }
  next();
};

// app.get(
//   "/home/studentLogin/studentPage/",ensureAuth,
//   async (req, res) => {
//     let { id } = req.session.studentId;

//     let Student = await studentLoginModel.findById(id);

//     res.render("./listings/studentDashboard.ejs", { Student });
//   }
// );

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Ensure student is authenticated
    if (!req.session.studentId) {
      throw new Error("Unauthorized: Student not logged in");
    }

    const subFolder = req.body.subFolder;
    console.log("subFolder");

    // Get the original file name
const originalFilename = file.originalname;
console.log(originalFilename);

// Ensure the file extension is only ".pdf"
const fileNameWithoutExtraExtension = originalFilename.replace(/\.pdf$/, ''); // Removes extra '.pdf' if exists
const fileExtension = path.extname(fileNameWithoutExtraExtension); // Get the correct file extension
const finalFileName = Date.now() + "-" + fileNameWithoutExtraExtension + fileExtension; // Final file name

    return {
      folder: `students/${req.session.studentId}/${subFolder}`, // Unique folder per student
      format: "pdf",
      public_id: finalFileName,
    };
  },
});


const upload = multer({ storage: storage });

app.get("/", (req, res) => {

  console.log("get /")
  res.render("upload");
});


// Upload Route for Student MAR Docs
app.post(
  "/upload",
  ensureAuth,
  upload.array("pdfs", 5),
  (req, res) => {

    console.log("Upload",);
    res.json({ message: "Files uploaded successfully", files: req.files });
    
  }
);

//Upload Mar Document 


app.get("/home/studentLogin/studentPage/mardocs/uploadNewMarDoc", async (req, res, next) => {
  try {

    const subFolder = "MAR_docs";
    res.render("./listings/studentNewMARUpload.ejs" , {subFolder });
  }
  catch (error) {
    console.error(error);
  }
});

app.get("/home/studentLogin/studentPage/mardocs/viewmardocs", ensureAuth, async (req, res) => {
  try {

    console.log(ensureAuth);
    const studentId = req.session.studentId;
    const folderPath = `students/${studentId}/MAR_docs`; // Fetch files from student-specific folder

    const result = await cloudinary.api.resources({
            type: "upload",
            prefix: folderPath, // Fetch all files in this folder
            resource_type: "image", // PDFs are stored as raw files
          });
      
          // Extract PDF URLs
          const pdfUrls = result.resources
            .filter(file => file.format === "pdf")
            .map(file => file.secure_url);
          
          console.log(pdfUrls);
      
          // Render the EJS template and pass the PDF URLs
          res.render("./listings/viewMardocs.ejs", { pdfFiles: pdfUrls });
        } catch (error) {
          console.error("Error fetching PDFs:", error);
          res.status(500).send("Failed to fetch PDFs");
        }
});


 // Student Mar Doc Connection

app.get("/home/studentLogin/studentPage/mardocs", async (req, res, next) => {
  try {
    res.render("./listings/studentMar.ejs")
  }
  catch (error) {
    console.error(error);
  }
});

 //Student Moocs Doc Connection

app.get("/home/studentLogin/studentPage/moocsdocs", async (req, res, next) => {
  try {
    res.render("./listings/studentMoocs.ejs");
  }
  catch (error) {
    console.error(error);
  }
});



 // Upload Moocs Document
app.get("/home/studentLogin/studentPage/moocsdocs/uploadNewMoocsDoc", async (req, res, next) => {
  try {

    const subFolder="MOOCs_docs";
    
    res.render("./listings/studentNewMOOCSUpload.ejs" , {subFolder});
  }
  catch (error) {
    console.error(error);
  }
});



// // View Moocs Documents
app.get("/home/studentLogin/studentPage/moocsdocs/viewmoocsdocs", ensureAuth, async (req, res) => {
  try {

    console.log(ensureAuth);
    const studentId = req.session.studentId;
    const folderPath = `students/${studentId}/MOOCs_docs`; // Fetch files from student-specific folder

    const result = await cloudinary.api.resources({
            type: "upload",
            prefix: folderPath, // Fetch all files in this folder
            resource_type: "image", // PDFs are stored as raw files
          });
      
          // Extract PDF URLs
          const pdfUrls = result.resources
            .filter(file => file.format === "pdf")
            .map(file => file.secure_url);
          
          console.log(pdfUrls);
      
          // Render the EJS template and pass the PDF URLs
          res.render("./listings/viewMoocsdocs.ejs", { pdfFiles: pdfUrls });
        } catch (error) {
          console.error("Error fetching PDFs:", error);
          res.status(500).send("Failed to fetch PDFs");
        }
});



//Teacher Login Authorization :

app.post("/home/teacherLogin/teacherPage", async (req, res, next) => {
  const { Username, Password } = req.body;

  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.json({ message: "All fields are required" });
    }
    const Teacher = await teacherLoginModel.findOne({ Username });

    if (!Teacher) {
      return res.json({ message: "Incorrect password or email" });
    }

    const auth = await bcrypt.compare(req.body.Password, Teacher.Password);

    if (!auth) {
      return res.json({ message: "Incorrect password or email" });
    }
    //  const token = createSecretToken(Admin._id);
    //  res.cookie("token", token, {
    //    withCredentials: true,
    //    httpOnly: false,
    //  });

  // Store teacher details in session
  req.session.teacherid = Teacher._id.toString();
  req.session.name = Teacher.name;

  console.log("Teacher Logged In:", req.session.name);
  
  res.render("./listings/teacherDashboard.ejs");
    next();
  } catch (error) {
    console.error(error);
  }
});

//adminPage add new Student

app.get("/home/adminLogin/adminPage/addNewStudent", (req, res) => {
  res.render("./listings/addNewStudent.ejs");
});

app.post("/home/adminLogin/adminPage/addNewStudent", async (req, res) => {
  let details = { ...req.body.student };
  let userPass = details.Password;

  const existingStudent = await studentLoginModel.findOne({
    univno: details.univno,
  });
  if (existingStudent) {
    return res.status(400).render("./listings/addNewStudent.ejs", {
      success: null,
      error: "Student with this university number already exists.",
    });
  }

  bcrypt.hash(userPass, 10, async function (err, hash) {
    if (err) {
      return res.render("./listings/addNewStudent.ejs", {
        success: null,
        error: "Error while hashing password.",
      });
    }
    let student = new studentLoginModel({
      name: details.name,
      fathername: details.fathername,
      mothername: details.mothername,
      univno: details.univno,
      regno: details.regno,
      course: details.course,
      department: details.department,
      Username: details.Username,
      mobilenumber: details.mobilenumber,
      gender: details.gender,
      dob: details.dob,
      yearofadmission: details.yearofadmission,
      address: details.address,
      Password: hash,
    });

    res.render("./listings/addNewStudent.ejs", {
      success: "Student added successfully!",
      error: null,
    });

    await student.save();
  });
});
//admin page add new teacher

app.get("/home/adminLogin/adminPage/addNewTeacher", (req, res) => {
  res.render("./listings/addNewTeacher.ejs");
});

app.post("/home/adminLogin/adminPage/addNewTeacher", async (req, res) => {
  let details = { ...req.body.teacher };
  let userPass = details.Password;

  const existingTeacher = await teacherLoginModel.findOne({
    teacherid: details.teacherid,
  });
  if (existingTeacher) {
    return res.status(400).render("./listings/addNewTeacher.ejs", {
      success: null,
      error: "Teacher with this teacher ID already exists.",
    });
  }

  bcrypt.hash(userPass, 10, async function (err, hash) {
    if (err) {
      return res.render("./listings/addNewTeacher.ejs", {
        success: null,
        error: "Error while hashing password.",
      });
    }
    let teacher = new teacherLoginModel({
      name: details.name,
      teacherid: details.teacherid,
      department: details.department,
      joiningdate: details.joiningdate,
      Username: details.Username,
      mobilenumber: details.mobilenumber,
      gender: details.gender,
      dob: details.dob,
      address: details.address,
      Password: hash,
    });

    await teacher.save();
    res.render("./listings/addNewTeacher.ejs", {
      success: "Teacher added successfully!",
      error: null,
    });
  });
});

//admin panel show existing students

app.get("/home/adminLogin/adminPage/showExistingStudents", async (req, res) => {
  let count = 1;

  let listOfStudents = await studentLoginModel.find({});

  res.render("./listings/showExistingStudents.ejs", { listOfStudents, count });
});

//admin panel showing existing teachers

app.get("/home/adminLogin/adminPage/showExistingTeachers", async (req, res) => {
  let count = 1;

  let listOfTeachers = await teacherLoginModel.find({});

  res.render("./listings/showExistingTeachers.ejs", { listOfTeachers, count });
});

//student view more

app.get(
  "/home/adminLogin/adminPage/showExistingStudents/:id",
  async (req, res) => {
    let { id } = req.params;

    let Student = await studentLoginModel.findById(id);

    res.render("./listings/showMoreStudent.ejs", { Student });
  }
);

//Teacher View More

app.get(
  "/home/adminLogin/adminPage/showExistingTeachers/:id",
  async (req, res) => {
    let { id } = req.params;

    let Teacher = await teacherLoginModel.findById(id);

    res.render("./listings/showMoreTeacher.ejs", { Teacher });
  }
);

//Edit Specific Student Details

app.get(
  "/home/adminLogin/adminPage/showExistingStudents/:id/edit",
  async (req, res) => {
    let { id } = req.params;

    let Student = await studentLoginModel.findById(id);

    res.render("./listings/editStudentDetails.ejs", { Student });
  }
);

app.patch(
  "/home/adminLogin/adminPage/showExistingStudents/:id",
  async (req, res) => {
    let { id } = req.params;

    // console.log({...req.body.student});

    await studentLoginModel.findByIdAndUpdate(id, { ...req.body.student });

    // console.log({...req.body.student});

    res.redirect(`/home/adminLogin/adminPage/showExistingStudents/${id}`);
  }
);

// edit Specific teacher details in DB

app.get(
  "/home/adminLogin/adminPage/showExistingTeachers/:id/edit",
  async (req, res) => {
    let { id } = req.params;

    let Teacher = await teacherLoginModel.findById(id);

    res.render("./listings/editTeacherDetails.ejs", { Teacher });
  }
);

app.patch(
  "/home/adminLogin/adminPage/showExistingTeachers/:id",
  async (req, res) => {
    let { id } = req.params;

    // console.log({...req.body.student});

    await teacherLoginModel.findByIdAndUpdate(id, { ...req.body.teacher });

    console.log({ ...req.body.teacher });

    res.redirect(`/home/adminLogin/adminPage/showExistingTeachers/${id}`);
  }
);

//delete a particular student

app.delete(
  "/home/adminLogin/adminPage/showExistingStudents/:id",
  async (req, res) => {
    let { id } = req.params;

    await studentLoginModel.findByIdAndDelete(id);

    res.redirect("/home/adminLogin/adminPage/showExistingStudents");
  }
);

//delete a particular teacher

app.delete(
  "/home/adminLogin/adminPage/showExistingTeachers/:id",
  async (req, res) => {
    let { id } = req.params;

    await teacherLoginModel.findByIdAndDelete(id);

    res.redirect("/home/adminLogin/adminPage/showExistingTeachers");
  }
);

//add data from excel student

app.get("/home/adminLogin/adminPage/addStudentDataExcel", async (req, res) => {
  res.render("./listings/addStudentDataExcel");
});

// Mentor-Mentee Mapping Dashboard

// {app.get('/home/adminLogin/adminPage/mapping', async (req, res) => {
//   try {
//       // Fetch all students and teachers
//       const students = await studentLoginModel.find({});
//       const teachers = await teacherLoginModel.find({});

//       if (!teachers.length || !students.length) {
//           return res.render('./listings/mapping.ejs', { mappings: [], message: "No teachers or students found" });
//       }

//       // Fetch existing mappings
//       let existingMappings = await mappingModel.find({})
//           .populate("teacherId", "name")
//           .populate("studentId", "univno name")
//           .lean(); // Convert to plain objects

//       // **Create a teacher-to-student count mapping**
//       let teacherStudentCount = {};
//       teachers.forEach(teacher => {
//           teacherStudentCount[teacher._id.toString()] = 0;
//       });

//       // Count existing students per teacher
//       existingMappings.forEach(mapping => {
//           teacherStudentCount[mapping.teacherId._id.toString()] = mapping.studentId.length;
//       });

//       // **Find students that are NOT yet mapped**
//       let mappedStudentIds = new Set(existingMappings.flatMap(mapping => mapping.studentId.map(student => student._id.toString())));
//       let unmappedStudents = students.filter(student => !mappedStudentIds.has(student._id.toString()));

//       console.log(`Unmapped students: ${unmappedStudents.length}`);

//       if (unmappedStudents.length > 0) {
//           console.log("Adding new students to teachers...");

//           for (let student of unmappedStudents) {
//               // **Sort teachers by the number of students assigned**
//               let sortedTeachers = teachers.sort((a, b) => teacherStudentCount[a._id.toString()] - teacherStudentCount[b._id.toString()]);

//               // Find all teachers with the **minimum** student count
//               let minCount = teacherStudentCount[sortedTeachers[0]._id.toString()];
//               let eligibleTeachers = sortedTeachers.filter(teacher => teacherStudentCount[teacher._id.toString()] === minCount);

//               // **Randomly assign from eligible teachers**
//               let assignedTeacher = eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];

//               // **Update existing mapping or create a new one**
//               let teacherMapping = existingMappings.find(mapping => mapping.teacherId._id.toString() === assignedTeacher._id.toString());

//               if (teacherMapping) {
//                   teacherMapping.studentId.push(student);
//                   await mappingModel.updateOne(
//                       { teacherId: assignedTeacher._id },
//                       { $push: { studentId: student._id } }
//                   );
//               } else {
//                   const newMapping = new mappingModel({
//                       teacherId: assignedTeacher._id,
//                       studentId: [student._id],
//                   });
//                   await newMapping.save();
//                   existingMappings.push(newMapping);
//               }

//               // **Update teacher's student count**
//               teacherStudentCount[assignedTeacher._id.toString()]++;
//               console.log(`✅ Assigned ${student.name} to ${assignedTeacher.name}`);
//           }
//       }

//       // Fetch updated mappings from DB
//       const updatedMappings = await mappingModel.find({})
//           .populate("teacherId", "name")
//           .populate("studentId", "univno name");

//       return res.render('./listings/mapping.ejs', { mappings: updatedMappings, message: "" });

//   } catch (error) {
//       console.error("Error mapping students to teachers:", error);
//       return res.status(500).render('./listings/mapping.ejs', { mappings: [], message: "Internal Server Error" });
//   }
// });
// }

// 🚀 Modernized Mapping Dashboard (Express Route)
// {
// app.get('/home/adminLogin/adminPage/mapping', async (req, res) => {
//   try {
//     const students = await studentLoginModel.find({});
//     const teachers = await teacherLoginModel.find({});
//     if (!teachers.length || !students.length) {
//       return res.render('./listings/mapping.ejs', { mappings: [], message: "No teachers or students found", leftoverStudents: [] });
//     }

//     let existingMappings = await mappingModel.find({})
//       .populate("teacherId", "name")
//       .populate("studentId", "univno name")
//       .lean();

//     // Track teacher capacity
//     let teacherStudentCount = {}, teacherMaxSlots = {};
//     teachers.forEach(teacher => {
//       teacherStudentCount[teacher._id.toString()] = 0;
//     });
//     existingMappings.forEach(mapping => {
//       const tid = mapping.teacherId._id.toString();
//       teacherStudentCount[tid] = mapping.studentId.length;
//       teacherMaxSlots[tid] = mapping.maxStudents || 5;
//     });

//     // Find unmapped students
//     let mappedStudentIds = new Set(existingMappings.flatMap(mapping => mapping.studentId.map(student => student._id.toString())));
//     let unmappedStudents = students.filter(student => !mappedStudentIds.has(student._id.toString()));

//     // Assign remaining students using admin-defined ratios
//     for (let student of unmappedStudents) {
//       let sortedTeachers = teachers.sort((a, b) => teacherStudentCount[a._id.toString()] - teacherStudentCount[b._id.toString()]);
//       let eligibleTeachers = sortedTeachers.filter(t => teacherStudentCount[t._id.toString()] < (teacherMaxSlots[t._id.toString()] || 5));

//       if (eligibleTeachers.length === 0) continue; // No teacher has space
//       let assignedTeacher = eligibleTeachers[0];

//       let mappingDoc = await mappingModel.findOne({ teacherId: assignedTeacher._id });
//       if (mappingDoc) {
//         await mappingModel.updateOne({ teacherId: assignedTeacher._id }, { $push: { studentId: student._id } });
//       } else {
//         await new mappingModel({ teacherId: assignedTeacher._id, studentId: [student._id] }).save();
//       }
//       teacherStudentCount[assignedTeacher._id.toString()]++;
//     }

//     const updatedMappings = await mappingModel.find({})
//       .populate("teacherId", "name")
//       .populate("studentId", "univno name")
//       .lean();

//     return res.render('./listings/mapping.ejs', {
//       mappings: updatedMappings,
//       message: "",
//       leftoverStudents: unmappedStudents
//     });
//   } catch (error) {
//     console.error("Error in Mapping:", error);
//     return res.status(500).render('./listings/mapping.ejs', { mappings: [], message: "Internal Server Error", leftoverStudents: [] });
//   }
// });

// // 🧩 Add Student to Teacher
// app.post('/mapping/add-student', async (req, res) => {
//   const { studentId, teacherId } = req.body;
//   const mapping = await mappingModel.findOne({ teacherId });
//   if (!mapping) {
//     await new mappingModel({ teacherId, studentId: [studentId] }).save();
//   } else {
//     await mappingModel.updateOne({ teacherId }, { $addToSet: { studentId } });
//   }
//   return res.redirect('/home/adminLogin/adminPage/mapping');
// });

// // ❌ Remove Student from Teacher
// app.post('/mapping/remove-student', async (req, res) => {
//   const { studentId, teacherId } = req.body;
//   await mappingModel.updateOne({ teacherId }, { $pull: { studentId } });
//   return res.redirect('/home/adminLogin/adminPage/mapping');
// });

// // 🗑️ Delete Teacher and list affected students
// app.post('/mapping/delete-teacher', async (req, res) => {
//   const { teacherId } = req.body;
//   const mapping = await mappingModel.findOneAndDelete({ teacherId }).populate('studentId', 'name univno');
//   const affectedStudents = mapping?.studentId || [];
//   // Optionally reassign students or list for reassignment
//   res.render('./listings/reassign.ejs', { affectedStudents, oldTeacherId: teacherId });
// });

// // ⚙️ Update Max Students per Teacher
// app.post('/mapping/update-max', async (req, res) => {
//   const { teacherId, maxStudents } = req.body;
//   await mappingModel.updateOne({ teacherId }, { $set: { maxStudents } });
//   return res.redirect('/home/adminLogin/adminPage/mapping');
// });
// }

// View mappings
app.get('/home/adminLogin/adminPage/mapping', async (req, res) => {
  try {
    const students = await studentLoginModel.find({});
    const teachers = await teacherLoginModel.find({});

    if (!teachers.length || !students.length) {
      return res.render('./listings/mapping.ejs', { mappings: [], message: "No teachers or students found", leftoverStudents: [] });
    }

    // Get deletion history of teachers and students first
    const mappingsWithDeletion = await mappingModel.find({ 'deletionHistory.type': { $in: ['teacher', 'student'] } }).lean();

    // Extract deleted teacher and student IDs from all deletionHistory arrays
    const deletedTeacherIds = new Set(
      mappingsWithDeletion.flatMap(mapping =>
        (mapping.deletionHistory || [])
          .filter(h => h.type === 'teacher' && h.teacherId)
          .map(h => h.teacherId.toString())
      )
    );
  
    console.log("deleted teachers: " ,deletedTeacherIds);
    const deletedStudentIds = new Set(
      mappingsWithDeletion.flatMap(mapping =>
        (mapping.deletionHistory || [])
          .filter(h => h.type === 'student' && h.studentId)
          .map(h => h.studentId.toString())
      )
    );

    // Fetch all existing mappings with populated fields
    let existingMappings = await mappingModel.find({})
      .populate("teacherId", "name")
      .populate("studentId", "univno name")
      .lean();

    // Filter mappings to exclude those with deleted teachers or deleted students
    existingMappings = existingMappings.filter(mapping => {
      const teacherIdStr = mapping.teacherId?._id?.toString();
      if (!teacherIdStr || deletedTeacherIds.has(teacherIdStr)) return false;

      // If any student in this mapping is deleted, exclude the entire mapping
      if (mapping.studentId.some(student => deletedStudentIds.has(student._id.toString()))) return false;

      return true;
    });

    // Filter out students under deleted teachers based on deletion history inside each mapping
    const deletedStudentsUnderDeletedTeachers = new Set(
      mappingsWithDeletion.flatMap(mapping =>
        (mapping.deletionHistory || [])
          .filter(h => h.type === 'teacher' && deletedTeacherIds.has(h.teacherId?.toString()) && h.studentId)
          .map(h => h.studentId.toString())
      )
    );

    // Filter active teachers and students by excluding deleted ones

    // Fetch all mappings with isDeleted = true
const inactiveMappings = await mappingModel.find({ isDeleted: true }).lean();

// Extract teacher IDs from inactive mappings
const inactiveTeacherIds = new Set(inactiveMappings.map(m => m.teacherId?.toString()));

    const activeTeachers = teachers.filter(t => 
  !deletedTeacherIds.has(t._id.toString()) &&
  !inactiveTeacherIds.has(t._id.toString())
);

    const activeStudents = students.filter(s =>
      !deletedStudentIds.has(s._id.toString()) &&
      !deletedStudentsUnderDeletedTeachers.has(s._id.toString())
    );

    // Initialize counts and max slots
    const teacherStudentCount = {};
    const teacherMaxSlots = {};

    activeTeachers.forEach(teacher => {
      teacherStudentCount[teacher._id.toString()] = 0;
    });

    existingMappings.forEach(mapping => {
      const tid = mapping.teacherId._id.toString();
      teacherStudentCount[tid] = mapping.studentId.length;
      // Use mapping.maxStudents if set, else fallback to default
      teacherMaxSlots[tid] = mapping.maxStudents || Math.ceil(activeStudents.length / activeTeachers.length);
    });

    // Determine students already mapped
    const mappedStudentIds = new Set(existingMappings.flatMap(mapping => mapping.studentId.map(s => s._id.toString())));
    console.log(mappedStudentIds);

    const mappedStudentNames = existingMappings.flatMap(mapping =>
  (mapping.studentId || []).map(s => s.univno)
);

console.log("Mapped Student Names:", mappedStudentNames);


   console.log("Mapped Student IDs:", mappedStudentIds.forEach(s=> s.name));
console.log("All Students:", students.map(s => s._id.toString()));
 

const allUnmappedStudents = students.filter(s => !mappedStudentIds.has(s._id.toString()));

// Mark leftover as those unmapped, including students in deletion history
const leftoverStudents = allUnmappedStudents;

// Mark assignable only from active students
const assignableUnmappedStudents = activeStudents.filter(s => !mappedStudentIds.has(s._id.toString()));

// If no existing mappings, perform auto-assignment
if (existingMappings.length === 0 && activeTeachers.length > 0 && assignableUnmappedStudents.length > 0) {
  const studentsPerTeacher = Math.floor(assignableUnmappedStudents.length / activeTeachers.length);
  const leftover = assignableUnmappedStudents.length % activeTeachers.length;

  let studentIndex = 0;

  for (let i = 0; i < activeTeachers.length; i++) {
    const teacher = activeTeachers[i];
    const count = studentsPerTeacher + (i < leftover ? 1 : 0);

    const assignedStudents = assignableUnmappedStudents.slice(studentIndex, studentIndex + count);
    studentIndex += count;

    await new mappingModel({
      teacherId: teacher._id,
      studentId: assignedStudents.map(s => s._id),
      maxStudents: count
    }).save();
  }
}


// Fetch updated mappings after assignment (if any)
const updatedMappings = await mappingModel.find({isDeleted: { $ne: true }})
  .populate("teacherId", "name")
  .populate("studentId", "univno name")
  .lean();

// Final render
return res.render('./listings/mapping.ejs', {
  mappings: updatedMappings,
  message: "",
  leftoverStudents: leftoverStudents
});


  } catch (error) {
    console.error("Error in Mapping:", error);
    return res.status(500).render('./listings/mapping.ejs', { mappings: [], message: "Internal Server Error", leftoverStudents: [] });
  }
});

// Add Student
app.post('/mapping/add-student', async (req, res) => {
  const { studentId, teacherId } = req.body;

  try {
    // 1. Get the mapping of the selected teacher
    let mapping = await mappingModel.findOne({ teacherId });

    // 2. Check if teacher has reached max capacity (default to 5 if not explicitly stored)
    const MAX_STUDENTS = mapping?.maxStudents;
    const currentCount = mapping?.studentId?.length || 0;

    if (currentCount >= MAX_STUDENTS) {
      return res.status(400).send("This teacher already has the maximum number of students.");
    }

    // 3. Remove student from any previous teacher mapping
    await mappingModel.updateMany(
      { studentId: studentId },
      { $pull: { studentId: studentId } }
    );

    // 4. Add student to new teacher mapping
    if (!mapping) {
      await new mappingModel({ teacherId, studentId: [studentId] }).save();
    } else {
      await mappingModel.updateOne({ teacherId }, { $addToSet: { studentId } });
    }

    
    // 5. Remove student from deletionHistory (any record where type = 'student' and studentId matches)
    await mappingModel.updateMany(
      { 'deletionHistory.studentId': studentId },
      { $pull: { deletionHistory: { studentId: studentId, type: 'student' } } }
    );
      await mappingModel.updateMany(
      { 'deletionHistory.studentId': studentId },
      { $pull: { deletionHistory: { studentId: studentId, type: 'teacher' } } }
    );

    return res.redirect('/home/adminLogin/adminPage/mapping');
  } catch (err) {
    console.error("Error in reassigning student:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Update Max Students
app.post('/mapping/update-max', async (req, res) => {
  const { teacherId, maxStudents } = req.body;

  try {
    const parsedMax = parseInt(maxStudents);
    if (isNaN(parsedMax) || parsedMax <= 0) {
      return res.status(400).send("Invalid maxStudents value.");
    }

    const mapping = await mappingModel.findOne({ teacherId }).populate("studentId");
    if (!mapping) {
      return res.status(404).send("Mapping not found.");
    }

    if (mapping.studentId.length > parsedMax) {
      return res.status(400).send(`Cannot set maxStudents to ${parsedMax}. Currently assigned students: ${mapping.studentId.length}`);
    }

    await mappingModel.updateOne({ teacherId }, { $set: { maxStudents: parsedMax } });
    return res.redirect('/home/adminLogin/adminPage/mapping');

  } catch (err) {
    console.error("Error updating maxStudents:", err);
    return res.status(500).send("Internal server error.");
  }
});


// Remove Student
app.post('/mapping/remove-student', async (req, res) => {
  const { studentId, teacherId } = req.body;

  try {
    const student = await studentLoginModel.findById(studentId);
    const teacher = await teacherLoginModel.findById(teacherId);
    const mapping = await mappingModel.findOne({ teacherId });

    if (!mapping) {
      return res.status(404).send("Mapping not found for this teacher.");
    }

    // Remove student from the mapping
    await mappingModel.updateOne({ teacherId }, { $pull: { studentId: studentId } });

    // Add to deletion history for the teacher
    await mappingModel.updateOne({ teacherId }, {
      $push: {
        deletionHistory: {
          type: "student",
          studentId: studentId,
          studentName: student.name,
          studentUnivNo: student.univno,
          previousTeacherId: teacherId,
          previousTeacherName: teacher.name,
          deletedAt: new Date()
        }
      }
    });

    return res.redirect('/home/adminLogin/adminPage/mapping');
  } catch (err) {
    console.error("Error removing student:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Delete Teacher
app.post('/mapping/delete-teacher', async (req, res) => {
  const { teacherId } = req.body;

  try {
    // Step 1: Find mapping and teacher
    const mapping = await mappingModel.findOne({ teacherId }).populate('studentId', 'name univno');
    const teacher = await teacherLoginModel.findById(teacherId);
    

    if (!mapping || !teacher) {
      return res.status(404).send("Teacher or mapping not found.");
    }

    // Step 2: Push teacher deletion history
    mapping.deletionHistory.push({
      type: "teacher",
      teacherId:teacherId,
      teacherName: teacher.name,
      deletedAt: new Date()
    });

    mapping.studentId.forEach(student => {
      mapping.deletionHistory.push({
        type: "teacher",
        studentId: student._id,
        teacherName:teacher.name,
        studentName: student.name,
        studentUnivNo: student.univno,
        previousTeacherName: teacher.name,
        previousTeacherId: teacherId,
        deletedAt: new Date(),
      });
    })

    mapping.studentId = [];
    console.log(typeof(mapping.teacherId), mapping.teacherId) // optional: clear students
    mapping.isDeleted = true; // optional: soft delete


    await mapping.save(); // Save deletion history
    //await mappingModel.deleteOne({ teacherId }); // Delete the mapping document

    // Step 3: Get all affected students (students who had this teacher)
    // const affectedStudents = mapping.studentId.map(student => ({
    //   studentId: student._id,
    //   studentName: student.name,
    //   studentUnivNo: student.univno
    // }));

    // Step 4: Return to the history page for reassignment
    return res.redirect('/home/adminLogin/adminPage/mapping');
  } catch (err) {
    console.error("Error deleting teacher mapping:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.get('/mapping/history', async (req, res) => {
  try {
    // Fetch all mappings with embedded deletionHistory
    const mappings = await mappingModel.find({}).lean();

    // Collect all deletion history entries from all mappings
    let allDeletionHistory = [];

    mappings.forEach(mapping => {
      if (Array.isArray(mapping.deletionHistory)) {
        mapping.deletionHistory.forEach(history => {
          // Attach some mapping info to each deletion record for display
          allDeletionHistory.push({
            ...history
          });
        });
      }
    });

    // Sort by deletedAt descending (latest first)
    allDeletionHistory.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    // Render EJS page and send deletion history data
    console.log(allDeletionHistory);
    res.render('./listings/history.ejs', { history: allDeletionHistory });
  } catch (error) {
    console.error('Error fetching deletion history:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete all mapping documents
app.post('/mapping/delete-all', async (req, res) => {
  try {
    await mappingModel.deleteMany({});
    return res.render('/home/adminLogin/adminPage/mapping');
  } catch (err) {
    console.error("Error deleting all mapping documents:", err);
    return res.status(500).send("Internal Server Error");
  }
});



app.get("/home/teacherLogin/teacherPage/studentlist", async (req, res) => {
  
  if (!req.session.teacherid) {
        console.log("Session Missing, Redirecting to Login...");
        return res.redirect("/home/teacherLogin"); // Redirect if not logged in
    }
    try {
      const teacherId = req.session.teacherid;
      const teacherName = req.session.name;

      console.log("Fetching Students for Teacher ID:", teacherId); // Debugging

       
      // Fetch mappings for this teacher
      const mapping = await mappingModel.findOne({ teacherId }).populate("studentId");

      if (!mapping || mapping.studentId.length === 0) {
          return res.render("./listings/studentlist.ejs", { students: [], teacherName, message: "No students assigned" });
      }

      res.render("./listings/studentlist.ejs", { students: mapping.studentId, teacherName, message: "" });

  } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).send("Internal Server Error");
  }


});

app.post("/home/teacherLogin/teacherPage/studentlist/setStudentMar", (req, res) => {
  req.session.studentId = req.body.studentId;
  res.redirect("/home/teacherLogin/teacherPage/studentlist/viewMarTeach");
});

const dynamicMarFields = [];
const dynamicMoocsFields=[];
let studentId;
let teacherName;

app.get("/home/teacherLogin/teacherPage/studentlist/viewMarTeach", ensureAuth, async (req, res) => {
  try {
      studentId = req.session.studentId;
      teacherName=req.session.name;
      const student = await studentLoginModel.findById(studentId);
      const folderPath = `students/${studentId}/MAR_docs`; 

      const result = await cloudinary.api.resources({
          type: "upload",
          prefix: folderPath,
          resource_type: "image", // PDFs are stored as raw files
      });

      const pdfUrls = result.resources
          .filter(file => file.format === "pdf")
          .map(file => file.secure_url);

          pdfUrls.forEach((_, index) => {
            dynamicMarFields.push({ name: `field${index + 1}` });
          });
          
          console.log(dynamicMarFields);
          
          const updatedCreditMar = await creditsMarModel.findOne({ studentId: studentId });
          console.log(updatedCreditMar);
          console.log(updatedCreditMar?.marPoints || []);
          

      res.render("./listings/viewMarTeach.ejs", {
          studentName: student.name,
          marPoints:(updatedCreditMar?.marPoints || []),
          pdfFiles: pdfUrls
      });
  } catch (error) {
      console.error("Error fetching MAR PDFs:", error);
      res.status(500).send("Failed to fetch MAR documents");
  }
});

app.post("/home/teacherLogin/teacherPage/studentlist/setStudentMoocs", (req, res) => {
  req.session.studentId = req.body.studentId;
  res.redirect("/home/teacherLogin/teacherPage/studentlist/viewMoocsTeach");
});

app.get("/home/teacherLogin/teacherPage/studentlist/viewMoocsTeach", ensureAuth, async (req, res) => {
  try {
      studentId = req.session.studentId;
      const student = await studentLoginModel.findById(studentId);
      const folderPath = `students/${studentId}/MOOCs_docs`; 

      const result = await cloudinary.api.resources({
          type: "upload",
          prefix: folderPath,
          resource_type: "image", // PDFs are stored as raw files
      });

      const pdfUrls = result.resources
          .filter(file => file.format === "pdf")
          .map(file => file.secure_url);

          pdfUrls.forEach((_, index) => {
            dynamicMoocsFields.push({ name: `field${index + 1}` });
          });
          
          console.log(dynamicMoocsFields);

          const updatedCreditMoocs = await creditsMoocsModel.findOne({ studentId: studentId });
          console.log(updatedCreditMoocs);
          console.log(updatedCreditMoocs?.moocsPoints || []);
          

      res.render("./listings/viewMoocsTeach.ejs", {
          studentName: student.name,
          moocsPoints:(updatedCreditMoocs?.moocsPoints || []),
          pdfFiles: pdfUrls
      });
  } catch (error) {
      console.error("Error fetching MOOCs PDFs:", error);
      res.status(500).send("Failed to fetch MOOCs documents");
  }
});


// MAR Credits Assignment


// const dynamicFields = [
//   { name: 'field1' },
//   { name: 'field2' },
//   { name: 'field3' },
// ];

// Home route to display the dynamic form
app.get('/home/teacherLogin/teacherPage/studentlist/viewMarTeach', (req, res) => {

  
  res.render('./listings/viewMarTeach.ejs', { fields: dynamicFields });
});

// Post route to handle form submission
app.post('/home/teacherLogin/teacherPage/studentlist/viewMarTeach/submit', ensureAuth, async (req, res) => {
  try {
     studentId = req.session.studentId;
    const student = await studentLoginModel.findById(studentId);

    if (!student) {
      return res.status(404).send("Student not found");
    }

    // const fields = req.body.fields; // Convert input to numbers

    // fields.forEach((index)=> {
    //   if(fields[index]=== undefined || fields[index]== "" || isNaN(fields[index]))
    //   {
    //     fields[index]=-1;
    //   }

    //   else 
    //   {
    //     fields[index]=Number(fields[index]);
    //   }
    // });

    const fields = req.body.fields; // Expecting an object like {0: "5", 1: "", 2: "3"}

Object.keys(fields).forEach((index) => {
    if (fields[index] === undefined || fields[index] === "" || isNaN(fields[index])) {
        fields[index] = -1;  // Assign -1 if empty or invalid
    } else {
        fields[index] = Number(fields[index]);  // Convert to number
    }
});

    console.log(fields);

    // Update if exists, otherwise create new entry
    const updatedStudent = await creditsMarModel.findOneAndUpdate(
      { studentId: studentId },  // Find by studentId
      { 
        studentName: student.name,
        teacherName: req.session.name,
        marPoints: fields 
      },
      { new: true, upsert: true } // Return updated document & create if not found
    );

    
    res.send(`MAR points for ${student.name} submitted successfully!`);
  } catch (err) {
    console.error("Error updating MAR points:", err);
    res.status(500).send("Error updating MAR points");
  }
});





// MOOCs Credits Assignment

// Home route to display the dynamic form
app.get('/home/teacherLogin/teacherPage/studentlist/viewMoocsTeach', (req, res) => {

  
  res.render('./listings/viewMarTeach.ejs', { fields: dynamicMoocsFields });
});

// Post route to handle form submission
app.post('/home/teacherLogin/teacherPage/studentlist/viewMoocsTeach/submit', ensureAuth, async (req, res) => {
  try {
     studentId = req.session.studentId;
    const student = await studentLoginModel.findById(studentId);

    if (!student) {
      return res.status(404).send("Student not found");
    }

    // const fields = req.body.fields; // Convert input to numbers

    const fields = req.body.fields; // Expecting an object like {0: "5", 1: "", 2: "3"}

Object.keys(fields).forEach((index) => {
    if (fields[index] === undefined || fields[index] === "" || isNaN(fields[index])) {
        fields[index] = -1;  // Assign -1 if empty or invalid
    } else {
        fields[index] = Number(fields[index]);  // Convert to number
    }
});

    console.log(fields);



    // Update if exists, otherwise create new entry
    const updatedStudent = await creditsMoocsModel.findOneAndUpdate(
      { studentId: studentId },  // Find by studentId
      { 
        studentName: student.name,
        teacherName: req.session.name,
        moocsPoints: fields 
      },
      { new: true, upsert: true } // Return updated document & create if not found
    );

    
    res.send(`MOOCs points for ${student.name} submitted successfully!`);
  } catch (err) {
    console.error("Error updating MOOCs points:", err);
    res.status(500).send("Error updating MOOCs points");
  }
});


// Mar Doc Report

app.get("/home/teacherLogin/teacherPage/totalMarDoc",async (req, res) => {
  try {
    

    let count = 1;

    // Fetch students associated with the logged-in teacher
    let listOfStudents = await creditsMarModel.find({ teacherName: req.session.name });

   

    // Render the EJS template with teacher details
    res.render("./listings/totalMarDoc.ejs", { listOfStudents, count });

  } catch (err) {
    console.error("Error fetching teacher details:", err);
    res.status(500).send("Internal Server Error");
  }
});

// MOOCs Doc Report

app.get("/home/teacherLogin/teacherPage/totalMoocsDoc",async (req, res) => {
  try {
    

    let count = 1;

    // Fetch students associated with the logged-in teacher
    let listOfStudents = await creditsMoocsModel.find({ teacherName: req.session.name });

   

    // Render the EJS template with teacher details
    res.render("./listings/totalMoocsDoc.ejs", { listOfStudents, count });

  } catch (err) {
    console.error("Error fetching teacher details:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/home/studentLogin/studentPage/studentProgressReport", ensureAuth,async(req,res)=>{
  try {
        studentId = req.session.studentId;
        const student = await studentLoginModel.findById(studentId);
        const folderMoocsPath = `students/${studentId}/MOOCs_docs`;
        const folderMarPath = `students/${studentId}/MAR_docs`;
  
        const resultMar = await cloudinary.api.resources({
            type: "upload",
            prefix: folderMarPath,
            resource_type: "image", // PDFs are stored as raw files
        });
  
        const pdfMarUrls = resultMar.resources
            .filter(file => file.format === "pdf")
            .map(file => file.secure_url);
  
            
        const resultMoocs = await cloudinary.api.resources({
          type: "upload",
          prefix: folderMoocsPath,
          resource_type: "image", // PDFs are stored as raw files
      });

      const pdfMoocsUrls = resultMoocs.resources
          .filter(file => file.format === "pdf")
          .map(file => file.secure_url);


            const updatedCreditMoocs = await creditsMoocsModel.findOne({ studentId: studentId });
            console.log(updatedCreditMoocs);
            console.log(updatedCreditMoocs?.moocsPoints || []);

            const updatedCreditMar = await creditsMarModel.findOne({ studentId: studentId });
            console.log(updatedCreditMar);
            console.log(updatedCreditMar?.marPoints || []);
            
  
        res.render("./listings/studentProgressReport.ejs", {
            studentName: student.name,
            moocsPoints:(updatedCreditMoocs?.moocsPoints || []),
            pdfMarFiles: pdfMarUrls,
            pdfMoocsFiles: pdfMoocsUrls,
            marPoints:(updatedCreditMar?.marPoints || []),

        });
    } catch (error) {
        console.error("Error fetching PDFs:", error);
        res.status(500).send("Failed to fetch documents");
    }
  

});


//Adding actual data in mongodb (Excel)

var excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/excelUploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
var excelUploads = multer({ storage: excelStorage });
app.get("/", (req, res) => {
  res.render("./listings/addNewStudent.ejs");
}); 

app.post("/uploadExcelFile", excelUploads.single("uploadfile"), (req, res) => {
  importFile("./public/excelUploads/" + req.file.filename)
    .then(() => {
      res.status(200).json({ message: "Data successfully saved to the database." });
    })
    .catch((err) => {
      console.error("Error processing file:", err.message);
      res.status(500).json({ message: "Failed to save data to the database." });
    });

  async function importFile(filePath) {
    try {
      const source = await csvtojson().fromFile(filePath);
      const arrayToInsert = source.map((row, index) => {
        try {
          return {
            name: row["name"] || "",
            fathername: row["fathername"] || "",
            mothername: row["mothername"] || "",
            univno: parseInt(row["univno"]) || null,
            regno: parseInt(row["regno"]) || null,
            course: row["course"] || "",
            department: row["department"] || "",
            Username: row["Username"] || "",
            mobilenumber: parseInt(row["mobilenumber"]) || null,
            gender: row["gender"] || "",
            dob: new Date(row["dob"]),
            yearofadmission: parseInt(row["yearofadmission"]) || null,
            address: row["address"] || "",
            Password: row["Password"] || "",
          };
        } catch (err) {
          console.error(`Error parsing row ${index + 1}: ${err.message}`);
          return null;
        }
      });

      const validData = arrayToInsert.filter((item) => item);

      if (validData.length === 0) {
        throw new Error("No valid data to insert.");
      }

      await studentLoginModel.insertMany(validData);
      console.log("Successfully saved data to DB");
    } catch (err) {
      throw err;
    }
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});