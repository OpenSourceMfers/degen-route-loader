"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const apiController_1 = __importDefault(require("../controllers/apiController"));
const index_1 = __importDefault(require("../index"));
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const authController_1 = __importDefault(require("../controllers/authController"));
const routes = require('../config/routes.json');
let listener;
let app = (0, express_1.default)();
const apiPort = 4041;
describe('Route Loader', () => {
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        app.use(express_1.default.json());
        let apiController = new apiController_1.default();
        let authController = new authController_1.default();
        let degenRouteLoader = new index_1.default();
        degenRouteLoader.registerController("api", apiController);
        degenRouteLoader.registerController("auth", authController);
        degenRouteLoader.loadRoutes(app, routes);
        listener = app.listen(apiPort, () => {
            console.log(`API Server listening at http://localhost:${apiPort}`);
        });
    }));
    after(() => __awaiter(void 0, void 0, void 0, function* () {
        listener.close();
    }));
    it('can ping', () => __awaiter(void 0, void 0, void 0, function* () {
        let authToken = 'validAuthToken';
        let response = yield axios_1.default.post(`http://localhost:${apiPort}/api/ping`, { authToken });
        (0, chai_1.expect)(response.data.success).to.eql(true);
    }));
    it('can fail on prehooks', () => __awaiter(void 0, void 0, void 0, function* () {
        let authToken = 'invalidAuthToken';
        let response = yield axios_1.default.post(`http://localhost:${apiPort}/api/ping`, { authToken });
        (0, chai_1.expect)(response.data.success).to.eql(false);
    }));
});
//# sourceMappingURL=routeloader.test.js.map