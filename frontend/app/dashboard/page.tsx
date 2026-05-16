'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getTransactions, User, Transaction } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função para buscar dados
  const fetchData = async (showRefreshIndicator = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      const [userData, transactionsData] = await Promise.all([
        getCurrentUser(),
        getTransactions(),
      ]);
      setUser(userData);
      setTransactions(transactionsData);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      if (!user) {
        setError('Erro ao carregar dados');
        setLoading(false);
      }
      setIsRefreshing(false);
      // Se erro 401, redireciona para login
      if (err.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  };

  // Carregamento inicial
  useEffect(() => {
    fetchData();
  }, [router]);

  // Polling automático a cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && user) {
        fetchData(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [loading, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Erro ao carregar dados'}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Tamborete Pagamentos</h1>
            <p className="text-sm text-gray-500">Sistema de Pagamentos</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Main Content - Centralizado */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl shadow-xl px-8 py-8 mb-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user.name}!</h2>
          <p className="text-emerald-100 text-sm">Gerencie suas transações e acompanhe seu saldo</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Saldo Card */}
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Saldo Atual</h3>
              <div className="bg-emerald-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-600 mb-1">
              R$ {Number(user.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">Atualizado agora</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</h3>
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-semibold text-green-600 mb-1">Conta Ativa</p>
            <p className="text-xs text-gray-500">Sistema operacional</p>
          </div>
        </div>

        {/* Transações List */}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800">Histórico de Transações</h3>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Atualizando...</span>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/nova-transacao')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Transação
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">Nenhuma transação realizada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions
                .slice(0, 10)
                .map((transaction) => {
                  const isSender = transaction.senderId === user.id;
                  const otherUser = isSender
                    ? { id: transaction.receiverId, name: transaction.receiverName, email: transaction.receiverEmail }
                    : { id: transaction.senderId, name: transaction.senderName, email: transaction.senderEmail };
                  const statusColor = {
                    'COMPLETED': 'bg-green-100 text-green-800',
                    'PENDING': 'bg-yellow-100 text-yellow-800',
                    'PROCESSING': 'bg-blue-100 text-blue-800',
                    'FAILED': 'bg-red-100 text-red-800',
                  }[transaction.status] || 'bg-gray-100 text-gray-800';

                  return (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`p-2 rounded-full ${isSender ? 'bg-red-100' : 'bg-green-100'}`}>
                            {isSender ? (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {isSender ? `Enviado para ${otherUser.name}` : `Recebido de ${otherUser.name}`}
                            </p>
                            <p className="text-xs text-gray-500">{otherUser.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${isSender ? 'text-red-600' : 'text-green-600'}`}>
                            {isSender ? '-' : '+'} R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${statusColor}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}