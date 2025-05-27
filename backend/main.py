import logging
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = "mongodb+srv://peeapltd:3M3OuJX5HLNsfDwD@fhirhospital.zfyw0vg.mongodb.net/"
try:
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.hospital_fhir
    logger.info("Successfully connected to MongoDB")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

# JWT settings
SECRET_KEY = "your-secret-key"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Hospital(BaseModel):
    name: str
    admin_email: EmailStr
    admin_password: str
    subscription_plan: Optional[str] = "basic"
    description: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    modules: Optional[list[str]] = ["billing", "appointment"]

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception
    
    try:
        user = await db.users.find_one({"email": email})
        if user is None:
            logger.error(f"User not found: {email}")
            raise credentials_exception
        return user
    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Routes
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        user = await db.users.find_one({"email": form_data.username})
        
        if not user:
            logger.warning(f"User not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            password_matches = bcrypt.checkpw(
                form_data.password.encode(), 
                user["password"].encode()
            )
        except Exception as e:
            logger.error(f"Password check error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error verifying password"
            )

        if not password_matches:
            logger.warning(f"Invalid password for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        logger.info(f"Login successful for user: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@app.post("/api/hospitals")
async def create_hospital(hospital: Hospital, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_superuser"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Hash the admin password
        hashed_password = bcrypt.hashpw(hospital.admin_password.encode(), bcrypt.gensalt())
        
        # Create hospital document
        hospital_doc = {
            "name": hospital.name,
            "subdomain": hospital.name.lower().replace(" ", "-"),
            "admin_email": hospital.admin_email,
            "admin_password": hashed_password.decode(),
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "description": hospital.description,
            "website": hospital.website,
            "phone": hospital.phone,
            "address": hospital.address,
            "modules": hospital.modules,
            "subscription_plan": hospital.subscription_plan
        }
        
        result = await db.hospitals.insert_one(hospital_doc)
        
        # Create subscription
        subscription_doc = {
            "hospital_id": result.inserted_id,
            "plan": hospital.subscription_plan,
            "start_date": datetime.utcnow(),
            "is_active": True
        }
        await db.subscriptions.insert_one(subscription_doc)
        
        # Return the created hospital
        created_hospital = await db.hospitals.find_one({"_id": result.inserted_id})
        created_hospital["_id"] = str(created_hospital["_id"])
        return created_hospital
    except Exception as e:
        logger.error(f"Error creating hospital: {e}")
        raise HTTPException(status_code=500, detail="Failed to create hospital")

@app.get("/api/hospitals")
async def list_hospitals(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_superuser"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cursor = db.hospitals.find()
    hospitals = []
    async for doc in cursor:
        hospital = {
            "id": str(doc["_id"]),
            "name": doc["name"],
            "slug": doc["subdomain"],
            "status": "Active" if doc.get("is_active", True) else "Inactive",
            "admin": doc.get("admin_name", ""),
            "email": doc["admin_email"],
            "phone": doc.get("phone", ""),
            "address": doc.get("address", ""),
            "package": doc.get("subscription_plan", "Basic"),
            "branches": doc.get("branches", 1),
            "logo": doc.get("logo", "/placeholder.svg?height=40&width=40"),
            "createdAt": doc["created_at"].isoformat(),
            "updatedAt": doc["updated_at"].isoformat(),
            "description": doc.get("description", ""),
            "website": doc.get("website", ""),
            "modules": doc.get("modules", ["billing", "appointment"])
        }
        hospitals.append(hospital)
    return {"hospitals": hospitals}

@app.get("/api/hospitals/{slug}")
async def get_hospital_by_slug(slug: str):
    try:
        logger.info(f"Looking up hospital with slug: {slug}")
        hospital = await db.hospitals.find_one({"subdomain": slug})
        
        if not hospital:
            logger.warning(f"Hospital not found with slug: {slug}")
            raise HTTPException(status_code=404, detail="Hospital not found")

        logger.info(f"Found hospital: {hospital['name']}")
        return {
            "id": str(hospital["_id"]),
            "name": hospital["name"],
            "slug": hospital["subdomain"],
            "status": "Active" if hospital.get("is_active", True) else "Inactive",
            "admin": hospital.get("admin_name", ""),
            "email": hospital["admin_email"],
            "phone": hospital.get("phone", ""),
            "address": hospital.get("address", ""),
            "package": hospital.get("subscription_plan", "Basic"),
            "branches": hospital.get("branches", 1),
            "logo": hospital.get("logo", "/placeholder.svg?height=40&width=40"),
            "createdAt": hospital["created_at"].isoformat() if isinstance(hospital["created_at"], datetime) else hospital["created_at"],
            "updatedAt": hospital["updated_at"].isoformat() if isinstance(hospital["updated_at"], datetime) else hospital["updated_at"],
            "description": hospital.get("description", ""),
            "website": hospital.get("website", ""),
            "modules": hospital.get("modules", ["billing", "appointment"])
        }
    except Exception as e:
        logger.error(f"Error fetching hospital by slug: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    import sys
    
    # Default port is 8001 as mentioned in the memory
    port = 8001
    
    # Check for command line arguments
    if len(sys.argv) > 2 and sys.argv[1] == '--port':
        port = int(sys.argv[2])
    
    print(f"Starting server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
