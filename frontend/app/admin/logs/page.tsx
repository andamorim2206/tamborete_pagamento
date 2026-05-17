'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getLogs, getLogById, getLogsByTransactionId, User, PaginatedLogs, Log } from '@/lib/api';

export default function AdminLogsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [logs, setLogs] = useState<PaginatedLogs | null>(null);
    const [transactionLogs, setTransactionLogs] = useState<Log[] | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterErrors, setFilterErrors] = useState(false);

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
            const [userData, logsData] = await Promise.all([
                getCurrentUser(),
                getLogs(page, limit),
            ]);

            // Verificar se usuário é admin
            if (userData.role !== 'ADMIN') {
                alert('❌ Acesso negado! Apenas administradores podem acessar esta área.');
                router.push('/dashboard');
                return;
            }

            setUser(userData);
            setLogs(logsData);
            setLoading(false);
            setIsRefreshing(false);
        } catch (err: any) {
            console.error('Erro ao buscar dados:', err);
            setError('Erro ao carregar dados');
            setLoading(false);
            setIsRefreshing(false);
            if (err.status === 401 || err.status === 403) {
                localStorage.removeItem('token');
                router.push('/login');
            }
        }
    };

    const fetchTransactionLogs = async (txId: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const userData = await getCurrentUser();

            // Verificar se usuário é admin
            if (userData.role !== 'ADMIN') {
                alert('❌ Acesso negado! Apenas administradores podem acessar esta área.');
                router.push('/dashboard');
                return;
            }

            setUser(userData);

            const txLogs = await getLogsByTransactionId(txId);
            setTransactionLogs(txLogs);
            setTransactionId(txId);
            setLoading(false);
        } catch (err: any) {
            console.error('Erro ao buscar logs da transação:', err);
            setError('Erro ao carregar logs da transação');
            setLoading(false);
            if (err.status === 401 || err.status === 403) {
                localStorage.removeItem('token');
                router.push('/login');
            }
        }
    };

    const clearTransactionFilter = () => {
        setTransactionId(null);
        setTransactionLogs(null);
        router.push('/admin/logs');
        fetchData();
    };

    const goToNextPage = () => {
        if (logs?.meta.hasNextPage) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchData(false, nextPage, itemsPerPage);
        }
    };

    const goToPreviousPage = () => {
        if (logs?.meta.hasPreviousPage) {
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

    const handleViewDetails = async (logId: string) => {
        try {
            const logDetails = await getLogById(logId);
            setSelectedLog(logDetails);
            setShowModal(true);
        } catch (err) {
            alert('Erro ao buscar detalhes do log');
        }
    };

    useEffect(() => {
        const txId = searchParams.get('transactionId');
        if (txId) {
            fetchTransactionLogs(txId);
        } else {
            fetchData();
        }
    }, [router]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && user) {
                fetchData(true, currentPage, itemsPerPage);
            }
        }, 10000); // 10 segundos

        return () => clearInterval(interval);
    }, [loading, user, currentPage, itemsPerPage]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Erro ao carregar dados'}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    const getLogTypeColor = (typeLog: string) => {
        if (typeLog.includes('FAILED') || typeLog.includes('ERROR')) return 'bg-red-100 text-red-800';
        if (typeLog.includes('COMPLETED') || typeLog.includes('SUCCESS')) return 'bg-green-100 text-green-800';
        if (typeLog.includes('PROCESSING') || typeLog.includes('LOGIN')) return 'bg-blue-100 text-blue-800';
        if (typeLog.includes('CREATED')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getLogTypeIcon = (typeLog: string) => {
        if (typeLog.includes('USER')) return '👤';
        if (typeLog.includes('TRANSACTION')) return '💸';
        if (typeLog.includes('RABBITMQ')) return '🐰';
        if (typeLog.includes('LOGIN')) return '🔐';
        return '📝';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-indigo-700">Sistema de Logs</h1>
                        <p className="text-sm text-gray-500">Área Administrativa</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/admin')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
                        >
                            ← Voltar
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl shadow-xl px-8 py-8 mb-6 text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">📊 Logs do Sistema</h2>
                    <p className="text-indigo-100 text-sm">Monitore todas as ações e eventos do sistema</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-5">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total de Logs</h3>
                        <p className="text-3xl font-bold text-indigo-600">{logs?.meta.total || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-5">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Página Atual</h3>
                        <p className="text-3xl font-bold text-blue-600">{logs?.meta.page || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-5">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total de Páginas</h3>
                        <p className="text-3xl font-bold text-cyan-600">{logs?.meta.totalPages || 0}</p>
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6">
                    {/* Banner de Filtro por Transação */}
                    {transactionId && (
                        <div className="mb-5 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🔍</span>
                                    <div>
                                        <h4 className="font-bold text-indigo-900">Filtrando por Transação</h4>
                                        <p className="text-sm text-indigo-700">
                                            ID: <span className="font-mono font-semibold">{transactionId.substring(0, 16)}...</span>
                                        </p>
                                        <p className="text-xs text-indigo-600 mt-1">
                                            Total de logs: {transactionLogs?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearTransactionFilter}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpar Filtro
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Logs do Sistema</h3>
                            {isRefreshing && (
                                <div className="flex items-center gap-2 text-indigo-600 text-xs">
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Atualizando...</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setFilterErrors(!filterErrors)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterErrors
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {filterErrors ? '🐛 Mostrando Apenas Erros' : '🔍 Mostrar Apenas Erros'}
                        </button>
                    </div>

                    {/* Exibição de Logs */}
                    {transactionLogs ? (
                        // Mostrando logs filtrados por transação
                        transactionLogs.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-sm text-gray-500">Nenhum log encontrado para esta transação</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactionLogs
                                    .filter(log => !filterErrors || log.typeLog.includes('ERROR') || log.typeLog.includes('FAILED'))
                                    .map((log) => {
                                        const isError = log.typeLog.includes('ERROR') || log.typeLog.includes('FAILED');
                                        return (
                                            <div
                                                key={log.id}
                                                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${isError ? 'border-red-300 bg-red-50' : 'border-indigo-300 bg-indigo-50'
                                                    }`}
                                                onClick={() => handleViewDetails(log.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="text-2xl">{isError ? '🚨' : getLogTypeIcon(log.typeLog)}</div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getLogTypeColor(log.typeLog)}`}>
                                                                    {log.typeLog.replace(/_/g, ' ')}
                                                                </span>
                                                                {log.statusCode && (
                                                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${log.statusCode < 300 ? 'bg-green-100 text-green-800' :
                                                                            log.statusCode < 400 ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {log.statusCode}
                                                                    </span>
                                                                )}
                                                                {isError && (
                                                                    <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">
                                                                        ⚠️ ERRO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm mb-1 ${isError ? 'text-red-800 font-semibold' : 'text-gray-700'}`}>
                                                                {log.message || 'Sem mensagem'}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                <span>📅 {new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                                                {log.userId && <span>👤 User: {log.userId.substring(0, 8)}...</span>}
                                                                {log.transactionId && <span>💸 TX: {log.transactionId.substring(0, 8)}...</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className={`text-sm font-medium ${isError ? 'text-red-600 hover:text-red-800' : 'text-indigo-600 hover:text-indigo-800'}`}>
                                                        Ver Detalhes →
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )
                    ) : !logs || logs.data.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-sm text-gray-500">Nenhum log encontrado</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {logs.data
                                    .filter(log => !filterErrors || log.typeLog.includes('ERROR') || log.typeLog.includes('FAILED'))
                                    .map((log) => {
                                        const isError = log.typeLog.includes('ERROR') || log.typeLog.includes('FAILED');
                                        return (
                                            <div
                                                key={log.id}
                                                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${isError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                    }`}
                                                onClick={() => handleViewDetails(log.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="text-2xl">{isError ? '🚨' : getLogTypeIcon(log.typeLog)}</div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getLogTypeColor(log.typeLog)}`}>
                                                                    {log.typeLog.replace(/_/g, ' ')}
                                                                </span>
                                                                {log.statusCode && (
                                                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${log.statusCode < 300 ? 'bg-green-100 text-green-800' :
                                                                        log.statusCode < 400 ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {log.statusCode}
                                                                    </span>
                                                                )}
                                                                {isError && (
                                                                    <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">
                                                                        ⚠️ ERRO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm mb-1 ${isError ? 'text-red-800 font-semibold' : 'text-gray-700'}`}>
                                                                {log.message || 'Sem mensagem'}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                <span>📅 {new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                                                {log.userId && <span>👤 User: {log.userId.substring(0, 8)}...</span>}
                                                                {log.transactionId && <span>💸 TX: {log.transactionId.substring(0, 8)}...</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className={`text-sm font-medium ${isError ? 'text-red-600 hover:text-red-800' : 'text-indigo-600 hover:text-indigo-800'}`}>
                                                        Ver Detalhes →
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>

                            {/* Paginação - Apenas quando NÃO está filtrando por transação */}
                            {!transactionId && logs.meta.total > 0 && (
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Mostrando {logs.data.length} de {logs.meta.total} logs
                                        <span className="mx-2">•</span>
                                        Página {logs.meta.page} de {logs.meta.totalPages}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value={5}>5 por página</option>
                                            <option value={10}>10 por página</option>
                                            <option value={20}>20 por página</option>
                                            <option value={50}>50 por página</option>
                                        </select>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={goToPreviousPage}
                                                disabled={!logs.meta.hasPreviousPage}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ← Anterior
                                            </button>

                                            <div className="hidden sm:flex gap-1">
                                                {Array.from({ length: Math.min(5, logs.meta.totalPages) }, (_, i) => {
                                                    let pageNumber;
                                                    if (logs.meta.totalPages <= 5) {
                                                        pageNumber = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNumber = i + 1;
                                                    } else if (currentPage >= logs.meta.totalPages - 2) {
                                                        pageNumber = logs.meta.totalPages - 4 + i;
                                                    } else {
                                                        pageNumber = currentPage - 2 + i;
                                                    }

                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => goToPage(pageNumber)}
                                                            className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${currentPage === pageNumber
                                                                ? 'bg-indigo-600 text-white border-indigo-600'
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
                                                disabled={!logs.meta.hasNextPage}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Modal de Detalhes */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className={`text-white px-6 py-4 rounded-t-xl ${selectedLog.typeLog.includes('ERROR') || selectedLog.typeLog.includes('FAILED')
                            ? 'bg-gradient-to-r from-red-600 to-red-700'
                            : 'bg-gradient-to-r from-indigo-600 to-blue-600'
                            }`}>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {selectedLog.typeLog.includes('ERROR') || selectedLog.typeLog.includes('FAILED') ? '🚨' : '📋'}
                                Detalhes do Log
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Destaque de Erro */}
                            {(selectedLog.typeLog.includes('ERROR') || selectedLog.typeLog.includes('FAILED')) && (
                                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">⚠️</span>
                                        <span className="font-bold text-red-800">ERRO DETECTADO</span>
                                    </div>
                                    <p className="text-sm text-red-700">
                                        Este log registra um erro no sistema. Veja os detalhes abaixo para identificar a causa.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase">ID do Log</label>
                                <p className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded">{selectedLog.id}</p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase">Tipo de Log</label>
                                <p className="mt-1">
                                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getLogTypeColor(selectedLog.typeLog)}`}>
                                        {getLogTypeIcon(selectedLog.typeLog)} {selectedLog.typeLog.replace(/_/g, ' ')}
                                    </span>
                                </p>
                            </div>

                            {selectedLog.statusCode && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Status Code</label>
                                    <p className={`text-2xl font-bold ${selectedLog.statusCode >= 400 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {selectedLog.statusCode}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase">Mensagem</label>
                                <p className={`text-sm p-3 rounded ${selectedLog.typeLog.includes('ERROR') || selectedLog.typeLog.includes('FAILED')
                                    ? 'bg-red-50 text-red-900 border border-red-200'
                                    : 'bg-gray-50 text-gray-800'
                                    }`}>
                                    {selectedLog.message || 'Sem mensagem'}
                                </p>
                            </div>

                            {selectedLog.userId && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase">ID do Usuário</label>
                                    <p className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded">{selectedLog.userId}</p>
                                </div>
                            )}

                            {selectedLog.transactionId && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase">ID da Transação</label>
                                    <p className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded">{selectedLog.transactionId}</p>
                                </div>
                            )}

                            {/* Stack Trace Destacado */}
                            {selectedLog.metadata?.stackTrace && (
                                <div>
                                    <label className="text-xs font-semibold text-red-600 uppercase flex items-center gap-2">
                                        <span>🔍</span> Stack Trace (Rastreamento de Erro)
                                    </label>
                                    <pre className="text-xs text-red-900 bg-red-50 border border-red-200 p-4 rounded overflow-x-auto font-mono max-h-96">
                                        {selectedLog.metadata.stackTrace}
                                    </pre>
                                </div>
                            )}

                            {/* Metadata completo */}
                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase">
                                        Metadata Completo {selectedLog.metadata.context && `(${selectedLog.metadata.context})`}
                                    </label>
                                    <div className="bg-gray-900 rounded p-4 overflow-x-auto">
                                        <pre className="text-xs text-green-400 font-mono">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase">Data de Criação</label>
                                <p className="text-sm text-gray-800">{new Date(selectedLog.createdAt).toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${selectedLog.typeLog.includes('ERROR') || selectedLog.typeLog.includes('FAILED')
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
