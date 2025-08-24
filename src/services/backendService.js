import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export async function fetchCompany(symbol) {
  const res = await axios.get(`${API_BASE}/api/company/${encodeURIComponent(symbol)}`);
  return res.data;
}

export async function fetchPriceChart(symbol) {
  const res = await axios.get(`${API_BASE}/api/price-chart/${encodeURIComponent(symbol)}`);
  return res.data;
}
