import { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://rcwxnpbxhuvhnnwcijga.supabase.co/functions/v1';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || '';

// Utility functions for JWT generation with encryption

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function getUserEmailFromCookie(): string {
  const email = getCookie('userEmail');
  if (!email) {
    throw new Error('User email not found in cookies. Please login again.');
  }
  return email;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64url(str: string): string {
  let encoded = btoa(str)
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return encoded;
}

function stringTo32Bytes(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // Create a 32-byte buffer for AES-256
  const keyData = new Uint8Array(32);
  
  // Copy the string data, truncating or padding as needed
  for (let i = 0; i < 32; i++) {
    keyData[i] = i < data.length ? data[i] : 0;
  }
  
  return keyData.buffer;
}

async function encryptData(data: any, secret: string): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  
  // Generate random IV (12 bytes for GCM)
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  
  // Convert secret to exactly 32 bytes
  const keyBuffer = stringTo32Bytes(secret);
  
  // Import key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    keyMaterial,
    dataBuffer
  );
  
  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData.buffer);
  return arrayBufferToBase64(signature);
}

function base64urlFromBase64(base64: string): string {
  return base64
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function generateJWT(email: string): Promise<string> {
  if (!JWT_SECRET || !API_KEY) {
    throw new Error('Missing required environment variables: JWT_SECRET or API_KEY');
  }

  if (!email) {
    throw new Error('Email is required for JWT generation');
  }

  try {
    // Encrypt the sensitive data
    const dataToEncrypt = {
      email: email,
      apikey: API_KEY
    };
    
    const { encrypted, iv } = await encryptData(dataToEncrypt, JWT_SECRET);
    
    // JWT Header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    // JWT Payload with encrypted data
    const payload = {
      data: encrypted,
      iv: iv,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
    };
    
    // Encode Header
    const encodedHeader = base64url(JSON.stringify(header));
    
    // Encode Payload
    const encodedPayload = base64url(JSON.stringify(payload));
    
    // Create Signature
    const token = encodedHeader + "." + encodedPayload;
    const signature = await hmacSha256(token, JWT_SECRET);
    const encodedSignature = base64urlFromBase64(signature);
    
    // Complete JWT
    const jwt = token + "." + encodedSignature;
    
    return jwt;
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw error;
  }
}

// Cache JWT token and its expiration
let cachedJWT: string | null = null;
let jwtExpiration: number = 0;

async function getAuthHeaders(): Promise<HeadersInit> {
  // Get email from cookies
  const email = getUserEmailFromCookie();
  
  // Check if we need to generate a new token
  const now = Math.floor(Date.now() / 1000);
  if (!cachedJWT || now >= jwtExpiration - 300) { // Refresh 5 minutes before expiry
    cachedJWT = await generateJWT(email);
    jwtExpiration = now + (60 * 60); // 1 hour
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cachedJWT}`,
    'apikey': API_KEY
  };
}

export const fetchWealthData = async (inputdate?: string): Promise<ApiResponse> => {
  const url = inputdate 
    ? `${BASE_URL}/balance?inputdate=${inputdate}`
    : `${BASE_URL}/balance`;

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers
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

export const checkUserEmail = async (email: string): Promise<import('../types').CheckUserEmailResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/check-user-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      // If the endpoint returns 404/500, we assume the user check failed or service is down
      return { exists: false, message: 'User check failed' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking user email:', error);
    return { exists: false, message: 'Error checking user email' };
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
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/balance`, {
      method: 'POST',
      headers,
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

export const getBalanceById = async (id: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/balance/${id}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get balance: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting balance by ID:', error);
    throw error;
  }
};

export const updateBalanceItem = async (id: string, payload: BalancePayload): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/balance/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ balance: payload })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update balance: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error updating balance item:', error);
    throw error;
  }
};

export const deleteBalanceById = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/balance/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete balance: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting balance by ID:', error);
    throw error;
  }
};

export const deleteMonthBalance = async (month: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/balance/month/${month}`, {
      method: 'DELETE',
      headers
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