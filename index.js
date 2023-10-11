const express = require('express');
const fs = require('fs');
const https = require('https');
const app = express();

//Load existing counts from a JSON file (if it exists)
const dbFilePath = 'counts.json';
let requestCounts = loadCounts();
function loadCounts() {
  if (fs.existsSync(dbFilePath)) {
    try {
      const dbData = fs.readFileSync(dbFilePath, 'utf8');
      return JSON.parse(dbData);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  }
  return {};
}

function saveCounts() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(requestCounts, null, 2));
  } catch (error) {
    console.error('Error saving counts:', error);
  }
}

//Endpoint to get the count and increase it
app.get('/count/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;
  const identifier = `${namespace}/${key}`;

  //Increment the count and save it
  requestCounts[identifier] = (requestCounts[identifier] || 0) + 1;
  saveCounts();

  res.json({ value: requestCounts[identifier] }); //Return count
});

//Endpoint to get the count without increasing it
app.get('/get/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;
  const identifier = `${namespace}/${key}`;

  res.json({ value: requestCounts[identifier] || 0 }); //Return count
});

// HTTPS Configuration
const credentials = {
  key: fs.readFileSync('ssl/default.key'),
  cert: fs.readFileSync('ssl/default.crt')
};

// Create an HTTPS server at port 443
const httpsServer = https.createServer(credentials, app);
const port = 443;
httpsServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});