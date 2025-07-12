from django.shortcuts import render
from django.http import JsonResponse
import json
import nltk
from nltk.tokenize import sent_tokenize
from transformers import pipeline

# --- Ensure NLTK tokenizer is available ---
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# --- Load summarization pipeline once on server start ---
print("Loading Hugging Face summarization model (facebook/bart-large-cnn)...")
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Model load error: {e}")
    summarizer = None

def homepage_view(request):
    if request.method == 'POST':
        is_json = request.headers.get('Content-Type', '').startswith('application/json')

        if summarizer is None:
            error_msg = 'Summarization model not loaded.'
            return JsonResponse({'error': error_msg}, status=500) if is_json else render(request, 'index.html', {'error': error_msg})

        if is_json:
            try:
                data = json.loads(request.body)
                text_to_summarize = data.get('text', '').strip()
                num_sentences = int(data.get('num_sentences', 3))
            except (json.JSONDecodeError, ValueError, TypeError):
                return JsonResponse({'error': 'Invalid input format.'}, status=400)
        else:
            text_to_summarize = request.POST.get('text', '').strip()
            try:
                num_sentences = int(request.POST.get('num_sentences', 3))
            except ValueError:
                num_sentences = 3

        if not text_to_summarize:
            error_msg = 'No text provided.'
            return JsonResponse({'error': error_msg}, status=400) if is_json else render(request, 'index.html', {'error': error_msg})

        if num_sentences <= 0:
            error_msg = 'Number of sentences must be positive.'
            return JsonResponse({'error': error_msg}, status=400) if is_json else render(request, 'index.html', {'error': error_msg})

        min_tokens = num_sentences * 20
        max_tokens = num_sentences * 30 + 50

        try:
            output = summarizer(text_to_summarize, max_length=max_tokens, min_length=min_tokens, do_sample=False)
            summary_text = output[0]['summary_text']
            final_summary = ' '.join(sent_tokenize(summary_text)[:num_sentences])
            return JsonResponse({'summary': final_summary}) if is_json else render(request, 'index.html', {
                'summary': final_summary,
                'text': text_to_summarize,
                'num_sentences': num_sentences
            })
        except Exception as e:
            error_msg = f'Error during summarization: {str(e)}'
            return JsonResponse({'error': error_msg}, status=500) if is_json else render(request, 'index.html', {'error': error_msg})

    return render(request, 'index.html')