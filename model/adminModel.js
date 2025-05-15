const {model} = require("mongoose");

const {adminSchema} = require("../schema/adminSchema");

const adminModel = new model("admin",adminSchema);

module.exports = {adminModel};




