import { ControllerMethod } from "..";

export default class AuthController  {

 
    authenticate: ControllerMethod =  async (req: any)  => {
        
        let authToken = req.body.authToken

         return {success: (authToken == 'validAuthToken') }
    }

}