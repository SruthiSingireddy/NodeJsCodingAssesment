const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000
const authMiddleware = require('./src/authMiddleware');
const eventRoutes = require('./src/events')

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(authMiddleware);
app.use(eventRoutes)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))