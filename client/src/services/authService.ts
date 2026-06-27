const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth';

const post = async (path: string, body: object) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return res.json();
};

export const registerAdmin = (name: string, email: string, password: string) =>
  post('/register', { name, email, password });

export const verifyOtp = (email: string, otp: string) =>
  post('/verify-otp', { email, otp });

export const loginAdmin = (email: string, password: string) =>
  post('/login', { email, password });

export const logoutAdmin = () =>
  fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' }).then(r => r.json());

export const getMe = () =>
  fetch(`${BASE}/me`, { credentials: 'include' }).then(r => r.json());

export const setPassword = (password: string) =>
  post('/set-password', { password });

export const forgotPassword = (email: string) =>
  post('/forgot-password', { email });

export const resetPassword = (email: string, otp: string, newPassword: string, confirmPassword: string) =>
  post('/reset-password', { email, otp, newPassword, confirmPassword });

export const createAdmin = (data: {
  name: string; email: string; password: string;
  can_register_admin: boolean; can_access_admin_panel: boolean;
}) => post('/create-admin', data);

export const verifyNewAdmin = (email: string, otp: string) =>
  post('/verify-new-admin', { email, otp });

export const listAdmins = () =>
  fetch(`${BASE}/admins`, { credentials: 'include' }).then(r => r.json());

export const toggleAdminAccess = (id: string, can_access_admin_panel: boolean) =>
  fetch(`${BASE}/admin/${id}/toggle-access`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ can_access_admin_panel }),
  }).then(r => r.json());

export const toggleRegisterPermission = (id: string, can_register_admin: boolean) =>
  fetch(`${BASE}/admin/${id}/toggle-register`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ can_register_admin }),
  }).then(r => r.json());

export const deleteAdmin = (id: string) =>
  fetch(`${BASE}/admin/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(r => r.json());
