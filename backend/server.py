from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from textblob import TextBlob
import csv
import io
import re
from collections import Counter

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Sentiment Analysis API", version="1.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    is_admin: bool = False
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: User

class TextInput(BaseModel):
    text: str

class SentimentResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    text: str
    sentiment: str  # positive, negative, neutral
    polarity: float
    subjectivity: float
    keywords: List[str]
    created_at: str

class SentimentStats(BaseModel):
    total: int
    positive: int
    negative: int
    neutral: int
    avg_polarity: float

class TrendPoint(BaseModel):
    date: str
    positive: int
    negative: int
    neutral: int

# ============ AUTH UTILITIES ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# ============ SENTIMENT ANALYSIS UTILITIES ============

def analyze_sentiment(text: str) -> dict:
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Determine sentiment
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Extract keywords (simple approach: get nouns and adjectives)
    words = blob.words.lower()
    # Filter out common stop words and get meaningful words
    stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'and', 'or', 'but', 'not', 'no', 'yes', 'to', 'from', 'in', 'out', 'up', 'down', 'with', 'by', 'for', 'of'}
    keywords = [word for word in words if len(word) > 3 and word not in stop_words]
    keyword_freq = Counter(keywords)
    top_keywords = [word for word, count in keyword_freq.most_common(5)]
    
    return {
        'sentiment': sentiment,
        'polarity': round(polarity, 3),
        'subjectivity': round(subjectivity, 3),
        'keywords': top_keywords
    }

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    try:
        # Check if user exists
        email_str = str(user_data.email).lower()
        existing = await db.users.find_one({"email": email_str})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": email_str,
            "password": hash_password(user_data.password),
            "name": user_data.name,
            "is_admin": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        
        token = create_token(user_id)
        user = User(
            id=user_id,
            email=email_str,
            name=user_data.name,
            is_admin=False,
            created_at=user_doc['created_at']
        )
        
        return TokenResponse(token=token, user=user)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    email_str = str(credentials.email).lower()
    user = await db.users.find_one({"email": email_str})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'])
    user_obj = User(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        is_admin=user.get('is_admin', False),
        created_at=user['created_at']
    )
    
    return TokenResponse(token=token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ============ SENTIMENT ANALYSIS ROUTES ============

@api_router.post("/analyze/text", response_model=SentimentResult)
async def analyze_text(input_data: TextInput, current_user: dict = Depends(get_current_user)):
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    analysis = analyze_sentiment(input_data.text)
    
    result_id = str(uuid.uuid4())
    result_doc = {
        "id": result_id,
        "user_id": current_user['id'],
        "text": input_data.text,
        "sentiment": analysis['sentiment'],
        "polarity": analysis['polarity'],
        "subjectivity": analysis['subjectivity'],
        "keywords": analysis['keywords'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sentiments.insert_one(result_doc)
    
    return SentimentResult(**result_doc)

@api_router.post("/analyze/csv")
async def analyze_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    contents = await file.read()
    decoded = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    # Try to find text column
    fieldnames = csv_reader.fieldnames
    text_column = None
    for field in ['text', 'Text', 'content', 'Content', 'tweet', 'Tweet', 'review', 'Review', 'message', 'Message']:
        if field in fieldnames:
            text_column = field
            break
    
    if not text_column:
        # Use first column
        text_column = fieldnames[0] if fieldnames else None
    
    if not text_column:
        raise HTTPException(status_code=400, detail="Could not find text column in CSV")
    
    results = []
    count = 0
    for row in csv_reader:
        if count >= 1000:  # Limit to 1000 rows
            break
        
        text = row.get(text_column, '').strip()
        if not text:
            continue
        
        analysis = analyze_sentiment(text)
        result_id = str(uuid.uuid4())
        result_doc = {
            "id": result_id,
            "user_id": current_user['id'],
            "text": text,
            "sentiment": analysis['sentiment'],
            "polarity": analysis['polarity'],
            "subjectivity": analysis['subjectivity'],
            "keywords": analysis['keywords'],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        results.append(result_doc)
        count += 1
    
    if results:
        await db.sentiments.insert_many(results)
    
    return {"message": f"Analyzed {len(results)} texts", "count": len(results)}

@api_router.get("/sentiments", response_model=List[SentimentResult])
async def get_sentiments(
    sentiment: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    skip: int = Query(0),
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user['id']}
    if sentiment and sentiment in ['positive', 'negative', 'neutral']:
        query['sentiment'] = sentiment
    
    results = await db.sentiments.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return results

@api_router.get("/sentiments/stats", response_model=SentimentStats)
async def get_stats(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user['id']}
    
    all_sentiments = await db.sentiments.find(query, {"_id": 0}).to_list(10000)
    
    total = len(all_sentiments)
    positive = sum(1 for s in all_sentiments if s['sentiment'] == 'positive')
    negative = sum(1 for s in all_sentiments if s['sentiment'] == 'negative')
    neutral = sum(1 for s in all_sentiments if s['sentiment'] == 'neutral')
    
    avg_polarity = sum(s['polarity'] for s in all_sentiments) / total if total > 0 else 0
    
    return SentimentStats(
        total=total,
        positive=positive,
        negative=negative,
        neutral=neutral,
        avg_polarity=round(avg_polarity, 3)
    )

@api_router.get("/sentiments/trends", response_model=List[TrendPoint])
async def get_trends(days: int = Query(7, le=30), current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user['id']}
    all_sentiments = await db.sentiments.find(query, {"_id": 0}).to_list(10000)
    
    # Group by date
    trends = {}
    for s in all_sentiments:
        date = s['created_at'][:10]  # Extract date (YYYY-MM-DD)
        if date not in trends:
            trends[date] = {'positive': 0, 'negative': 0, 'neutral': 0}
        trends[date][s['sentiment']] += 1
    
    # Convert to list and sort by date
    trend_list = [
        TrendPoint(date=date, **counts)
        for date, counts in sorted(trends.items())
    ]
    
    return trend_list[-days:]

@api_router.get("/sentiments/keywords")
async def get_top_keywords(limit: int = Query(20, le=50), current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user['id']}
    all_sentiments = await db.sentiments.find(query, {"_id": 0}).to_list(10000)
    
    all_keywords = []
    for s in all_sentiments:
        all_keywords.extend(s.get('keywords', []))
    
    keyword_freq = Counter(all_keywords)
    top_keywords = [{'word': word, 'count': count} for word, count in keyword_freq.most_common(limit)]
    
    return top_keywords

@api_router.delete("/sentiments/{sentiment_id}")
async def delete_sentiment(sentiment_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.sentiments.delete_one({"id": sentiment_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    return {"message": "Deleted successfully"}

# ============ ADMIN ROUTES ============

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if not current_user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if not current_user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_analyses = await db.sentiments.count_documents({})
    
    # Get recent activity
    recent_analyses = await db.sentiments.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_users": total_users,
        "total_analyses": total_analyses,
        "recent_analyses": recent_analyses
    }

# ============ EXPORT ROUTES ============

@api_router.get("/export/csv")
async def export_csv(current_user: dict = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    
    query = {"user_id": current_user['id']}
    sentiments = await db.sentiments.find(query, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=['text', 'sentiment', 'polarity', 'subjectivity', 'keywords', 'created_at'])
    writer.writeheader()
    
    for s in sentiments:
        writer.writerow({
            'text': s['text'],
            'sentiment': s['sentiment'],
            'polarity': s['polarity'],
            'subjectivity': s['subjectivity'],
            'keywords': ', '.join(s.get('keywords', [])),
            'created_at': s['created_at']
        })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentiment_analysis.csv"}
    )

# Root route
@api_router.get("/")
async def root():
    return {"message": "Sentiment Analysis API", "version": "1.0"}

# Include the router in the main app
app.include_router(api_router)

origins = os.environ.get("CORS_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()