/**
 * REST client for the BADHIYA NestJS backend.
 *
 * All responses must be validated at the boundary via Zod schemas
 * in the feature modules that call these methods. Never trust
 * server data without schema-parse at the call site.
 *
 * 401 handling:
 *   - Single-flight refresh via `tryRefresh()` (multiple concurrent 401s
 *     only trigger one refresh attempt)
 *   - Original request is retried once with the new token
 *   - If refresh fails, tokens are cleared and caller sees the 401
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { logout as clearAuthState } from '@/stores/auth';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';

const TOKEN_KEY = 'badhiya.auth.token';
const REFRESH_KEY = 'badhiya.auth.refresh';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;
  private refreshing: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach token on every request
    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 → single-flight refresh → retry once
    this.client.interceptors.response.use(
      (r) => r,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const originalReq = error.config as
          | (AxiosRequestConfig & { _retried?: boolean })
          | undefined;

        if (status === 401 && originalReq && !originalReq._retried) {
          originalReq._retried = true;
          try {
            await this.tryRefresh();
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (token) {
              originalReq.headers = originalReq.headers ?? {};
              (originalReq.headers as Record<string, string>).Authorization =
                `Bearer ${token}`;
              return this.client.request(originalReq);
            }
          } catch {
            // Refresh failed — the session is dead. Clear tokens AND
            // the Legend State auth flag so the root redirect sends
            // the user back to /login on the next render. Observer
            // screens will unmount their stale data.
            await this.clearAuthTokens();
            clearAuthState();
          }
        }
        return Promise.reject(this.normalizeError(error));
      },
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | { code?: string; message?: string; error?: string }
      | undefined;
    return new ApiError(
      status,
      data?.code ?? data?.error ?? 'UNKNOWN',
      data?.message ?? error.message ?? 'Network error',
    );
  }

  private async tryRefresh(): Promise<void> {
    // Single-flight — only one refresh in progress at a time.
    if (this.refreshing) return this.refreshing;

    this.refreshing = (async () => {
      try {
        const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!refresh) throw new Error('no refresh token');

        // Use bare axios (not the interceptor-wrapped client) to avoid recursion
        const res = await axios.post<{ accessToken: string }>(
          `${API_URL}/auth/token/refresh`,
          { refreshToken: refresh },
          { timeout: 10_000 },
        );

        if (!res.data?.accessToken) {
          throw new Error('no access token in refresh response');
        }

        await SecureStore.setItemAsync(TOKEN_KEY, res.data.accessToken);
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  async setAuthTokens(token: string, refresh: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  }

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  async clearAuthTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T>(path, config).then((r) => r.data);
  }

  post<T>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.client.post<T>(path, body, config).then((r) => r.data);
  }

  patch<T>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.client.patch<T>(path, body, config).then((r) => r.data);
  }

  delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T>(path, config).then((r) => r.data);
  }
}

export const api = new ApiClient();
