import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  templateName?: string;
  onRetry?: () => void;
  onDelete?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class TemplateErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Template rendering error:', error, errorInfo);
    
    // Log specific details for debugging
    if (error.message.includes('icon')) {
      console.error('🚨 [TEMPLATE_ERROR] Icon property access error detected', {
        templateName: this.props.templateName,
        error: error.message,
        stack: error.stack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const isIconError = this.state.error?.message?.includes('icon') || 
                         this.state.error?.message?.includes('Cannot read properties of undefined');
      
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800">
              Template Rendering Error
              {this.props.templateName && ` - ${this.props.templateName}`}
            </h3>
          </div>
          
          <div className="text-sm text-red-700 mb-4">
            {isIconError ? (
              <div>
                <p className="font-medium mb-2">🔧 Template Data Corruption Detected</p>
                <p className="mb-2">This template has corrupted component data (missing icon property).</p>
                <p className="text-xs bg-red-100 p-2 rounded font-mono">
                  Error: {this.state.error?.message}
                </p>
              </div>
            ) : (
              <div>
                <p>An error occurred while rendering this template.</p>
                <p className="text-xs bg-red-100 p-2 rounded font-mono mt-2">
                  {this.state.error?.message}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
            
            {this.props.onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={this.props.onDelete}
                className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                Delete Corrupted Template
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1"
            >
              🔄 Reload Page
            </Button>
          </div>
          
          {isIconError && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-800 mb-2">💡 Quick Fix:</p>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. Open browser console (F12)</li>
                <li>2. Run: <code className="bg-blue-100 px-1 rounded">fixTemplatePageImmediately()</code></li>
                <li>3. This will automatically fix the corrupted template data</li>
              </ol>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export const TemplateErrorBoundary = TemplateErrorBoundaryClass;