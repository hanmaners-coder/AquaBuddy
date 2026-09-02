const https = require('https');

const SUPABASE_URL = "https://ogfzfgsvmjuimjjhaubs.supabase.co";
const ANON_KEY = "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

function inspectUsers() {
    const url = new URL(`${SUPABASE_URL}/rest/v1/users?select=id,email,nickname,real_name,role,is_instructor,instructor_status`);
    const options = {
        method: 'GET',
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    };
    const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            const users = JSON.parse(body);
            console.log("=== Users with '김동욱' or related emails ===");
            users.filter(u => (u.email && u.email.includes('hanman')) || (u.real_name && u.real_name.includes('동욱')) || (u.nickname && u.nickname.includes('동욱'))).forEach(u => {
                console.log(u);
            });
        });
    });
    req.end();
}

inspectUsers();
