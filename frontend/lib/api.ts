const API_URL = 'http://localhost:3000';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  role?: string;
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

export interface PaginatedTransactions {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface Log {
  id: string;
  typeLog: string;
  statusCode?: number;
  message?: string;
  userId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaginatedLogs {
  data: Log[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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
  role?: string;
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

export async function getTransactions(page: number = 1, limit: number = 10): Promise<PaginatedTransactions> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/transactions?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar transações');
  }

  return response.json();
}

export async function getAdminTransactions(page: number = 1, limit: number = 10): Promise<PaginatedTransactions> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/transactions/admin/all?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar transações');
  }

  return response.json();
}

export async function getLogs(page: number = 1, limit: number = 10): Promise<PaginatedLogs> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/logs?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar logs');
  }

  return response.json();
}

export async function getLogById(id: string): Promise<Log> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/logs/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar log');
  }

  return response.json();
}

export async function getLogsByTransactionId(transactionId: string): Promise<Log[]> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado');
  }

  const response = await fetch(`${API_URL}/logs/transaction/${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Erro ao buscar logs da transação');
  }

  return response.json();
}
