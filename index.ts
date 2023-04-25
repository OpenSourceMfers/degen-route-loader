


//export type APICall = (req: any, res: any) => any


export type ControllerMethod = (req: any) => Promise<AssertionResponse>

export interface Route {
  type:string,
  uri: string,
  method: string, 
  controller: string,
  preHooks?: Array<PreHookDeclaration>
  
  appendParams?: any
}

export interface AssertionResponse {
  success:boolean,
  data?: any,
  error?: string ,
  specialAction?: string 
}

export interface PreHookDeclaration {
  method: string,
  controller: string 
}

export interface Config {
  verboseLogging?: boolean 
}




const configDefaults: Config = {
  verboseLogging:false 
}


let controllersMap = new Map<String,any>()
 
const terminationActions = ['reject','redirect'] //these terminate the response chain 


export default class DegenRouteLoader {


   config:Config


   constructor(conf?: Config) {
      this.config = { ...configDefaults, ...conf };
  }
 

  registerController(name:string, controllerClass: any ) {
    controllersMap.set(name, controllerClass);
  }


  loadRoutes(expressApp: any, routesConfig: Array<Route> ) {
    for (const route of routesConfig) {
      this.configureRoute(expressApp, route )
    }
  }

  configureRoute(expressApp: any, route: Route ) {
    
    if(this.config.verboseLogging){
      console.log('configuring route', route)
    }
    
    let restAction: string = route.type 
    let endpointURI: string = route.uri
    let methodName: string = route.method 
    let controllerName: string = route.controller


    let appendParams: any = route.appendParams ? JSON.parse(JSON.stringify( route.appendParams )) : undefined
    let preHooks: PreHookDeclaration[]  = route.preHooks ? route.preHooks : []

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
      controller: controllerName,
      appendParams,
      preHooks 
    }

    let controllerClass = controllersMap.get(controllerName)

    if(!controllerClass){
      throw new Error(`Controller not yet registered with route loader: ${controllerName}`)
    }

    if (restAction == 'get' || restAction == 'post') {
      expressApp[restAction](endpointURI, async (req: any, res: any) => {
       
        req = DegenRouteLoader.appendParams(req, appendParams)
 

        try{
          let endpointResult:AssertionResponse = await this.performEndpointActions(req, res, controllerClass, formattedRouteData)
  
          let statusCode = 200 

          /*try{
            if(endpointResult.error && endpointResult.error.trim().startsWith('#')){
              let statusCodeString = endpointResult.error.trim().substring(1,4)
              statusCode = parseInt(statusCodeString)
            }
          }catch(err){
            console.error(err)
          }*/

          if( endpointResult.specialAction ){
            return this.handleSpecialActions(endpointResult, res)
            //return res.status(statusCode).redirect(endpointResult.data.url)
          }

          return res.status(statusCode).send(endpointResult)
        }catch(error){
          console.error(error)
          return res.status(400).send(error)
        }
      })
    } 
  }

  handleSpecialActions( assertionResponse: AssertionResponse, res: any  ){

    if(assertionResponse.specialAction == "reject"){

      return res.status(401).send(assertionResponse.data)
    }

    if(assertionResponse.specialAction == "redirect"){

      return res.status(302).redirect(assertionResponse.data.url)
    }

    if(assertionResponse.specialAction == "setCookie"){

      return res.cookie( assertionResponse.data.key, assertionResponse.data.value  )
    }

  }

  async performEndpointActions(  req: any, res:any ,  controllerClass: any, route: Route ) : Promise<AssertionResponse>{
 
    let methodName:string = route.method
    let preHooks = route.preHooks


    if(preHooks){
     let combinedPreHooksResponse:AssertionResponse = await this.runPreHooks(preHooks,req, res)
      
      if(!combinedPreHooksResponse.success){
        return combinedPreHooksResponse
      }

      //if a prehook does a termination action, just do it and dont keep going 
      if(combinedPreHooksResponse.specialAction && terminationActions.includes( combinedPreHooksResponse.specialAction) ){
        return combinedPreHooksResponse
      }
    }
    
    let methodResponse:AssertionResponse = await controllerClass[methodName](req)


    return methodResponse  
  }

  async runPreHooks(preHooks:PreHookDeclaration[], req:any, res:any   ) : Promise<AssertionResponse>{

    for(let preHook of preHooks){
      let methodName = preHook.method
      let controllerClass = controllersMap.get(preHook.controller)

      let methodResponse:AssertionResponse = await controllerClass[methodName](req)

      if(!methodResponse.success){
        return methodResponse
      }

      //if any prehooks run a special action and it is a termination type action, just do that 
      if( methodResponse.specialAction && terminationActions.includes( methodResponse.specialAction ) ){
        return methodResponse
      }

      //if any prehook runs a special action and it is not terminating, run it and keep going 
      if(  methodResponse.specialAction ){
        this.handleSpecialActions(methodResponse, res)       
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
