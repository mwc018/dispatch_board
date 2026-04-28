import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function getAccessToken(): Promise<string> {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ACCOUNTS_URL } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Missing Zoho OAuth credentials in .env');
  }
  const response = await axios.post(
    `${ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com'}/oauth/v2/token`,
    null,
    {
      params: {
        grant_type: 'refresh_token',
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        refresh_token: ZOHO_REFRESH_TOKEN,
      },
    }
  );
  return response.data.access_token;
}

async function main() {
  const token = await getAccessToken();
  console.log('Got access token\n');

  const apiBase = process.env.ZOHO_API_BASE || 'https://www.zohoapis.com/crm/v8';
  const moduleName = process.env.ZOHO_MODULE_NAME || 'Service_Orders';

  const response = await axios.get(`${apiBase}/${moduleName}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    params: {
      criteria: '((Status:equals:Open))',
      per_page: 5,
      page: 1,
    },
  });

  const { data, info } = response.data;
  console.log(`Total records returned: ${data?.length ?? 0}`);
  console.log(`More records: ${info?.more_records}`);
  console.log('\nFirst record (raw):');
  console.log(JSON.stringify(data?.[0], null, 2));
}

main().catch((err) => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
