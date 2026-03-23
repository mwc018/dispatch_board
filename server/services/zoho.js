const axios = require('axios');

// Zoho OAuth token management
let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt - 60000) {
    return accessToken;
  }

  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ACCOUNTS_URL } = process.env;

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho OAuth credentials not configured. Check your .env file.');
  }

  const response = await axios.post(`${ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com'}/oauth/v2/token`, null, {
    params: {
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    },
  });

  accessToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
  return accessToken;
}

function getApiBase() {
  return process.env.ZOHO_API_BASE || 'https://www.zohoapis.com/crm/v2';
}

/**
 * Update a Zoho Service Order record with dispatch assignment info.
 * Field names map to your actual Zoho field API names — configure in .env.
 */
async function updateServiceOrderAssignment({ zohoId, techName, priority, scheduledTime, status }) {
  try {
    const token = await getAccessToken();
    const moduleName = process.env.ZOHO_MODULE_NAME || 'Service_Orders';
    const fields = {};

    if (process.env.ZOHO_FIELD_TECH && techName !== undefined) {
      fields[process.env.ZOHO_FIELD_TECH] = techName || null;
    }
    if (process.env.ZOHO_FIELD_PRIORITY && priority !== undefined) {
      fields[process.env.ZOHO_FIELD_PRIORITY] = priority || null;
    }
    if (process.env.ZOHO_FIELD_TIME && scheduledTime !== undefined) {
      fields[process.env.ZOHO_FIELD_TIME] = scheduledTime || null;
    }
    if (process.env.ZOHO_FIELD_STATUS && status !== undefined) {
      fields[process.env.ZOHO_FIELD_STATUS] = status;
    }

    if (Object.keys(fields).length === 0) return;

    await axios.put(
      `${getApiBase()}/${moduleName}/${zohoId}`,
      { data: [{ id: zohoId, ...fields }] },
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
  } catch (err) {
    // Log but don't crash — Zoho sync is best-effort
    console.error('[Zoho] Failed to update service order:', err.response?.data || err.message);
  }
}

/**
 * Fetch all CRM users to populate technician list.
 */
async function fetchCRMUsers() {
  const token = await getAccessToken();
  const response = await axios.get(`${getApiBase().replace('/crm/v2', '/crm/v2')}/users?type=AllUsers`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  return response.data.users || [];
}

module.exports = { updateServiceOrderAssignment, fetchCRMUsers, getAccessToken };
