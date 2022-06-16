"use strict";
exports.__esModule = true;
var colors = require("colors");
var Logger = /** @class */ (function () {
    function Logger(name) {
        this.name = name;
    }
    // # means private method
    Logger.prototype.constructLogMessage = function (level, messages) {
        return "".concat(new Date().toUTCString(), " ").concat(level, ": [").concat(this.name, "] ").concat(messages.join(" "));
    };
    Logger.prototype.info = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        console.log(colors.green(this.constructLogMessage("INFO", messages)));
    };
    Logger.prototype.warn = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        console.warn(colors.yellow(this.constructLogMessage("WARN", messages)));
    };
    Logger.prototype.error = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        console.error(colors.red(this.constructLogMessage("ERROR", messages)));
    };
    return Logger;
}());
exports["default"] = Logger;
