import React from 'react';
import { RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Непредвиденная ошибка интерфейса',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl bg-[#131316] border border-white/[0.08] p-5 space-y-4 text-center">
            <div className="space-y-1">
              <h1 className="text-[17px] font-semibold">Произошёл сбой экрана</h1>
              <p className="text-[13px] text-zinc-400 leading-relaxed break-words">
                {this.state.message}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full h-11 rounded-xl bg-white text-[#09090B] text-[14px] font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              <span>Перезагрузить</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
