from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def delete_user():
    # MongoDB connection
    MONGODB_URL = "mongodb+srv://peeapltd:3M3OuJX5HLNsfDwD@fhirhospital.zfyw0vg.mongodb.net/"
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.hospital_fhir
    
    # Delete the user
    result = await db.users.delete_one({"email": "admin@medicore.com"})
    if result.deleted_count > 0:
        print("User deleted successfully")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(delete_user())
