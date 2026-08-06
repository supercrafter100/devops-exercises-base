// Halcyon Events - Gastenlijst frontend
// Verwacht de API op /api op dezelfde origin (via Caddy).

(function () {
    const guestsBody = document.getElementById('guestsBody');
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
            if (data.storage === 'postgres') {
                storageBadge.className =
                    'text-xs font-mono px-3 py-1.5 rounded-full bg-green-500/20 text-green-300';
            }
        } catch (e) {
            storageBadge.textContent = 'opslag: API onbereikbaar';
            storageBadge.className =
                'text-xs font-mono px-3 py-1.5 rounded-full bg-red-500/20 text-red-300';
        }
    }

    async function loadGuests() {
        hideError();
        try {
            const res = await fetch('/api/guests');
            if (!res.ok) throw new Error('Kon gastenlijst niet ophalen');
            render(await res.json());
        } catch (e) {
            showError(e.message);
        }
    }

    function render(guests) {
        guestsBody.innerHTML = '';

        if (!guests || guests.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');

        const ticketColors = {
            vip: 'bg-amber-500/20 text-amber-300',
            press: 'bg-sky-500/20 text-sky-300',
            standard: 'bg-slate-600/40 text-slate-300',
        };

        for (const g of guests) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-700/30';

            const badge = ticketColors[g.ticket_type] || ticketColors.standard;

            tr.innerHTML = `
                <td class="px-4 py-3"></td>
                <td class="px-4 py-3 text-slate-400 text-xs"></td>
                <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full ${badge} ticket-badge"></span>
                </td>
                <td class="px-4 py-3">
                    <span class="text-xs ${
                        g.checked_in ? 'text-green-400' : 'text-slate-500'
                    } status-cell"></span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button class="checkin-btn text-xs text-fuchsia-400 hover:text-fuchsia-300 hover:underline mr-3"></button>
                    <button class="delete-btn text-xs text-red-400 hover:text-red-300 hover:underline">verwijder</button>
                </td>
            `;

            // textContent gebruiken zodat invoer van gebruikers niet als HTML
            // geinterpreteerd wordt.
            const cells = tr.querySelectorAll('td');
            cells[0].textContent = g.name;
            cells[1].textContent = g.email;
            tr.querySelector('.ticket-badge').textContent = g.ticket_type;
            tr.querySelector('.status-cell').textContent = g.checked_in
                ? '● ingecheckt'
                : '○ verwacht';
            tr.querySelector('.checkin-btn').textContent = g.checked_in
                ? 'uitchecken'
                : 'inchecken';

            tr.querySelector('.checkin-btn').addEventListener('click', () =>
                toggleCheckin(g.id),
            );
            tr.querySelector('.delete-btn').addEventListener('click', () =>
                removeGuest(g.id),
            );

            guestsBody.appendChild(tr);
        }
    }

    async function addGuest() {
        hideError();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const ticket_type = document.getElementById('ticketType').value;

        if (!name || !email) {
            showError('Naam en e-mail zijn verplicht.');
            return;
        }

        addBtn.disabled = true;
        try {
            const res = await fetch('/api/guests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, ticket_type }),
            });
            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ error: 'Toevoegen mislukt' }));
                throw new Error(err.error || 'Toevoegen mislukt');
            }
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            await loadGuests();
        } catch (e) {
            showError(e.message);
        } finally {
            addBtn.disabled = false;
        }
    }

    async function toggleCheckin(id) {
        hideError();
        try {
            const res = await fetch(`/api/guests/${id}/checkin`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Inchecken mislukt');
            await loadGuests();
        } catch (e) {
            showError(e.message);
        }
    }

    async function removeGuest(id) {
        hideError();
        try {
            const res = await fetch(`/api/guests/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Verwijderen mislukt');
            await loadGuests();
        } catch (e) {
            showError(e.message);
        }
    }

    addBtn.addEventListener('click', addGuest);

    loadStorageType();
    loadGuests();
})();
