const {Schema} = require("mongoose");

const studentLoginSchema = new Schema({
    Username: {
       type: String,
       required: true,
    },
    
    Password :{
        type : String,
        required :true,
        

    } 
});


module.exports ={studentLoginSchema};