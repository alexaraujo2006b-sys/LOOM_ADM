import React from 'react';
import { useAppContext } from '../context/AppContext';

const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
);
const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
);
const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

const OperatorView: React.FC = () => {
    const { activeShift, looms, openModal } = useAppContext();

    if (!activeShift) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Nenhum turno ativo.</h2>
                    <p className="text-gray-500">Por favor, inicie um novo turno na visão principal para começar os lançamentos.</p>
                </div>
            </div>
        );
    }
    
    const ActionButton: React.FC<{ label: string; onClick: () => void; icon: React.ReactNode }> = ({ label, onClick, icon }) => (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center w-full h-32 bg-brand-green text-white p-4 rounded-lg shadow-lg hover:bg-brand-light-green transition-transform transform hover:scale-105"
        >
            {icon}
            <span className="mt-2 text-lg font-semibold text-center">{label}</span>
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <header className="text-center mb-8 bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800">Visão do Operador</h1>
                <p className="text-gray-600 mt-2 text-lg">
                    Turno: <span className="font-semibold text-brand-green">{activeShift.shiftName}</span> | Responsável: <span className="font-semibold text-brand-green">{activeShift.responsible}</span>
                </p>
            </header>

            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Ações Gerais do Turno</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActionButton label="Lançar Produção" onClick={() => openModal('LOG_PRODUCTION')} icon={<EditIcon className="w-8 h-8"/>} />
                    <ActionButton label="Parada Manutenção" onClick={() => openModal('MANAGE_MAINTENANCE')} icon={<WrenchIcon className="w-8 h-8"/>} />
                    <ActionButton label="Parada Operacional" onClick={() => openModal('MANAGE_INTERVENTION')} icon={<AlertTriangleIcon className="w-8 h-8"/>} />
                    <ActionButton label="Lançar Qualidade" onClick={() => openModal('LOG_QUALITY')} icon={<ShieldCheckIcon className="w-8 h-8"/>} />
                </div>
            </section>
            
            <section className="mt-12">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Registrar Microparada (ITH)</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                     {looms.map(loom => (
                         <button 
                            key={loom.id}
                            onClick={() => openModal('LOG_ITH', { loomId: loom.id })}
                            className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-lg shadow-md hover:border-orange-500 hover:bg-orange-50 transition"
                         >
                            <ZapIcon className="w-6 h-6 text-orange-500" />
                            <span className="text-lg font-bold text-gray-800">{loom.code}</span>
                         </button>
                     ))}
                 </div>
            </section>
        </div>
    );
};

export default OperatorView;