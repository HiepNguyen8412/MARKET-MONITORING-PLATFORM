import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          color: 'red', 
          padding: 40, 
          background: '#0a0e1a', 
          minHeight: '100vh',
          fontFamily: 'monospace' 
        }}>
          <h1>🔴 Render Error</h1>
          <pre style={{ 
            color: '#ff6b6b', 
            whiteSpace: 'pre-wrap',
            background: 'rgba(255,0,0,0.1)',
            padding: 20,
            borderRadius: 8,
            border: '1px solid rgba(255,0,0,0.2)'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {(this.state.error as any)?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
