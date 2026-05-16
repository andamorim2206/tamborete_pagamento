const API_URL = 'http://localhost:3000';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.message || 'Erro ao cadastrar');
  }

  return response.json();
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.message || 'Email ou senha incorretos');
  }

  return response.json();
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export async function getCurrentUser(): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar dados do usuário');
  }

  return response.json();
}

export async function getUserById(userId: string): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar dados do usuário');
  }

  return response.json();
}

export async function getTransactions(): Promise<Transaction[]> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar transações');
  }

  return response.json();
}
