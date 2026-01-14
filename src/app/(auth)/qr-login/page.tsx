'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function QrLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);

  const handleSubmit = async (codeToSubmit?: string) => {
    const submitCode = codeToSubmit || code;
    if (!submitCode.trim()) {
      setError('Vui lòng nhập mã hoặc quét barcode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/auth/qr?code=${encodeURIComponent(submitCode)}`, {
        credentials: 'include',
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        // Go directly to play page
        router.push('/play');
        return;
      }

      setError(data.error || 'Có lỗi xảy ra');
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    setCameraError('');
    setScanning(true);
  };

  // Initialize scanner when scanning becomes true
  useEffect(() => {
    if (!scanning) return;

    let html5QrCode: import('html5-qrcode').Html5Qrcode | null = null;
    let isMounted = true;

    const initScanner = async () => {
      // Check if running on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        setCameraError('Camera chỉ hoạt động trên HTTPS. Vui lòng nhập mã thủ công.');
        setScanning(false);
        return;
      }

      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ camera. Vui lòng nhập mã thủ công.');
        setScanning(false);
        return;
      }

      try {
        // First request camera permission
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
            // Stop the stream immediately, we just needed to get permission
            stream.getTracks().forEach(track => track.stop());
          });

        const { Html5Qrcode } = await import('html5-qrcode');
        
        if (!isMounted) return;
        
        html5QrCode = new Html5Qrcode('barcode-reader');
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
            aspectRatio: 2.0,
          },
          async (decodedText) => {
            if (!isMounted) return;
            setCode(decodedText);
            setScanning(false);
            // Submit directly here
            setLoading(true);
            try {
              const res = await fetch(`/api/auth/qr?code=${encodeURIComponent(decodedText)}`, {
                credentials: 'include',
              });
              const data = await res.json();
              if (res.ok && data.success) {
                router.push('/play');
              } else {
                setError(data.error || 'Có lỗi xảy ra');
              }
            } catch {
              setError('Lỗi kết nối');
            } finally {
              setLoading(false);
            }
          },
          () => {
            // Ignore scan errors
          }
        );
      } catch (err: unknown) {
        console.error('Scanner error:', err);
        if (isMounted) {
          const error = err as Error;
          if (error.name === 'NotAllowedError') {
            setCameraError('Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền hoặc nhập mã thủ công.');
          } else if (error.name === 'NotFoundError') {
            setCameraError('Không tìm thấy camera trên thiết bị này.');
          } else if (error.name === 'NotReadableError') {
            setCameraError('Camera đang được sử dụng bởi ứng dụng khác.');
          } else {
            setCameraError('Không thể mở camera. Vui lòng nhập mã thủ công.');
          }
          setScanning(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [scanning, router]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Quét mã Barcode</CardTitle>
          <p className="text-gray-500 mt-1">
            Quét mã barcode hoặc nhập mã để tham gia game
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barcode Scanner */}
          <div className="space-y-2">
            {!scanning ? (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
                onClick={startScanner}
                disabled={loading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <line x1="7" x2="7" y1="8" y2="16"/>
                  <line x1="10" x2="10" y1="8" y2="16"/>
                  <line x1="13" x2="13" y1="8" y2="16"/>
                  <line x1="17" x2="17" y1="8" y2="16"/>
                </svg>
                <span>Nhấn để quét Barcode</span>
              </Button>
            ) : (
              <div className="space-y-2">
                <div 
                  id="barcode-reader" 
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full"
                  onClick={stopScanner}
                >
                  Dừng quét
                </Button>
              </div>
            )}
            
            {cameraError && (
              <p className="text-red-500 text-sm text-center">{cameraError}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Hoặc nhập mã</span>
            </div>
          </div>

          {/* Manual Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div>
              <Input
                placeholder="Nhập mã tham gia..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading || scanning}
                className="text-center text-lg"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || scanning}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                'Vào game'
              )}
            </Button>
          </form>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Lưu ý:</strong> Mỗi mã chỉ có thể sử dụng 1 lượt chơi
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
