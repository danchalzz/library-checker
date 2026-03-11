console.log("Library Checker initializing...");

// Global variable to store all books (for searching)
let allBooks = [];

// Reference to the table body and last-updated element
const tbody = document.querySelector('#book-table tbody');
const lastUpdatedEl = document.getElementById('last-updated');

// Your published Google Sheets CSV URL
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQiHyJEo2F06BMhllNODNVgE1zrBm4Y3lOyKOL6kIiwqq0c5J-HVIokjLz7TtZnTuPFCx1SvDr0kjCP/pub?output=csv';

// ---------- Fetch Books from Google Sheets ----------
async function fetchBooks() {
    try {
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));
        
        // Remove header row (first row) and map to book objects
        allBooks = rows.slice(1).map(row => ({
            title: row[1] ? row[1].trim() : 'Untitled',
            author: row[2] ? row[2].trim() : 'Unknown',
            status: row[3] ? row[3].trim() : 'Unknown'
        }));
        
        // Update last updated time
        lastUpdatedEl.innerText = 'Last updated: ' + new Date().toLocaleString();
        
        // Re-apply current search filter
        applySearchFilter();
        
    } catch (error) {
        console.error('Fetch error:', error);
        // Show error message in table
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">
            Error loading data. Please try again later.
        </td></tr>`;
        lastUpdatedEl.innerText = 'Last updated: never (error)';
    }
}

// ---------- Display Books (with optional filtering) ----------
function displayBooks(booksToShow) {
    tbody.innerHTML = ''; // Clear table

    if (booksToShow.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center;">No books found</td>';
        tbody.appendChild(row);
        return;
    }

    for (let book of booksToShow) {
        const row = document.createElement('tr');
        // Determine CSS class for status (case‑insensitive, trimmed already)
        const statusClass = book.status.toLowerCase() === 'available' ? 'available' : 'borrowed';
        row.innerHTML = `
            <td>${escapeHTML(book.title)}</td>
            <td>${escapeHTML(book.author)}</td>
            <td class="${statusClass}">${escapeHTML(book.status)}</td>
        `;
        tbody.appendChild(row);
    }
}

// Simple helper to prevent XSS (just in case titles contain HTML)
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- Search Function ----------
function applySearchFilter() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    if (searchTerm === '') {
        displayBooks(allBooks); // Show all
    } else {
        const filtered = allBooks.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
        displayBooks(filtered);
    }
}

// ---------- Event Listeners ----------
document.getElementById('search').addEventListener('input', applySearchFilter);

// Initial fetch
fetchBooks();

// Refresh every 5 minutes (300000 ms)
setInterval(fetchBooks, 300000);