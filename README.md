# 🚀 SentiMapper – AI Powered Sentiment Analysis Dashboard


A complete **full stack sentiment analysis system** that allows users to analyze text reviews using AI, visualize results, and manage analysis history.

---

## 🌟 Features

### 🔐 Authentication
- User Register & Login (JWT Based)
- Secure password hashing using bcrypt
- Protected API routes

### 🧠 Sentiment Analysis
- Analyze single text input
- Bulk CSV file analysis
- Positive / Negative / Neutral classification
- Polarity & Subjectivity scores
- Keyword extraction

### 📊 Dashboard & Visualization
- Sentiment distribution pie chart  
- 7-day trend graph  
- Top keywords bar chart  
- Analysis history management  

### 📥 Export
- Export all analysis as CSV  
- Filter by sentiment type  

---

## 🖼 Application Screenshots

### 1️⃣ Login Page
![Login](https://github.com/drsudeep/SentiMapper/blob/main/login%20page.png?raw=true)

### 2️⃣ Register Page
![Register](https://github.com/drsudeep/SentiMapper/blob/main/register%20page.png?raw=true)

### 3️⃣ Dashboard Overview
![Dashboard](https://github.com/drsudeep/SentiMapper/blob/main/dashboard%20image.png?raw=true)

### 4️⃣ Upload & Analyze Text / CSV
![Upload](https://github.com/drsudeep/SentiMapper/blob/main/upload%20page.png?raw=true)

### 5️⃣ Analysis Results
![Analysis](https://github.com/drsudeep/SentiMapper/blob/main/analysis%20page.png?raw=true)

### 6️⃣ Top Keywords Visualization
![Keywords](https://github.com/drsudeep/SentiMapper/blob/main/keywords%20page.png?raw=true)

### 7️⃣ Trend Analysis
![Trends](https://github.com/drsudeep/SentiMapper/blob/main/trends%20page.png?raw=true)

---

## 🛠 Tech Stack

### Backend
- Python  
- FastAPI  
- MongoDB  
- TextBlob  
- JWT Authentication  

### Frontend
- React JS  
- Tailwind CSS  
- Recharts  
- Axios  

---

## ⚙ Installation

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m textblob.download_corpora
uvicorn server:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 📂 Project Structure

```
SentiMapper/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── screenshots/
│   ├── login.png
│   ├── register.png
│   ├── dashboard.png
│   ├── upload.png
│   ├── analysis.png
│   ├── keywords.png
│   └── trends.png
│
└── README.md
```

---

## 📌 How It Works

1. User logs in  
2. Uploads text or CSV  
3. System analyzes sentiment using NLP  
4. Dashboard visualizes:
   - Sentiment ratio  
   - Keyword frequency  
   - Weekly trends  
5. User can export reports  

---

## 🧪 Sample CSV Format

```csv
text
"I love this product"
"Worst service ever"
"Average experience"
```

---

## 🎯 Future Enhancements

- AI model upgrade  
- Multi-language support  
- PDF report generation  
- Admin analytics  

---

## 👨‍💻 Author

**Sudeep D R**

- MCA Student  
- Full Stack Developer  
- AI & Web Enthusiast  

---

## 📜 License

MIT License
