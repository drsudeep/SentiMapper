import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Trash2, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#94a3b8'
};

export default function Analysis({ user, onLogout }) {
  const [sentiments, setSentiments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiments();
  }, [filter]);

  const fetchSentiments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${API}/sentiments?limit=100`
        : `${API}/sentiments?sentiment=${filter}&limit=100`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentiments(response.data);
    } catch (error) {
      console.error('Error fetching sentiments:', error);
      toast.error('Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/sentiments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted successfully');
      setSentiments(sentiments.filter(s => s.id !== id));
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sentiment_analysis.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export successful!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="analysis-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight font-heading">Analysis Results</h1>
            <p className="text-base text-muted-foreground mt-2">View and manage your sentiment analyses</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]" data-testid="sentiment-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={handleExport}
              data-testid="export-csv-button"
              className="h-10"
            >
              <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : sentiments.length === 0 ? (
          <Card className="p-12 border text-center" data-testid="no-results">
            <p className="text-muted-foreground">No analyses found. Upload some data to get started!</p>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="results-list">
            {sentiments.map((sentiment) => (
              <Card key={sentiment.id} className="p-6 border hover:border-primary/50 transition-colors duration-200" data-testid={`result-item-${sentiment.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge 
                        style={{ 
                          backgroundColor: COLORS[sentiment.sentiment],
                          color: 'white'
                        }}
                        data-testid={`sentiment-badge-${sentiment.sentiment}`}
                      >
                        {sentiment.sentiment.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Polarity: {sentiment.polarity.toFixed(3)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Subjectivity: {sentiment.subjectivity.toFixed(3)}
                      </span>
                    </div>

                    <p className="text-base leading-relaxed">{sentiment.text}</p>

                    {sentiment.keywords && sentiment.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Keywords:</span>
                        {sentiment.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="font-normal">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(sentiment.created_at).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sentiment.id)}
                    data-testid={`delete-button-${sentiment.id}`}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}