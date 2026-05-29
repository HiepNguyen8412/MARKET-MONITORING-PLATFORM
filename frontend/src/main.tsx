import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Global Error Handler for debugging
window.onerror = (msg, src, line, col, err) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color:red;padding:40px;font-family:monospace;background:#0a0e1a;min-height:100vh">
        <h2 style="color: white; margin-bottom: 20px;">🚫 JS Runtime Error</h2>
        <div style="background: rgba(255,0,0,0.1); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,0,0,0.2);">
          <p style="color: #ff6b6b; font-weight: bold;">${msg}</p>
          <p style="color: #6b7a99;">Source: ${src}</p>
          <p style="color: #6b7a99;">Line: ${line} | Column: ${col}</p>
          <pre style="margin-top: 20px; color: #ff6b6b; font-size: 12px; white-space: pre-wrap;">${err?.stack ?? ''}</pre>
        </div>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
