const supabaseUrl = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';

async function check() {
    console.log('--- Database Check Started ---');
    try {
        // 1. Check users table
        const res = await fetch(`${supabaseUrl}/rest/v1/users?select=*&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Fetch failed with status:', res.status, errText);
            return;
        }

        const data = await res.json();
        console.log('Total users fetched (limit 1):', data.length);
        if (data.length > 0) {
            console.log('Sample User Fields:', Object.keys(data[0]).join(', '));
            console.log('Column "is_banned" exists:', Object.keys(data[0]).includes('is_banned'));
        } else {
            console.log('No users found in "users" table.');
        }

        // 2. Check if we can add the column via execute_sql RPC (if it exists)
        // Most Supabase projects have an execute_sql RPC for migrations.
        console.log('\n--- Attempting to check/add is_banned column ---');
        const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql_query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;'
            })
        });

        if (rpcRes.ok) {
            console.log('Column sync successful (or already exists via RPC).');
        } else {
            const rpcErr = await rpcRes.text();
            console.log('RPC sync skipped or failed (common if RPC not defined):', rpcErr);
        }

    } catch (e) {
        console.error('Check script error:', e.message);
    }
    console.log('--- Database Check Finished ---');
}

check();
