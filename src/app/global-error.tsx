'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#fef2f2'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            maxWidth: '32rem',
            width: '100%'
          }}>
            <h2 style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Lỗi ứng dụng
            </h2>
            <pre style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: '8rem',
              whiteSpace: 'pre-wrap'
            }}>
              {error.message}
            </pre>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Digest: {error.digest}
              </p>
            )}
            <pre style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '12rem',
              marginTop: '0.5rem',
              whiteSpace: 'pre-wrap'
            }}>
              {error.stack}
            </pre>
            <button
              onClick={reset}
              style={{
                marginTop: '1rem',
                width: '100%',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
