'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NovaTransacaoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        receiverEmail: '',
        amount: '',
        paymentMethod: 'PIX',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch('http://localhost:3000/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    receiverEmail: formData.receiverEmail,
                    amount: parseFloat(formData.amount),
                    paymentMethod: formData.paymentMethod,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro ao criar transação');
            }

            // Redirecionar para o dashboard
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Erro ao criar transação:', err);
            setError(err.message || 'Erro ao criar transação');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center py-8 px-4">
            {/* Main Content */}
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6">
                    <div className="text-center mb-6">
                        <div className="bg-emerald-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Nova Transação</h2>
                        <p className="text-sm text-gray-500">Envie dinheiro para outro usuário</p>
                    </div>
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email do Destinatário */}
                        <div>
                            <label htmlFor="receiverEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email do Destinatário
                            </label>
                            <input
                                type="email"
                                id="receiverEmail"
                                required
                                value={formData.receiverEmail}
                                onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder="destinatario@email.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Valor */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                                Valor (R$)
                            </label>
                            <input
                                type="number"
                                id="amount"
                                required
                                min="0.01"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder="0,00"
                                disabled={loading}
                            />
                        </div>

                        {/* Método de Pagamento */}
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-semibold text-gray-700 mb-2">
                                Método de Pagamento
                            </label>
                            <select
                                id="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                disabled={loading}
                            >
                                <option value="PIX">PIX</option>
                                <option value="CARTAO_DE_CREDITO">Cartão de Crédito</option>
                            </select>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processando...' : 'Enviar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
