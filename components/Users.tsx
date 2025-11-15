import React from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const Users: React.FC = () => {
  const { users, openModal, deleteUser } = useAppContext();

  const handleEdit = (user: User) => {
    openModal('ADD_EDIT_USER', { user });
  };
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
        <button onClick={() => openModal('ADD_EDIT_USER')} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-light-green transition-colors">
          Adicionar Usuário
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome de Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível de Acesso</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700 capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
             <p className="text-center text-gray-500 py-8">Nenhum usuário cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default Users;