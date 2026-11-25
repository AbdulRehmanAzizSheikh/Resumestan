// TEMP: DB data check — raw mongodb driver.
const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_URI;

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  console.log("Connected to cluster");
  const dbs = await client.db("admin").admin().listDatabases();
  console.log("=== DATABASES ===");
  for (const d of dbs.databases) {
    console.log(`\n• ${d.name}`);
    const db = client.db(d.name);
    const cols = await db.listCollections().toArray();
    if (cols.length === 0) { console.log("  (no collections)"); continue; }
    for (const c of cols) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`   - ${c.name}: ${count} docs`);
    }
    if (cols.some(c => c.name === "users")) {
      console.log("\n=== users (safe fields) ===");
      const users = await db.collection("users").find({}, { projection: { email: 1, username: 1, "verify.status": 1, canvaAccounts: 1, "pendingCanvaState.state": 1 } }).limit(10).toArray();
      console.log(JSON.stringify(users, null, 1));
    }
  }
  await client.close();
})().catch((e) => { console.error("DB CHECK ERROR:", e.message); process.exit(1); });
