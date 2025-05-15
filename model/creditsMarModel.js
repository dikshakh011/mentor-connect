const {model} = require("mongoose");

const {creditsMarSchema} = require("../schema/creditsMarSchema");

const creditsMarModel = new model("creditMar",creditsMarSchema);

module.exports = {creditsMarModel};