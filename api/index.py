
import os
import sys

# Add the project root to the path so 'backend' can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.app.main import app
