'use client';

import { useEffect } from 'react';

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Play page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Lỗi trang chơi</h2>
        <div className="space-y-2">
          <p className="font-medium">Error:</p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-32 whitespace-pre-wrap">
            {error.message}
          </pre>
          {error.digest && (
            <p className="text-xs text-gray-500">Digest: {error.digest}</p>
          )}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
            {error.stack}
          </pre>
        </div>
        <div className="mt-4 space-y-2">
          <button
            onClick={reset}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
          <button
            onClick={() => window.location.href = '/qr-login'}
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
