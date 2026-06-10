import express from 'express';
import axios from 'axios';

const router = express.Router();
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

router.get('/markets', async (req, res) => {
  try {
    const params = { ...req.query };
    const response = await axios.get(`${COINGECKO_BASE}/coins/markets`, { params });
    res.json(response.data);
  } catch (err: any) {
    console.error('Error proxying /markets:', err?.message || err);
    res.status(err?.response?.status || 500).json({ error: err?.message || 'proxy error' });
  }
});

router.get('/global', async (req, res) => {
  try {
    const response = await axios.get(`${COINGECKO_BASE}/global`);
    res.json(response.data);
  } catch (err: any) {
    console.error('Error proxying /global:', err?.message || err);
    res.status(err?.response?.status || 500).json({ error: err?.message || 'proxy error' });
  }
});

router.get('/coins/:id/market_chart', async (req, res) => {
  try {
    const { id } = req.params;
    const params = { ...req.query };
    const response = await axios.get(`${COINGECKO_BASE}/coins/${encodeURIComponent(id)}/market_chart`, { params });
    res.json(response.data);
  } catch (err: any) {
    console.error('Error proxying /coins/:id/market_chart:', err?.message || err);
    res.status(err?.response?.status || 500).json({ error: err?.message || 'proxy error' });
  }
});

export default router;
