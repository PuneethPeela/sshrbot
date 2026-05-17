import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin using a service account or default credentials
# For Hackathon MVP, we can skip explicit service account if environment is set,
# or provide a dummy check if testing locally without a real project.
firebase_credentials = os.getenv("FIREBASE_CREDENTIALS_PATH")
try:
    if firebase_credentials and os.path.exists(firebase_credentials):
        cred = credentials.Certificate(firebase_credentials)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()
except ValueError:
    # App already initialized
    pass

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    # Mock fallback for local MVP testing without real firebase keys
    if os.getenv("SKIP_AUTH") == "true" or token == "mock_token_for_testing":
        return {"uid": "mock_user", "email": "employee@promtal.com"}
        
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
