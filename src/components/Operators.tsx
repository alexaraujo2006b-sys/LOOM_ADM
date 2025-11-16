import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Operator } from '@/types';

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);


const Operators: React.FC = () => {
  const { operators, openModal, deleteOperator } = useAppContext();

  const handleEdit = (operator: Operator) => {
    openModal('ADD_EDIT_OPERATOR', { operator });
  };
  
  const handleDelete = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir este operador?')) {
      deleteOperator(id);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Cadastro de Operadores</h1>
        <button onClick={() => openModal('ADD_EDIT_OPERATOR')} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-light-green transition-colors">
          Adicionar Operador
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operators.map(op => (
              <tr key={op.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{op.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{op.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{op.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{op.shiftName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button onClick={() => handleEdit(op)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(op.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {operators.length === 0 && (
             <p className="text-center text-gray-500 py-8">Nenhum operador cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default Operators;
