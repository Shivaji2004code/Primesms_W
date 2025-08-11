// Error Boundary to catch React errors and prevent white screen
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ERROR_BOUNDARY] Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                🚨 Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                Don't worry! This error has been caught and the page can be recovered.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
              <code className="text-sm text-red-700 block bg-red-100 p-2 rounded">
                {this.state.error?.message || 'Unknown error occurred'}
              </code>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔃 Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                🏠 Go to Dashboard
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-700">
                  🔍 Technical Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Template-specific error boundary for the templates page
export class TemplateErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [TEMPLATE_ERROR_BOUNDARY] Template error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-start">
            <div className="text-red-400 text-2xl mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Template Loading Error
              </h3>
              <p className="text-red-700 mb-4">
                There was an error loading the templates. This might be due to a template with invalid data.
              </p>
              
              <div className="bg-red-100 rounded p-3 mb-4">
                <code className="text-sm text-red-800">
                  {this.state.error?.message || 'Unknown template error'}
                </code>
              </div>

              <div className="space-x-3">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                    window.location.reload();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  🔄 Reload Templates
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  🏠 Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}