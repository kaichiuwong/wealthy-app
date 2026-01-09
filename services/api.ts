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

export interface BalancePayload {
  inputdate: string;
  item: string;
  amount: number;
  currency: string;
  base_currency: string;
  fx_rate: number;
  active: boolean;
  trx_type: 'CASH' | 'STOCK' | 'CRYPTO';
}

export const saveBalanceItem = async (payload: BalancePayload): Promise<void> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': API_KEY
      },
      body: JSON.stringify({ balance: payload })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save balance: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error saving balance item:', error);
    throw error;
  }
};

export const deleteMonthBalance = async (month: string): Promise<void> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  try {
    const response = await fetch(`${API_URL}/month/${month}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete month data: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting month data:', error);
    throw error;
  }
};