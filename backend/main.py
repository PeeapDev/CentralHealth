import logging
import random
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import os
import json
import asyncpg
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import jwt
import bcrypt
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for serving profile images and other assets
os.makedirs("assets/images/profiles", exist_ok=True)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# PostgreSQL Database connection settings
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "hospital_fhir"
DB_USER = "postgres"
DB_PASSWORD = "postgres"

# PostgreSQL connection pool
db_pool = None

@app.on_event("startup")
async def create_db_pool():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        logger.info("Successfully connected to PostgreSQL database")
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        raise

@app.on_event("shutdown")
async def close_db_pool():
    if db_pool:
        await db_pool.close()
        logger.info("Closed PostgreSQL connection pool")

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
        # Use PostgreSQL to fetch user
        async with db_pool.acquire() as conn:
            user = await conn.fetchrow(
                """SELECT id, email, first_name, last_name, role, 
                   patient_id, profile_image_url 
                   FROM users WHERE email = $1""", 
                email
            )
            
            if user is None:
                logger.error(f"User not found: {email}")
                raise credentials_exception
            
            # Convert PostgreSQL record to dict
            return dict(user)
    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Models for mobile authentication
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MobileAuthResponse(BaseModel):
    id: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    accessToken: str
    refreshToken: str
    roles: list = []
    profileImageUrl: Optional[str] = None

# Routes
@app.post("/api/auth/mobile/login")
async def mobile_login(request: LoginRequest):
    try:
        logger.info(f"Mobile login attempt for user: {request.email}")
        
        # Use PostgreSQL connection to authenticate user
        async with db_pool.acquire() as conn:
            # Find user by email
            user = await conn.fetchrow(
                """SELECT id, email, password, first_name, last_name, role, 
                    patient_id, profile_image_url, created_at, updated_at 
                FROM users WHERE email = $1""", 
                request.email
            )
            
            if not user:
                logger.warning(f"User not found: {request.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Verify password
            password_matches = bcrypt.checkpw(
                request.password.encode(),
                user['password'].encode()
            )
            
            if not password_matches:
                logger.warning(f"Invalid password for user: {request.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Generate tokens
            user_id = str(user['id'])
            access_token = create_access_token(
                data={"sub": user["email"]},
                expires_delta=timedelta(minutes=30),
            )
            refresh_token = create_access_token(
                data={"sub": user["email"]},
                expires_delta=timedelta(days=7),
            )
            
            # Record login timestamp
            await conn.execute(
                """UPDATE users SET last_login = $1 WHERE id = $2""",
                datetime.utcnow(), user['id']
            )
            
            # Format user data for response
            profile_image_url = user['profile_image_url']
            if profile_image_url and not profile_image_url.startswith('http'):
                profile_image_url = f"/assets/images/profiles/{profile_image_url}"
                
            # Return response with exact format expected by Flutter app
            return {
                "id": user_id,
                "email": user["email"],
                "name": f"{user['first_name'] or ''} {user['last_name'] or ''}".strip(),
                "role": user["role"] or "patient",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "profileImageUrl": profile_image_url
            }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Mobile login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        
        # Use PostgreSQL to authenticate user
        async with db_pool.acquire() as conn:
            user = await conn.fetchrow(
                """SELECT id, email, password, first_name, last_name, role 
                   FROM users WHERE email = $1""", 
                form_data.username
            )
            
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
            
            # Update last login time
            await conn.execute(
                """UPDATE users SET last_login = $1 WHERE id = $2""",
                datetime.utcnow(), user['id']
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
        
        # Create subdomain slug from hospital name
        subdomain = hospital.name.lower().replace(" ", "-")
        
        # Insert hospital into PostgreSQL
        async with db_pool.acquire() as conn:
            hospital_id = await conn.fetchval(
                """INSERT INTO hospitals 
                   (name, subdomain, admin_email, admin_password, is_active,
                    created_at, updated_at, description, website, phone,
                    address, subscription_plan) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                   RETURNING id""",
                hospital.name,
                subdomain,
                hospital.admin_email,
                hashed_password.decode(),
                True,
                datetime.utcnow(),
                datetime.utcnow(),
                hospital.description,
                hospital.website,
                hospital.phone,
                hospital.address,
                hospital.subscription_plan
            )
            
            # Store modules as JSON
            if hospital.modules:
                for module in hospital.modules:
                    await conn.execute(
                        """INSERT INTO hospital_modules (hospital_id, module_name)
                           VALUES ($1, $2)""",
                        hospital_id, module
                    )
            
            # Create subscription
            await conn.execute(
                """INSERT INTO subscriptions 
                   (hospital_id, plan, start_date, is_active)
                   VALUES ($1, $2, $3, $4)""",
                hospital_id,
                hospital.subscription_plan,
                datetime.utcnow(),
                True
            )
            
            # Return the created hospital
            created_hospital = await conn.fetchrow(
                """SELECT id, name, subdomain, admin_email, 
                      is_active, created_at, updated_at, description, 
                      website, phone, address, subscription_plan 
                   FROM hospitals WHERE id = $1""",
                hospital_id
            )
            
            return dict(created_hospital)
    except Exception as e:
        logger.error(f"Error creating hospital: {e}")
        raise HTTPException(status_code=500, detail="Failed to create hospital")

@app.get("/api/hospitals")
async def list_hospitals(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_superuser") and not current_user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        async with db_pool.acquire() as conn:
            # Fetch all hospitals
            rows = await conn.fetch(
                """SELECT h.id, h.name, h.subdomain, h.is_active, h.admin_email, 
                          h.phone, h.address, h.subscription_plan, h.created_at, 
                          h.updated_at, h.description, h.website
                   FROM hospitals h
                   ORDER BY h.created_at DESC"""
            )
            
            hospitals = []
            for row in rows:
                # Get modules for this hospital
                modules = await conn.fetch(
                    """SELECT module_name FROM hospital_modules 
                       WHERE hospital_id = $1""", row['id']
                )
                
                module_list = [m['module_name'] for m in modules] if modules else ["billing", "appointment"]
                
                hospital = {
                    "id": str(row['id']),
                    "name": row['name'],
                    "slug": row['subdomain'],
                    "status": "Active" if row['is_active'] else "Inactive",
                    "admin": "", # Can be updated with admin name if stored separately
                    "email": row['admin_email'],
                    "phone": row['phone'] or "",
                    "address": row['address'] or "",
                    "package": row['subscription_plan'] or "Basic",
                    "branches": 1, # Default value, update if branches are stored
                    "logo": "/placeholder.svg?height=40&width=40", # Default logo
                    "createdAt": row['created_at'].isoformat() if row['created_at'] else None,
                    "updatedAt": row['updated_at'].isoformat() if row['updated_at'] else None,
                    "description": row['description'] or "",
                    "website": row['website'] or "",
                    "modules": module_list
                }
                hospitals.append(hospital)
            
            return {"hospitals": hospitals}
    except Exception as e:
        logger.error(f"Error listing hospitals: {e}")
        raise HTTPException(status_code=500, detail="Failed to list hospitals")

@app.get("/api/hospitals/{slug}")
async def get_hospital_by_slug(slug: str):
    try:
        logger.info(f"Looking up hospital with slug: {slug}")
        
        async with db_pool.acquire() as conn:
            # Fetch hospital by slug/subdomain
            hospital = await conn.fetchrow(
                """SELECT id, name, subdomain, is_active, admin_email, 
                          phone, address, subscription_plan, created_at, 
                          updated_at, description, website 
                   FROM hospitals 
                   WHERE subdomain = $1""", 
                slug
            )
            
            if not hospital:
                logger.warning(f"Hospital not found with slug: {slug}")
                raise HTTPException(status_code=404, detail="Hospital not found")
            
            # Get modules for this hospital
            modules = await conn.fetch(
                """SELECT module_name FROM hospital_modules 
                   WHERE hospital_id = $1""", 
                hospital['id']
            )
            
            module_list = [m['module_name'] for m in modules] if modules else ["billing", "appointment"]
            
            logger.info(f"Found hospital: {hospital['name']}")
            return {
                "id": str(hospital['id']),
                "name": hospital['name'],
                "slug": hospital['subdomain'],
                "status": "Active" if hospital['is_active'] else "Inactive",
                "admin": "", # Admin name could be stored separately
                "email": hospital['admin_email'],
                "phone": hospital['phone'] or "",
                "address": hospital['address'] or "",
                "package": hospital['subscription_plan'] or "Basic",
                "branches": 1, # Default value
                "logo": "/placeholder.svg?height=40&width=40", # Default logo path
                "createdAt": hospital['created_at'].isoformat() if hospital['created_at'] else None,
                "updatedAt": hospital['updated_at'].isoformat() if hospital['updated_at'] else None,
                "description": hospital['description'] or "",
                "website": hospital['website'] or "",
                "modules": module_list
            }
    except Exception as e:
        logger.error(f"Error fetching hospital by slug: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Patient Profile and Image Endpoints
from fastapi import File, Form, UploadFile, Query
import shutil
from pathlib import Path

@app.get("/api/patients/profile")
async def get_patient_profile(email: str = Query(...)):
    try:
        logger.info(f"Fetching patient profile for email: {email}")
        
        # Get real profile data from PostgreSQL
        async with db_pool.acquire() as conn:
            # Get user data
            user = await conn.fetchrow(
                """SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
                      p.patient_id, p.hospital_code, p.date_of_birth, p.blood_type,
                      p.gender, p.phone, p.address, u.profile_image_url,
                      u.created_at, u.updated_at
                FROM users u
                LEFT JOIN patient_profiles p ON u.id = p.user_id
                WHERE u.email = $1""",
                email
            )
            
            if not user:
                logger.warning(f"User profile not found: {email}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient profile not found"
                )
            
            # Format profile image URL
            profile_image_url = user['profile_image_url']
            if profile_image_url and not profile_image_url.startswith('http'):
                profile_image_url = f"/assets/images/profiles/{profile_image_url}"
            
            # Create response with correct format
            profile = {
                "id": str(user['id']),
                "email": user['email'],
                "firstName": user['first_name'],
                "lastName": user['last_name'],
                "role": user['role'] or "patient",
                "patientId": user['patient_id'],
                "hospitalCode": user['hospital_code'] or "CENTRAL",
                "dateOfBirth": user['date_of_birth'].isoformat() if user['date_of_birth'] else None,
                "bloodType": user['blood_type'],
                "gender": user['gender'],
                "phone": user['phone'],
                "address": user['address'],
                "profileImageUrl": profile_image_url,
                "createdAt": user['created_at'].isoformat() if user['created_at'] else None,
            "updatedAt": datetime.utcnow().isoformat(),
        }
        
        logger.info(f"Mock patient profile returned successfully for: {email}")
        return profile
    except Exception as e:
        logger.error(f"Error creating mock patient profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create mock profile: {str(e)}")

# Profile Image Upload Endpoints
from fastapi import File, Form, UploadFile
import shutil
from pathlib import Path

@app.post("/api/profile/{user_id}/image")
async def upload_profile_image(user_id: str, file: UploadFile = File(...)):
    try:
        logger.info(f"Uploading profile image for user {user_id}")
        
        # Create the profile images directory if it doesn't exist
        profile_dir = Path("assets/images/profiles")
        profile_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate a unique filename based on user_id
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        profile_image_path = profile_dir / f"{user_id}.{file_extension}"
        
        # Save the uploaded file
        with profile_image_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate the URL for the image
        image_url = f"/assets/images/profiles/{user_id}.{file_extension}"
        logger.info(f"Profile image saved at {image_url}")
        
        # Update the user's profile with the new image URL
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profileImageUrl": image_url, "updated_at": datetime.utcnow()}}
        )
        
        return {"imageUrl": image_url}
    except Exception as e:
        logger.error(f"Error uploading profile image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

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
