import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ConfigProvider } from './context/ConfigContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(ConfigProvider, null, React.createElement(ToastProvider, null, React.createElement(AuthProvider, null, React.createElement(App))))
    )
  )
);
