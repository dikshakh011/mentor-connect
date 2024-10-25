const {Schema} = require("mongoose");

const adminSchema = new Schema({
    Username: {
       type: String,
       required: true,
    },
    
    Password :{
        type : String,
        required :true,
        

    } 
});


module.exports ={adminSchema};