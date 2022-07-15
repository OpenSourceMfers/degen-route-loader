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
let controllersMap = new Map();
const validPrehookActions = ['setCookie', 'reject', 'redirect'];
const terminationActions = ['reject', 'redirect']; //these terminate the response chain 
class DegenRouteLoader {
    constructor(conf) {
        this.config = Object.assign(Object.assign({}, configDefaults), conf);
    }
    registerController(name, controllerClass) {
        controllersMap.set(name, controllerClass);
    }
    loadRoutes(expressApp, routesConfig) {
        for (const route of routesConfig) {
            this.configureRoute(expressApp, route);
        }
    }
    configureRoute(expressApp, route) {
        if (this.config.verboseLogging) {
            console.log('configuring route', route);
        }
        let restAction = route.type;
        let endpointURI = route.uri;
        let methodName = route.method;
        let controllerName = route.controller;
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
            controller: controllerName,
            appendParams,
            preHooks
        };
        let controllerClass = controllersMap.get(controllerName);
        if (!controllerClass) {
            throw new Error(`Controller not yet registered with route loader: ${controllerName}`);
        }
        if (restAction == 'get' || restAction == 'post') {
            expressApp[restAction](endpointURI, (req, res) => __awaiter(this, void 0, void 0, function* () {
                req = DegenRouteLoader.appendParams(req, appendParams);
                let endpointResult = yield this.performEndpointActions(req, res, controllerClass, formattedRouteData);
                let statusCode = 200;
                /*try{
                  if(endpointResult.error && endpointResult.error.trim().startsWith('#')){
                    let statusCodeString = endpointResult.error.trim().substring(1,4)
                    statusCode = parseInt(statusCodeString)
                  }
                }catch(err){
                  console.error(err)
                }*/
                if (endpointResult.specialAction) {
                    return this.handleSpecialActions(endpointResult, res);
                    //return res.status(statusCode).redirect(endpointResult.data.url)
                }
                return res.status(statusCode).send(endpointResult);
            }));
        }
    }
    handleSpecialActions(assertionResponse, res) {
        if (assertionResponse.specialAction == "reject") {
            return res.status(401).send(assertionResponse.data);
        }
        if (assertionResponse.specialAction == "redirect") {
            return res.status(302).redirect(assertionResponse.data.url);
        }
        if (assertionResponse.specialAction == "setCookie") {
            return res.cookie(assertionResponse.data.key, assertionResponse.data.value);
        }
    }
    performEndpointActions(req, res, controllerClass, route) {
        return __awaiter(this, void 0, void 0, function* () {
            let methodName = route.method;
            let preHooks = route.preHooks;
            if (preHooks) {
                let combinedPreHooksResponse = yield this.runPreHooks(preHooks, req, res);
                if (!combinedPreHooksResponse.success) {
                    return combinedPreHooksResponse;
                }
                //if a prehook does a termination action, just do it and dont keep going 
                if (combinedPreHooksResponse.specialAction && terminationActions.includes(combinedPreHooksResponse.specialAction)) {
                    return combinedPreHooksResponse;
                }
            }
            let methodResponse = yield controllerClass[methodName](req);
            return methodResponse;
        });
    }
    runPreHooks(preHooks, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let preHook of preHooks) {
                let methodName = preHook.method;
                let controllerClass = controllersMap.get(preHook.controller);
                let methodResponse = yield controllerClass[methodName](req);
                if (!methodResponse.success) {
                    return methodResponse;
                }
                //if any prehooks run a special action and it is a termination type action, just do that 
                if (methodResponse.specialAction && terminationActions.includes(methodResponse.specialAction)) {
                    return methodResponse;
                }
                if (methodResponse.specialAction) {
                    if (!validPrehookActions.includes(methodResponse.specialAction)) {
                        throw new Error(`Invalid action for a prehook: ${methodResponse.specialAction}`);
                    }
                    this.handleSpecialActions(methodResponse, res);
                    //return res.status(statusCode).redirect(endpointResult.data.url)
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