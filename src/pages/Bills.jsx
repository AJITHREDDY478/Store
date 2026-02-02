import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import storage from '../storage';
import { formatDate, formatDateTime } from '../dateUtils';

function Bills() {
  const [bills, setBills] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = () => {
    setBills(storage.getAllBills());
  };

  const printReceipt = () => {
    window.print();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add logo and header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Sneha Fancy Store', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Bills Report', 105, 25, { align: 'center' });
    
    // Prepare table data
    const tableData = bills.map(bill => [
      bill.bill_number,
      bill.customer_name || 'N/A',
      `₹${bill.total.toFixed(2)}`,
      formatDate(bill.created_at)
    ]);
    
    // Add table
    autoTable(doc, {
      startY: 32,
      head: [['Bill #', 'Customer', 'Total', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      footStyles: { fillColor: [79, 70, 229] },
      foot: [[
        'Total Bills: ' + bills.length,
        '',
        '₹' + bills.reduce((sum, b) => sum + b.total, 0).toFixed(2),
        ''
      ]]
    });
    
    // Save PDF
    const filename = `Bills_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const sendToWhatsApp = () => {
    if (!selected || !selected.customer_phone) {
      alert('Customer phone number not available!');
      return;
    }

    const sendImage = async () => {
      try {
        // Capture receipt as image
        const receiptElement = document.querySelector('.receipt');
        const canvas = await html2canvas(receiptElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          logging: false
        });

        const image = canvas.toDataURL('image/png');

        // Convert data URL to blob
        const response = await fetch(image);
        const blob = await response.blob();

        // Try to share using Web Share API if available
        if (navigator.share) {
          const file = new File([blob], `receipt_${selected.bill_number}.png`, { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: 'Bill Receipt',
            text: `Receipt from Sneha Fancy Store - Bill No: ${selected.bill_number}`
          });
        } else {
          // Fallback: Download and open WhatsApp
          // Download the image
          const link = document.createElement('a');
          link.href = image;
          link.download = `receipt_${selected.bill_number}.png`;
          link.click();

          // Open WhatsApp
          const phoneNumber = selected.customer_phone.replace(/\D/g, '');
          const message = `Receipt Image - Bill No: ${selected.bill_number}`;
          const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          window.open(whatsappURL, '_blank');

          alert('Receipt image downloaded. Please open WhatsApp and attach the image.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error generating receipt image. Please try again.');
      }
    };

    sendImage();
  };

  return (
    <div>
      <h1 className="page-title no-print">Bills</h1>
      
      {selected ? (
        <div>
          <div className="no-print" style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>
              ← Back
            </button>
            <button className="btn btn-primary" onClick={printReceipt}>
              🖨️ Print
            </button>
          </div>
          
          <div className="receipt">
            <div className="receipt-header">
              <img src="/ss.jpg" alt="Sneha Fancy Store" className="receipt-logo" />
              <h1>Sneha Fancy Store</h1>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Opposite to Vaishnavi Hotel, Shahapur, Karnataka 585223</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Phone: 087926 85004</p>
            </div>

            <div className="receipt-info">
              <div>
                <strong>Bill No:</strong> {selected.bill_number}<br/>
                <strong>Date:</strong> {formatDateTime(selected.created_at)}<br/>
                <strong>GST No:</strong> Applied
              </div>
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.name}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-total">
              {selected.discount_amount && selected.discount_amount > 0 && (
                <>
                  <div className="total-row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Sub total:</span>
                    <span>₹{selected.subtotal ? selected.subtotal.toFixed(2) : selected.total.toFixed(2)}</span>
                  </div>
                  <div className="total-row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem', color: '#d32f2f' }}>
                    <span>Discount:</span>
                    <span>-₹{selected.discount_amount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {selected.tax > 0 && (
                <div className="total-row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem', color: '#388e3c' }}>
                  <span>Tax ({selected.tax}%):</span>
                  <span>+₹{selected.tax_amount ? selected.tax_amount.toFixed(2) : '0.00'}</span>
                </div>
              )}
              <div className="total-row" style={{ justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                <span>Total Amount:</span>
                <span>₹{selected.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-footer" style={{ textAlign: 'center' }}>
              <p>Thank you</p>
              <p>Please visit again 🙏</p>
            </div>
          </div>

          <div className="no-print" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={sendToWhatsApp} style={{ width: '100%', maxWidth: '300px' }}>
              💬 Send to WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="no-print" style={{ marginBottom: '1rem' }}>
            <button onClick={exportToPDF} className="btn btn-primary">
              📄 Export PDF
            </button>
          </div>

        <div className="card">
          {bills.length === 0 ? (
            <p>No bills found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Bill #</th>
                  <th style={{ width: '20%' }}>Customer</th>
                  <th style={{ width: '25%' }}>Total</th>
                  <th style={{ width: '25%' }}>Date</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id}>
                    <td style={{ width: '15%' }}>{bill.bill_number}</td>
                    <td style={{ width: '20%' }}>{bill.customer_name || 'N/A'}</td>
                    <td style={{ width: '25%' }}>₹{bill.total.toFixed(2)}</td>
                    <td style={{ width: '25%' }}>{formatDate(bill.created_at)}</td>
                    <td style={{ width: '15%', textAlign: 'center' }}>
                      <button 
                        className="btn btn-primary btn-icon" 
                        onClick={() => setSelected(bill)} 
                        title="View Details"
                        style={{ 
                          padding: '0.4rem 0.5rem',
                          fontSize: '0.9rem',
                          minWidth: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

export default Bills;
