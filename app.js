const express = require("express");

const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const { adminModel } = require("./model/adminModel");
const { studentLoginModel } = require("./model/studentLoginModel");
const { teacherLoginModel } = require("./model/teacherLoginModel");
const bcrypt = require("bcrypt");

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

//checking connection

//admin Schema

// let myPass = "Admin1@1233";
// // let hashPass = await bcrypt.hash(myPass,10);
// // console.log(hashPass);

// bcrypt.hash(myPass, 10, function(err, hash) {

//   let  sampleAdmin = new adminModel (({
//     Username: "admin1@gmail.com",
//     Password : hash,

// }));

//     sampleAdmin.save().then((res)=>{
//     console.log("Data Saved");
// });

// });

// adminModel.findOne({Username:"admin1@gmail.com"}).then((res)=>{
//   console.log(res);
// });

//student Schema

// let myPass = "user1@1233";

// bcrypt.hash(myPass, 10, function(err, hash) {

//   let  sampleUser = new studentLoginModel (({
//     Username: "user1@gmail.com",
//     Password : hash,

// }));

//     sampleUser.save().then((res)=>{
//     console.log("Data Saved");
// });

// });

// teacher Schema

// let myPass = "teacher1@1233";

// bcrypt.hash(myPass, 10, function(err, hash) {

//   let  sampleUser = new teacherLoginModel (({
//     Username: "teacher1@gmail.com",
//     Password : hash,

// }));

//     sampleUser.save().then((res)=>{
//     console.log("Data Saved");
// });

// });

app.listen(8080, () => {
  console.log("App is Listening on Port 8080");

  mongoose.connect(url);
  console.log("DB Connected");
});

app.get("/", (req, res) => {
  res.send("working");
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
  const { Username, Password } = req.body;

  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.json({ message: "All fields are required" });
    }
    const Student = await studentLoginModel.findOne({ Username });

    if (!Student) {
      return res.json({ message: "Incorrect password or email" });
    }

    const auth = await bcrypt.compare(req.body.Password, Student.Password);

    if (!auth) {
      return res.json({ message: "Incorrect password or email" });
    }
    //  const token = createSecretToken(Admin._id);
    //  res.cookie("token", token, {
    //    withCredentials: true,
    //    httpOnly: false,
    //  });
    res.render("./listings/studentDashboard.ejs");
    next();
  } catch (error) {
    console.error(error);
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
    res
      .status(201)
      .json({ message: "Teacher logged in successfully", success: true });
    next();
  } catch (error) {
    console.error(error);
  }
});

//adminPage add new Student

app.get("/home/adminLogin/adminPage/addNewStudent", (req, res) => {
  res.render("./listings/addNewStudent.ejs");
});

app.post("/home/adminLogin/adminPage/addNewStudent", (req, res) => {
  let details = { ...req.body.student };

  let userPass = details.Password;

  bcrypt.hash(userPass, 10, async function (err, hash) {
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

    await student.save();
  });

});

//admin page add new teacher

app.get("/home/adminLogin/adminPage/addNewTeacher", (req, res) => {
  res.render("./listings/addNewTeacher.ejs");
});

app.post("/home/adminLogin/adminPage/addNewTeacher", (req, res) => {
  let details = { ...req.body.teacher };

  let userPass = details.Password;

  bcrypt.hash(userPass, 10, async function (err, hash) {
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
  });


  
});
