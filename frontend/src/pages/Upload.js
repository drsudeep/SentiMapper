import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload as UploadIcon, FileText, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Upload({ user, onLogout }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTextAnalysis = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/analyze/text`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Text analyzed successfully!');
      setText('');
      setTimeout(() => navigate('/analysis'), 500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API}/analyze/csv`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      toast.success(`Analyzed ${response.data.count} texts successfully!`);
      setFile(null);
      setTimeout(() => navigate('/analysis'), 500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="upload-page">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-heading">Upload Data</h1>
          <p className="text-base text-muted-foreground mt-2">Analyze text manually or upload a CSV file</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Text Input */}
          <Card className="p-8 border" data-testid="manual-text-card">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold tracking-normal font-heading">Manual Text Input</h3>
              </div>

              <form onSubmit={handleTextAnalysis} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Enter text to analyze</Label>
                  <Textarea
                    id="text"
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="resize-none"
                    data-testid="text-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={loading || !text.trim()}
                  data-testid="analyze-text-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Text'
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* CSV File Upload */}
          <Card className="p-8 border" data-testid="csv-upload-card">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <UploadIcon className="h-6 w-6" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold tracking-normal font-heading">CSV File Upload</h3>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload CSV file</Label>
                  <div className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-primary/50 transition-colors duration-200">
                    <input
                      id="file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                      data-testid="file-input"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                      <p className="text-base font-medium mb-1">
                        {file ? file.name : 'Click to upload CSV'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CSV file with text column
                      </p>
                    </label>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>CSV Format:</strong> Your CSV should have a column named "text", "content", "tweet", or "review" containing the text to analyze.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={loading || !file}
                  data-testid="upload-csv-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload & Analyze'
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sample CSV */}
        <Card className="p-6 border" data-testid="sample-csv-card">
          <h3 className="text-xl font-semibold tracking-normal font-heading mb-4">Sample CSV Format</h3>
          <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
            <pre>
text
"This product is amazing! I love it."
"Terrible experience. Would not recommend."
"It's okay, nothing special."
            </pre>
          </div>
        </Card>
      </div>
    </Layout>
  );
}