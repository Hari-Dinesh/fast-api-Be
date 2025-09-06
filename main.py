from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional

# Pydantic Model
class Item(BaseModel):
    categoryName: str
    name: str
    imgUrl: str
    description: Optional[str] = None

# FastAPI App
app = FastAPI()

# MongoDB Configuration
MONGO_URL = "mongodb+srv://dinesh_123:Asdfg123&()@cluster0.flfu7ke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "foodapp"

# Global database connection
client = None
db = None

@app.on_event("startup")
async def startup_event():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await client.server_info()  # Test connection
        print("Connected to MongoDB successfully")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    if client:
        client.close()
        print("MongoDB connection closed")

# Routes
@app.post("/items")
async def create_item(item: Item):
    result = await db.items.insert_one(item.dict())
    return {"id": str(result.inserted_id), "success": True}

@app.get("/items")
async def get_all_items():
    items = []
    async for item in db.items.find():
        item["_id"] = str(item["_id"])
        items.append(item)
    return items

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3500)