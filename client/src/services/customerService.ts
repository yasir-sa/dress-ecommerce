const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/customer';

const post = async (path: string, body: object) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return res.json();
};

export const registerCustomer = (name: string, email: string, password: string) =>
  post('/register', { name, email, password });

export const verifyCustomerOtp = (email: string, otp: string) =>
  post('/verify-otp', { email, otp });

export const loginCustomer = (email: string, password: string) =>
  post('/login', { email, password });

export const getCustomerMe = () =>
  fetch(`${BASE}/me`, { credentials: 'include' }).then(r => r.json());

export const logoutCustomer = () =>
  fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' }).then(r => r.json());

export const customerGoogleLogin = () => {
  window.location.href = `${BASE}/google`;
};
