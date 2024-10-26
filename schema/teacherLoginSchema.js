const {Schema} = require("mongoose");

const teacherLoginSchema = new Schema({
    name: {
        type: String,
        required: true,
      },
      teacherid: {
        type: String,
        required: true,
      },
      department: {
        type: String,
        required: true,
      },
      joiningdate: {
        type: Date,
        required: true,
      },
      
      Username: {
        type: String,
        required: true,
      },
      mobilenumber: {
        type: Number,
        required: true,
      },
      gender: {
        type: String,
        required: true,
      },
      dob: {
        type: Date,
        required: true,
      },
    
      address: {
        type: String,
        required: true,
      },
      Password: {
        type: String,
        required: true,
      },
});


module.exports ={teacherLoginSchema};