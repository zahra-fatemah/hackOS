import sys
import os
from pymongo import MongoClient
import urllib.parse

# URI from app.py
uri = "mongodb+srv://admin:admin123@cluster0.dbw5z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["hackos"]
col = db["hackathons"]

for doc in col.find():
    print(f"Title: {doc.get('title')}, Organizer: '{doc.get('organizer_email')}'")

