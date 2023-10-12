const express = require('express');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const app = express();

//Make it cors friendly
app.use(cors());

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

// Endpoint to get counts for all keys within a specific namespace
app.get('/getnamespace/:namespace', (req, res) => {
  const { namespace } = req.params;
  const countsInNamespace = {};

  for (const key in requestCounts) {
    if (key.startsWith(namespace + '/')) {
      const modifiedKey = key.substring(namespace.length + 1); // +1 to remove the trailing '/'
      countsInNamespace[modifiedKey] = requestCounts[key];
    }
  }

  res.json(countsInNamespace);
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