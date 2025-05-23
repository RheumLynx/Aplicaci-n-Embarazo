const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  analyzePdf: `${API_BASE_URL}/analyze-pdf`,
  getDrugs: `${API_BASE_URL}/drugs`
}; 