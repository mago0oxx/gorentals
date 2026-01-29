import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Generate PDF
    const doc = new jsPDF();

    // Header
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('GoRentals', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Factura de Alquiler', 20, 32);

    // Invoice details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Factura #${booking.id.substring(0, 8).toUpperCase()}`, 140, 25);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 140, 32);

    // Billing info
    let y = 55;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Facturado a:', 20, y);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    y += 7;
    doc.text(booking.renter_name, 20, y);
    y += 5;
    doc.text(booking.renter_email, 20, y);

    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Propietario:', 20, y);
    
    doc.setFont(undefined, 'normal');
    y += 7;
    doc.text(booking.owner_name, 20, y);
    y += 5;
    doc.text(booking.owner_email, 20, y);

    // Booking details
    y += 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, 180, 30, 'F');
    
    y += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Detalles de la Reserva', 20, y);
    
    doc.setFont(undefined, 'normal');
    y += 7;
    doc.text(`Vehículo: ${booking.vehicle_title}`, 20, y);
    y += 5;
    doc.text(`Fechas: ${booking.start_date} al ${booking.end_date}`, 20, y);
    y += 5;
    doc.text(`Duración: ${booking.total_days} días`, 20, y);

    // Line items
    y += 20;
    doc.setFont(undefined, 'bold');
    doc.setFillColor(20, 184, 166);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Descripción', 20, y);
    doc.text('Cantidad', 120, y);
    doc.text('Precio', 155, y, { align: 'right' });
    doc.text('Total', 190, y, { align: 'right' });

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    // Rental
    doc.text(`Alquiler de vehículo`, 20, y);
    doc.text(`${booking.total_days} días`, 120, y);
    doc.text(`$${booking.price_per_day.toFixed(2)}`, 155, y, { align: 'right' });
    doc.text(`$${booking.subtotal.toFixed(2)}`, 190, y, { align: 'right' });

    // Service fee
    y += 7;
    doc.text('Tarifa de servicio (15%)', 20, y);
    doc.text('1', 120, y);
    doc.text(`$${booking.platform_fee.toFixed(2)}`, 155, y, { align: 'right' });
    doc.text(`$${booking.platform_fee.toFixed(2)}`, 190, y, { align: 'right' });

    // Extras
    if (booking.extras_total > 0) {
      y += 7;
      doc.text('Extras y accesorios', 20, y);
      doc.text('1', 120, y);
      doc.text(`$${booking.extras_total.toFixed(2)}`, 155, y, { align: 'right' });
      doc.text(`$${booking.extras_total.toFixed(2)}`, 190, y, { align: 'right' });
    }

    // Insurance
    if (booking.insurance_cost > 0) {
      y += 7;
      doc.text('Seguro adicional', 20, y);
      doc.text('1', 120, y);
      doc.text(`$${booking.insurance_cost.toFixed(2)}`, 155, y, { align: 'right' });
      doc.text(`$${booking.insurance_cost.toFixed(2)}`, 190, y, { align: 'right' });
    }

    // Security deposit
    y += 7;
    doc.text('Depósito de seguridad (reembolsable)', 20, y);
    doc.text('1', 120, y);
    doc.text(`$${booking.security_deposit.toFixed(2)}`, 155, y, { align: 'right' });
    doc.text(`$${booking.security_deposit.toFixed(2)}`, 190, y, { align: 'right' });

    // Totals
    y += 12;
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL', 20, y);
    doc.text(`$${booking.total_amount.toFixed(2)} USD`, 190, y, { align: 'right' });

    // Footer
    y += 20;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('GoRentals - Isla de Margarita, Venezuela', 105, y, { align: 'center' });
    y += 5;
    doc.text('Gracias por confiar en nosotros', 105, y, { align: 'center' });

    // Convert to base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    return Response.json({ 
      success: true,
      pdf: pdfBase64
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});