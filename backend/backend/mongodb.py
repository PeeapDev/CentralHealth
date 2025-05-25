from pymongo import MongoClient
from django.conf import settings
import os
from dotenv import load_dotenv

load_dotenv()

def get_mongodb_client():
    """
    Get MongoDB client using connection string from environment variables.
    """
    mongo_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_url)
    return client

def get_database():
    """
    Get the MongoDB database instance.
    """
    client = get_mongodb_client()
    db_name = os.getenv('MONGODB_DB_NAME', 'hospital_fhir')
    return client[db_name]

# Example collections
def get_analytics_collection():
    """
    Get the analytics collection for storing usage statistics.
    """
    db = get_database()
    return db['analytics']

def get_audit_logs_collection():
    """
    Get the audit logs collection for storing system audit trails.
    """
    db = get_database()
    return db['audit_logs']

def get_cache_collection():
    """
    Get the cache collection for storing temporary data.
    """
    db = get_database()
    return db['cache']
