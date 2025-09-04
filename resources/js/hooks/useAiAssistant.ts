import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface AiResponse {
  ai_response?: string;
  summary?: string;
  confidence_score: number;
  rationale_explanation: string;
  differential_diagnoses?: string[];
  recommended_actions?: string[];
  recommended_tests?: string[];
  safety_warnings: string[];
  urgency_level: 'routine' | 'high' | 'emergency';
  processing_time: number;
  tokens_used?: number;
  model_used: string;
  service_used: string;
  provider_service: string;
  cost?: number;
  error_message?: string;
  fallback_used?: boolean;
}

interface SendMessageParams {
  message: string;
  sessionId: string;
  context?: {
    userRole?: string;
    specialty?: string;
    institution?: string;
    contextMode?: string;
    medical_history?: any;
  };
}

interface AnalyzeImagesParams {
  images: File[];
  context: string;
  sessionId: string;
  userRole?: string;
}

interface GenerateDiagnosisParams {
  symptoms: string[];
  age?: number;
  gender?: string;
  sessionId: string;
  context?: string;
}

interface RateLimitStatus {
  requests_used: number;
  requests_limit: number;
  requests_remaining: number;
  reset_time: string;
}

interface AiServiceStatus {
  groq: {
    available: boolean;
    rate_limit: RateLimitStatus;
  };
  ollama: {
    available: boolean;
    models: string[];
  };
  fallback_chain_order: string[];
  last_updated: string;
}

export const useAiAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);

  const sendMessage = useCallback(async (params: SendMessageParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai-assistant/message', {
        message: params.message,
        session_id: params.sessionId,
        context: params.context || {},
        interaction_type: 'general_query'
      });

      // Update rate limit status from response headers
      updateRateLimitFromHeaders(response.headers);

      return {
        data: response.data as AiResponse,
        success: true
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la procesarea mesajului';
      setError(errorMessage);

      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter) {
          setError(`Prea multe cereri. Încercați din nou în ${retryAfter} secunde.`);
        }
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeImages = useCallback(async (params: AnalyzeImagesParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      params.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      formData.append('context', params.context);
      formData.append('session_id', params.sessionId);
      formData.append('interaction_type', 'image_analysis');

      if (params.userRole) {
        formData.append('user_role', params.userRole);
      }

      const response = await api.post('/ai-assistant/analyze-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for image analysis
      });

      updateRateLimitFromHeaders(response.headers);

      return {
        data: response.data as AiResponse,
        success: true
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la analiza imaginilor';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateDifferentialDiagnosis = useCallback(async (params: GenerateDiagnosisParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai-assistant/differential-diagnosis', {
        symptoms: params.symptoms,
        age: params.age,
        gender: params.gender,
        session_id: params.sessionId,
        context: params.context,
        interaction_type: 'differential_diagnosis'
      });

      updateRateLimitFromHeaders(response.headers);

      return {
        data: response.data as AiResponse,
        success: true
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la generarea diagnosticului diferențial';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitFeedback = useCallback(async (interactionId: string, rating: number, comment?: string) => {
    try {
      await api.post('/ai-assistant/feedback', {
        interaction_id: interactionId,
        rating,
        comment
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, []);

  const getServiceStatus = useCallback(async (): Promise<AiServiceStatus> => {
    try {
      const response = await api.get('/ai-assistant/status');
      return response.data as AiServiceStatus;
    } catch (error: any) {
      throw new Error('Eroare la obținerea statusului serviciilor AI');
    }
  }, []);

  const getUsageStats = useCallback(async (period: '7d' | '30d' | '90d' = '30d') => {
    try {
      const response = await api.get(`/ai-assistant/usage?period=${period}`);
      return response.data;
    } catch (error: any) {
      throw new Error('Eroare la obținerea statisticilor de utilizare');
    }
  }, []);

  const getInteractionHistory = useCallback(async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/ai-assistant/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw new Error('Eroare la obținerea istoricului interacțiunilor');
    }
  }, []);

  const exportInteractions = useCallback(async (format: 'csv' | 'json' = 'csv', dateFrom?: string, dateTo?: string) => {
    try {
      const params = new URLSearchParams({ format });
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await api.get(`/ai-assistant/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-interactions-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error('Eroare la exportul interacțiunilor');
    }
  }, []);

  const testServices = useCallback(async () => {
    try {
      const response = await api.post('/ai-assistant/test-services');
      return response.data;
    } catch (error: any) {
      throw new Error('Eroare la testarea serviciilor AI');
    }
  }, []);

  const updateRateLimitFromHeaders = (headers: any) => {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (limit && remaining) {
      setRateLimitStatus({
        requests_used: parseInt(limit) - parseInt(remaining),
        requests_limit: parseInt(limit),
        requests_remaining: parseInt(remaining),
        reset_time: reset ? new Date(parseInt(reset) * 1000).toISOString() : ''
      });
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Core functions
    sendMessage,
    analyzeImages,
    generateDifferentialDiagnosis,
    submitFeedback,

    // Utility functions
    getServiceStatus,
    getUsageStats,
    getInteractionHistory,
    exportInteractions,
    testServices,

    // State
    isLoading,
    error,
    rateLimitStatus,
    clearError,
  };
};

// Hook for managing AI conversation context
export const useAiConversation = (sessionId: string) => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>>([]);

  const addMessage = useCallback((message: {
    type: 'user' | 'ai';
    content: string;
    metadata?: any;
  }) => {
    const newMessage = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...message
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<{
    content: string;
    metadata: any;
  }>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const exportConversation = useCallback((format: 'text' | 'json' = 'text') => {
    if (format === 'json') {
      return JSON.stringify(messages, null, 2);
    }

    return messages.map(msg => 
      `[${msg.type.toUpperCase()}] ${msg.timestamp.toLocaleString()}\n${msg.content}\n\n`
    ).join('');
  }, [messages]);

  return {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    exportConversation,
  };
};

// Hook for AI usage analytics
export const useAiAnalytics = () => {
  const [analytics, setAnalytics] = useState<{
    totalInteractions: number;
    averageConfidence: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
    usageByDay: Array<{ date: string; count: number }>;
    feedbackStats: { positive: number; negative: number };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async (period: '7d' | '30d' | '90d' = '30d') => {
    setIsLoading(true);
    try {
      const response = await api.get(`/ai-assistant/analytics?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load AI analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analytics,
    isLoading,
    loadAnalytics,
  };
};
