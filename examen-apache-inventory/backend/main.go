// Northwind Hardware - Warehouse Inventory API
//
// Regels:
//   - Alle routes draaien onder /api
//   - STORAGE bepaalt de opslag: memory (default) | mysql
//   - Bij mysql wordt verbonden via MYSQL_HOST, MYSQL_DB, MYSQL_USER, MYSQL_PWD
//   - De API luistert op poort 4000
//
// Deze applicatie is bewust klein en leesbaar gehouden.
// Je hoeft de Go code NIET aan te passen om deze oefening op te lossen.
package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// Port waarop de API luistert.
const Port = 4000

// Part is een onderdeel in het magazijn.
type Part struct {
	ID       int    `json:"id"`
	SKU      string `json:"sku"`
	Name     string `json:"name"`
	Location string `json:"location"`
	Quantity int    `json:"quantity"`
}

// Storage is de opslaglaag. Er zijn twee implementaties:
// memoryStorage (default) en mysqlStorage.
type Storage interface {
	Type() string
	List() ([]Part, error)
	Add(p Part) (Part, error)
	Delete(id int) error
}

// ---------------------------------------------------------------------------
// In-memory opslag (default)
// ---------------------------------------------------------------------------

type memoryStorage struct {
	mu     sync.Mutex
	parts  []Part
	nextID int
}

func newMemoryStorage() *memoryStorage {
	return &memoryStorage{
		nextID: 1,
		parts:  []Part{},
	}
}

func (m *memoryStorage) Type() string { return "memory" }

func (m *memoryStorage) List() ([]Part, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	out := make([]Part, len(m.parts))
	copy(out, m.parts)
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func (m *memoryStorage) Add(p Part) (Part, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	p.ID = m.nextID
	m.nextID++
	m.parts = append(m.parts, p)
	return p, nil
}

func (m *memoryStorage) Delete(id int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, p := range m.parts {
		if p.ID == id {
			m.parts = append(m.parts[:i], m.parts[i+1:]...)
			return nil
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// MySQL / MariaDB opslag
// ---------------------------------------------------------------------------

type mysqlStorage struct {
	db *sql.DB
}

func newMySQLStorage() (*mysqlStorage, error) {
	host := env("MYSQL_HOST", "127.0.0.1")
	name := env("MYSQL_DB", "inventory")
	user := env("MYSQL_USER", "root")
	pwd := env("MYSQL_PWD", "")

	// Als er geen poort in de host staat, gebruiken we de standaardpoort 3306.
	if !strings.Contains(host, ":") {
		host = host + ":3306"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true", user, pwd, host, name)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	// De database heeft bij het opstarten even tijd nodig. We proberen
	// daarom een aantal keer opnieuw te verbinden voor we opgeven.
	var pingErr error
	for i := 0; i < 30; i++ {
		pingErr = db.Ping()
		if pingErr == nil {
			log.Println("Verbonden met MySQL/MariaDB")
			return &mysqlStorage{db: db}, nil
		}
		log.Printf("Wachten op database... (%v)", pingErr)
		time.Sleep(2 * time.Second)
	}

	return nil, pingErr
}

func (s *mysqlStorage) Type() string { return "mysql" }

func (s *mysqlStorage) List() ([]Part, error) {
	rows, err := s.db.Query("SELECT id, sku, name, location, quantity FROM parts ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	parts := []Part{}
	for rows.Next() {
		var p Part
		if err := rows.Scan(&p.ID, &p.SKU, &p.Name, &p.Location, &p.Quantity); err != nil {
			return nil, err
		}
		parts = append(parts, p)
	}
	return parts, rows.Err()
}

func (s *mysqlStorage) Add(p Part) (Part, error) {
	res, err := s.db.Exec(
		"INSERT INTO parts (sku, name, location, quantity) VALUES (?, ?, ?, ?)",
		p.SKU, p.Name, p.Location, p.Quantity,
	)
	if err != nil {
		return Part{}, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return Part{}, err
	}

	p.ID = int(id)
	return p, nil
}

func (s *mysqlStorage) Delete(id int) error {
	_, err := s.db.Exec("DELETE FROM parts WHERE id = ?", id)
	return err
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------

var storage Storage

// writeJSON stuurt een JSON response met de gegeven status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// GET /api/verify
// Geeft terug welke opslag in gebruik is: {"storage":"memory"} of {"storage":"mysql"}
func handleVerify(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"storage": storage.Type()})
}

// GET  /api/parts        -> lijst van onderdelen
// POST /api/parts        -> nieuw onderdeel toevoegen
func handleParts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		parts, err := storage.List()
		if err != nil {
			log.Println("Fout bij ophalen onderdelen:", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "kon onderdelen niet ophalen"})
			return
		}
		writeJSON(w, http.StatusOK, parts)

	case http.MethodPost:
		var p Part
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ongeldige JSON"})
			return
		}

		p.SKU = strings.TrimSpace(p.SKU)
		p.Name = strings.TrimSpace(p.Name)
		p.Location = strings.TrimSpace(p.Location)

		if p.SKU == "" || p.Name == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sku en name zijn verplicht"})
			return
		}
		if p.Quantity < 0 {
			p.Quantity = 0
		}

		created, err := storage.Add(p)
		if err != nil {
			log.Println("Fout bij toevoegen onderdeel:", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "kon onderdeel niet toevoegen"})
			return
		}
		writeJSON(w, http.StatusCreated, created)

	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "methode niet toegestaan"})
	}
}

// DELETE /api/parts/{id} -> onderdeel verwijderen
func handlePartByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "methode niet toegestaan"})
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/parts/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ongeldig id"})
		return
	}

	if err := storage.Delete(id); err != nil {
		log.Println("Fout bij verwijderen onderdeel:", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "kon onderdeel niet verwijderen"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	mode := strings.ToLower(env("STORAGE", "memory"))

	if mode == "mysql" {
		s, err := newMySQLStorage()
		if err != nil {
			log.Fatalf("Kon niet verbinden met de database: %v", err)
		}
		storage = s
	} else {
		storage = newMemoryStorage()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/verify", handleVerify)
	mux.HandleFunc("/api/parts", handleParts)
	mux.HandleFunc("/api/parts/", handlePartByID)

	addr := fmt.Sprintf(":%d", Port)
	log.Printf("Inventory API luistert op http://localhost%s", addr)
	log.Printf("Opslag: %s", storage.Type())

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server gestopt: %v", err)
	}
}
