// Northwind Hardware - Magazijnbeheer frontend
// Verwacht de API op /api op dezelfde origin (via de webserver/reverse proxy).

(function () {
    const partsBody = document.getElementById('partsBody');
    const emptyMsg = document.getElementById('emptyMsg');
    const errorMsg = document.getElementById('errorMsg');
    const storageBadge = document.getElementById('storageBadge');
    const addBtn = document.getElementById('addBtn');

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function hideError() {
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
    }

    // Toont bovenaan of de API in-memory of met de database werkt.
    async function loadStorageType() {
        try {
            const res = await fetch('/api/verify');
            const data = await res.json();
            storageBadge.textContent = `opslag: ${data.storage}`;
            if (data.storage === 'mysql') {
                storageBadge.className =
                    'text-xs font-mono px-3 py-1.5 rounded-full bg-green-100 text-green-800';
            }
        } catch (e) {
            storageBadge.textContent = 'opslag: API onbereikbaar';
            storageBadge.className =
                'text-xs font-mono px-3 py-1.5 rounded-full bg-red-100 text-red-800';
        }
    }

    async function loadParts() {
        hideError();
        try {
            const res = await fetch('/api/parts');
            if (!res.ok) throw new Error('Kon onderdelen niet ophalen');
            const parts = await res.json();
            render(parts);
        } catch (e) {
            showError(e.message);
        }
    }

    function render(parts) {
        partsBody.innerHTML = '';

        if (!parts || parts.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');

        for (const p of parts) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-stone-50';

            const low = p.quantity < 100;
            tr.innerHTML = `
                <td class="px-4 py-3 font-mono text-xs text-stone-700"></td>
                <td class="px-4 py-3 text-stone-800"></td>
                <td class="px-4 py-3 font-mono text-xs text-stone-600"></td>
                <td class="px-4 py-3 text-right font-medium ${
                    low ? 'text-red-600' : 'text-stone-800'
                }"></td>
                <td class="px-4 py-3 text-right">
                    <button class="text-xs text-red-600 hover:text-red-800 hover:underline">verwijder</button>
                </td>
            `;

            // textContent gebruiken zodat invoer van gebruikers niet als HTML
            // geinterpreteerd wordt.
            const cells = tr.querySelectorAll('td');
            cells[0].textContent = p.sku;
            cells[1].textContent = p.name;
            cells[2].textContent = p.location;
            cells[3].textContent = p.quantity;

            tr.querySelector('button').addEventListener('click', () =>
                removePart(p.id),
            );
            partsBody.appendChild(tr);
        }
    }

    async function addPart() {
        hideError();

        const sku = document.getElementById('sku').value.trim();
        const name = document.getElementById('name').value.trim();
        const location = document.getElementById('location').value.trim();
        const quantity = Number(document.getElementById('quantity').value || 0);

        if (!sku || !name) {
            showError('Artikelnummer en omschrijving zijn verplicht.');
            return;
        }

        addBtn.disabled = true;
        try {
            const res = await fetch('/api/parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sku, name, location, quantity }),
            });
            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ error: 'Toevoegen mislukt' }));
                throw new Error(err.error || 'Toevoegen mislukt');
            }
            document.getElementById('sku').value = '';
            document.getElementById('name').value = '';
            document.getElementById('location').value = '';
            document.getElementById('quantity').value = '0';
            await loadParts();
        } catch (e) {
            showError(e.message);
        } finally {
            addBtn.disabled = false;
        }
    }

    async function removePart(id) {
        hideError();
        try {
            const res = await fetch(`/api/parts/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Verwijderen mislukt');
            await loadParts();
        } catch (e) {
            showError(e.message);
        }
    }

    addBtn.addEventListener('click', addPart);

    loadStorageType();
    loadParts();
})();
