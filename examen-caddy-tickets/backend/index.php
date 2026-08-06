<?php
/**
 * Halcyon Events - Gastenlijst API
 *
 * Regels:
 *   - Alle routes draaien onder /api
 *   - STORAGE bepaalt de opslag: memory (default) | postgres
 *   - Bij postgres wordt verbonden via POSTGRES_HOST, POSTGRES_DB,
 *     POSTGRES_USER, POSTGRES_PWD
 *
 * Deze applicatie is bewust klein en leesbaar gehouden.
 * Je hoeft de PHP code NIET aan te passen om deze oefening op te lossen.
 */

header('Content-Type: application/json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function env(string $key, string $fallback = ''): string
{
    $value = getenv($key);
    return ($value === false || $value === '') ? $fallback : $value;
}

function send($status, $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

/**
 * In-memory modus heeft geen echte database. We houden de gasten bij in een
 * JSON bestand in de tijdelijke map van de container. Bij een herstart van de
 * container is die data weg - precies wat we willen aantonen.
 */
function memoryFile(): string
{
    return sys_get_temp_dir() . '/halcyon-guests.json';
}

function memoryRead(): array
{
    $file = memoryFile();
    if (!file_exists($file)) {
        return [];
    }
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function memoryWrite(array $guests): void
{
    file_put_contents(memoryFile(), json_encode($guests));
}

// ---------------------------------------------------------------------------
// Database verbinding
// ---------------------------------------------------------------------------

$storageMode = strtolower(env('STORAGE', 'memory'));
$pdo = null;

if ($storageMode === 'postgres') {
    $host = env('POSTGRES_HOST', '127.0.0.1');
    $db   = env('POSTGRES_DB', 'halcyon');
    $user = env('POSTGRES_USER', 'postgres');
    $pwd  = env('POSTGRES_PWD', '');

    $dsn = sprintf('pgsql:host=%s;port=5432;dbname=%s', $host, $db);

    // De database heeft bij het opstarten even tijd nodig. We proberen
    // daarom een aantal keer opnieuw te verbinden voor we opgeven.
    for ($i = 0; $i < 30; $i++) {
        try {
            $pdo = new PDO($dsn, $user, $pwd, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            break;
        } catch (PDOException $e) {
            error_log('Wachten op database: ' . $e->getMessage());
            sleep(2);
        }
    }

    if ($pdo === null) {
        send(500, ['error' => 'Kon niet verbinden met de databank']);
    }
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

// Het pad zonder querystring, bv. "/api/guests" of "/api/guests/3"
$path   = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// GET /api/verify -> {"storage":"memory"} of {"storage":"postgres"}
if ($path === '/api/verify') {
    send(200, ['storage' => $storageMode === 'postgres' ? 'postgres' : 'memory']);
}

// GET /api/guests -> lijst van gasten
if ($path === '/api/guests' && $method === 'GET') {
    if ($pdo) {
        $rows = $pdo->query('SELECT id, name, email, ticket_type, checked_in FROM guests ORDER BY id')->fetchAll();

        // PostgreSQL geeft booleans en getallen als tekst terug. We zetten ze
        // om zodat de frontend altijd hetzelfde formaat krijgt.
        $rows = array_map(function ($r) {
            $r['id'] = (int) $r['id'];
            $r['checked_in'] = filter_var($r['checked_in'], FILTER_VALIDATE_BOOLEAN);
            return $r;
        }, $rows);

        send(200, $rows);
    }

    send(200, array_values(memoryRead()));
}

// POST /api/guests -> gast toevoegen
if ($path === '/api/guests' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $name       = trim($input['name'] ?? '');
    $email      = trim($input['email'] ?? '');
    $ticketType = trim($input['ticket_type'] ?? 'standard');

    if ($name === '' || $email === '') {
        send(400, ['error' => 'naam en e-mail zijn verplicht']);
    }

    if ($pdo) {
        $stmt = $pdo->prepare(
            'INSERT INTO guests (name, email, ticket_type, checked_in)
             VALUES (:name, :email, :ticket_type, FALSE)
             RETURNING id, name, email, ticket_type, checked_in'
        );
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':ticket_type' => $ticketType,
        ]);

        $row = $stmt->fetch();
        $row['id'] = (int) $row['id'];
        $row['checked_in'] = filter_var($row['checked_in'], FILTER_VALIDATE_BOOLEAN);

        send(201, $row);
    }

    $guests = memoryRead();
    $nextId = 1;
    foreach ($guests as $g) {
        if ($g['id'] >= $nextId) {
            $nextId = $g['id'] + 1;
        }
    }

    $guest = [
        'id' => $nextId,
        'name' => $name,
        'email' => $email,
        'ticket_type' => $ticketType,
        'checked_in' => false,
    ];

    $guests[] = $guest;
    memoryWrite($guests);
    send(201, $guest);
}

// POST /api/guests/{id}/checkin -> gast inchecken
if (preg_match('#^/api/guests/(\d+)/checkin$#', $path, $m) && $method === 'POST') {
    $id = (int) $m[1];

    if ($pdo) {
        $stmt = $pdo->prepare('UPDATE guests SET checked_in = NOT checked_in WHERE id = :id');
        $stmt->execute([':id' => $id]);
        send(200, ['ok' => true]);
    }

    $guests = memoryRead();
    foreach ($guests as &$g) {
        if ($g['id'] === $id) {
            $g['checked_in'] = !$g['checked_in'];
        }
    }
    unset($g);

    memoryWrite($guests);
    send(200, ['ok' => true]);
}

// DELETE /api/guests/{id} -> gast verwijderen
if (preg_match('#^/api/guests/(\d+)$#', $path, $m) && $method === 'DELETE') {
    $id = (int) $m[1];

    if ($pdo) {
        $stmt = $pdo->prepare('DELETE FROM guests WHERE id = :id');
        $stmt->execute([':id' => $id]);
        send(200, ['deleted' => true]);
    }

    $guests = array_values(array_filter(memoryRead(), fn($g) => $g['id'] !== $id));
    memoryWrite($guests);
    send(200, ['deleted' => true]);
}

send(404, ['error' => 'onbekend endpoint']);
