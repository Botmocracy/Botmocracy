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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var discord_js_1 = require("discord.js");
var Town_1 = require("../schema/Town");
var Module_1 = require("./abstract/Module");
var undici_1 = require("undici");
var Info = /** @class */ (function (_super) {
    __extends(Info, _super);
    function Info() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.commandManager = null;
        _this.name = "Info";
        return _this;
    }
    Info.prototype.onEnable = function () {
        this.logger.info("Enabled");
    };
    Info.prototype.getTownByName = function (name) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, fullBody, _b, _c, data, e_1_1, towns, _i, towns_1, townData;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, (0, undici_1.request)("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1JSmJtYkYrEx6Am5drhSet17qwJzOKDI7tE7FxPx4YNI&sheetName=New%20World", { maxRedirections: 1 })];
                    case 1:
                        result = _d.sent();
                        fullBody = '';
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 7, 8, 13]);
                        _b = __asyncValues(result.body);
                        _d.label = 3;
                    case 3: return [4 /*yield*/, _b.next()];
                    case 4:
                        if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 6];
                        data = _c.value;
                        fullBody += data.toString(); // ok but why doesn't it just send it as a string...
                        _d.label = 5;
                    case 5: return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _d.trys.push([8, , 11, 12]);
                        if (!(_c && !_c.done && (_a = _b["return"]))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(_b)];
                    case 9:
                        _d.sent();
                        _d.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        towns = JSON.parse(fullBody);
                        for (_i = 0, towns_1 = towns; _i < towns_1.length; _i++) {
                            townData = towns_1[_i];
                            if (townData['Town Name'] == name) {
                                return [2 /*return*/, townData];
                            }
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    Info.prototype.onModulesLoaded = function (modules) {
        var self = this;
        this.commandManager = modules.get("CommandManager");
        this.commandManager.registerCommand({ name: "gettown", executor: function (message, args) {
                if (args.length < 1) {
                    message.channel.send("Syntax: `gettown <name>`");
                    return;
                }
                Town_1["default"].findOne({ name: args.shift() }, function (err, res) {
                    if (!res || err) {
                        message.channel.send("Invalid town");
                        return;
                    }
                    var name = res['name'];
                    var mayor = res['mayor'];
                    var depMayor = res['depMayor'];
                    var coords = res['coords'];
                    var embed = new discord_js_1.MessageEmbed()
                        .setTitle(name)
                        .addField("Mayor", mayor)
                        .addField("Deputy Mayor", depMayor)
                        .addField("Coords", coords)
                        .setColor("BLURPLE");
                    message.channel.send({ embeds: [embed] });
                });
            } });
        this.commandManager.registerCommand({ name: "addtown", executor: function (message, args) {
                if (args.length < 1) {
                    message.channel.send("Syntax: `addtown <name`");
                }
                self.getTownByName(args[0]).then(function (result) {
                    if (!result) {
                        message.channel.send("Invalid town");
                    }
                    result = result;
                    var townName = result["Town Name"];
                    var town = new Town_1["default"]({
                        name: result["Town Name"],
                        mayor: result['Mayor'],
                        depMayor: result['Deputy Mayor'],
                        coords: "".concat(result['X'], " ").concat(result['Y'], " ").concat(result['Z']),
                        rank: result['Town Rank']
                    });
                    Town_1["default"].findOne({ name: townName }, function (err, res) {
                        if (!err || res) {
                            Town_1["default"].deleteOne({ name: townName }, function (err, res) {
                                if (err)
                                    throw err;
                            });
                        }
                    });
                    town.save(function (err) { if (err)
                        throw err; });
                    message.channel.send("Done.");
                });
            } });
    };
    return Info;
}(Module_1["default"]));
exports["default"] = Info;
