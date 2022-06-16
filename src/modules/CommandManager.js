"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Module_1 = require("./abstract/Module");
var discord_js_1 = require("discord.js");
var CommandManager = /** @class */ (function (_super) {
    __extends(CommandManager, _super);
    function CommandManager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "CommandManager";
        _this.prefix = "-";
        _this.commands = new discord_js_1.Collection();
        return _this;
    }
    CommandManager.prototype.onEnable = function () {
        this.logger.info("Enabled");
    };
    CommandManager.prototype.onMessage = function (message) {
        var _a, _b;
        if (!message.content.startsWith(this.prefix))
            return;
        var args = message.content.substring(this.prefix.length).split(" ");
        var commandName = args.shift();
        if (!commandName)
            return;
        var command = this.commands.get(commandName);
        if (!command)
            return;
        // If no permissions specified then we assume executable by everyone and run it
        if (!command.allowedPermissions && !command.allowedRoles)
            return this.executeCommand(command, message, args);
        if (command.allowedPermissions)
            for (var _i = 0, _c = command.allowedPermissions; _i < _c.length; _i++) {
                var permission = _c[_i];
                if ((_a = message.member) === null || _a === void 0 ? void 0 : _a.permissions.has(permission))
                    return this.executeCommand(command, message, args);
            }
        if (command.allowedRoles)
            for (var _d = 0, _e = command.allowedRoles; _d < _e.length; _d++) {
                var role = _e[_d];
                if ((_b = message.member) === null || _b === void 0 ? void 0 : _b.roles.cache.has(role.toString()))
                    return this.executeCommand(command, message, args);
            }
        message.reply("You do not have permission to execute this command.");
    };
    CommandManager.prototype.executeCommand = function (command, message, args) {
        try {
            command.executor(message, args);
        }
        catch (e) {
            this.logger.error(e.toString());
            message.channel.send("An error occurred. ``` ".concat(e.toString(), " ```"));
        }
    };
    CommandManager.prototype.registerCommand = function (options) {
        this.commands.set(options.name, options);
    };
    return CommandManager;
}(Module_1["default"]));
exports["default"] = CommandManager;
