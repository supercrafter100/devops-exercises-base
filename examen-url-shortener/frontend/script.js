// Frontend logic for URL Shortener
// - No environment variables: assumes /api lives on the same origin
// - Uses fetch to POST /api/shorten and shows the short link

(function () {
    const input = document.getElementById('longUrl');
    const button = document.getElementById('shortenBtn');
    const resultCard = document.getElementById('resultCard');
    const shortLink = document.getElementById('shortLink');
    const errorMsg = document.getElementById('errorMsg');

    function hideError() {
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    async function shorten(url) {
        const res = await fetch('/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        if (!res.ok) {
            const err = await res
                .json()
                .catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'Request failed');
        }
        return res.json();
    }

    async function onShortenClick() {
        hideError();
        const url = (input.value || '').trim();
        if (!/^https?:\/\//i.test(url)) {
            showError('Please enter a valid http(s) URL.');
            return;
        }

        button.disabled = true;
        button.classList.add('opacity-70');
        try {
            const data = await shorten(url);
            const code = data.shortCode;
            const shortUrl = `${window.location.origin}/api/${code}`;
            shortLink.textContent = shortUrl;
            shortLink.href = shortUrl;
            resultCard.classList.remove('hidden');
        } catch (e) {
            showError(e.message || 'Something went wrong.');
        } finally {
            button.disabled = false;
            button.classList.remove('opacity-70');
        }
    }

    button.addEventListener('click', onShortenClick);
})();
