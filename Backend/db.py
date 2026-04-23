import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Connection Pool — shared across all modules
# ---------------------------------------------------------------------------
_pool = pooling.MySQLConnectionPool(
    pool_name="dmrc_pool",
    pool_size=5,
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", 3306)),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", "root"),
    database=os.getenv("DB_NAME", "dmrc_ticketing"),
    autocommit=False
)

def get_connection():
    """Acquire a connection from the pool."""
    return _pool.get_connection()
