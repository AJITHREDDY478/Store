import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import storage from '../storage';

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', stock: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(storage.getAllProducts());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editing) {
      storage.updateProduct(editing, {
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock)
      });
      setEditing(null);
    } else {
      storage.addProduct({
        id: uuidv4(),
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    setForm({ name: '', price: '', stock: '' });
    loadProducts();
  };

  const handleEdit = (product) => {
    setForm({ name: product.name, price: product.price, stock: product.stock });
    setEditing(product.id);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this product?')) {
      storage.deleteProduct(id);
      loadProducts();
    }
  };

  return (
    <div>
      <h1 className="page-title">Products</h1>
      
      <div className="card">
        <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {editing ? 'Update' : 'Add'} Product
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setEditing(null); setForm({ name: '', price: '', stock: '' }); }}
              style={{ marginTop: '0.5rem' }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Product List</h2>
        {products.length === 0 ? (
          <p>No products yet. Add your first product above!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Name</th>
                <th style={{ width: '25%' }}>Price</th>
                <th style={{ width: '20%' }}>Stock</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td style={{ width: '35%' }}>{product.name}</td>
                  <td style={{ width: '25%' }}>₹{product.price.toFixed(2)}</td>
                  <td style={{ width: '20%' }}>{product.stock}</td>
                  <td style={{ width: '20%', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-icon" 
                        onClick={() => handleEdit(product)} 
                        title="Edit"
                        style={{ 
                          padding: '0.4rem 0.5rem',
                          fontSize: '0.9rem',
                          minWidth: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger btn-icon" 
                        onClick={() => handleDelete(product.id)} 
                        title="Delete"
                        style={{ 
                          padding: '0.4rem 0.5rem',
                          fontSize: '0.9rem',
                          minWidth: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Products;
