import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ModalProvider } from './context/ModalContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import AddProduct from './pages/AddProduct';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    <ModalProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />

                                {/* Protected Routes */}
                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }>
                                    <Route index element={<Dashboard />} />
                                    
                                    <Route path="products" element={<Products />} />
                                    <Route path="products/:id" element={<ProductDetails />} />
                                    <Route path="products/add" element={<AddProduct />} />
                                    <Route path="products/edit/:id" element={<AddProduct />} />
                                    
                                    <Route path="suppliers" element={<Suppliers />} />
                                    <Route path="inventory" element={<Inventory />} />
                                    <Route path="transactions" element={<Transactions />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="settings" element={<Settings />} />

                                    {/* Admin Route */}
                                    <Route path="admin" element={
                                        <AdminRoute>
                                            <AdminPanel />
                                        </AdminRoute>
                                    } />
                                </Route>

                                {/* Fallback Redirect */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </ModalProvider>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
