const {model} = require("mongoose");

const {teacherLoginSchema} = require("../schema/teacherLoginSchema");

const teacherLoginModel = new model("teacher",teacherLoginSchema);

module.exports = {teacherLoginModel};