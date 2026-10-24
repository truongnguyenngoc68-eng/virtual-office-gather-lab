import { Component, ErrorInfo, ReactNode } from "react";
import { analytics } from "../utils/analytics";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Track error in analytics
    analytics.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>Đã xảy ra lỗi!</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
          <details style={{ marginTop: "20px", textAlign: "left" }}>
            <summary>Chi tiết lỗi</summary>
            <pre style={{ background: "#f5f5f5", padding: "10px", overflow: "auto" }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

