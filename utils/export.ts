import { ShiftRecord, Loom, Operator, Product, ActiveShift, ProductionEntry, Settings } from '../types';
import { formatDuration } from './time';

declare const jsPDF: any;
declare const XLSX: any;

const getLoomInfo = (loomId: string, looms: Loom[], operators: Operator[], products: Product[], shiftName: string) => {
    const loom = looms.find(l => l.id === loomId);
    if (!loom) return { code: 'N/A', operator: 'N/A', product: 'N/A' };

    const operatorId = loom.operatorIds[shiftName];
    const operator = operators.find(o => o.id === operatorId);
    const product = products.find(p => p.id === loom.productId);

    return {
        code: loom.code,
        operator: operator?.name || 'N/A',
        product: product?.name || 'N/A'
    };
};

const calculateTotalProduction = (loomId: string, productionEntries: ProductionEntry[]): number => {
    const entries = productionEntries.filter(p => p.loomId === loomId).sort((a,b) => a.timestamp - b.timestamp);
    if (entries.length < 2) return 0;
    const firstReading = entries[0].reading;
    const lastReading = entries[entries.length - 1].reading;
    return Math.max(0, lastReading - firstReading);
}

const addHeaderToPDF = (doc: any, title: string, settings: Settings) => {
    const pageWidth = doc.internal.pageSize.width;
    
    // Logo
    if (settings.companyLogo) {
        try {
            doc.addImage(settings.companyLogo, 'PNG', 14, 8, 20, 20); // Assume PNG/JPEG/etc.
        } catch (e) {
            console.error("Failed to add logo to PDF:", e);
        }
    }

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(settings.companyName, pageWidth / 2, 25, { align: 'center' });

    // Reset styles
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    return 35; // Return the starting Y position for content
}


export const exportToPDF = (record: ShiftRecord, looms: Loom[], operators: Operator[], products: Product[], settings: Settings) => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    let y = addHeaderToPDF(doc, "Relatório de Turno", settings);

    const pageHeight = doc.internal.pageSize.height;

    const checkPageEnd = () => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 15;
        }
    };

    doc.setFontSize(12);
    doc.text(`Turno: ${record.shiftName}`, 14, y);
    doc.text(`Data: ${new Date(record.userStartTime).toLocaleDateString()}`, 105, y, { align: 'center' });
    doc.text(`Responsável: ${record.responsible}`, 196, y, { align: 'right' });
    y += 10;
    
    // Production Summary
    doc.setFontSize(14);
    doc.text("Resumo da Produção", 14, y);
    y += 6;
    checkPageEnd();
    const productionBody = looms.map(loom => {
        const info = getLoomInfo(loom.id, looms, operators, products, record.shiftName);
        const totalProduction = calculateTotalProduction(loom.id, record.production);
        return [info.code, info.product, info.operator, totalProduction.toFixed(2) + ' m'];
    });

    doc.autoTable({
        startY: y,
        head: [['Tear', 'Produto', 'Operador', 'Produção Total']],
        body: productionBody,
        theme: 'striped'
    });
    y = doc.autoTable.previous.finalY + 10;
    checkPageEnd();
    
    if (record.maintenance.length > 0) {
        doc.setFontSize(14);
        doc.text("Paradas de Manutenção", 14, y);
        y += 6;
        checkPageEnd();
        doc.autoTable({
            startY: y,
            head: [['Tear', 'Motivo', 'Início', 'Fim', 'Duração', 'Obs']],
            body: record.maintenance.map(m => {
                const info = getLoomInfo(m.loomId, looms, operators, products, record.shiftName);
                return [info.code, m.reason, new Date(m.start).toLocaleTimeString(), m.end ? new Date(m.end).toLocaleTimeString() : 'Ativa', formatDuration((m.end || Date.now())- m.start), m.notes || ''];
            }),
            theme: 'striped'
        });
        y = doc.autoTable.previous.finalY + 10;
        checkPageEnd();
    }
   
    if (record.interventions.length > 0) {
        doc.setFontSize(14);
        doc.text("Paradas Operacionais", 14, y);
        y += 6;
        checkPageEnd();
        doc.autoTable({
            startY: y,
            head: [['Tear', 'Motivo', 'Início', 'Fim', 'Duração', 'Obs']],
            body: record.interventions.map(i => {
                const info = getLoomInfo(i.loomId, looms, operators, products, record.shiftName);
                return [info.code, i.reason, new Date(i.start).toLocaleTimeString(), i.end ? new Date(i.end).toLocaleTimeString() : 'Ativa', formatDuration((i.end || Date.now()) - i.start), i.notes || ''];
            }),
            theme: 'striped'
        });
        y = doc.autoTable.previous.finalY + 10;
        checkPageEnd();
    }

    doc.setFontSize(12);
    if(record.summary) {
        doc.text("Resumo do Turno:", 14, y);
        y += 6;
        const summaryLines = doc.splitTextToSize(record.summary, 180);
        doc.text(summaryLines, 14, y);
        y += summaryLines.length * 5 + 5;
        checkPageEnd();
    }
     if(record.actionPlans) {
        doc.text("Plano de Ação:", 14, y);
        y += 6;
        const actionPlanLines = doc.splitTextToSize(record.actionPlans, 180);
        doc.text(actionPlanLines, 14, y);
     }
    
    doc.save(`Relatorio_Turno_${record.shiftName}_${new Date(record.userStartTime).toLocaleDateString()}.pdf`);
};


export const exportToExcel = (record: ShiftRecord | ActiveShift, looms: Loom[], operators: Operator[], products: Product[], settings: Settings, fileName: string) => {
    const wb = XLSX.utils.book_new();
    
    let totalShiftProduction = 0;
    looms.forEach(loom => {
        totalShiftProduction += calculateTotalProduction(loom.id, record.production);
    });

    const summaryData: (string | number)[][] = [
        ["Turno", record.shiftName],
        ["Data Início", new Date(record.userStartTime).toLocaleString()],
        ["Responsável", record.responsible],
        ["Apontador", record.recorder],
        ["Produção Total do Turno (m)", totalShiftProduction.toFixed(2)],
    ];
    if ('summary' in record && record.summary) summaryData.push(["Resumo", record.summary]);
    if ('actionPlans' in record && record.actionPlans) summaryData.push(["Plano de Ação", record.actionPlans]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    // Production Sheet
    const productionData = looms.map(loom => {
        const info = getLoomInfo(loom.id, looms, operators, products, record.shiftName);
        const totalProduction = calculateTotalProduction(loom.id, record.production);
        return {
            Tear: info.code,
            Produto: info.product,
            Operador: info.operator,
            'Produção Total (m)': totalProduction,
        }
    });
    const wsProduction = XLSX.utils.json_to_sheet(productionData);
    XLSX.utils.book_append_sheet(wb, wsProduction, "Produção");

    // Stops Sheet
    const stopsData = [...record.maintenance, ...record.interventions].map(s => {
        const info = getLoomInfo(s.loomId, looms, operators, products, record.shiftName);
        return {
            Tear: info.code,
            Tipo: 'reason' in s ? "Manutenção" : "Operacional",
            Motivo: s.reason,
            Início: new Date(s.start).toLocaleString(),
            Fim: s.end ? new Date(s.end).toLocaleString() : 'Ativa',
            Duração: formatDuration((s.end || Date.now()) - s.start),
            Observações: s.notes || ''
        }
    }).sort((a,b) => a.Tear.localeCompare(b.Tear));
     const wsStops = XLSX.utils.json_to_sheet(stopsData);
    XLSX.utils.book_append_sheet(wb, wsStops, "Paradas");

    // ITH Losses Sheet
    if (record.ithInterventions && record.ithInterventions.length > 0) {
        const ithLossesData = record.ithInterventions.map(ith => {
            const loom = looms.find(l => l.id === ith.loomId);
            const product = products.find(p => p.id === loom?.productId);
            const reason = settings.ithStopReasons.find(r => r.id === ith.reasonId);
            
            const hourlyGoal = (product && product.threadDensity > 0)
                ? (product.standardRpm * 60) / (product.threadDensity * 10)
                : 0;

            const lossMeters = (1 * hourlyGoal) / 60; // Assuming 1 min loss
            const lossKg = (product && product.fabricWidthM && product.grammageM2)
                ? (lossMeters * product.fabricWidthM * product.grammageM2) / 1000
                : 0;
            
            return {
                'Horário': new Date(ith.timestamp).toLocaleString('pt-BR'),
                'Tear': loom?.code || 'N/A',
                'Cód. Causa': reason?.code || 'N/A',
                'Descrição Causa': reason?.description || 'N/A',
                'Perda (m)': lossMeters.toFixed(2),
                'Perda (kg)': lossKg.toFixed(2),
            };
        }).sort((a,b) => a['Tear'].localeCompare(b['Tear']) || a['Horário'].localeCompare(b['Horário']));
        
        const wsIthLosses = XLSX.utils.json_to_sheet(ithLossesData);
        XLSX.utils.book_append_sheet(wb, wsIthLosses, "Perdas ITH");
    }

    XLSX.writeFile(wb, `${fileName.replace(/[/ ]/g, "_")}.xlsx`);
}

export const exportOperatorReportToPDF = (
    operatorName: string,
    date: string,
    entries: { time: string, loomCode: string, reading: number, produced: number }[],
    totalProduced: number,
    settings: Settings,
) => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    const title = "Relatório Individual de Produção";
    let y = addHeaderToPDF(doc, title, settings);

    doc.setFontSize(12);
    doc.text(`Operador: ${operatorName}`, 14, y);
    doc.text(`Data: ${date}`, 196, y, { align: 'right' });
    y += 10;
    
    doc.setFontSize(10);
    doc.text(`Produção Total do Dia: ${totalProduced.toFixed(2)} m`, 14, y);
    y+= 10;


    const body = entries.map(entry => [
        entry.time,
        entry.loomCode,
        entry.reading.toFixed(2),
        entry.produced > 0 ? `+${entry.produced.toFixed(2)} m` : '-'
    ]);

    doc.autoTable({
        startY: y,
        head: [['Horário', 'Tear', 'Leitura (m)', 'Produzido na Hora']],
        body: body,
        theme: 'striped'
    });
    
    doc.save(`Relatorio_${operatorName.replace(/ /g, '_')}_${date.replace(/\//g, '-')}.pdf`);
};