import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-4xl mx-auto text-red-400 font-mono">
          <h2 className="text-2xl font-bold mb-4">Something went wrong rendering the results.</h2>
          <details className="whitespace-pre-wrap bg-black/40 p-4 rounded border border-red-500/50 text-xs">
            <summary className="cursor-pointer mb-2">Show error details</summary>
            <p className="mb-2">{this.state.error?.toString()}</p>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-cyber-blue/20 border border-cyber-blue rounded text-white"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
