import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#59BCC0',
          colorBgContainer: '#0A192F',
          colorBgElevated: '#1F2937',
          borderRadius: 8,
          colorText: '#FFFFFF',
          colorTextSecondary: 'rgba(255, 255, 255, 0.85)',
          colorBorder: '#2FCEE4',
          colorBorderSecondary: '#378E8B',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
