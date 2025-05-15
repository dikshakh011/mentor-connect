const {model} = require("mongoose");

const {creditsMoocsSchema} = require("../schema/creditsMoocsSchema");

const creditsMoocsModel = new model("creditMoocs",creditsMoocsSchema);

module.exports = {creditsMoocsModel};