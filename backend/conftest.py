"""Pytest bootstrap.

Put the backend root on sys.path so tests can ``import chat``, ``import server``
and ``import settings`` regardless of where pytest is invoked from.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
