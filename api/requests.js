export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SHEET_ID = process.env.SHEET_ID;
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const SHEET_NAME = 'ProductRequests';

  if (!SHEET_ID || !API_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values || data.values.length < 2) {
      return res.status(200).json([]);
    }

    const rows = data.values.slice(1);

    const requests = rows.map(row => ({
      timestamp: row[0] || '',
      city: row[1] || '',
      store: row[2] || '',
      product: row[3] || '',
      email: row[4] || 'Not provided',
      instagram: row[5] || 'Not provided',
      date: row[6] || '',
      status: row[7] || 'New'
    }));

    res.status(200).json(requests);
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    res.status(500).json({ error: 'Failed to fetch request data' });
  }
}
