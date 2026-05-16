import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-12 border border-emerald-100 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-extrabold text-emerald-900 mb-4">Tamborete Pagamentos</h1>
        <p className="text-lg text-emerald-700 mb-8">
          A solução simples e segura para gerenciar seus pagamentos e transferências.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/login" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            Entrar
          </Link>
          <Link 
            href="/cadastro" 
            className="border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 font-medium py-3 px-8 rounded-lg transition-colors"
          >
            Criar Conta
          </Link>
        </div>
      </div>
      <footer className="mt-8 text-emerald-400 text-sm">
        &copy; 2023 Tamborete Pagamentos. Todos os direitos reservados.
      </footer>
    </div>
  );
}