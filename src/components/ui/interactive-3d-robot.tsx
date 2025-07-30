'use client';

import { Suspense, lazy, Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface InteractiveRobotSplineProps {
  scene: string;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SplineErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Spline WebGL Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function WebGLFallback({ className }: { className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 to-purple-600/20 rounded-2xl border border-purple-500/20 ${className}`}>
      <div className="relative">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <Bot className="w-16 h-16 text-white" />
        </div>
        <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-purple-600/40 to-purple-400/40 rounded-full animate-ping"></div>
      </div>
      <h3 className="text-lg font-semibold text-purple-300 mb-2">ORÁCULO AI</h3>
      <p className="text-sm text-purple-400/80 text-center max-w-xs">
        Sistema de inteligência artificial para opções binárias
      </p>
    </div>
  );
}

function SafeSpline({ scene, className }: InteractiveRobotSplineProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check WebGL support
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setWebglSupported(!!context);
        
        // Clean up WebGL context if created
        if (context) {
          const webglContext = context as WebGLRenderingContext;
          if (webglContext.getExtension) {
            const loseContext = webglContext.getExtension('WEBGL_lose_context');
            if (loseContext) {
              loseContext.loseContext();
            }
          }
        }
      } catch (e) {
        console.warn('WebGL check failed:', e);
        setWebglSupported(false);
      }
    };

    // Small delay to avoid immediate context creation
    const timer = setTimeout(checkWebGL, 100);
    return () => clearTimeout(timer);
  }, []);

  if (webglSupported === false) {
    return <WebGLFallback className={className} />;
  }

  if (webglSupported === null) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-purple-600/10 ${className}`}>
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"></path>
          </svg>
          <span className="text-purple-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <Spline
      scene={scene}
      className={className}
      onError={(error) => {
        console.warn('Spline loading error:', error);
      }}
    />
  );
}

export function InteractiveRobotSpline({ scene, className }: InteractiveRobotSplineProps) {
  return (
    <SplineErrorBoundary fallback={<WebGLFallback className={className} />}>
      <Suspense
        fallback={
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-purple-600/10 ${className}`}>
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"></path>
              </svg>
              <span className="text-purple-400">Carregando...</span>
            </div>
          </div>
        }
      >
        <SafeSpline scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  );
}