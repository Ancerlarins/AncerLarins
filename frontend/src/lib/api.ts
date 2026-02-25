import axios from 'axios';
import { API_URL } from './constants';

/**
 * Minimal Axios instance for pages that haven't migrated to RTK Query yet.
 * No auth interceptors — tokens are sent as httpOnly cookies automatically.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

export default api;
