const {model} = require("mongoose");

const {mappingSchema} = require("../schema/mappingSchema");

const mappingModel = new model("mapping",mappingSchema);

module.exports = {mappingModel};