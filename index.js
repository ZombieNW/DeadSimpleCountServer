const express = require('express');
const fs = require('fs');
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

  //Send the count as a JSON response
  res.json({ value: requestCounts[identifier] });
});

//Endpoint to get the count without increasing it
app.get('/get/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;
  const identifier = `${namespace}/${key}`;

  //Get count and return it
  res.json({ value: requestCounts[identifier] || 0 });
});

//Start the server
const port = 80;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
