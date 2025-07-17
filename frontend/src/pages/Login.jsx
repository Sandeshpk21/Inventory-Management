import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext';
import api from '../services/api';
import { Box } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const response = await api.post('/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      login(response.data);
      const role = response.data.user.role;
      if (role === 'employee') {
        navigate('/requirements');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="flex flex-col items-center mb-10">
        <span className="bg-blue-100 p-4 rounded-full shadow-md mb-4">
          <Box className="h-10 w-10 text-blue-600" />
        </span>
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">Welcome to Inventory Management</h1>
        <p className="text-gray-500 text-lg text-center max-w-md">Effortlessly manage your stock, requirements, and orders. Please log in to continue.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-80 border border-blue-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Login</h2>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold shadow">Login</button>
      </form>
    </div>
  );
};

export default Login; 