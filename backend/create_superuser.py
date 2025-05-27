from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import asyncio

async def create_superuser():
    # MongoDB connection
    MONGODB_URL = "mongodb+srv://peeapltd:3M3OuJX5HLNsfDwD@fhirhospital.zfyw0vg.mongodb.net/"
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.hospital_fhir
    
    # Superuser details
    email = "superadmin@medicore.com"
    password = "super123"
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        print("Superuser already exists")
        return
    
    # Hash password
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    
    # Create superuser document
    user_doc = {
        "email": email,
        "password": hashed_password.decode(),
        "is_superuser": True,
        "is_active": True
    }
    
    # Insert into database
    await db.users.insert_one(user_doc)
    print("Superuser created successfully")

if __name__ == "__main__":
    asyncio.run(create_superuser())
