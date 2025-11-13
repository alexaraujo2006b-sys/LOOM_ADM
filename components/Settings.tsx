import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Loom, ShiftTime } from '../types';

const Settings: React.FC = () => {
  const { settings, setSettings, looms, setLooms, activeShift, openModal, operators, products, addStopReason } = useAppContext();
  const [editableSettings, setEditableSettings] = useState(settings);
  const [editableLooms, setEditableLooms] = useState(looms);

  const [newMaintReason, setNewMaintReason] = useState('');
  const [newOpReason, setNewOpReason] = useState('');

  const avgProductionGoal = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((sum, p) => sum + p.hourlyProductionGoal, 0);
    return total / products.length;
  }, [products]);
  
  // Update the fallback goal in settings state whenever the average changes
  React.useEffect(() => {
     setEditableSettings(prev => ({ ...prev, hourlyProductionGoal: avgProductionGoal }));
  }, [avgProductionGoal]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditableSettings(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleShiftChange = (index: number, field: keyof ShiftTime, value: string) => {
    const newShifts = [...editableSettings.shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setEditableSettings(prev => ({ ...prev, shifts: newShifts }));
  };
  
  const handleLoomChange = (index: number, field: keyof Loom, value: string | number) => {
    const newLooms = [...editableLooms];
    const loom = newLooms[index];
    (loom[field] as any) = value;
    setEditableLooms(newLooms);
  };
  
  const handleLoomProductSelectChange = (index: number, value: string) => {
     const newLooms = editableLooms.map((loom, i) => i === index ? { ...loom, productId: value } : loom);
     setEditableLooms(newLooms);
  }

  const handleLoomOperatorChange = (loomIndex: number, shiftName: string, operatorId: string) => {
    const newLooms = [...editableLooms];
    const loom = newLooms[loomIndex];
    loom.operatorIds = {
      ...loom.operatorIds,
      [shiftName]: operatorId
    };
    setEditableLooms(newLooms);
  };

  const handleAddReason = (type: 'maintenance' | 'operational') => {
    const reason = type === 'maintenance' ? newMaintReason : newOpReason;
    addStopReason(type, reason);
    if (type === 'maintenance') setNewMaintReason('');
    else setNewOpReason('');
  };

  const handleSave = () => {
    if (window.confirm('Deseja salvar todas as alterações?')) {
        setSettings(editableSettings);
        setLooms(editableLooms);
        alert('Configurações salvas com sucesso!');
    }
  };

  const inputStyle = "mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green";
  const selectStyle = "mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green bg-white";

  return (
    <div className="p-2 sm:p-4 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>

      {/* Gerenciamento de Turno */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Gerenciamento de Turno</h2>
        {!activeShift ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <p className="text-gray-600">Nenhum turno ativo no momento.</p>
                <button onClick={() => openModal('START_SHIFT')} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition shadow-sm font-semibold">
                    Iniciar Novo Turno
                </button>
            </div>
        ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>Turno <span className="font-bold text-brand-green">{activeShift.shiftName}</span> está ativo.</p>
                <button onClick={() => openModal('END_SHIFT')} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition shadow-sm font-semibold">
                    Encerrar Turno Atual
                </button>
            </div>
        )}
      </div>

      {/* Configurações Gerais */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Meta de Eficiência (%)</label>
            <input type="number" name="efficiencyGoal" value={editableSettings.efficiencyGoal} onChange={handleSettingsChange} className={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Meta de Produção Padrão (m/h)</label>
            <input type="number" value={avgProductionGoal.toFixed(2)} readOnly className={`${inputStyle} bg-gray-100 cursor-not-allowed`} title="Calculado automaticamente com base na média dos produtos cadastrados."/>
          </div>
        </div>
      </div>
      
      {/* Horários dos Turnos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Horários dos Turnos</h2>
        <div className="space-y-4">
          {editableSettings.shifts.map((shift, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <input type="text" value={shift.name} onChange={e => handleShiftChange(index, 'name', e.target.value)} className={inputStyle} />
              <input type="time" value={shift.start} onChange={e => handleShiftChange(index, 'start', e.target.value)} className={inputStyle} />
              <input type="time" value={shift.end} onChange={e => handleShiftChange(index, 'end', e.target.value)} className={inputStyle} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Motivos de Parada */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Causas de Parada</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-medium text-gray-800 mb-2">Manutenção</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-3">
                        {settings.stopReasons.maintenance.map(r => <li key={r}>{r}</li>)}
                    </ul>
                    <div className="flex gap-2">
                        <input type="text" value={newMaintReason} onChange={e => setNewMaintReason(e.target.value)} placeholder="Nova causa de manutenção" className={inputStyle + " mt-0"} />
                        <button onClick={() => handleAddReason('maintenance')} className="bg-gray-200 px-3 rounded-md hover:bg-gray-300 text-sm font-semibold">+</button>
                    </div>
                </div>
                <div>
                    <h3 className="font-medium text-gray-800 mb-2">Operacional</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-3">
                        {settings.stopReasons.operational.map(r => <li key={r}>{r}</li>)}
                    </ul>
                    <div className="flex gap-2">
                        <input type="text" value={newOpReason} onChange={e => setNewOpReason(e.target.value)} placeholder="Nova causa operacional" className={inputStyle + " mt-0"} />
                        <button onClick={() => handleAddReason('operational')} className="bg-gray-200 px-3 rounded-md hover:bg-gray-300 text-sm font-semibold">+</button>
                    </div>
                </div>
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
                        {editableSettings.shifts.map(shift => (
                          <th key={shift.name} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Op. {shift.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {editableLooms.map((loom, index) => (
                    <tr key={loom.id}>
                        <td className="px-2 py-1 whitespace-nowrap"><input type="text" value={loom.code} onChange={(e) => handleLoomChange(index, 'code', e.target.value)} className={`${inputStyle} w-24 p-1`} /></td>
                        <td className="px-2 py-1 whitespace-nowrap">
                           <select value={loom.productId} onChange={(e) => handleLoomProductSelectChange(index, e.target.value)} className={`${selectStyle} p-1`}>
                            <option value="">Selecione...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        {editableSettings.shifts.map(shift => {
                          const operatorsForShift = operators.filter(op => op.shiftName === shift.name);
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
      
      <div className="flex justify-end mt-8">
        <button onClick={handleSave} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-light-green transition-colors">
          Salvar Todas as Alterações
        </button>
      </div>
    </div>
  );
};

export default Settings;