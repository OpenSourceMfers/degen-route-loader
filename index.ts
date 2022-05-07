


export type APICall = (req: any, res: any) => any

export interface Route {
  type:string,
  uri: string,
  method: string,
  preHooks?: Array<string>
  controller?: string
  appendParams?: any
}


export interface Config {
  verboseLogging: boolean,
  successCode: number,
  failureCode: number
}

export interface AssertionResponse{
  success:boolean,
  data?: any,
  error?: string 
}


const configDefaults: Config = {
  verboseLogging:false,
  successCode: 200,
  failureCode: 401 
}


export default class DegenRouteLoader {


   config:Config


   constructor(conf: Config) {
      this.config = { ...configDefaults, ...conf };
  }
 

  loadRoutes(expressApp: any, routesConfig: Array<Route>, controllerClass: any) {
    for (const route of routesConfig) {
      this.configureRoute(expressApp, route, controllerClass)
    }
  }

  configureRoute(expressApp: any, route: Route, controllerClass: any) {
    
    if(this.config.verboseLogging){
      console.log('configuring route', route)
    }
    
    let restAction: string = route.type 
    let endpointURI: string = route.uri
    let methodName: string = route.method 


    let appendParams: any = route.appendParams ? JSON.parse(JSON.stringify( route.appendParams )) : undefined
    let preHooks: string[]  = route.preHooks ? route.preHooks : []

    if (typeof endpointURI != 'string' ) {
      throw 'Error: invalid route format for endpointURI'
    }

    if (typeof methodName != 'string') {
      throw 'Error: invalid route format for methodName'
    } 

    if (typeof restAction != 'string') {
      throw 'Error: invalid route format for restAction'
    }

    restAction = restAction.toLowerCase()


    const formattedRouteData : Route = { 
      type: restAction,
      uri: endpointURI,
      method: methodName,
      appendParams,
      preHooks 
    }

    if (restAction == 'get' || restAction == 'post') {
      expressApp[restAction](endpointURI, async (req: any, res: any) => {
       
        req = DegenRouteLoader.appendParams(req, appendParams)

        let endpointResult:AssertionResponse = await this.performEndpointActions(req, controllerClass, formattedRouteData)
 
        let statusCode = endpointResult.success? this.config.successCode : this.config.failureCode

        return res.status(statusCode).send(endpointResult)
      })
    } 
  }

  async performEndpointActions(  req: any, controllerClass: any, route: Route ) : Promise<AssertionResponse>{
 
    let methodName = route.method
    let preHooks = route.preHooks


    if(preHooks){
     let combinedPreHooksResponse:AssertionResponse = await this.runPreHooks(controllerClass,preHooks,req)
      
      if(!combinedPreHooksResponse.success){
        return {success:false, error: combinedPreHooksResponse.error }
      }
    }

    let methodResponse:AssertionResponse = await controllerClass[methodName](req)


    return methodResponse  
  }

  async runPreHooks(controllerClass:any, preHooks:string[], req:any  ) : Promise<AssertionResponse>{

    for(let preHook of preHooks){
      let methodResponse:AssertionResponse = await controllerClass[preHook](req)

      if(!methodResponse.success){
        return methodResponse
      }
    }

    return { success:true } 
  }

  static appendParams(req:any, appendParams: any){

    if(appendParams){
      return Object.assign( req , {router: { params: appendParams }})
    }

    return Object.assign( req , {router: { params: {}  }}) 

  }

}
