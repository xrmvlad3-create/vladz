import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  BookOpen,
  Brain,
  Users,
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  ChevronRight,
  Calendar,
  BookmarkCheck,
  Stethoscope,
  GraduationCap
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  type: 'course_completed' | 'ai_interaction' | 'certificate_earned' | 'condition_viewed';
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
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: dashboardData, loading, error, refetch } = useDashboardData();

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [aiUsageData, setAiUsageData] = useState<any>(null);

  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData.stats);
      setRecentActivity(dashboardData.recentActivity);
      setCourseProgress(dashboardData.courseProgress);
      setAiUsageData(dashboardData.aiUsageData);
    }
  }, [dashboardData]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bună dimineața';
    if (hour < 18) return 'Bună ziua';
    return 'Bună seara';
  };

  const getUserRoleDisplay = (): string => {
    if (!user?.roles) return 'Utilizator';

    const role = user.roles[0];
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'professor': 'Profesor',
      'doctor': 'Medic',
      'student': 'Student'
    };

    return roleMap[role] || 'Utilizator';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_completed':
        return <GraduationCap className="h-4 w-4 text-green-500" />;
      case 'ai_interaction':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'certificate_earned':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'condition_viewed':
        return <Stethoscope className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'acum';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}z`;
    return date.toLocaleDateString('ro-RO');
  };

  const aiUsageChartData = aiUsageData ? {
    labels: aiUsageData.labels,
    datasets: [
      {
        label: 'Interacțiuni AI',
        data: aiUsageData.values,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const courseCompletionData = {
    labels: ['Finalizate', 'În progres', 'Neînceput'],
    datasets: [
      {
        data: [
          stats?.completedCourses || 0,
          courseProgress?.length || 0,
          (stats?.totalCourses || 0) - (stats?.completedCourses || 0) - (courseProgress?.length || 0)
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              A apărut o eroare la încărcarea datelor dashboard-ului. 
              <Button variant="link" className="p-0 h-auto font-normal" onClick={refetch}>
                Încearcă din nou
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                {getUserRoleDisplay()} • {user?.institution || 'IzaManagement Platform'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Ultima vizită: {user?.last_login_at ? 
                  new Date(user.last_login_at).toLocaleDateString('ro-RO') : 'N/A'}
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Program
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cursuri Active</p>
                  <p className="text-3xl font-bold text-gray-900">{courseProgress?.length || 0}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats?.completedCourses || 0} finalizate
                  </p>
                </div>
                <BookOpen className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interacțiuni AI</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.aiInteractions || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedPeriod === '7d' ? 'Ultima săptămână' : 
                     selectedPeriod === '30d' ? 'Ultima lună' : 'Ultimele 3 luni'}
                  </p>
                </div>
                <Brain className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credite EMC</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.cmeCreditsEarned || 0}</p>
                  <p className="text-xs text-yellow-600 mt-1">Câștigate anul acesta</p>
                </div>
                <Award className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Afecțiuni Consultate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.medicalConditions || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Din biblioteca medicală</p>
                </div>
                <Stethoscope className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Progress */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  Progresul Cursurilor
                  <div className="flex space-x-2">
                    {['7d', '30d', '90d'].map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPeriod(period as any)}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courseProgress && courseProgress.length > 0 ? (
                  <div className="space-y-4">
                    {courseProgress.slice(0, 5).map((course) => (
                      <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{course.title}</h4>
                            <p className="text-sm text-gray-500">
                              {course.instructor} • {course.category}
                            </p>
                          </div>
                          <Badge variant={course.progress >= 80 ? 'default' : 'secondary'}>
                            {course.progress}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        {course.deadline && (
                          <p className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Deadline: {new Date(course.deadline).toLocaleDateString('ro-RO')}
                          </p>
                        )}
                      </div>
                    ))}

                    {courseProgress.length > 5 && (
                      <Button variant="ghost" className="w-full">
                        Vezi toate cursurile ({courseProgress.length - 5} mai multe)
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Niciun curs activ
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Începe învățarea cu cursurile noastre medicale
                    </p>
                    <Button>
                      Explorează Cursurile
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Usage Analytics */}
            {aiUsageChartData && (
              <Card>
                <CardHeader>
                  <CardTitle>Utilizarea Asistentului AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line
                      data={aiUsageChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activitate Recentă</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Nicio activitate recentă
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Completion Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Progresul General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <Doughnut
                    data={courseCompletionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acțiuni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  Întreabă Asistentul AI
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Caută Cursuri
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Afecțiuni Medicale
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Certificatele Mele
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            {stats?.upcomingDeadlines && stats.upcomingDeadlines > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>{stats.upcomingDeadlines} termene apropiate</strong>
                  <br />
                  Verifică cursurile pentru deadline-uri importante.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Statusul Sistemului
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">API Status: Operațional</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">AI Services: Disponibile</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Utilizare AI: {user?.monthly_ai_usage || 0}/1000
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
