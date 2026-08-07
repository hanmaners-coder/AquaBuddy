import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise EnvironmentError('Supabase URL or ANON KEY not set in environment variables')

# Initialize global Supabase client instance
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
