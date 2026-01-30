import requests
import sys
import json
from datetime import datetime
import os

class SentimentAnalysisAPITester:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.sentiment_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)
        
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {response['user']['email']}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Login Test {timestamp}"
        }
        
        # Register first
        reg_success, reg_response = self.run_test(
            "Registration for Login Test",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not reg_success:
            return False
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            # Update token for subsequent tests
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data=invalid_data
        )
        return success

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'id' in response

    def test_analyze_text(self):
        """Test text sentiment analysis"""
        test_texts = [
            "This is amazing! I love it so much!",
            "Terrible experience. Very disappointed.",
            "It's okay, nothing special."
        ]
        
        all_passed = True
        for i, text in enumerate(test_texts):
            success, response = self.run_test(
                f"Analyze Text {i+1}",
                "POST",
                "analyze/text",
                200,
                data={"text": text}
            )
            
            if success and 'sentiment' in response and 'id' in response:
                self.sentiment_ids.append(response['id'])
                print(f"   Sentiment: {response['sentiment']}, Polarity: {response['polarity']}")
            else:
                all_passed = False
        
        return all_passed

    def test_analyze_empty_text(self):
        """Test analyzing empty text"""
        success, response = self.run_test(
            "Analyze Empty Text",
            "POST",
            "analyze/text",
            400,
            data={"text": ""}
        )
        return success

    def test_analyze_csv(self):
        """Test CSV file analysis"""
        csv_path = "/app/sample_data.csv"
        
        if not os.path.exists(csv_path):
            print(f"❌ CSV file not found at {csv_path}")
            return False
        
        with open(csv_path, 'rb') as f:
            files = {'file': ('sample_data.csv', f, 'text/csv')}
            success, response = self.run_test(
                "Analyze CSV File",
                "POST",
                "analyze/csv",
                200,
                files=files
            )
        
        return success and 'count' in response

    def test_get_sentiments(self):
        """Test retrieving sentiments"""
        success, response = self.run_test(
            "Get All Sentiments",
            "GET",
            "sentiments",
            200
        )
        return success and isinstance(response, list)

    def test_get_sentiments_filtered(self):
        """Test retrieving filtered sentiments"""
        success, response = self.run_test(
            "Get Positive Sentiments",
            "GET",
            "sentiments?sentiment=positive",
            200
        )
        return success and isinstance(response, list)

    def test_get_stats(self):
        """Test getting sentiment statistics"""
        success, response = self.run_test(
            "Get Sentiment Stats",
            "GET",
            "sentiments/stats",
            200
        )
        
        expected_fields = ['total', 'positive', 'negative', 'neutral', 'avg_polarity']
        return success and all(field in response for field in expected_fields)

    def test_get_trends(self):
        """Test getting trend data"""
        success, response = self.run_test(
            "Get Trends (7 days)",
            "GET",
            "sentiments/trends?days=7",
            200
        )
        return success and isinstance(response, list)

    def test_get_keywords(self):
        """Test getting top keywords"""
        success, response = self.run_test(
            "Get Top Keywords",
            "GET",
            "sentiments/keywords",
            200
        )
        return success and isinstance(response, list)

    def test_delete_sentiment(self):
        """Test deleting a sentiment"""
        if not self.sentiment_ids:
            print("❌ No sentiment IDs available for deletion test")
            return False
        
        sentiment_id = self.sentiment_ids[0]
        success, response = self.run_test(
            "Delete Sentiment",
            "DELETE",
            f"sentiments/{sentiment_id}",
            200
        )
        return success

    def test_export_csv(self):
        """Test CSV export"""
        success, response = self.run_test(
            "Export CSV",
            "GET",
            "export/csv",
            200
        )
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        return success and 'message' in response

def main():
    print("🚀 Starting Sentiment Analysis API Tests")
    print("=" * 50)
    
    tester = SentimentAnalysisAPITester()
    
    # Test sequence
    test_sequence = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("User Registration", tester.test_register),
        ("Get Current User", tester.test_get_me),
        ("User Login", tester.test_login),
        ("Invalid Login", tester.test_invalid_login),
        ("Analyze Text", tester.test_analyze_text),
        ("Analyze Empty Text", tester.test_analyze_empty_text),
        ("Analyze CSV", tester.test_analyze_csv),
        ("Get Sentiments", tester.test_get_sentiments),
        ("Get Filtered Sentiments", tester.test_get_sentiments_filtered),
        ("Get Stats", tester.test_get_stats),
        ("Get Trends", tester.test_get_trends),
        ("Get Keywords", tester.test_get_keywords),
        ("Delete Sentiment", tester.test_delete_sentiment),
        ("Export CSV", tester.test_export_csv),
    ]
    
    failed_tests = []
    
    for test_name, test_func in test_sequence:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\nSuccess rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())