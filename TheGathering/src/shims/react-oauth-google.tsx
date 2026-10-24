type GoogleOAuthProviderProps = {
  clientId?: string;
  // Dùng any để tránh phụ thuộc kiểu React trong build server
  children?: any;
};

// Shim cực đơn giản: chỉ render children, không dùng context/JSX phức tạp
export function GoogleOAuthProvider(props: GoogleOAuthProviderProps) {
  if (typeof window === "undefined") {
    // Build-time / SSR: chỉ trả về children
    return props.children as any;
  }
  // Client: có thể log để biết đang chạy shim
  if (props.clientId) {
    console.warn(
      "[GoogleOAuthProvider shim] Running with clientId:",
      props.clientId
    );
  } else {
    console.warn("[GoogleOAuthProvider shim] Running without clientId");
  }
  return props.children as any;
}

type UseGoogleLoginOptions = {
  onSuccess?: (token: { access_token: string }) => void;
  onError?: (error: unknown) => void;
};

/**
 * Lightweight shim for environments where we don't want to pull in the real
 * `@react-oauth/google` package (e.g. Netlify build issues).
 *
 * In this shim, calling the returned function will simply warn and invoke
 * `onError` if provided.
 */
export function useGoogleLogin(options: UseGoogleLoginOptions = {}) {
  const { onError } = options;

  return () => {
    const error = new Error(
      "Google OAuth login is disabled in this deployment (shim module in use)."
    );
    console.warn(error.message);
    if (onError) {
      onError(error);
    }
  };
}

