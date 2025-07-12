document.addEventListener('DOMContentLoaded', () => {
    const summarizeButton = document.getElementById('summarizeButton');
    const copyButton = document.getElementById('copyButton');
    const inputText = document.getElementById('inputText');
    const summaryOutput = document.getElementById('summaryOutput');
    const numSentencesInput = document.getElementById('numSentences');
    const clearButton = document.getElementById('clearButton');

    // CSRF token from cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            document.cookie.split(';').forEach(cookie => {
                const trimmed = cookie.trim();
                if (trimmed.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(trimmed.substring(name.length + 1));
                }
            });
        }
        return cookieValue;
    }

    summarizeButton.addEventListener('click', async () => {
        const textToSummarize = inputText.value.trim();
        const numSentences = parseInt(numSentencesInput.value, 10);

        if (!textToSummarize) {
            summaryOutput.innerHTML = '<p class="error-message">Please enter some text to summarize.</p>';
            copyButton.style.display = 'none';
            return;
        }

        if (isNaN(numSentences) || numSentences <= 0) {
            summaryOutput.innerHTML = '<p class="error-message">Please enter a valid positive number for sentences.</p>';
            copyButton.style.display = 'none';
            return;
        }

        summaryOutput.innerHTML = '<p class="placeholder-text">Summarizing... Please wait.</p>';
        copyButton.style.display = 'none';

        try {
            const csrfToken = getCookie('csrftoken');

            const response = await fetch('/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    text: textToSummarize,
                    num_sentences: numSentences
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error: ${response.status}`);
            }

            summaryOutput.innerHTML = `<p>${data.summary}</p>`;
            copyButton.style.display = 'inline-block';

        } catch (error) {
            summaryOutput.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
            copyButton.style.display = 'none';
        }
    });

    copyButton.addEventListener('click', () => {
        const summaryText = summaryOutput.innerText;
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                const original = summaryOutput.innerHTML;
                summaryOutput.innerHTML = '<p class="copy-success-message">Copied!</p>';
                setTimeout(() => {
                    summaryOutput.innerHTML = original;
                }, 1500);
            })
            .catch(() => {
                summaryOutput.innerHTML = '<p class="error-message">Failed to copy.</p>';
            });
    });

    clearButton.addEventListener('click', () => {
        inputText.value = '';
        summaryOutput.innerHTML = '<p class="placeholder-text">The summarized content will beautifully appear here.</p>';
        copyButton.style.display = 'none';
    });
});