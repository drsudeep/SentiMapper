# AI-Powered Sentiment Analysis Dashboard

A complete, locally-running sentiment analysis application built with FastAPI, React, and MongoDB. Analyze text sentiment from manual input or CSV files, visualize results with interactive charts, and export reports.

## Features

### Core Functionality
- **User Authentication**: Secure JWT-based registration and login
- **Text Analysis**: Analyze sentiment of individual texts or batch upload via CSV
- **Real-time Results**: Instant sentiment classification (Positive/Negative/Neutral)
- **Advanced Metrics**: Polarity scores, subjectivity analysis, and keyword extraction
- **Data Visualization**: Interactive charts showing sentiment distribution and trends
- **Export Reports**: Download analysis results as CSV
- **Admin Dashboard**: System overview and user statistics (admin users only)

### Sentiment Analysis
- Powered by **TextBlob** NLP library
- Classifies text as Positive, Negative, or Neutral
- Calculates polarity (-1 to +1) and subjectivity (0 to 1) scores
- Extracts top keywords from analyzed text
- Handles batch processing of up to 1000 texts per CSV upload

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database with Motor async driver
- **TextBlob**: Natural Language Processing library
- **JWT**: Secure authentication
- **bcrypt**: Password hashing

### Frontend
- **React**: UI framework
- **Recharts**: Data visualization library
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: High-quality UI components
- **Axios**: HTTP client

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB

### Backend Setup

1. Navigate to backend directory:
```bash
cd /app/backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download TextBlob corpora (already done):
```bash
python -m textblob.download_corpora
```

4. Environment variables are already configured in `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=sentiment-analysis-secret-key-change-in-production
CORS_ORIGINS=*
```

5. Backend runs on port 8001 (managed by supervisor)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd /app/frontend
```

2. Install dependencies:
```bash
yarn install
```

3. Frontend runs on port 3000 (managed by supervisor)

### Starting the Application

Services are managed by supervisor and auto-start:

```bash
# Check status
sudo supervisorctl status

# Restart services if needed
sudo supervisorctl restart backend frontend
```

Access the application at: `http://localhost:3000`

## Usage Guide

### 1. Create an Account
- Navigate to the Register page
- Enter your name, email, and password
- Click "Create Account"

### 2. Analyze Text

#### Manual Input
1. Go to **Upload** page
2. Enter or paste text in the text area
3. Click "Analyze Text"
4. View results in the Analysis page

#### CSV Upload
1. Go to **Upload** page
2. Click "Click to upload CSV" and select your CSV file
3. CSV should have a column named: `text`, `content`, `tweet`, `review`, or `message`
4. Click "Upload & Analyze"
5. View batch results in the Analysis page

**Sample CSV format:**
```csv
text
"This product is amazing! I love it."
"Terrible experience. Would not recommend."
"It's okay, nothing special."
```

A sample dataset is provided at `/app/sample_data.csv`

### 3. View Dashboard
- See overall statistics (total, positive, negative, neutral counts)
- View sentiment distribution pie chart
- Analyze 7-day trends with line chart
- Explore top keywords bar chart

### 4. Manage Results
- **Filter**: Use dropdown to filter by sentiment type
- **Delete**: Remove individual analysis results
- **Export**: Download all results as CSV

### 5. Admin Access
Create an admin user by updating MongoDB:
```bash
# Connect to MongoDB
mongo

# Switch to database
use test_database

# Update user to admin
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { is_admin: true } }
)
```

Admin users can access the Admin Dashboard to view system-wide statistics.

## API Documentation

### Authentication

**Register**
```
POST /api/auth/register
Body: { "name": "string", "email": "string", "password": "string" }
```

**Login**
```
POST /api/auth/login
Body: { "email": "string", "password": "string" }
Returns: { "token": "jwt-token", "user": {...} }
```

**Get Current User**
```
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
```

### Analysis

**Analyze Text**
```
POST /api/analyze/text
Headers: { "Authorization": "Bearer <token>" }
Body: { "text": "string" }
```

**Analyze CSV**
```
POST /api/analyze/csv
Headers: { "Authorization": "Bearer <token>" }
Body: FormData with file
```

**Get Sentiments**
```
GET /api/sentiments?sentiment=positive&limit=100&skip=0
Headers: { "Authorization": "Bearer <token>" }
```

**Get Statistics**
```
GET /api/sentiments/stats
Headers: { "Authorization": "Bearer <token>" }
```

**Get Trends**
```
GET /api/sentiments/trends?days=7
Headers: { "Authorization": "Bearer <token>" }
```

**Get Keywords**
```
GET /api/sentiments/keywords?limit=20
Headers: { "Authorization": "Bearer <token>" }
```

**Delete Sentiment**
```
DELETE /api/sentiments/{sentiment_id}
Headers: { "Authorization": "Bearer <token>" }
```

**Export CSV**
```
GET /api/export/csv
Headers: { "Authorization": "Bearer <token>" }
```

### Admin

**Get Admin Stats**
```
GET /api/admin/stats
Headers: { "Authorization": "Bearer <token>" }
Note: Requires admin privileges
```

## Database Schema

### Users Collection
```javascript
{
  id: "uuid",
  email: "string",
  password: "hashed-password",
  name: "string",
  is_admin: boolean,
  created_at: "ISO-date-string"
}
```

### Sentiments Collection
```javascript
{
  id: "uuid",
  user_id: "uuid",
  text: "string",
  sentiment: "positive|negative|neutral",
  polarity: number,  // -1 to 1
  subjectivity: number,  // 0 to 1
  keywords: ["string"],
  created_at: "ISO-date-string"
}
```

## Design Guidelines

The application follows a **Swiss Control Room** design philosophy:
- **Colors**: Monochrome (95%) with sentiment-specific colors (5%)
  - Positive: Green (#10b981)
  - Negative: Red (#ef4444)
  - Neutral: Gray (#94a3b8)
- **Typography**: 
  - Headings: Manrope (bold, tight tracking)
  - Body: IBM Plex Sans (clean, readable)
  - Code: JetBrains Mono (data display)
- **Layout**: Sidebar navigation with spacious content area
- **Components**: Border-focused cards with minimal shadows

## Project Structure

```
/app/
├── backend/
│   ├── server.py           # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Upload.js
│   │   │   ├── Analysis.js
│   │   │   └── Admin.js
│   │   ├── components/    # Reusable components
│   │   │   ├── Layout.js
│   │   │   └── ui/        # Shadcn components
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
├── sample_data.csv        # Sample dataset
└── README.md
```

## Resume Bullet Points

**AI-Powered Sentiment Analysis Dashboard**
- Built full-stack sentiment analysis application using FastAPI, React, and MongoDB with TextBlob NLP integration
- Implemented secure JWT authentication, batch CSV processing (1000+ texts), and real-time sentiment classification
- Designed interactive data visualizations (Recharts) showing sentiment distribution, trend analysis, and keyword extraction
- Architected RESTful APIs with proper error handling, pagination, and CSV export functionality
- Created responsive UI with Tailwind CSS following Swiss design principles for optimal data presentation

## Interview Explanation

**Technical Overview:**
"I built a production-ready sentiment analysis dashboard that allows users to analyze text sentiment from multiple sources. The backend uses FastAPI with asynchronous MongoDB operations for high performance. For NLP, I integrated TextBlob which provides sentiment polarity scores and keyword extraction.

The architecture follows best practices: JWT for secure authentication, bcrypt for password hashing, and proper separation of concerns with Pydantic models for validation. The frontend is built with React and uses Recharts for data visualization, showing sentiment distribution, trends over time, and keyword frequency.

Key technical challenges I solved include handling batch CSV uploads efficiently (up to 1000 texts), implementing proper MongoDB queries with projections to avoid ObjectId serialization issues, and creating a responsive dashboard that handles both empty states and large datasets gracefully.

The application is containerized and runs fully locally without any external API dependencies, making it cost-effective and privacy-focused."

**Features Highlight:**
- User authentication and authorization
- Single text and batch CSV processing
- Real-time sentiment analysis with polarity scores
- Interactive charts and trend analysis
- Keyword extraction from analyzed texts
- Data filtering and export capabilities
- Admin dashboard for system monitoring

## Security Considerations

- Passwords hashed with bcrypt
- JWT tokens with expiration
- Protected routes with authentication middleware
- Input validation with Pydantic
- CORS configuration for secure frontend-backend communication
- MongoDB projections to exclude sensitive data

## Performance Optimizations

- Async/await throughout the stack
- MongoDB indexing on user_id and sentiment fields
- Pagination for large datasets
- Batch processing for CSV uploads
- Efficient keyword extraction algorithm

## Future Enhancements

- Multi-language sentiment analysis support
- Advanced NLP models (BERT, transformers)
- Real-time analysis with WebSockets
- Scheduled analysis jobs
- Email notifications for batch processing
- API rate limiting
- User dashboard customization
- Export to PDF with charts
- Sentiment comparison across time periods

## License

MIT License

## Author

Built with FastAPI, React, MongoDB, and TextBlob
