import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('[SKKN ErrorBoundary] Uncaught runtime error caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('skkn_user');
      localStorage.removeItem('skkn_session_token');
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">
                  HỆ THỐNG ĐÃ PHỤC HỒI AN TOÀN
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  SKKN REVIEW PRO — Tránh tình trạng màn hình trắng
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-sm text-slate-300 space-y-2 mb-6">
              <p className="font-medium text-slate-200">
                Một sự cố hiển thị nhỏ vừa xảy ra. Trạng thái cơ sở dữ liệu và tài khoản của bạn vẫn được bảo toàn nguyên vẹn.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-rose-300 break-words border border-rose-950/60">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại trang (F5)
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700/60"
              >
                <Home className="w-4 h-4" />
                Về Trang Chủ & Làm mới
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
