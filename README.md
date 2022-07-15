#### Degen Route Loader

 Route file configuration for express 

 See the unit test for implementation instructions 


## In your express initialization code 



        import DegenRouteLoader from 'degen-route-loader'

        import APIController from '../controllers/APIController'

        const Routes = JSON.parse( fs.readFileSync('./server/routes/routes.json') )

        this.apiController=new APIController(  )
                

       

        const app = express()
 
        const degenRouteLoader = new DegenRouteLoader()
        degenRouteLoader.loadRoutes( app, Routes , this.apiController  )
        // Dont forget you can load routes for multiple controllers

        app.listen(apiPort, () => {
        console.log(`API Server listening at http://localhost:${apiPort}`)
        })




## Anatomy of a route 


#### Each route must have the following: 

Type: A string, either 'get' or 'post' for the type of REST request to expect 

uri: The uri onto which to expose the route with express 

method: The name of the controller method to call (the method must extend APICall

#### Each route may additionally specify the following optional attributes: 

controller: The name of the controller that has the methods for this route 

appendParams: An object that will be appended to 'req' just before it is passed to the method in the controller.  This will be appended at 'req.router.params'

preHooks: An array of  {method:string, controller:string} which will be run before the primary method.  If any of these return {success:false, error?: string} then the overall REST api call will fail due to that prehook.  Useful for authentication prehooks and such - which will likely be shared by multiple routes.



## In routes.json 


  [ 
    {"type":"get","uri":"/api/ping","method":"ping","controller":"api"}
 
]


## In your controller class



        import { APIMethod } from "degen-route-loader"


        export default class APIController  {

            ping: APIMethod =  async (req: any) => {
                return res.status(200).send('Pong')
            }

        }



## Assertion Response 

An assertion response is the response that your api controller returns from its controller method.  It contains 

*success* - A boolean indicating if the method errored or not (prehooks that error will cancel the route flow) 

*data* - Optional param that can contain anything.  This will be sent to the user as json by default (no special action) 

*error* - Optional string for an error message to return if success is false 

*specialAction* - Optional string for specifying that you want express (via this plugin) to perform an action other than returning data as json.  See the section titled Special Actions. 




## Special Actions

You can specify a specialAction on any route or prehook in order to accomplish special tasks like a redirect or setting cookies. 

*setCookie* - Sets a cookie on the client side using data.key and data.value.   Most typically used in a preHook so that the primary route can then redirect.  Useful for authentication flow.

*reject* - Will return a 401 status code 

*redirect* - Will redirect to data.url 

If a prehook performs a "response terminating" action like a reject or redirect then no other prehooks will run nor will the primary route.  The route response flow will end.  
