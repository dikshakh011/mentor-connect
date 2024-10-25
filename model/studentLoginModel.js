const {model} = require("mongoose");

const {studentLoginSchema} = require("../schema/studentLoginSchema");

const studentLoginModel = new model("student",studentLoginSchema);

module.exports = {studentLoginModel};




