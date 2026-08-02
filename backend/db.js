const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(); // utilise le nom de base présent dans MONGO_URI
  console.log('✅ MongoDB connecté');
  return db;
}

function getDB() {
  if (!db) throw new Error('La base de données n\'est pas encore connectée');
  return db;
}

module.exports = { connectDB, getDB };