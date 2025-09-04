import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for Laravel
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', {
            refresh_token: refreshToken
          });

          const { token } = response.data;
          localStorage.setItem('auth_token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Could show a toast notification here
    }

    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.error(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
      // Could show a toast notification for server errors
    }

    return Promise.reject(error);
  }
);

// API endpoint helpers
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    user: '/auth/user',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/password/forgot',
    resetPassword: '/auth/password/reset',
    verifyEmail: '/auth/email/verify',
    updateProfile: '/auth/profile',
    changePassword: '/auth/password/change',
    enable2FA: '/auth/2fa/enable',
    confirm2FA: '/auth/2fa/confirm',
    disable2FA: '/auth/2fa/disable',
  },

  // Medical Conditions
  medicalConditions: {
    list: '/medical-conditions',
    show: (id: string) => `/medical-conditions/${id}`,
    create: '/medical-conditions',
    update: (id: string) => `/medical-conditions/${id}`,
    delete: (id: string) => `/medical-conditions/${id}`,
    search: '/medical-conditions/search',
    searchByCodes: '/medical-conditions/search-by-codes',
    bookmark: (id: string) => `/medical-conditions/${id}/bookmark`,
    stats: '/medical-conditions/stats',
    export: '/medical-conditions/export',
    bulkUpdate: '/medical-conditions/bulk-update',
  },

  // Courses
  courses: {
    list: '/courses',
    show: (id: string) => `/courses/${id}`,
    create: '/courses',
    update: (id: string) => `/courses/${id}`,
    delete: (id: string) => `/courses/${id}`,
    enroll: (id: string) => `/courses/${id}/enroll`,
    progress: (id: string) => `/courses/${id}/progress`,
    complete: (id: string) => `/courses/${id}/complete`,
    modules: (id: string) => `/courses/${id}/modules`,
    tests: (id: string) => `/courses/${id}/tests`,
    reviews: (id: string) => `/courses/${id}/reviews`,
  },

  // AI Assistant
  aiAssistant: {
    message: '/ai-assistant/message',
    analyzeImages: '/ai-assistant/analyze-images',
    differentialDiagnosis: '/ai-assistant/differential-diagnosis',
    feedback: '/ai-assistant/feedback',
    history: '/ai-assistant/history',
    usage: '/ai-assistant/usage',
    export: '/ai-assistant/export',
    status: '/ai-assistant/status',
    testServices: '/ai-assistant/test-services',
  },

  // Dashboard
  dashboard: '/dashboard',
  notifications: {
    list: '/notifications',
    markAsRead: (id: string) => `/notifications/${id}/read`,
    delete: (id: string) => `/notifications/${id}`,
    markAllAsRead: '/notifications/mark-all-read',
  },

  // Certificates
  certificates: {
    list: '/certificates',
    show: (id: string) => `/certificates/${id}`,
    download: (id: string) => `/certificates/${id}/download`,
    verify: (code: string) => `/certificates/verify/${code}`,
  },

  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    courses: '/analytics/courses',
    ai: '/analytics/ai',
    users: '/analytics/users',
  },
};

// Helper functions for common API operations
export const apiHelpers = {
  // Generic GET request with caching
  get: async <T = any>(
    url: string, 
    config?: AxiosRequestConfig,
    cache = false,
    cacheTime = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> => {
    const cacheKey = `api_cache_${url}_${JSON.stringify(config?.params || {})}`;

    if (cache) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTime) {
          return data;
        }
      }
    }

    const response = await api.get<T>(url, config);

    if (cache) {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }));
    }

    return response.data;
  },

  // Generic POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  // Generic PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  // Generic PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  // Generic DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<T>(url, config);
    return response.data;
  },

  // Upload file with progress
  uploadFile: async (
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // Download file
  downloadFile: async (url: string, filename?: string) => {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Clear cache
  clearCache: (pattern?: string) => {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        if (!pattern || key.includes(pattern)) {
          sessionStorage.removeItem(key);
        }
      }
    });
  },
};

// Health check function
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: Record<string, 'operational' | 'degraded' | 'down'>;
}> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'down',
        database: 'unknown',
        ai_services: 'unknown'
      }
    };
  }
};

// WebSocket connection helper
export const createWebSocketConnection = (endpoint: string, options?: {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}) => {
  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:6001'}${endpoint}`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = options?.onOpen || (() => console.log('WebSocket connected'));
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      options?.onMessage?.(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };
  ws.onerror = options?.onError || ((error) => console.error('WebSocket error:', error));
  ws.onclose = options?.onClose || (() => console.log('WebSocket disconnected'));

  return ws;
};

export { api };
export default api;
