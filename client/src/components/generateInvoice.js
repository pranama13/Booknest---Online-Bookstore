import jsPDF from 'jspdf';

const generateInvoice = ({ invoiceNumber, date, customerName, shippingAddress, items, total }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let y = margin;

  // Colors from Checkout.css
  const primaryColor = '#14b8a6'; // --primary-color
  const textDark = '#1f2937'; // --text-dark
  const textLight = '#6b7280'; // --text-light

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text('BookNest Invoice', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(textDark);
  doc.text(`Invoice Number: ${invoiceNumber}`, margin, y);
  y += 7;
  doc.text(`Date: ${date}`, margin, y);
  y += 15;

  // Customer Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Customer Details', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(textLight);
  doc.text(`Name: ${customerName}`, margin, y);
  y += 7;
  doc.text(`Address: ${shippingAddress}`, margin, y, { maxWidth: pageWidth - 2 * margin });
  y += 15;

  // Items Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textDark);
  const tableHeaders = ['Item', 'Quantity', 'Price', 'Subtotal'];
  const colWidths = [100, 30, 30, 30];
  let x = margin;
  tableHeaders.forEach((header, index) => {
    doc.text(header, x, y);
    x += colWidths[index];
  });
  y += 5;

  // Table Divider
  doc.setDrawColor(primaryColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(textLight);
  items.forEach((item) => {
    x = margin;
    const row = [
      item.title.substring(0, 50) + (item.title.length > 50 ? '...' : ''),
      item.quantity.toString(),
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.price * item.quantity).toFixed(2)}`,
    ];
    row.forEach((cell, index) => {
      doc.text(cell, x, y, { maxWidth: colWidths[index] - 5 });
      x += colWidths[index];
    });
    y += 10;
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
  });

  // Totals
  y += 5;
  doc.setDrawColor(primaryColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textDark);
  const shippingCost = total > 5000 ? 0 : 500;
  doc.text(`Subtotal: Rs.${total.toFixed(2)}`, pageWidth - margin - 50, y);
  y += 7;
  doc.text(`Shipping: ${shippingCost === 0 ? 'Free' : `Rs.${shippingCost.toFixed(2)}`}`, pageWidth - margin - 50, y);
  y += 7;
  doc.text(`Total: Rs.${(total + shippingCost).toFixed(2)}`, pageWidth - margin - 50, y);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(textLight);
  doc.text('Thank you for shopping with BookNest!', margin, pageHeight - margin);

  // Download
  doc.save(`invoice_${invoiceNumber}.pdf`);
};

export default generateInvoice;