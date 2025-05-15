const mongoose = require("mongoose");

const creditsMarSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "student", required: true, unique:true },
        
    studentName:{
        type:String,
        required:true, 
    },

    teacherName:{
        type:String,
        required:true, 
    },


    marPoints: { 
        type: [Number], 
        default:[]
    }, // Array of numbers
    
});


module.exports ={creditsMarSchema};


