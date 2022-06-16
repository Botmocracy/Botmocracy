"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var accountSchema = new mongoose_1.Schema({
    discordId: String,
    minecraftUUID: String,
    lastKnownUsername: { type: String, required: false } // might be used in the future
});
exports["default"] = (0, mongoose_1.model)("Account", accountSchema);
