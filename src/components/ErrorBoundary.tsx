'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.stack || '' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || error.stack || '',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
            <div className="space-y-2">
              <p className="font-medium">Error:</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
              <p className="font-medium mt-4">Stack:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48">
                {this.state.errorInfo}
              </pre>
            </div>
            <button
              onClick={() => window.location.href = '/qr-login'}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
