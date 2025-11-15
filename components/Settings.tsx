import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Loom, ShiftTime, AppData } from '../types';

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const LoaderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;


const Settings: React.FC = () => {
  const { settings, setSettings, looms, setLooms, openModal, products, operators, deleteIthStopReason, backupData, restoreData, fileHandle, connectToFile, disconnectFile, isSaving } = useAppContext();
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const parsedData = JSON.parse(text) as AppData;
                    if (parsedData.looms && parsedData.settings && parsedData.products) {
                         restoreData(parsedData);
                    } else {
                        alert("Arquivo de backup inválido ou corrompido.");
                    }
                }
            } catch (error) {
                alert("Erro ao ler o arquivo de backup.");
            }
        };
        reader.readAsText(file);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setSettings(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setSettings(prev => ({ ...prev, companyLogo: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShiftChange = (index: number, field: keyof ShiftTime, value: string) => {
    setSettings(prev => {
        const newShifts = [...prev.shifts];
        newShifts[index] = { ...newShifts[index], [field]: value };
        return { ...prev, shifts: newShifts };
    });
  };
  
  const handleLoomChange = (index: number, field: keyof Loom, value: string | number) => {
    setLooms(prev => {
        const newLooms = [...prev];
        const loom = newLooms[index];
        (loom[field] as any) = value;
        return newLooms;
    });
  };
  
  const handleLoomProductSelectChange = (index: number, value: string) => {
     setLooms(prev => prev.map((loom, i) => i === index ? { ...loom, productId: value } : loom));
  }

  const handleLoomOperatorChange = (loomIndex: number, shiftName: string, operatorId: string) => {
    setLooms(prev => {
        const newLooms = [...prev];
        const loom = newLooms[loomIndex];
        loom.operatorIds = { ...loom.operatorIds, [shiftName]: operatorId };
        return newLooms;
    });
  };

  const inputStyle = "mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green";
  const selectStyle = "mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green bg-white";

  return (
    <div className="p-2 sm:p-4 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Configurações Gerais</h1>

       {/* Sincronização de Arquivo Local */}
       <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 border-b pb-2">Sincronização com Arquivo Local</h2>
          <p className="text-sm text-gray-500 mb-4">Salve seus dados diretamente em um arquivo no seu computador para garantir backup e acesso offline. Ideal para PWA.</p>
          <div className="flex flex-wrap gap-4 items-center">
              <button onClick={connectToFile} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400" disabled={!!fileHandle}>
                Conectar Arquivo
              </button>
              <button onClick={disconnectFile} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold disabled:bg-gray-400" disabled={!fileHandle}>
                Desconectar
              </button>
              <div className="flex-1 min-w-[250px]">
                {fileHandle ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-md">
                    <CheckCircleIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium">Conectado a: <span className="font-bold">{fileHandle.name}</span></span>
                    {isSaving && <LoaderIcon className="w-4 h-4 text-green-700"/>}
                  </div>
                ) : (
                   <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-2 rounded-md">
                    <AlertCircleIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium">Não conectado a um arquivo local.</span>
                  </div>
                )}
              </div>
          </div>
      </div>

      {/* Backup e Restauração */}
      <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Backup e Restauração (Manual)</h2>
          <div className="flex flex-wrap gap-4 items-center">
              <button onClick={backupData} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold">Fazer Backup</button>
              <input type="file" accept=".json" onChange={handleRestore} ref={restoreInputRef} className="hidden" />
              <button onClick={() => restoreInputRef.current?.click()} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold">Restaurar Backup</button>
              <p className="text-sm text-gray-600 flex-1">Use esta seção para baixar ou carregar manualmente um arquivo de backup (`.json`).</p>
          </div>
      </div>
      
      {/* Identidade Visual */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Identidade Visual</h2>
         <p className="text-sm text-gray-500 mb-4 -mt-2">As alterações são salvas automaticamente.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
            <input type="text" name="companyName" value={settings.companyName} onChange={handleSettingsChange} className={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logotipo</label>
            <div className="mt-1 flex items-center gap-4">
              {settings.companyLogo && <img src={settings.companyLogo} alt="Logo" className="h-12 w-12 object-contain rounded-md bg-gray-100 p-1" />}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-green file:text-white hover:file:bg-brand-light-green cursor-pointer"/>
            </div>
          </div>
        </div>
      </div>
      
      {/* Horários dos Turnos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Horários dos Turnos</h2>
        <div className="space-y-4">
          {settings.shifts.map((shift, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <input type="text" value={shift.name} onChange={e => handleShiftChange(index, 'name', e.target.value)} className={inputStyle} />
              <input type="time" value={shift.start} onChange={e => handleShiftChange(index, 'start', e.target.value)} className={inputStyle} />
              <input type="time" value={shift.end} onChange={e => handleShiftChange(index, 'end', e.target.value)} className={inputStyle} />
            </div>
          ))}
        </div>
      </div>
      
        {/* ITH Stop Reasons */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold">Causas de ITH (Microparadas)</h2>
                <button onClick={() => openModal('ADD_EDIT_ITH_REASON', { isEditing: false })} className="bg-brand-green text-white px-4 py-1 rounded-md hover:bg-brand-light-green text-sm font-semibold">
                    Adicionar Causa
                </button>
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 border rounded-md">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="text-left font-medium p-2">Código</th>
                            <th className="text-left font-medium p-2">Descrição</th>
                            <th className="text-right font-medium p-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {settings.ithStopReasons.map(r => (
                            <tr key={r.id} className="border-t">
                                <td className="p-2 font-mono">{r.code}</td>
                                <td className="p-2">{r.description}</td>
                                <td className="p-2 text-right space-x-2">
                                    <button onClick={() => openModal('ADD_EDIT_ITH_REASON', { reason: r, isEditing: true })} title="Editar"><EditIcon className="inline text-blue-600 hover:text-blue-800"/></button>
                                    <button onClick={() => deleteIthStopReason(r.id)} title="Excluir"><TrashIcon className="inline text-red-600 hover:text-red-800"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

       {/* Cadastro de Teares */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Cadastro de Teares</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cód</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        {settings.shifts.map(shift => (
                          <th key={shift.name} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Op. {shift.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {looms.map((loom, index) => (
                    <tr key={loom.id}>
                        <td className="px-2 py-1 whitespace-nowrap"><input type="text" value={loom.code} onChange={(e) => handleLoomChange(index, 'code', e.target.value)} className={`${inputStyle} w-24 p-1`} /></td>
                        <td className="px-2 py-1 whitespace-nowrap">
                           <select value={loom.productId} onChange={(e) => handleLoomProductSelectChange(index, e.target.value)} className={`${selectStyle} p-1`}>
                            <option value="">Selecione...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        {settings.shifts.map(shift => {
                          const operatorsForShift = (operators || []).filter(op => op.shiftName === shift.name);
                          return (
                          <td key={shift.name} className="px-2 py-1 whitespace-nowrap">
                            <select value={loom.operatorIds[shift.name] || ''} onChange={(e) => handleLoomOperatorChange(index, shift.name, e.target.value)} className={`${selectStyle} p-1`}>
                              <option value="">Selecione...</option>
                              {operatorsForShift.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                            </select>
                          </td>
                        )})}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;