/// <reference types="vite/client" />
import { ApiResponse } from '../types';

const API_URL = 'https://xktvegbahkomfyfzsnda.supabase.co/functions/v1/balance';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export const fetchWealthData = async (): Promise<ApiResponse> => {
  if (!API_KEY) {
    console.warn('API Key is missing. Please check your environment variables.');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching wealth data:', error);
    throw error;
  }
};