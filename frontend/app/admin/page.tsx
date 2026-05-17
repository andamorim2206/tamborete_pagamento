'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getAdminTransactions, User, PaginatedTransactions } from '@/lib/api';

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<PaginatedTransactions | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Função para buscar dados
    const fetchData = async (showRefreshIndicator = false, page = currentPage, limit = itemsPerPage) => {
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
                getAdminTransactions(page, limit),
            ]);

            // Verificar se o usuário é admin
            if (userData.role !== 'ADMIN') {
                alert('❌ Acesso negado! Apenas administradores podem acessar esta área.');
                router.push('/dashboard');
                return;
            }

            setUser(userData);
            setTransactions(transactionsData);
            setLoading(false);
            setIsRefreshing(false);
        } catch (err: any) {
            console.error('Erro ao buscar dados:', err);
            if (err.status === 403) {
                alert('❌ Acesso negado! Apenas administradores podem acessar esta área.');
                router.push('/dashboard');
                return;
            }
            if (!user) {
                setError('Erro ao carregar dados');
                setLoading(false);
            }
            setIsRefreshing(false);
            if (err.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
        }
    };

    // Funções de navegação
    const goToNextPage = () => {
        if (transactions?.meta.hasNextPage) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchData(false, nextPage, itemsPerPage);
        }
    };

    const goToPreviousPage = () => {
        if (transactions?.meta.hasPreviousPage) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            fetchData(false, prevPage, itemsPerPage);
        }
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
        fetchData(false, page, itemsPerPage);
    };

    const changeItemsPerPage = (newLimit: number) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchData(false, 1, newLimit);
    };

    // Carregamento inicial
    useEffect(() => {
        fetchData();
    }, [router]);

    // Polling automático a cada 5 segundos (mantém a página atual)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && user) {
                fetchData(true, currentPage, itemsPerPage);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [loading, user, currentPage, itemsPerPage]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Carregando área administrativa...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 py-8 px-4 sm:px-6 lg:px-8">
           <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-3xl px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">👑</span>
                                    <h1 className="text-2xl font-bold text-white">Área Administrativa</h1>
                                </div>
                                <p className="text-purple-100 text-sm">Olá, {user?.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {isRefreshing && (
                                    <div className="flex items-center gap-2 text-purple-100 text-sm bg-purple-700 bg-opacity-50 px-3 py-1.5 rounded-full">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>Atualizando...</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => router.push('/admin/logs')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    📊 Ver Logs
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Dashboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-md hover:shadow-lg"
                                >
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600">Total de Transações</p>
                                        <p className="text-3xl font-bold text-purple-900 mt-1">
                                            {transactions?.meta.total || 0}
                                        </p>
                                    </div>
                                    <div className="bg-purple-200 p-3 rounded-full">
                                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl p-4 border border-pink-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-pink-600">Página Atual</p>
                                        <p className="text-3xl font-bold text-pink-900 mt-1">
                                            {transactions?.meta.page || 1}
                                        </p>
                                    </div>
                                    <div className="bg-pink-200 p-3 rounded-full">
                                        <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-4 border border-red-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-600">Total de Páginas</p>
                                        <p className="text-3xl font-bold text-red-900 mt-1">
                                            {transactions?.meta.totalPages || 0}
                                        </p>
                                    </div>
                                    <div className="bg-red-200 p-3 rounded-full">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transações */}
                <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Todas as Transações do Sistema
                    </h2>

                    {!transactions || transactions.data.length === 0 ? (
                        <div className="text-center py-10">
                            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="mt-3 text-sm text-gray-500">Nenhuma transação encontrada</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {transactions.data.map((transaction) => {
                                    const statusColor = {
                                        'COMPLETED': 'bg-green-100 text-green-800',
                                        'PENDING': 'bg-yellow-100 text-yellow-800',
                                        'PROCESSING': 'bg-blue-100 text-blue-800',
                                        'FAILED': 'bg-red-100 text-red-800',
                                    }[transaction.status] || 'bg-gray-100 text-gray-800';

                                    return (
                                        <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div className="p-2 rounded-full bg-purple-100">
                                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold text-gray-900">
                                                                {transaction.senderName}
                                                            </p>
                                                            <span className="text-gray-400">→</span>
                                                            <p className="font-semibold text-gray-900">
                                                                {transaction.receiverName}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                {transaction.senderEmail}
                                                            </span>
                                                            <span>→</span>
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                {transaction.receiverEmail}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                                            ID: {transaction.id.substring(0, 8)}...
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full mt-1 ${statusColor}`}>
                                                        {transaction.status}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-1">{transaction.paymentMethod}</p>
                                                    <button
                                                        onClick={() => router.push(`/admin/logs?transactionId=${transaction.id}`)}
                                                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Ver Logs
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Paginação */}
                            {(transactions.meta.total > 0) && (
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Mostrando {transactions.data.length} de {transactions.meta.total} transações
                                        <span className="mx-2">•</span>
                                        Página {transactions.meta.page} de {transactions.meta.totalPages}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value={5}>5 por página</option>
                                            <option value={10}>10 por página</option>
                                            <option value={20}>20 por página</option>
                                            <option value={50}>50 por página</option>
                                        </select>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={goToPreviousPage}
                                                disabled={!transactions.meta.hasPreviousPage}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ← Anterior
                                            </button>

                                            <div className="hidden sm:flex gap-1">
                                                {Array.from({ length: Math.min(5, transactions.meta.totalPages) }, (_, i) => {
                                                    let pageNumber;
                                                    if (transactions.meta.totalPages <= 5) {
                                                        pageNumber = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNumber = i + 1;
                                                    } else if (currentPage >= transactions.meta.totalPages - 2) {
                                                        pageNumber = transactions.meta.totalPages - 4 + i;
                                                    } else {
                                                        pageNumber = currentPage - 2 + i;
                                                    }

                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => goToPage(pageNumber)}
                                                            className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${currentPage === pageNumber
                                                                ? 'bg-purple-600 text-white border-purple-600'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={goToNextPage}
                                                disabled={!transactions.meta.hasNextPage}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Próxima →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
