export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SCRIPT_URL = process.env.REQUEST_SCRIPT_URL;

  if (!SCRIPT_URL) {
    console.error('REQUEST_SCRIPT_URL not set in environment variables');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const body = req.body;

    // Basic validation
    if (!body.city || !body.store || !body.product) {
      return res.status(400).json({ error: 'Missing required fields: city, store, product' });
    }

    // Forward to Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: body.timestamp || new Date().toISOString(),
        city: body.city,
        store: body.store,
        product: body.product,
        email: body.email || 'Not provided',
        instagram: body.instagram || 'Not provided',
        date: body.date || new Date().toLocaleDateString(),
        status: 'New'
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      throw new Error('Apps Script returned error');
    }
  } catch (error) {
    console.error('Request submission error:', error);
    return res.status(500).json({ error: 'Failed to submit request' });
  }
}
