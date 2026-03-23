const fs = require('fs');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:AyRILqBIOWxREuiE@db.uzaeicbdbscljwavnpew.supabase.co:5432/postgres';

async function migrate() {
    console.log("Reading schema.sql...");
    const schema = fs.readFileSync('server/schema.sql', 'utf8');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Supabase Postgres.");

        // Split schema into statements if necessary, but pg can run multiple statements
        await client.query(schema);
        
        console.log("Migration executed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
