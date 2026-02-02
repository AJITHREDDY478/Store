import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import CreateBill from './pages/CreateBill';
import Bills from './pages/Bills';
import { formatDateTime } from './dateUtils';
import './App.css';

function App() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 style={{ margin: 0 }}>
              <img src="/ss.jpg" alt="Logo" className="nav-logo" />
              Sneha Fancy Store
            </h1>
          </div>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/products">Products</Link>
            <Link to="/create-bill">New Bill</Link>
            <Link to="/bills">Bills</Link>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/create-bill" element={<CreateBill />} />
            <Route path="/bills" element={<Bills />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
