import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_type !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { period, stats, vehicleStats, monthlyData } = await req.json();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Reporte de Ganancias', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('GoRentals - Isla de Margarita', pageWidth / 2, 30, { align: 'center' });
    
    // Owner info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Propietario: ${user.full_name}`, 20, 55);
    doc.text(`Email: ${user.email}`, 20, 62);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 20, 69);
    
    const periodLabels = {
      'this_month': 'Este mes',
      'last_month': 'Mes pasado',
      'this_year': 'Este año',
      'all_time': 'Todo el tiempo'
    };
    doc.text(`Período: ${periodLabels[period] || period}`, 20, 76);
    
    // Stats boxes
    let yPos = 90;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen Financiero', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Stats grid
    const statsData = [
      { label: 'Ganancias totales', value: `$${stats.totalEarnings.toFixed(2)}` },
      { label: 'Reservas completadas', value: stats.completedBookings },
      { label: 'Ganancias pendientes', value: `$${stats.pendingEarnings.toFixed(2)}` },
      { label: 'Promedio por reserva', value: `$${stats.avgBookingValue.toFixed(2)}` }
    ];
    
    statsData.forEach((stat, index) => {
      const xPos = 20 + (index % 2) * 90;
      const yOffset = Math.floor(index / 2) * 20;
      
      doc.setFillColor(249, 250, 251);
      doc.rect(xPos, yPos + yOffset, 85, 15, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(stat.label, xPos + 5, yPos + yOffset + 6);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(String(stat.value), xPos + 5, yPos + yOffset + 12);
      doc.setFont(undefined, 'normal');
    });
    
    // Vehicle performance table
    yPos += 60;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Rendimiento por Vehículo', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Vehículo', 20, yPos);
    doc.text('Reservas', 110, yPos);
    doc.text('Ganancias', 150, yPos);
    
    doc.setFont(undefined, 'normal');
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 8;
    
    if (vehicleStats && vehicleStats.length > 0) {
      vehicleStats.forEach((vehicle, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(vehicle.name.substring(0, 40), 20, yPos);
        doc.text(String(vehicle.bookings), 110, yPos);
        doc.text(`$${vehicle.value.toFixed(2)}`, 150, yPos);
        yPos += 7;
      });
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('No hay datos disponibles para este período', 20, yPos);
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - GoRentals © ${new Date().getFullYear()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=reporte-ganancias-${Date.now()}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});