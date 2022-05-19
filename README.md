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

preHooks: an array of method names which will be run before the primary method.  If any of these return {success:false, error?: string} then the overall REST api call will fail due to that prehook.  Useful for authentication prehooks and such - which will likely be shared by multiple routes.

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



## Status Codes

If a route contains an error and that error begins with '#___' where '___' is a three digit code, the REST response will not return a 200 status code but instead that three digit code preceeding the error. 

Otherwise, error messages are not allowed to start with the character #.  