import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  FileText,
  Printer,
  CalendarDays,
  PackageSearch,
  History,
  Eye,
  FileDown,
  Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

interface ReportRecord {
  id: string;
  type: 'inventario' | 'caja';
  title: string;
  targetDate: string;
  createdAt: string;
}

export const ReportesVentasView: React.FC = () => {
  const { user } = useAuth();
  
  const [cajaDate, setCajaDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportHistory, setReportHistory] = useState<ReportRecord[]>([]);

  const getLongDateString = (dateObj: Date) => {
    return dateObj.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ==========================================
  // GENERADOR PDF: INVENTARIO
  // ==========================================
  const generateInventarioPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-AR');

    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(66, 48, 143); // Color primary (#42308f)
    doc.text('ARIES BOUTIQUE', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte Físico de Mercadería (Inventario y Reposición)', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de emisión: ${dateStr}`, 14, 38);
    doc.text(`Generado por: ${user?.name || 'Administración'}`, 14, 43);

    // Sección 1: Semáforo de Urgencias
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('1. SEMÁFORO DE URGENCIAS (Requieren Reposición)', 14, 55);

    autoTable(doc, {
      startY: 60,
      head: [['Código', 'Producto / Modelo', 'Talle', 'Color', 'Stock', 'Estado']],
      body: [
        ['#201', 'Buzo Oversize Hoodie', 'L', 'Azul Marino', '0 u.', 'AGOTADO'],
        ['#302', 'Jean Wide Leg Denim', '38', 'Celeste', '0 u.', 'AGOTADO'],
        ['#102', 'Remera Estampada Sunset', 'XL', 'Bordó', '2 u.', 'BAJO'],
        ['#105', 'Remera Básica Algodón', 'M', 'Negro', '3 u.', 'BAJO'],
      ],
      headStyles: { fillColor: [66, 48, 143] },
      alternateRowStyles: { fillColor: [248, 249, 255] },
    });

    // Sección 2: Distribución por Categorías
    doc.text('2. DISTRIBUCIÓN POR CATEGORÍAS', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Categoría', 'Volumen Físico', 'Observaciones']],
      body: [
        ['Buzos', '45 u.', 'Quiebre de stock en talles grandes (L/XL).'],
        ['Pantalones', '28 u.', 'Curva incompleta en modelo Denim.'],
        ['Remeras', '112 u.', 'Stock óptimo para la temporada.'],
        ['Accesorios', '30 u.', 'Stock óptimo.'],
      ],
      headStyles: { fillColor: [66, 48, 143] },
    });

    // Guardar Documento
    const fileName = `Inventario_Aries_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    return fileName;
  };

  // ==========================================
  // GENERADOR PDF: CIERRE DE CAJA
  // ==========================================
  const generateCajaPDF = (targetDate: Date) => {
    const doc = new jsPDF();
    const dateStr = targetDate.toLocaleDateString('es-AR');

    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // Color emerald-600
    doc.text('ARIES BOUTIQUE', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte Financiero (Cierre de Caja y Rendimiento)', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período evaluado: Cierre del día ${dateStr}`, 14, 38);
    doc.text(`Generado por: ${user?.name || 'Administración'}`, 14, 43);

    // Balance Financiero Texto
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('1. BALANCE FINANCIERO', 14, 55);
    doc.setFontSize(10);
    doc.text('Total Facturado (Ingresos brutos): $245.500', 18, 63);
    doc.text('Cantidad de Ventas Cerradas: 8 operaciones', 18, 69);
    doc.text('Ticket Promedio por Cliente: $30.687', 18, 75);

    // Sección 2: Desglose por Método de Pago
    doc.setFontSize(12);
    doc.text('2. DESGLOSE POR MÉTODO DE PAGO (Para arqueo)', 14, 90);

    autoTable(doc, {
      startY: 95,
      head: [['Método de Cobro', 'Monto Ingresado', 'Porcentaje']],
      body: [
        ['Transferencia (Mercado Pago / Banco)', '$120.000', '49%'],
        ['Efectivo (Billetes en caja)', '$85.500', '35%'],
        ['Tarjeta (Débito / Crédito)', '$40.000', '16%'],
        ['TOTAL A RENDIR', '$245.500', '100%'],
      ],
      headStyles: { fillColor: [5, 150, 105] },
    });

    // Sección 3: Rendimiento Top 3
    doc.text('3. RENDIMIENTO DE MERCADERÍA (Top 3 Más Vendidos)', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Puesto', 'Producto Estrella', 'Unidades', 'Ingreso Generado']],
      body: [
        ['1°', 'Remera Estampada Sunset', '4 u.', '$79.680'],
        ['2°', 'Buzo Oversize Hoodie', '3 u.', '$110.400'],
        ['3°', 'Top Ribb Manga Corta', '2 u.', '$39.600'],
      ],
      headStyles: { fillColor: [5, 150, 105] },
    });

    // Guardar Documento
    const fileName = `Cierre_Caja_Aries_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    return fileName;
  };

  const handlePrintInventario = () => {
    const now = new Date();
    generateInventarioPDF();
    
    const newRecord: ReportRecord = {
      id: `rep-${Date.now()}`,
      type: 'inventario',
      title: 'Reporte Estado de Inventario',
      targetDate: getLongDateString(now),
      createdAt: now.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
    };
    setReportHistory((prev) => [newRecord, ...prev]);
  };

  const handlePrintCaja = () => {
    const selectedDate = new Date(cajaDate + 'T00:00:00');
    generateCajaPDF(selectedDate);

    const newRecord: ReportRecord = {
      id: `rep-${Date.now()}`,
      type: 'caja',
      title: 'Reporte Cierre de Caja',
      targetDate: getLongDateString(selectedDate),
      createdAt: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
    };
    setReportHistory((prev) => [newRecord, ...prev]);
  };

  const handleReDownload = (report: ReportRecord) => {
    if (report.type === 'inventario') {
      generateInventarioPDF();
    } else {
      // Como es un mockup estático, para el redownload usamos la fecha actual o podrías parsear targetDate
      generateCajaPDF(new Date()); 
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#eff4ff] text-[#42308f] rounded-full text-xs font-bold border border-[#c9c4d3]/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#42308f]" />
              Acceso Exclusivo: Dueña & Desarrollador
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30]">
            Centro de Reportes
          </h1>
          <p className="text-xs sm:text-sm text-[#5e5d69] mt-1">
            Generación de documentos imprimibles (A4) y métricas financieras de la boutique.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* REPORTE 1: INVENTARIO */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/60 card-shadow relative overflow-hidden flex flex-col justify-between group hover:border-[#42308f]/50 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <PackageSearch className="w-32 h-32 text-[#42308f]" />
          </div>
          
          <div className="relative z-10 space-y-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#42308f] flex items-center justify-center shadow-sm border border-[#42308f]/10">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0b1c30]">
                Reporte de Inventario y Reposición
              </h2>
              <p className="text-sm text-[#5e5d69] mt-2 max-w-[90%]">
                Documento enfocado en la **mercadería física**. Muestra la foto actual de los percheros, el semáforo de urgencias (prendas agotadas o bajas) y el estado de los apartados.
              </p>
            </div>
            
            <div className="bg-[#f8f9ff] border border-[#c9c4d3]/40 rounded-xl p-3 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-[#42308f]">Se genera en Tiempo Real (Sin filtro de fecha)</span>
            </div>
          </div>

          <button 
            onClick={handlePrintInventario}
            className="relative z-10 w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-[#42308f] text-[#42308f] hover:bg-[#42308f] hover:text-white rounded-2xl font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Descargar PDF Inventario
          </button>
        </div>

        {/* REPORTE 2: CIERRE DE CAJA */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/60 card-shadow relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-emerald-600" />
          </div>
          
          <div className="relative z-10 space-y-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-200">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0b1c30]">
                Cierre de Caja y Rendimiento
              </h2>
              <p className="text-sm text-[#5e5d69] mt-2 max-w-[90%]">
                Documento enfocado en **la facturación y el dinero**. Muestra el balance, métodos de pago para arqueo de billetes y el Top 3 de prendas estrella. 
              </p>
            </div>
            
            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 whitespace-nowrap">
                <CalendarDays className="w-4 h-4" />
                Día a auditar:
              </label>
              <input 
                type="date" 
                value={cajaDate}
                onChange={(e) => setCajaDate(e.target.value)}
                className="flex-1 text-sm font-bold text-[#0b1c30] bg-white border border-emerald-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <button 
            onClick={handlePrintCaja}
            className="relative z-10 w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 border-2 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 rounded-2xl font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Descargar PDF Cierre de Caja
          </button>
        </div>
      </div>

      {/* HISTORIAL DE REPORTES */}
      <div className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#0b1c30] flex items-center gap-2">
              <History className="w-5 h-5 text-[#42308f]" />
              Archivo de Documentos Generados
            </h3>
            <p className="text-xs text-[#797583] mt-1">
              Registro histórico de los últimos reportes emitidos. Podés visualizarlos o volver a descargarlos.
            </p>
          </div>
          <span className="text-xs font-bold text-[#5e5d69] bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            {reportHistory.length} registros
          </span>
        </div>

        {reportHistory.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">Todavía no generaste ningún reporte hoy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-gray-50">
                {reportHistory.map((report) => (
                  <tr key={report.id} className="hover:bg-[#f8f9ff]/60 transition-colors group">
                    <td className="py-4 px-2 w-10">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                        report.type === 'caja' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-[#eff4ff] text-[#42308f] border border-[#42308f]/10'
                      }`}>
                        {report.type === 'caja' ? <DollarSign className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="font-bold text-[#0b1c30] text-[13px]">{report.title}</div>
                      <div className="text-[#5e5d69] mt-0.5 capitalize">del {report.targetDate}</div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                        <Clock className="w-3 h-3" />
                        Generado a las {report.createdAt}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleReDownload(report)}
                          className="p-2 text-gray-500 hover:text-[#42308f] hover:bg-[#eff4ff] rounded-lg transition-colors border border-transparent hover:border-[#42308f]/20 cursor-pointer"
                          title="Volver a Descargar"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};