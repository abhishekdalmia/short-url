# short-url
Simple url shortening service

## Instructions for setup:
* Setup monodb on server beforehand to be able to use it
* Download the repo to the desired location
* From the repository folder run "npm install"
* Run mongo daemon with "mongod"
* Run the server with "node index.js" or "nodemon index.js"
* It is required to define the environment variable "shorturl_jwtprivatekey" in the environment that the app is run
