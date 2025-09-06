from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
import os
from bson import ObjectId
from contextlib import asynccontextmanager

# Pydantic Models
class ItemCreate(BaseModel):
    categoryName: str
    name: str
    imgUrl: str
    description: Optional[str] = None

class ItemUpdate(BaseModel):
    categoryName: Optional[str] = None
    name: Optional[str] = None
    imgUrl: Optional[str] = None
    description: Optional[str] = None

class ItemResponse(BaseModel):
    id: str
    categoryName: str
    name: str
    imgUrl: str
    description: Optional[str] = None

# Get MongoDB URL from environment variable
MONGO_URL = 'mongodb+srv://dinesh_123:Asdfg123&()@cluster0.flfu7ke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
DB_NAME = "foodapp"

# Global database connection
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        db = None
    
    yield
    
    # Shutdown
    if db is not None:
        db.client.close()
        print("✅ MongoDB connection closed")

# FastAPI App with lifespan
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database connection
async def get_database():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    return db

# Helper function to convert MongoDB document to response model
def item_helper(item) -> dict:
    return {
        "id": str(item["_id"]),
        "categoryName": item["categoryName"],
        "name": item["name"],
        "imgUrl": item["imgUrl"],
        "description": item.get("description", "")
    }

# Routes

# Health check endpoint
@app.get("/")
async def health_check():
    if db is None:
        return {"status": "unhealthy", "database": "disconnected"}
    return {"status": "healthy", "database": "connected"}

# Create a new item
@app.post("/items", response_model=dict)
async def create_item(item: ItemCreate, db = Depends(get_database)):
    try:
        item_dict = item.dict()
        result = await db.items.insert_one(item_dict)
        
        if result.inserted_id:
            return {"success": True, "id": str(result.inserted_id), "message": "Item created successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create item")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")

# Get all items
@app.get("/items", response_model=List[ItemResponse])
async def get_all_items(db = Depends(get_database)):
    try:
        items = []
        async for item in db.items.find():
            items.append(item_helper(item))
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")

# Get a single item by ID
@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str, db = Depends(get_database)):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item ID")
            
        item = await db.items.find_one({"_id": ObjectId(item_id)})
        if item:
            return item_helper(item)
        else:
            raise HTTPException(status_code=404, detail="Item not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch item: {str(e)}")

# Update an item
@app.put("/items/{item_id}", response_model=dict)
async def update_item(item_id: str, item_update: ItemUpdate, db = Depends(get_database)):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item ID")
            
        # Remove None values from update data
        update_data = {k: v for k, v in item_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        result = await db.items.update_one(
            {"_id": ObjectId(item_id)}, 
            {"$set": update_data}
        )
        
        if result.modified_count == 1:
            return {"success": True, "message": "Item updated successfully"}
        else:
            # Check if item exists
            existing_item = await db.items.find_one({"_id": ObjectId(item_id)})
            if not existing_item:
                raise HTTPException(status_code=404, detail="Item not found")
            return {"success": True, "message": "No changes detected"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")

# Delete an item
@app.delete("/items/{item_id}", response_model=dict)
async def delete_item(item_id: str, db = Depends(get_database)):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item ID")
            
        result = await db.items.delete_one({"_id": ObjectId(item_id)})
        
        if result.deleted_count == 1:
            return {"success": True, "message": "Item deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Item not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")

# Get items by category
@app.get("/items/category/{category_name}", response_model=List[ItemResponse])
async def get_items_by_category(category_name: str, db = Depends(get_database)):
    try:
        items = []
        async for item in db.items.find({"categoryName": category_name}):
            items.append(item_helper(item))
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3500)