"use strict";
//export type APICall = (req: any, res: any) => any
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const configDefaults = {
    verboseLogging: false
};
class DegenRouteLoader {
    constructor(conf) {
        this.config = Object.assign(Object.assign({}, configDefaults), conf);
    }
    loadRoutes(expressApp, routesConfig, controllerClass) {
        for (const route of routesConfig) {
            this.configureRoute(expressApp, route, controllerClass);
        }
    }
    configureRoute(expressApp, route, controllerClass) {
        if (this.config.verboseLogging) {
            console.log('configuring route', route);
        }
        let restAction = route.type;
        let endpointURI = route.uri;
        let methodName = route.method;
        let appendParams = route.appendParams ? JSON.parse(JSON.stringify(route.appendParams)) : undefined;
        let preHooks = route.preHooks ? route.preHooks : [];
        if (typeof endpointURI != 'string') {
            throw 'Error: invalid route format for endpointURI';
        }
        if (typeof methodName != 'string') {
            throw 'Error: invalid route format for methodName';
        }
        if (typeof restAction != 'string') {
            throw 'Error: invalid route format for restAction';
        }
        restAction = restAction.toLowerCase();
        const formattedRouteData = {
            type: restAction,
            uri: endpointURI,
            method: methodName,
            appendParams,
            preHooks
        };
        if (restAction == 'get' || restAction == 'post') {
            expressApp[restAction](endpointURI, (req, res) => __awaiter(this, void 0, void 0, function* () {
                req = DegenRouteLoader.appendParams(req, appendParams);
                let endpointResult = yield this.performEndpointActions(req, controllerClass, formattedRouteData);
                let statusCode = 200;
                try {
                    if (endpointResult.error && endpointResult.error.trim().startsWith('#')) {
                        let statusCodeString = endpointResult.error.trim().substring(1, 4);
                        statusCode = parseInt(statusCodeString);
                    }
                }
                catch (err) {
                    console.error(err);
                }
                return res.status(statusCode).send(endpointResult);
            }));
        }
    }
    performEndpointActions(req, controllerClass, route) {
        return __awaiter(this, void 0, void 0, function* () {
            let methodName = route.method;
            let preHooks = route.preHooks;
            if (preHooks) {
                let combinedPreHooksResponse = yield this.runPreHooks(controllerClass, preHooks, req);
                if (!combinedPreHooksResponse.success) {
                    return { success: false, error: combinedPreHooksResponse.error };
                }
            }
            let methodResponse = yield controllerClass[methodName](req);
            return methodResponse;
        });
    }
    runPreHooks(controllerClass, preHooks, req) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let preHook of preHooks) {
                let methodResponse = yield controllerClass[preHook](req);
                if (!methodResponse.success) {
                    return methodResponse;
                }
            }
            return { success: true };
        });
    }
    static appendParams(req, appendParams) {
        if (appendParams) {
            return Object.assign(req, { router: { params: appendParams } });
        }
        return Object.assign(req, { router: { params: {} } });
    }
}
exports.default = DegenRouteLoader;
//# sourceMappingURL=index.js.map