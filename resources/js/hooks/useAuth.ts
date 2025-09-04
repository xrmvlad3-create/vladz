import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  specialization?: string;
  institution?: string;
  license_number?: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  avatar?: string;
  is_active: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  roles: string[];
  permissions: string[];
  has_completed_profile: boolean;
  completed_courses: number;
  total_cme_credits: number;
  monthly_ai_usage: number;
  can_access_ai: boolean;
  has_exceeded_ai_limits: boolean;
  two_factor_enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (userData: RegisterData) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  verifyEmail: (id: number, hash: string) => Promise<void>;
  enable2FA: () => Promise<TwoFactorSetup>;
  confirm2FA: (code: string) => Promise<void>;
  disable2FA: (password: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  two_factor_code?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
  requires_2fa?: boolean;
  temp_token?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  specialization: string;
  institution: string;
  license_number?: string;
  phone?: string;
  country?: string;
  city?: string;
}

interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface ResetPasswordData {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  recovery_codes: string[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize auth state from localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        // Validate token and refresh user data
        fetchCurrentUser();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearAuthData();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const setAuthData = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    delete api.defaults.headers.common['Authorization'];
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/user');
      setUser(response.data.user);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Error fetching current user:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', credentials);
      const { user: userData, token: authToken, requires_2fa } = response.data;

      if (requires_2fa) {
        return response.data;
      }

      setAuthData(userData, authToken);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la autentificare';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/register', userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la înregistrare';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (allDevices = false): Promise<void> => {
    setIsLoading(true);

    try {
      await api.post('/auth/logout', { all_devices: allDevices });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearAuthData();
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await api.post('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la actualizarea profilului';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/password/change', data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la schimbarea parolei';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/password/forgot', { email });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la trimiterea email-ului de resetare';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/password/reset', data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la resetarea parolei';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (id: number, hash: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/email/verify', { id, hash });
      if (user) {
        setUser({ ...user, email_verified_at: new Date().toISOString() });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la verificarea email-ului';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async (): Promise<TwoFactorSetup> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/2fa/enable');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la activarea 2FA';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const confirm2FA = async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/2fa/confirm', { code });
      if (user) {
        setUser({ ...user, two_factor_enabled: true });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la confirmarea 2FA';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async (password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/2fa/disable', { password });
      if (user) {
        setUser({ ...user, two_factor_enabled: false });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la dezactivarea 2FA';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await api.post('/auth/refresh');
      const { token: newToken } = response.data;
      setToken(newToken);
      localStorage.setItem('auth_token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearAuthData();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    enable2FA,
    confirm2FA,
    disable2FA,
    refreshToken,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) => {
  return (props: P) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return null;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
      if (!hasRequiredRole) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Acces restricționat</h2>
              <p className="text-gray-600 mt-2">Nu aveți permisiunile necesare pentru a accesa această pagină.</p>
            </div>
          </div>
        );
      }
    }

    return <Component {...props} />;
  };
};

// Hook for checking specific permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => user?.roles.includes(role)) || false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => user?.permissions.includes(permission)) || false;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    user,
  };
};
