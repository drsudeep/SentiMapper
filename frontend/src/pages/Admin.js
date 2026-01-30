import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Users, FileText, Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Admin({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="admin-page">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-heading">Admin Dashboard</h1>
          <p className="text-base text-muted-foreground mt-2">System overview and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="total-users-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-bold tracking-tight mt-2">{stats?.total_users || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </Card>

          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="total-analyses-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Analyses</p>
                <p className="text-3xl font-bold tracking-tight mt-2">{stats?.total_analyses || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </Card>

          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="avg-per-user-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg per User</p>
                <p className="text-3xl font-bold tracking-tight mt-2">
                  {stats && stats.total_users > 0 
                    ? Math.round(stats.total_analyses / stats.total_users)
                    : 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 border" data-testid="recent-activity-card">
          <h3 className="text-xl font-semibold tracking-normal font-heading mb-4">Recent Analyses</h3>
          {stats?.recent_analyses && stats.recent_analyses.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_analyses.map((analysis, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-md" data-testid={`recent-analysis-${idx}`}>
                  <p className="text-sm font-medium mb-1">
                    Sentiment: <span className="font-bold">{analysis.sentiment.toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{analysis.text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(analysis.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </Card>
      </div>
    </Layout>
  );
}