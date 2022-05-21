import { config, expect, should } from 'chai'
import ApiController from '../controllers/apiController'
 

import DegenRouteLoader, { Config, Route } from '../index'
import axios from 'axios'
 
import express from 'express'
import AuthController from '../controllers/authController'
import { Server } from 'http'

const routes = require('../config/routes.json')

let listener :Server
let app = express()

const apiPort = 4041


describe('Route Loader', () => {
 
  before(async () => {

    app.use(express.json())
 

    let apiController = new ApiController()
    let authController = new AuthController() 
 

    let degenRouteLoader = new DegenRouteLoader( )
 

    degenRouteLoader.registerController( "api", apiController )
    degenRouteLoader.registerController( "auth", authController )
    degenRouteLoader.loadRoutes( app, routes)

    listener = app.listen(apiPort, () => {
      console.log(`API Server listening at http://localhost:${apiPort}`)
    })
    

  })


  after(async () => {

    listener.close()
  })
  
  it('can ping', async () => {

    let authToken = 'validAuthToken'
   
    let response = await axios.post(`http://localhost:${apiPort}/api/ping`,{authToken})
 
    expect(response.data.success).to.eql(true)

  })



  it('can fail on prehooks', async () => {

    let authToken = 'invalidAuthToken'
   
    let response = await axios.post(`http://localhost:${apiPort}/api/ping`,{authToken})
 
    expect(response.data.success).to.eql(false)

  })

   

 

 

})
