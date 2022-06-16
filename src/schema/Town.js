"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var townSchema = new mongoose_1.Schema({
    name: String,
    mayor: String,
    depMayor: { type: String, required: false, "default": "None" },
    coords: String,
    rank: { type: String, required: false, "default": "Unranked" }
});
exports["default"] = (0, mongoose_1.model)("Town", townSchema);
