const mongoose = require("mongoose");

const creditsMoocsSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "student", required: true, unique:true },
          
      studentName:{
          type:String,
          required:true, 
      },
  
      teacherName:{
          type:String,
          required:true, 
      },
  
  
      moocsPoints: { 
          type: [Number], 
          default: [] 
      }, // Array of numbers
      
});


module.exports ={creditsMoocsSchema};