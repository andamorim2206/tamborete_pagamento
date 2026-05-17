'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser, ApiError } from '@/lib/api';

export default function CadastroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validações em tempo real
  const validateName = (name: string): string => {
    if (!name) return 'Nome é obrigatório';
    if (name.length < 3) return 'Nome deve ter no mínimo 3 caracteres';
    if (name.length > 100) return 'Nome deve ter no máximo 100 caracteres';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) return 'Nome deve conter apenas letras';
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email) return 'Email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email inválido';
    if (email.length > 255) return 'Email deve ter no máximo 255 caracteres';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Senha é obrigatória';
    if (password.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
    if (password.length > 100) return 'Senha deve ter no máximo 100 caracteres';
    if (!/(?=.*[a-z])/.test(password)) return 'Senha deve conter ao menos uma letra minúscula';
    if (!/(?=.*[A-Z])/.test(password)) return 'Senha deve conter ao menos uma letra maiúscula';
    if (!/(?=.*\d)/.test(password)) return 'Senha deve conter ao menos um número';
    if (!/(?=.*[@$!%*?&#])/.test(password)) return 'Senha deve conter ao menos um caractere especial (@$!%*?&#)';
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return 'Confirmação de senha é obrigatória';
    if (password !== confirmPassword) return 'As senhas não coincidem';
    return '';
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; width: string } => {
    if (!password) return { strength: '', color: '', width: '0%' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#]/.test(password)) score++;

    if (score <= 2) return { strength: 'Fraca', color: 'bg-red-500', width: '33%' };
    if (score <= 3) return { strength: 'Média', color: 'bg-yellow-500', width: '66%' };
    return { strength: 'Forte', color: 'bg-green-500', width: '100%' };
  };

  const handleFieldBlur = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.password, value);
        break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validar todos os campos
    const errors: Record<string, string> = {};
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);

    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Por favor, corrija os erros no formulário.');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, isAdmin, ...dataToSend } = formData;
      const payload = {
        ...dataToSend,
        role: isAdmin ? 'ADMIN' : 'USER',
      };
      await registerUser(payload);
      alert('✅ Cadastro realizado com sucesso! Faça login.');
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-t-3xl px-8 py-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-emerald-100 text-sm">Sistema de Pagamentos Tamborete</p>
        </div>

        {/* Form */}
        <div className="px-8 py-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="João Silva"
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${fieldErrors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                onBlur={(e) => handleFieldBlur('name', e.target.value)}
              />
              {fieldErrors.name && (
                <p className="text-red-600 text-xs mt-1.5">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail *
              </label>
              <input
                type="email"
                required
                placeholder="joao@example.com"
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${fieldErrors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                onBlur={(e) => handleFieldBlur('email', e.target.value)}
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-xs mt-1.5">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all pr-12 ${fieldErrors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                  }}
                  onBlur={(e) => handleFieldBlur('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                        style={{ width: getPasswordStrength(formData.password).width }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {getPasswordStrength(formData.password).strength}
                    </span>
                  </div>
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1.5">{fieldErrors.password}</p>
              )}
              <p className="text-gray-500 text-xs mt-1.5">
                Mínimo 8 caracteres com letras, números e símbolos
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all pr-12 ${fieldErrors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1.5">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                />
                <div className="ml-3">
                  <span className="text-sm font-semibold text-gray-900">Cadastrar como Administrador</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Administradores têm acesso a todas as transações do sistema
                  </p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                Faça login aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
