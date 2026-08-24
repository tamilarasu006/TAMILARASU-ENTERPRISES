import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Login from './pages/Login';

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="font-bold text-xl tracking-wider">VSRT Admin Portal</div>
        <div className="space-x-6">
          <Link to="/" className="hover:text-blue-300">Dashboard</Link>
          <Link to="/orders" className="hover:text-blue-300">Customer Inquiries</Link>
          <button onClick={handleLogout} className="text-red-300 hover:text-red-100">Logout</button>
        </div>
      </nav>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/orders" element={<AdminLayout><Orders /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;