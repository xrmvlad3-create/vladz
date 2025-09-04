import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  completedCourses: number;
  aiInteractions: number;
  medicalConditions: number;
  cmeCreditsEarned: number;
  upcomingDeadlines: number;
}

interface ActivityItem {
  id: string;
  type: 'course_completed' | 'ai_interaction' | 'certificate_earned' | 'condition_viewed' | 'profile_updated';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  deadline?: Date;
  instructor: string;
  category: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  enrollment_date: Date;
  last_accessed?: Date;
}

interface AiUsageData {
  labels: string[];
  values: number[];
  totalInteractions: number;
  averagePerDay: number;
  peakUsageDay: string;
  mostUsedFeature: string;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
  action_url?: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  courseProgress: CourseProgress[];
  aiUsageData: AiUsageData;
  notifications: Notification[];
  systemStatus: {
    api: 'operational' | 'degraded' | 'down';
    ai_services: 'operational' | 'degraded' | 'down';
    database: 'operational' | 'degraded' | 'down';
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    type: 'course_deadline' | 'exam' | 'webinar' | 'maintenance';
    date: Date;
    description?: string;
  }>;
}

export const useDashboardData = (refreshInterval = 300000) => { // 5 minutes default
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard');

      // Transform response data to match our interface
      const transformedData: DashboardData = {
        ...response.data,
        recentActivity: response.data.recentActivity?.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        })) || [],
        courseProgress: response.data.courseProgress?.map((course: any) => ({
          ...course,
          deadline: course.deadline ? new Date(course.deadline) : undefined,
          enrollment_date: new Date(course.enrollment_date),
          last_accessed: course.last_accessed ? new Date(course.last_accessed) : undefined
        })) || [],
        notifications: response.data.notifications?.map((notification: any) => ({
          ...notification,
          created_at: new Date(notification.created_at)
        })) || [],
        upcomingEvents: response.data.upcomingEvents?.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        })) || []
      };

      setData(transformedData);
      setLastRefresh(new Date());
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Eroare la încărcarea datelor dashboard-ului';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      if (data) {
        setData(prev => prev ? {
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        } : null);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [data]);

  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);

      if (data) {
        setData(prev => prev ? {
          ...prev,
          notifications: prev.notifications.filter(notification => 
            notification.id !== notificationId
          )
        } : null);
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, [data]);

  const updateCourseProgress = useCallback(async (courseId: string) => {
    try {
      const response = await api.get(`/courses/${courseId}/progress`);
      const updatedProgress = {
        ...response.data,
        deadline: response.data.deadline ? new Date(response.data.deadline) : undefined,
        enrollment_date: new Date(response.data.enrollment_date),
        last_accessed: response.data.last_accessed ? new Date(response.data.last_accessed) : undefined
      };

      if (data) {
        setData(prev => prev ? {
          ...prev,
          courseProgress: prev.courseProgress.map(course =>
            course.id === courseId ? { ...course, ...updatedProgress } : course
          )
        } : null);
      }
    } catch (error) {
      console.error('Failed to update course progress:', error);
    }
  }, [data]);

  const getFilteredActivity = useCallback((type?: ActivityItem['type'], limit = 10) => {
    if (!data?.recentActivity) return [];

    let filtered = data.recentActivity;
    if (type) {
      filtered = filtered.filter(activity => activity.type === type);
    }

    return filtered.slice(0, limit);
  }, [data]);

  const getUpcomingDeadlines = useCallback((daysAhead = 7) => {
    if (!data?.courseProgress) return [];

    const now = new Date();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysAhead);

    return data.courseProgress
      .filter(course => 
        course.deadline && 
        course.deadline > now && 
        course.deadline <= deadline &&
        course.status !== 'completed'
      )
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;
        return a.deadline.getTime() - b.deadline.getTime();
      });
  }, [data]);

  const getUnreadNotifications = useCallback(() => {
    if (!data?.notifications) return [];
    return data.notifications.filter(notification => !notification.read);
  }, [data]);

  const getCoursesByStatus = useCallback((status: CourseProgress['status']) => {
    if (!data?.courseProgress) return [];
    return data.courseProgress.filter(course => course.status === status);
  }, [data]);

  const getAiUsageTrend = useCallback(() => {
    if (!data?.aiUsageData) return 'stable';

    const values = data.aiUsageData.values;
    if (values.length < 2) return 'stable';

    const recent = values.slice(-7); // Last 7 days
    const earlier = values.slice(-14, -7); // Previous 7 days

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;

    if (recentAvg > earlierAvg * 1.1) return 'increasing';
    if (recentAvg < earlierAvg * 0.9) return 'decreasing';
    return 'stable';
  }, [data]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, refreshInterval]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (lastRefresh && Date.now() - lastRefresh.getTime() > 60000) { // 1 minute
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData, lastRefresh]);

  return {
    data,
    loading,
    error,
    lastRefresh,
    refetch,

    // Notification management
    markNotificationAsRead,
    dismissNotification,

    // Course management
    updateCourseProgress,

    // Data utilities
    getFilteredActivity,
    getUpcomingDeadlines,
    getUnreadNotifications,
    getCoursesByStatus,
    getAiUsageTrend,
  };
};

// Hook for real-time dashboard updates using WebSockets
export const useDashboardRealtime = (userId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:6001'}/dashboard/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Dashboard WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        setRealtimeUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Dashboard WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Dashboard WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId]);

  const sendUpdate = useCallback((update: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(update));
    }
  }, [socket, isConnected]);

  return {
    isConnected,
    realtimeUpdates,
    sendUpdate,
  };
};
