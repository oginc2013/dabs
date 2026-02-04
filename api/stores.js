export default async function handler(req, res) {
  const SHEET_ID = process.env.SHEET_ID;
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const SHEET_NAME = 'Stores';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values || data.values.length < 2) {
      return res.status(404).json({ error: 'No store data found' });
    }

    const rows = data.values.slice(1);

    const stores = rows.map(row => ({
      state: row[0],
      name: row[1],
      address: row[2],
      city: row[3],
      zip: row[4],
      phone: row[5],
      lat: parseFloat(row[6]),
      lng: parseFloat(row[7]),
    }));

    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store data' });
  }
}
