#!/usr/bin/env python3
"""
GitHub data extraction pipeline for FlowSight AI.

Usage:
    python run_pipeline.py owner/repo
"""

import sys
from pathlib import Path

# Add backend root to path so imports work
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from app.pipeline.cli import main

if __name__ == "__main__":
    main()
