/**
 * escapeHtml
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * formatCurrency
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * formatNumber
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num || 0);
}

/**
 * formatDate
 * @param {string|Date} date
 * @param {Object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
    if (!date) return 'N/A';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    
    return new Intl.DateTimeFormat('en-IN', defaultOptions).format(new Date(date));
}

/**
 * formatDateTime
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
    return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * truncateText
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * generateSKU
 * @returns {string}
 */
export function generateSKU() {
    const prefix = 'SKU';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * debounce
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * copyToClipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    }
}

/**
 * downloadFile
 * @param {string} data
 * @param {string} filename
 * @param {string} mimeType
 */
export function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * convertToCSV
 * @param {Array} data
 * @param {Array} headers
 * @returns {string}
 */
export function convertToCSV(data, headers = null) {
    if (!data || data.length === 0) return '';

    const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
    const labels = headers ? headers.map(h => h.label) : keys;

    const csvRows = [];
    csvRows.push(labels.map(l => `"${l}"`).join(','));

    for (const row of data) {
        const values = keys.map(key => {
            const value = row[key] !== null && row[key] !== undefined ? row[key] : '';
            const stringValue = String(value).replace(/"/g, '""');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue}"`;
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    }

    return '\uFEFF' + csvRows.join('\n'); // BOM for Excel
}

/**
 * capitalizeWords
 * @param {string} str
 * @returns {string}
 */
export function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * isValidEmail
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * isPositiveNumber
 * @param {string|number} value
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
}

/**
 * sortData
 * @param {Array} data
 * @param {string} column
 * @param {string} direction
 * @returns {Array}
 */
export function sortData(data, column, direction = 'asc') {
    return [...data].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (valA == null) valA = '';
        if (valB == null) valB = '';

        if (column.includes('date') || column.includes('_at')) {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
            // Keep as numbers
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * filterData
 * @param {Array} data
 * @param {string} searchTerm
 * @param {Array} fields
 * @returns {Array}
 */
export function filterData(data, searchTerm, fields = []) {
    if (!searchTerm || searchTerm.trim() === '') return data;

    const term = searchTerm.toLowerCase().trim();

    return data.filter(item => {
        if (fields.length === 0) {
            return Object.values(item).some(val => 
                val != null && String(val).toLowerCase().includes(term)
            );
        }
        return fields.some(field => {
            const val = item[field];
            return val != null && String(val).toLowerCase().includes(term);
        });
    });
}

/**
 * paginateData
 * @param {Array} data
 * @param {number} page
 * @param {number} perPage
 * @returns {Object}
 */
export function paginateData(data, page = 1, perPage = 10) {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedItems = data.slice(startIndex, endIndex);

    return {
        items: paginatedItems,
        totalItems,
        totalPages,
        currentPage,
        perPage,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalItems),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
}
