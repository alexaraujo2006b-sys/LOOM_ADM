import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Login: React.FC = () => {
    const { login, settings } = useAppContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!login(username, password)) {
            const errorMessage = 'Usuário ou senha inválidos.';
            setError(errorMessage);
            alert(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    {settings.companyLogo && <img src={settings.companyLogo} alt="Logo" className="w-20 h-20 mx-auto mb-4" />}
                    <h1 className="text-2xl font-bold text-gray-900">{settings.companyName}</h1>
                    <p className="text-gray-600">Controle de Produção</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-brand-green text-white font-semibold rounded-lg shadow-md hover:bg-brand-light-green transition-colors"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;