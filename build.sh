#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python -c "import nltk; nltk.download('punkt')"
python manage.py collectstatic --no-input
python manage.py migrate
