#!/usr/bin/env python3
"""
Configuration validation script for Python microservice
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, name):
    """Check if a file exists"""
    if Path(filepath).exists():
        print(f"✅ {name} exists")
        return True
    else:
        print(f"❌ {name} not found")
        return False

def check_env_var(var_name, env_content):
    """Check if environment variable is set"""
    if f"{var_name}=" in env_content and not f"{var_name}=\n" in env_content:
        print(f"   ✓ {var_name} is configured")
        return True
    else:
        print(f"⚠️  {var_name} is not set in .env")
        return False

def main():
    print("🔍 Validating Python microservice configuration...\n")
    
    errors = 0
    warnings = 0
    
    # Check .env file
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print("❌ Python .env file not found")
        print("   Create it from .env.example: cp .env.example .env")
        errors += 1
    else:
        print("✅ Python .env file exists")
        with open(env_path, 'r') as f:
            env_content = f.read()
        
        required_vars = ['MONGODB_CONNECTION', 'DB_NAME']
        for var in required_vars:
            if not check_env_var(var, env_content):
                warnings += 1
    
    # Check if requirements are installed
    print("\n🔌 Checking Python dependencies...")
    try:
        import flask
        print("   ✓ Flask installed")
    except ImportError:
        print("❌ Flask not installed")
        errors += 1
    
    try:
        import pymongo
        print("   ✓ PyMongo installed")
    except ImportError:
        print("❌ PyMongo not installed")
        errors += 1
    
    try:
        import PyPDF2
        print("   ✓ PyPDF2 installed")
    except ImportError:
        print("❌ PyPDF2 not installed")
        errors += 1
    
    try:
        from fastembed import TextEmbedding
        print("   ✓ FastEmbed installed")
    except ImportError:
        print("❌ FastEmbed not installed")
        errors += 1
    
    if errors > 0:
        print("\n   Run: pip install -r requirements.txt")
    
    # Check required files
    print("\n📄 Checking required files...")
    required_files = [
        ('main.py', 'Main Flask server'),
        ('analyzeprofile.py', 'Analysis module'),
        ('preprocess.py', 'Preprocessing module'),
        ('resumeparser.py', 'Resume parser'),
        ('requirements.txt', 'Requirements file')
    ]
    
    for filename, description in required_files:
        filepath = Path(__file__).parent / filename
        if not check_file_exists(filepath, description):
            errors += 1
    
    # Test MongoDB connection if configured
    if env_path.exists():
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_uri = os.getenv('MONGODB_CONNECTION')
        if mongo_uri:
            print("\n🔌 Testing MongoDB connection...")
            try:
                from pymongo import MongoClient
                client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
                client.server_info()
                print("✅ MongoDB connection successful")
                client.close()
            except Exception as e:
                print(f"❌ MongoDB connection failed: {e}")
                errors += 1
        else:
            print("\n⚠️  Cannot test MongoDB (connection string not configured)")
            warnings += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Validation Summary:")
    print(f"   Errors: {errors}")
    print(f"   Warnings: {warnings}")
    
    if errors == 0 and warnings == 0:
        print("\n✨ All checks passed! Python service is ready to run.")
        print("   Start the service: python main.py")
    elif errors == 0:
        print("\n⚠️  Some warnings found, but service should work.")
        print("   Review warnings above for optimal configuration.")
    else:
        print("\n❌ Errors found! Please fix them before starting the service.")
    
    print("=" * 50 + "\n")
    
    sys.exit(1 if errors > 0 else 0)

if __name__ == "__main__":
    main()
