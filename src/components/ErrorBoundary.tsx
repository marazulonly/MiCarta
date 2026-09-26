import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center mb-4 text-amber-600 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-800 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Capa de Protección de UI</span>
          </div>

          <h2 className="text-2xl font-black text-neutral-900 mb-2">
            {this.props.fallbackTitle || 'Ocurrió un problema al cargar esta sección'}
          </h2>

          <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
            Se ha producido un inconveniente temporal en la visualización. Tus datos y configuración se encuentran seguros. Haz clic en el botón para reintentar la carga.
          </p>

          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-bold text-sm hover:bg-neutral-800 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar Carga</span>
            </button>
          </div>

          <button
            onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition font-mono cursor-pointer"
          >
            <span>{this.state.showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos del error'}</span>
            {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {this.state.showDetails && (
            <div className="mt-4 p-4 rounded-xl bg-neutral-900 text-neutral-200 text-left font-mono text-xs w-full overflow-x-auto border border-neutral-800 max-h-48">
              <p className="text-rose-400 font-bold mb-1">{this.state.error?.toString()}</p>
              <p className="text-neutral-400 whitespace-pre-wrap leading-tight">{this.state.errorInfo?.componentStack}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
