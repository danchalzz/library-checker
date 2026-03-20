console.log("Library Checker initializing...");

// ---------- GLOBAL VARIABLES ----------
let allBooks = [];
let uniqueCategories = [];

// DOM elements
const tbody = document.querySelector('#book-table tbody');
const lastUpdatedEl = document.getElementById('last-updated');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category-filter');
const announcementsContainer = document.getElementById('announcements-container');
const loadingIndicator = document.getElementById('loading-indicator');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// URLs (replace with your actual published CSV links)
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQiHyJEo2F06BMhllNODNVgE1zrBm4Y3lOyKOL6kIiwqq0c5J-HVIokjLz7TtZnTuPFCx1SvDr0kjCP/pub?output=csv';
const announcementsURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBbWud35zOpS4PVFivGygg7cZtRCphifWpaM0xmfm7sZSw_Z_4BNY6ImxrQJ_cYTc-p1Om1uU7UWAu/pub?output=csv';

// ---------- FETCH BOOKS ----------
async function fetchBooks() {
    try {
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));

        // Map rows to book objects (skip header row)
        allBooks = rows.slice(1).map(row => ({
            title: row[1] ? row[1].trim() : 'Untitled',
            author: row[2] ? row[2].trim() : 'Unknown',
            status: row[3] ? row[3].trim() : 'Unknown',
            category: row[4] ? row[4].trim() : 'Uncategorized'
        }));

        // Extract unique categories for dropdown
        const cats = new Set();
        allBooks.forEach(book => {
            if (book.category) cats.add(book.category);
        });
        uniqueCategories = Array.from(cats).sort();

        // Populate category dropdown
        populateCategoryDropdown(uniqueCategories);

        // Update last updated timestamp
        lastUpdatedEl.innerText = 'Last updated: ' + new Date().toLocaleString();

        // Apply filters (search + category)
        applyFilters();

    } catch (error) {
        console.error('Fetch error (books):', error);
        tbody.innerHTML = `技术<td colspan="4" style="text-align: center; color: red;">
            Error loading books. Please try again later.
        <\/td>`;
        lastUpdatedEl.innerText = 'Last updated: never (error)';
    }
}

// ---------- FETCH ANNOUNCEMENTS ----------
async function fetchAnnouncements() {
    try {
        const response = await fetch(announcementsURL);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));

        // Skip header row and map to announcement objects
        const announcements = rows.slice(1).map(row => ({
            date: row[0] ? row[0].trim() : '',
            message: row[1] ? row[1].trim() : '',
            link: row[2] ? row[2].trim() : null,
            priority: row[3] ? row[3].trim() : 'Normal'
        }));

        displayAnnouncements(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        if (announcementsContainer) {
            announcementsContainer.innerHTML = '<p style="color:red;">Could not load announcements.</p>';
        }
    }
}

// ---------- DISPLAY ANNOUNCEMENTS ----------
function displayAnnouncements(announcements) {
    if (!announcementsContainer) return;
    if (!announcements || announcements.length === 0) {
        announcementsContainer.innerHTML = '<p>No announcements at this time.</p>';
        return;
    }

    // Sort by date descending (assuming YYYY-MM-DD format)
    announcements.sort((a, b) => (b.date > a.date ? 1 : -1));

    let html = '<div class="announcements-list">';
    announcements.forEach(ann => {
        const priorityClass = ann.priority.toLowerCase() === 'high' ? 'high-priority' : 'normal-priority';
        html += `<div class="announcement ${priorityClass}">`;
        html += `<span class="announcement-date">${ann.date}</span>`;
        if (ann.link) {
            html += `<a href="${ann.link}" class="announcement-link">${ann.message}</a>`;
        } else {
            html += `<span class="announcement-message">${ann.message}</span>`;
        }
        html += '</div>';
    });
    html += '</div>';
    announcementsContainer.innerHTML = html;
}

// ---------- POPULATE CATEGORY DROPDOWN ----------
function populateCategoryDropdown(categories) {
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// ---------- DISPLAY BOOKS ----------
function displayBooks(booksToShow) {
    tbody.innerHTML = ''; // Clear table

    if (booksToShow.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No books found<\/td>';
        tbody.appendChild(row);
        return;
    }

    for (let book of booksToShow) {
        const row = document.createElement('tr');
        const statusClass = book.status.toLowerCase() === 'available' ? 'available' : 'borrowed';
        row.innerHTML = `
            <td>${escapeHTML(book.title)}<\/td>
            <td>${escapeHTML(book.author)}<\/td>
            <td class="${statusClass}">${escapeHTML(book.status)}<\/td>
            <td><a href="mailto:library@school.edu?subject=Request: ${encodeURIComponent(book.title)}&body=I would like to request the book: ${encodeURIComponent(book.title)} by ${encodeURIComponent(book.author)}" class="request-link">Request</a><\/td>
        `;
        tbody.appendChild(row);
    }
}

// ---------- HELPER: ESCAPE HTML ----------
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- COMBINED FILTER (SEARCH + CATEGORY) ----------
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categorySelect.value;

    let filtered = allBooks;

    if (searchTerm !== '') {
        filtered = filtered.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
    }

    if (selectedCategory !== 'all') {
        filtered = filtered.filter(book => book.category === selectedCategory);
    }

    displayBooks(filtered);
}

// ---------- CLEAR FILTERS ----------
document.getElementById('clear-filters').addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = 'all';
    applyFilters();
});

// ---------- DARK MODE TOGGLE ----------
let darkMode = false;
darkModeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// ---------- LOADING INDICATOR ----------
loadingIndicator.style.display = 'block';
Promise.all([fetchBooks(), fetchAnnouncements()])
    .catch(error => console.error('Error loading data:', error))
    .finally(() => loadingIndicator.style.display = 'none');

// Refresh every 5 minutes (both)
setInterval(() => {
    loadingIndicator.style.display = 'block';
    Promise.all([fetchBooks(), fetchAnnouncements()])
        .catch(error => console.error('Error refreshing data:', error))
        .finally(() => loadingIndicator.style.display = 'none');
}, 300000);
