#!/usr/bin/env bash
set -o errexit
python -c "import nltk; nltk.download('punkt')"
import nltk; nltk.download('punkt')

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
