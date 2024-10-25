const {Schema} = require("mongoose");

const teacherLoginSchema = new Schema({
    Username: {
       type: String,
       required: true,
    },
    
    Password :{
        type : String,
        required :true,
        

    } 
});


module.exports ={teacherLoginSchema};