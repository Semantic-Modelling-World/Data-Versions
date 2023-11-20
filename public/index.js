const express = require('express')
const app = express()
const path = require('path')

const port = 3001;

app.use('/', express.static(path.resolve(__dirname, '')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
})
module.exports = app
