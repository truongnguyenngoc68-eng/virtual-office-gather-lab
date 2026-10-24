type AuthFetchOptions = RequestInit & {
  /**
   * If true, do not attempt refresh on 401.
   * Defaults to false.
   */
  noRefresh?: boolean;
};

function getServerUrl(): string {
  return import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
}

function getAccessToken(): string | null {
  return localStorage.getItem("token");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${getServerUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
  if (!data?.accessToken) return null;

  localStorage.setItem("token", data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }
  return data.accessToken;
}

/**
 * Fetch that automatically attaches Authorization header and retries once
 * after refreshing access token on 401 responses.
 */
export async function authFetch(input: string, init: AuthFetchOptions = {}): Promise<Response> {
  const { noRefresh, headers, ...rest } = init;

  const token = getAccessToken();
  const mergedHeaders: HeadersInit = {
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const first = await fetch(input, { ...rest, headers: mergedHeaders });
  if (first.status !== 401 || noRefresh) return first;

  const newAccessToken = await refreshTokens();
  if (!newAccessToken) return first;

  const retryHeaders: HeadersInit = {
    ...(headers || {}),
    Authorization: `Bearer ${newAccessToken}`,
  };
  return fetch(input, { ...rest, headers: retryHeaders });
}

