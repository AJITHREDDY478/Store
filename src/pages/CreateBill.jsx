import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import storage from '../storage';

function CreateBill() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [manualMode, setManualMode] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: 1 });
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setProducts(storage.getAllProducts());
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectProduct = (product) => {
    setSelectedProduct(product.id);
    setSearchTerm(product.name);
    setShowDropdown(false);
  };

  const addItem = () => {
    if (!selectedProduct) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product || product.stock < quantity) {
      alert('Not enough stock!');
      return;
    }

    const existing = items.find(i => i.product_id === selectedProduct);
    if (existing) {
      setItems(items.map(i =>
        i.product_id === selectedProduct
          ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.price }
          : i
      ));
    } else {
      setItems([...items, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        total: product.price * quantity
      }]);
    }

    setSelectedProduct('');
    setSearchTerm('');
    setQuantity(1);
  };

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.price || manualItem.quantity <= 0) {
      alert('Please fill all fields!');
      return;
    }

    const price = parseFloat(manualItem.price);
    const qty = parseInt(manualItem.quantity);

    setItems([...items, {
      product_id: uuidv4(),
      name: manualItem.name,
      price: price,
      quantity: qty,
      total: price * qty,
      manual: true
    }]);

    setManualItem({ name: '', price: '', quantity: 1 });
  };

  const removeItem = (productId) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const createBill = () => {
    if (items.length === 0) {
      alert('Add at least one item!');
      return;
    }

    const existingBills = storage.getAllBills();
    const billCount = (existingBills.length + 1).toString().padStart(2, '0');
    
    const subtotalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discount;
    const taxableAmount = subtotalAmount - discountAmount;
    const taxAmount = (taxableAmount * tax) / 100;
    const totalAmount = taxableAmount + taxAmount;
    
    const bill = {
      id: uuidv4(),
      bill_number: `SS${billCount}`,
      customer_name: customer.name,
      customer_phone: customer.phone,
      items: items,
      subtotal: subtotalAmount,
      discount: discount,
      discount_amount: discountAmount,
      tax: tax,
      tax_amount: taxAmount,
      total: totalAmount,
      created_at: new Date().toISOString()
    };

    storage.addBill(bill);

    // Update stock
    items.forEach(item => {
      if (!item.manual) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          storage.updateProduct(item.product_id, {
            stock: product.stock - item.quantity
          });
        }
      }
    });

    alert('Bill created successfully!');
    setItems([]);
    setCustomer({ name: '', phone: '' });
    setDiscount(0);
    setTax(0);
    setProducts(storage.getAllProducts());
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <h1 className="page-title">Create Bill</h1>
      
      <div className="card">
        <h2>Customer Details</h2>
        <div className="form-group">
          <label>Customer Name</label>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="card">
        <h2>Add Items</h2>
        
        <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button 
            className={`btn ${!manualMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setManualMode(false)}
          >
            From Inventory
          </button>
          <button 
            className={`btn ${manualMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setManualMode(true)}
          >
            Manual Entry
          </button>
        </div>

        {!manualMode ? (
          <div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Product</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  setSelectedProduct('');
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search product..."
              />
              {showDropdown && filteredProducts.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000
                }}>
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: selectedProduct === p.id ? '#f3f4f6' : '#ffffff'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedProduct === p.id ? '#f3f4f6' : '#ffffff'}
                    >
                      <div style={{ fontWeight: '500', color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        ₹{p.price} • Stock: {p.stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Qty</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
              />
            </div>
            <button className="btn btn-primary" onClick={addItem}>Add</button>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                value={manualItem.name}
                onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={manualItem.price}
                onChange={(e) => setManualItem({ ...manualItem, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={manualItem.quantity}
                onChange={(e) => setManualItem({ ...manualItem, quantity: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <button className="btn btn-primary" onClick={addManualItem}>Add</button>
          </div>
        )}

        <h3 style={{ marginTop: '2rem' }}>Bill Items</h3>
        {items.length === 0 ? (
          <p>No items added yet</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Item</th>
                  <th style={{ width: '22%' }}>Price</th>
                  <th style={{ width: '15%' }}>Qty</th>
                  <th style={{ width: '22%' }}>Total</th>
                  <th style={{ width: '11%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.product_id}>
                    <td style={{ width: '30%' }}>{item.name}</td>
                    <td style={{ width: '22%' }}>₹{item.price.toFixed(2)}</td>
                    <td style={{ width: '15%' }}>{item.quantity}</td>
                    <td style={{ width: '22%' }}>₹{item.total.toFixed(2)}</td>
                    <td style={{ width: '11%', textAlign: 'center' }}>
                      <button className="btn btn-danger btn-icon" onClick={() => removeItem(item.product_id)} title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Discount (₹):</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Tax (%):</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <strong>₹{subtotal.toFixed(2)}</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Discount:</span>
                  <strong>-₹{discount.toFixed(2)}</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <strong>+₹{(((subtotal - discount) * tax) / 100).toFixed(2)}</strong>
                </p>
                <div style={{ borderTop: '2px solid #4f46e5', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total:</span>
                    <span>₹{(subtotal - discount + (((subtotal - discount) * tax) / 100)).toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <button className="btn btn-primary" onClick={createBill} style={{ marginTop: '1rem' }}>
                Create Bill
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CreateBill;
