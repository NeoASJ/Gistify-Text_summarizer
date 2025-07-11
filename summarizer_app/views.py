# summarizer_app/views.py
from django.shortcuts import render
from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt # Consider removing this in production if CSRF is handled by JS
import json

# Import the necessary libraries for summarization
from transformers import pipeline
from nltk.tokenize import sent_tokenize
import nltk

# --- NLTK Download (ensure this runs) ---
# In development, this is fine. For production, pre-download 'punkt' during deployment.
try:
    nltk.data.find('tokenizers/punkt')
except nltk.downloader.DownloadError:
    print("NLTK 'punkt' tokenizer not found, downloading...")
    nltk.download('punkt')
    print("NLTK 'punkt' tokenizer downloaded.")

# --- Initialize Hugging Face summarizer (runs once when server starts) ---
# Load the model outside the view function so it's not reloaded on every request.
print("Loading Hugging Face summarization model (facebook/bart-large-cnn)...")
try:
    # Ensure you have 'torch' installed for this model
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn", revision="main")
    print("Hugging Face summarization model loaded successfully.")
except Exception as e:
    print(f"Error loading Hugging Face model: {e}")
    summarizer = None # Set to None if loading fails

# @csrf_exempt # Uncomment this only if you remove X-CSRFToken from script.js, NOT recommended for production.
def summarize_text(request):
    if request.method == 'POST':
        if summarizer is None:
            return JsonResponse({'error': 'Summarization model not loaded. Server issue.'}, status=500)
        try:
            data = json.loads(request.body)
            text_to_summarize = data.get('text', '').strip()
            # Safely get num_sentences, defaulting to 3 if not provided or invalid
            try:
                num_sentences = int(data.get('num_sentences', 3))
            except ValueError:
                num_sentences = 3 # Fallback to default if conversion fails

            if not text_to_summarize:
                return JsonResponse({'error': 'No text provided for summarization.'}, status=400)
            if num_sentences <= 0:
                return JsonResponse({'error': 'Number of sentences must be positive.'}, status=400)

            # --- Summarization Logic ---
            min_tokens_for_summary = num_sentences * 20
            max_tokens_for_summary = num_sentences * 30 + 50 # Adding some buffer for model flexibility

            if min_tokens_for_summary > max_tokens_for_summary:
                max_tokens_for_summary = min_tokens_for_summary + 20

            summary_output = summarizer(
                text_to_summarize,
                max_length=max_tokens_for_summary,
                min_length=min_tokens_for_summary,
                do_sample=False
            )

            summary = summary_output[0]['summary_text']

            # Trim the summary to desired number of sentences using NLTK
            sentences = sent_tokenize(summary)
            final_summary = ' '.join(sentences[:num_sentences])

            return JsonResponse({'summary': final_summary})

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format in request body.'}, status=400)
        except Exception as e:
            print(f"Error during summarization: {e}")
            return JsonResponse({'error': f'An unexpected error occurred during summarization: {str(e)}'}, status=500)
    
    # Handle GET request for the homepage
    # This view will now only handle the API call.
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# A separate view specifically for serving the homepage
def homepage_view(request):
    return render(request, 'index.html')