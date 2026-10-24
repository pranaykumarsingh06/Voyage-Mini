import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VOYAGE ErrorBoundary] Caught unhandled runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env && import.meta.env.DEV);

      return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-background relative overflow-hidden select-none">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-gold/10 rounded-full blur-[140px] pointer-events-none -z-10" />

          <div className="w-full max-w-xl rounded-3xl glass-panel p-8 sm:p-12 border border-border-strong shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Brand / Alert Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-glow-primary">
              <AlertCircle className="w-8 h-8" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-extrabold tracking-widest text-primary">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Voyage Experience Recovery</span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                {this.props.fallbackTitle || 'Something Went Wrong'}
              </h1>
              <p className="text-xs sm:text-sm text-surface-300 max-w-md mx-auto leading-relaxed">
                {this.props.fallbackMessage || 
                  'An unexpected interruption occurred while preparing this sanctuary view. Please refresh the page or return to explore other destinations.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReload}
                icon={<RefreshCw className="w-4 h-4" />}
                className="w-full sm:w-auto px-6 shadow-glow-primary"
              >
                Reload Page
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  this.handleReset();
                  window.location.href = '/';
                }}
                icon={<Home className="w-4 h-4" />}
                className="w-full sm:w-auto px-6"
              >
                Return to Sanctuary
              </Button>
            </div>

            {/* Development-Only Diagnostics Drawer */}
            {isDev && this.state.error && (
              <details className="text-left mt-6 p-4 rounded-2xl bg-black/50 border border-rose-500/20 text-xs font-mono text-rose-300 overflow-x-auto space-y-2">
                <summary className="cursor-pointer text-[11px] font-bold text-rose-400 uppercase tracking-wider select-none hover:text-rose-300">
                  Developer Diagnostics (Dev Mode Only)
                </summary>
                <div className="pt-2 text-[11px] space-y-1">
                  <p className="font-bold text-white">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="text-[10px] text-surface-400 overflow-x-auto p-2 bg-black/40 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-[10px] text-surface-500 overflow-x-auto p-2 bg-black/40 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">
                      Component Stack:{this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
