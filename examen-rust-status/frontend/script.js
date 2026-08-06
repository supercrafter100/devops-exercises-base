// Meridian Freight - Statusbord frontend
// Verwacht de API op /api op dezelfde origin (via de reverse proxy).

(function () {
    const shipmentsBody = document.getElementById('shipmentsBody');
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

    // Toont bovenaan of de API in-memory of met Redis werkt.
    async function loadStorageType() {
        try {
            const res = await fetch('/api/verify');
            const data = await res.json();
            storageBadge.textContent = `opslag: ${data.storage}`;
            if (data.storage === 'redis') {
                storageBadge.className =
                    'text-xs font-mono px-3 py-1.5 rounded-full bg-green-500/20 text-green-300';
            }
        } catch (e) {
            storageBadge.textContent = 'opslag: API onbereikbaar';
            storageBadge.className =
                'text-xs font-mono px-3 py-1.5 rounded-full bg-red-500/20 text-red-300';
        }
    }

    async function loadShipments() {
        hideError();
        try {
            const res = await fetch('/api/shipments');
            if (!res.ok) throw new Error('Kon zendingen niet ophalen');
            render(await res.json());
        } catch (e) {
            showError(e.message);
        }
    }

    function render(shipments) {
        shipmentsBody.innerHTML = '';

        if (!shipments || shipments.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');

        const statusColors = {
            onderweg: 'bg-cyan-500/20 text-cyan-300',
            vertraagd: 'bg-amber-500/20 text-amber-300',
            geleverd: 'bg-green-500/20 text-green-300',
        };

        for (const s of shipments) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-zinc-800/40';

            const badge = statusColors[s.status] || 'bg-zinc-700 text-zinc-300';

            tr.innerHTML = `
                <td class="px-4 py-3 font-mono text-xs text-cyan-300"></td>
                <td class="px-4 py-3 text-zinc-200"></td>
                <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full ${badge} status-badge"></span>
                </td>
                <td class="px-4 py-3 text-right">
                    <button class="text-xs text-red-400 hover:text-red-300 hover:underline">verwijder</button>
                </td>
            `;

            // textContent gebruiken zodat invoer van gebruikers niet als HTML
            // geinterpreteerd wordt.
            const cells = tr.querySelectorAll('td');
            cells[0].textContent = s.tracking;
            cells[1].textContent = s.destination;
            tr.querySelector('.status-badge').textContent = s.status;

            tr.querySelector('button').addEventListener('click', () =>
                removeShipment(s.id),
            );
            shipmentsBody.appendChild(tr);
        }
    }

    async function addShipment() {
        hideError();

        const tracking = document.getElementById('tracking').value.trim();
        const destination = document.getElementById('destination').value.trim();
        const status = document.getElementById('status').value;

        if (!tracking || !destination) {
            showError('Trackingnummer en bestemming zijn verplicht.');
            return;
        }

        addBtn.disabled = true;
        try {
            const res = await fetch('/api/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracking, destination, status }),
            });
            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ error: 'Registreren mislukt' }));
                throw new Error(err.error || 'Registreren mislukt');
            }
            document.getElementById('tracking').value = '';
            document.getElementById('destination').value = '';
            await loadShipments();
        } catch (e) {
            showError(e.message);
        } finally {
            addBtn.disabled = false;
        }
    }

    async function removeShipment(id) {
        hideError();
        try {
            const res = await fetch(`/api/shipments/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Verwijderen mislukt');
            await loadShipments();
        } catch (e) {
            showError(e.message);
        }
    }

    addBtn.addEventListener('click', addShipment);

    loadStorageType();
    loadShipments();
})();
