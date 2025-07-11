document.addEventListener('DOMContentLoaded', () => {
    const summarizeButton = document.getElementById('summarizeButton');
    const copyButton = document.getElementById('copyButton');
    const inputText = document.getElementById('inputText');
    const summaryOutput = document.getElementById('summaryOutput');
    const numSentencesInput = document.getElementById('numSentences'); // Get the number input element

    // Function to get CSRF token from cookies (essential for Django POST requests)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Handle Summarize Button Click
    summarizeButton.addEventListener('click', async () => {
        const textToSummarize = inputText.value.trim();
        const numSentences = parseInt(numSentencesInput.value, 10); // Parse the input as an integer

        // Input validation
        if (textToSummarize.length === 0) {
            summaryOutput.innerHTML = '<p class="placeholder-text error-message">Please enter some text to summarize.</p>';
            summaryOutput.classList.add('placeholder-text');
            copyButton.style.display = 'none';
            return;
        }

        if (isNaN(numSentences) || numSentences <= 0) {
            summaryOutput.innerHTML = '<p class="placeholder-text error-message">Please enter a valid positive number for sentences.</p>';
            summaryOutput.classList.add('placeholder-text');
            copyButton.style.display = 'none';
            return;
        }

        // Show a loading state
        summaryOutput.innerHTML = '<p class="placeholder-text">Summarizing... Please wait, this might take a moment.</p>';
        summaryOutput.classList.add('placeholder-text'); // Add class for styling loading/error messages
        copyButton.style.display = 'none';
        
        try {
            const csrfToken = getCookie('csrftoken'); // Get the CSRF token

            const response = await fetch('/api/summarize/', { // This URL must match your urls.py for the API endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Include the CSRF token in the headers
                },
                body: JSON.stringify({ // Send both text and number of sentences
                    text: textToSummarize,
                    num_sentences: numSentences
                })
            });
            
            const data = await response.json(); // Always try to parse JSON response

            if (!response.ok) {
                // If response status is not 2xx, it's an error from the backend
                const errorMessage = data.error || `HTTP error! Status: ${response.status}`;
                throw new Error(errorMessage);
            }

            // If response is OK, display the summarized text
            const summarizedText = data.summary;
            summaryOutput.innerHTML = `<p>${summarizedText}</p>`;
            summaryOutput.classList.remove('placeholder-text'); // Remove placeholder styling for actual content
            copyButton.style.display = 'inline-block'; // Show copy button
        } catch (error) {
            console.error('Error during summarization:', error);
            let displayMessage = 'Oops! An unknown error occurred during summarization. Please try again.';
            // Customize error messages based on what we might expect
            if (error.message.includes('400')) {
                displayMessage = `Input Error: ${error.message}`;
            } else if (error.message.includes('403')) {
                displayMessage = 'Authorization error. Please refresh the page and try again (CSRF token issue).';
            } else if (error.message.includes('500')) {
                displayMessage = `Server Error: The summarization service encountered an issue. ${error.message}`;
            }
            summaryOutput.innerHTML = `<p class="placeholder-text error-message">${displayMessage}</p>`;
            summaryOutput.classList.add('placeholder-text'); // Keep placeholder styling for error messages
            copyButton.style.display = 'none';
        }
    });

    // Handle Copy Button Click
    copyButton.addEventListener('click', () => {
        const summaryText = summaryOutput.innerText;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(summaryText).then(() => {
                const originalContent = summaryOutput.innerHTML;
                summaryOutput.innerHTML = '<p class="copy-success-message">Copied to clipboard!</p>';
                summaryOutput.classList.add('placeholder-text'); // Add for styling feedback
                setTimeout(() => {
                    summaryOutput.innerHTML = originalContent; // Revert after a short delay
                    summaryOutput.classList.remove('placeholder-text');
                }, 1500);
            }).catch(err => {
                console.error('Could not copy text: ', err);
                const originalContent = summaryOutput.innerHTML;
                summaryOutput.innerHTML = '<p class="error-message">Failed to copy.</p>';
                summaryOutput.classList.add('placeholder-text');
                setTimeout(() => {
                    summaryOutput.innerHTML = originalContent;
                    summaryOutput.classList.remove('placeholder-text');
                }, 1500);
            });
        } else {
            // Fallback for older browsers (less reliable)
            const textArea = document.createElement("textarea");
            textArea.value = summaryText;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                const originalContent = summaryOutput.innerHTML;
                summaryOutput.innerHTML = '<p class="copy-success-message">Copied to clipboard!</p>';
                summaryOutput.classList.add('placeholder-text');
                setTimeout(() => {
                    summaryOutput.innerHTML = originalContent;
                    summaryOutput.classList.remove('placeholder-text');
                }, 1500);
            } catch (err) {
                const originalContent = summaryOutput.innerHTML;
                summaryOutput.innerHTML = '<p class="error-message">Failed to copy.</p>';
                summaryOutput.classList.add('placeholder-text');
                setTimeout(() => {
                    summaryOutput.innerHTML = originalContent;
                    summaryOutput.classList.remove('placeholder-text');
                }, 1500);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("clearButton").addEventListener("click", function () {
        document.getElementById("inputText").value = "";
    });
});