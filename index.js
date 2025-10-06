const express = require('express');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
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
    const result = incrementAndGet(namespace, key);
    return res.json({ value: result.value });

  } catch (error) {
    console.error("Error in /count endpoint:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get count without increasing it
app.get('/get/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;

  try {
    const result = getCountStmt.get(namespace, key);
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

// SSL Check
if (!fs.existsSync('ssl')) {
  console.error('Error: ssl folder not found. Please create it and place default.key and default.crt inside it.');
  process.exit(1);
}

const credentials = {
  key: fs.readFileSync('ssl/default.key'),
  cert: fs.readFileSync('ssl/default.crt')
};

const port = 443;
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Database is stored in '${dbFilePath}'`);
});

// Night Time !!!
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));