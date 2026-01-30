import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#94a3b8'
};

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, trendsRes, keywordsRes] = await Promise.all([
        axios.get(`${API}/sentiments/stats`, { headers }),
        axios.get(`${API}/sentiments/trends?days=7`, { headers }),
        axios.get(`${API}/sentiments/keywords?limit=10`, { headers })
      ]);

      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setKeywords(keywordsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const pieData = stats ? [
    { name: 'Positive', value: stats.positive, color: COLORS.positive },
    { name: 'Negative', value: stats.negative, color: COLORS.negative },
    { name: 'Neutral', value: stats.neutral, color: COLORS.neutral }
  ] : [];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="dashboard-container">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-heading">Dashboard</h1>
          <p className="text-base text-muted-foreground mt-2">Overview of your sentiment analysis</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="total-analyses-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Analyses</p>
                <p className="text-3xl font-bold tracking-tight mt-2">{stats?.total || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </Card>

          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="positive-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Positive</p>
                <p className="text-3xl font-bold tracking-tight mt-2" style={{ color: COLORS.positive }}>{stats?.positive || 0}</p>
              </div>
              <ThumbsUp className="h-8 w-8" style={{ color: COLORS.positive }} strokeWidth={1.5} />
            </div>
          </Card>

          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="negative-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Negative</p>
                <p className="text-3xl font-bold tracking-tight mt-2" style={{ color: COLORS.negative }}>{stats?.negative || 0}</p>
              </div>
              <ThumbsDown className="h-8 w-8" style={{ color: COLORS.negative }} strokeWidth={1.5} />
            </div>
          </Card>

          <Card className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid="neutral-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Neutral</p>
                <p className="text-3xl font-bold tracking-tight mt-2" style={{ color: COLORS.neutral }}>{stats?.neutral || 0}</p>
              </div>
              <Minus className="h-8 w-8" style={{ color: COLORS.neutral }} strokeWidth={1.5} />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Distribution */}
          <Card className="p-6 border" data-testid="sentiment-distribution-chart">
            <h3 className="text-xl font-semibold tracking-normal font-heading mb-4">Sentiment Distribution</h3>
            {stats && stats.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet. Upload some texts to analyze!
              </div>
            )}
          </Card>

          {/* Trend Analysis */}
          <Card className="p-6 border" data-testid="trend-chart">
            <h3 className="text-xl font-semibold tracking-normal font-heading mb-4">7-Day Trend</h3>
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="positive" stroke={COLORS.positive} strokeWidth={2} />
                  <Line type="monotone" dataKey="negative" stroke={COLORS.negative} strokeWidth={2} />
                  <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </Card>
        </div>

        {/* Top Keywords */}
        <Card className="p-6 border" data-testid="keywords-chart">
          <h3 className="text-xl font-semibold tracking-normal font-heading mb-4">Top Keywords</h3>
          {keywords && keywords.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={keywords}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="word" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="count" fill="#18181b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No keywords extracted yet
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}