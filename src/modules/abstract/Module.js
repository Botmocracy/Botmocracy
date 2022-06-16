"use strict";
exports.__esModule = true;
var Logger_1 = require("../../util/Logger");
var Module = /** @class */ (function () {
    function Module() {
        this.name = "";
        this.logger = new Logger_1["default"]("");
        this.client = null; // |null is required bcs of typescript
        this.slashCommands = {};
    }
    Module.prototype.initialise = function (client) {
        var _this = this;
        this.client = client;
        this.logger = new Logger_1["default"](this.name);
        this.client.on("messageCreate", function (msg) { return _this.onMessage(msg); });
        this.client.on("interactionCreate", function (i) {
            var _a;
            if (!i.isCommand())
                return;
            (_a = _this.slashCommands[i.commandName]) === null || _a === void 0 ? void 0 : _a.handler(i);
        });
        this.onEnable();
    };
    Module.prototype.onEnable = function () { };
    Module.prototype.onModulesLoaded = function (modules) { }; // Runs when all modules are loaded
    Module.prototype.onMessage = function (message) { };
    return Module;
}());
exports["default"] = Module;
