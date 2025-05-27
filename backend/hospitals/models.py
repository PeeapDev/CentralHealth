from django.utils.text import slugify
from django.utils import timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from django.conf import settings
import datetime

# MongoDB connection
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

class Hospital:
    collection = db.hospitals
    
    def __init__(self, name, subdomain=None, admin_email=None, admin_password=None,
                 is_active=True, created_at=None, updated_at=None, _id=None):
        self._id = _id or ObjectId()
        self.name = name
        self.subdomain = subdomain or slugify(name)
        self.admin_email = admin_email
        self.admin_password = admin_password
        self.is_active = is_active
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
    
    @classmethod
    async def create(cls, **kwargs):
        hospital = cls(**kwargs)
        await cls.collection.insert_one(hospital.to_dict())
        return hospital
    
    @classmethod
    async def get_by_subdomain(cls, subdomain):
        doc = await cls.collection.find_one({'subdomain': subdomain})
        if doc:
            return cls(**doc)
        return None
    
    def to_dict(self):
        return {
            '_id': self._id,
            'name': self.name,
            'subdomain': self.subdomain,
            'admin_email': self.admin_email,
            'admin_password': self.admin_password,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

class Subscription:
    BASIC = 'basic'
    PREMIUM = 'premium'
    ENTERPRISE = 'enterprise'
    
    PLAN_CHOICES = [
        (BASIC, 'Basic'),
        (PREMIUM, 'Premium'),
        (ENTERPRISE, 'Enterprise'),
    ]
    
    collection = db.subscriptions
    
    def __init__(self, hospital_id, plan=BASIC, start_date=None,
                 end_date=None, is_active=True, _id=None):
        self._id = _id or ObjectId()
        self.hospital_id = hospital_id
        self.plan = plan
        self.start_date = start_date or datetime.datetime.now()
        self.end_date = end_date
        self.is_active = is_active
    
    @classmethod
    async def create(cls, **kwargs):
        subscription = cls(**kwargs)
        await cls.collection.insert_one(subscription.to_dict())
        return subscription
    
    def to_dict(self):
        return {
            '_id': self._id,
            'hospital_id': self.hospital_id,
            'plan': self.plan,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'is_active': self.is_active
        }
