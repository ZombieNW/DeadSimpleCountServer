const express = require('express');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const http = require('http');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();

// Setup Database
const dbFilePath = 'counts.db';
const db = new Database(dbFilePath, { verbose: console.log });

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS counts (
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (namespace, key)
  )  
`);

// Statements
const getCountStatement = db.prepare('SELECT value FROM counts WHERE namespace = ? AND key = ?');
const getNamespaceStatement = db.prepare('SELECT key, value FROM counts WHERE namespace = ?');
const upsertCountStatement = db.prepare(`
  INSERT INTO counts (namespace, key, value)
  VALUES (@namespace, @key, 1)
  ON CONFLICT(namespace, key) DO UPDATE SET
  value = value + 1
`);

// Get count and increase it
const incrementAndGet = db.transaction((namespace, key) => {
  upsertCountStatement.run({ namespace, key });
  return getCountStatement.get(namespace, key).value;
});

// Make it CORS friendly
app.use(cors());

// API Time !!!

// Get count and increase it
app.get('/count/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;

  try {
    const resultValue = incrementAndGet(namespace, key);
    return res.json({ value: resultValue });

  } catch (error) {
    console.error("Error in /count endpoint:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get count without increasing it
app.get('/get/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;

  try {
    const result = getCountStatement.get(namespace, key);
    return res.json({ value: result ? result.value : 0 });

  } catch (error) {
    console.error('Error in /get endpoint:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get counts of all keys within namespace
app.get('/getnamespace/:namespace', (req, res) => {
  const { namespace } = req.params;
  try {
    const rows = getNamespaceStatement.all(namespace);
    const counts = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    return res.json(counts);
    
  } catch (error) {
    console.error('Error in /getnamespace endpoint:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Server Time !!!

let server;
const keyPath = path.join(__dirname, 'ssl', 'default.key');
const certPath = path.join(__dirname, 'ssl', 'default.crt');

const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (useHttps) {
  console.log('SSL certs found! Starting HTTPS server!');

  const port = 443;
  const credentials = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  server = https.createServer(credentials, app);
  server.listen(port, () => {
    console.log(`Server running on port ${port} (HTTPS)`);
    console.log(`Database at '${dbFilePath}'`);
  });
  
} else {
  console.warn('No SSL certs found in /ssl dir');
  console.warn('Starting HTTP server!');
  
  const port = 3000;

  server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server running on port ${port} (HTTP)`);
    console.log(`Database at '${dbFilePath}'`);
  });
}

// Night Time !!!
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));