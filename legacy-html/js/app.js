/**
 * ============================================================
 * APP UTILITIES MODULE
 * ============================================================
 * Shared utilities used across all pages including toast
 * notifications, modals, confirmations, and common helpers.
 * This is the main utility file that all pages import.
 * ============================================================
 */

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================

/**
 * Show a toast notification
 * @param {string} message - Toast message text
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - How long to show in ms (default 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
    // Get or create toast container
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-item ${type} toast-enter`;
    
    // Icon based on type
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#10B981'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim() || '#EF4444'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--color-warning').trim() || '#F59E0B'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--color-info').trim() || '#3B82F6'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span style="flex: 1; font-size: 0.875rem; color: var(--text-primary);">${escapeHtml(message)}</span>
        <button class="toast-close" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 0.25rem; display: flex;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        dismissToast(toast);
    });

    container.appendChild(toast);

    // Auto-dismiss
    if (duration > 0) {
        setTimeout(() => dismissToast(toast), duration);
    }
}

/**
 * Dismiss a toast with exit animation
 * @param {HTMLElement} toast - Toast element to remove
 */
function dismissToast(toast) {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
}

// ============================================================
// MODAL SYSTEM
// ============================================================

/**
 * Show a modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.content - HTML content for modal body
 * @param {string} options.size - Modal size: 'sm', 'md', 'lg'
 * @param {Function} options.onConfirm - Callback when confirm button clicked
 * @param {Function} options.onCancel - Callback when cancelled
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {string} options.confirmClass - Confirm button CSS class
 */
function showModal(options = {}) {
    const {
        title = 'Confirm',
        content = '',
        size = 'md',
        onConfirm = null,
        onCancel = null,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmClass = 'btn-primary'
    } = options;

    // Remove any existing modal
    closeModal();

    const sizeClasses = {
        sm: 'max-width: 380px;',
        md: 'max-width: 520px;',
        lg: 'max-width: 720px;'
    };

    const modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.className = 'modal-overlay backdrop-enter';
    modal.innerHTML = `
        <div class="modal-container modal-enter" style="${sizeClasses[size] || sizeClasses.md}">
            <div class="modal-header">
                <div>
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(title)}</h3>
                </div>
                <button onclick="closeModal()" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 0.25rem; border-radius: var(--radius-md);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-secondary">${escapeHtml(cancelText)}</button>
                ${onConfirm ? `<button id="modal-confirm-btn" class="btn ${confirmClass}">${escapeHtml(confirmText)}</button>` : ''}
            </div>
        </div>
    `;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (onCancel) onCancel();
            closeModal();
        }
    });

    // Confirm button
    if (onConfirm) {
        const confirmBtn = modal.querySelector('#modal-confirm-btn');
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            // Modal stays open unless explicitly closed by the callback
        });
    }

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            if (onCancel) onCancel();
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    return modal;
}

/**
 * Close the current modal
 */
function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        const container = modal.querySelector('.modal-container');
        if (container) {
            container.classList.remove('modal-enter');
            container.classList.add('modal-exit');
        }
        modal.style.animation = 'backdropFadeOut 0.2s ease';
        setTimeout(() => {
            modal.remove();
            // Only restore scroll if no other modals exist
            if (!document.querySelector('.modal-overlay')) {
                document.body.style.overflow = '';
            }
        }, 200);
    }
}

// ============================================================
// CONFIRMATION DIALOG
// ============================================================

/**
 * Show a confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 * @param {string} confirmText - Confirm button text
 * @param {string} confirmClass - Confirm button CSS class
 */
function showConfirm(message, title = 'Are you sure?', onConfirm = null, onCancel = null, confirmText = 'Delete', confirmClass = 'btn-danger') {
    showModal({
        title,
        content: `<p style="color: var(--text-secondary); line-height: 1.6;">${escapeHtml(message)}</p>`,
        onConfirm,
        onCancel,
        confirmText,
        cancelText: 'Cancel',
        confirmClass,
        size: 'sm'
    });
}

// ============================================================
// FORM VALIDATION
// ============================================================

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate a required field
 * @param {string} value - Field value
 * @returns {boolean} True if not empty
 */
function isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

/**
 * Validate a positive number
 * @param {string|number} value - Value to validate
 * @returns {boolean} True if positive number
 */
function isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
}

/**
 * Show field error
 * @param {HTMLElement} field - Form field element
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    // Remove existing error
    const existingError = field.parentElement.querySelector('.form-error');
    if (existingError) existingError.remove();

    // Add error styling
    field.style.borderColor = 'var(--color-danger)';

    // Add error message
    const errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    field.parentElement.appendChild(errorEl);

    // Remove error on input
    field.addEventListener('input', () => {
        field.style.borderColor = '';
        errorEl.remove();
    }, { once: true });
}

/**
 * Clear all field errors in a form
 * @param {HTMLFormElement} form - Form element
 */
function clearFieldErrors(form) {
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('[style*="border-color"]').forEach(el => {
        el.style.borderColor = '';
    });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format a number as currency (INR)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num || 0);
}

/**
 * Format a date
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
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
 * Format a datetime
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
function formatDateTime(date) {
    return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate a random SKU
 * @returns {string} Random SKU
 */
function generateSKU() {
    const prefix = 'SKU';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
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
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
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
        showToast('Copied to clipboard!', 'success');
        return true;
    }
}

/**
 * Download data as a file
 * @param {string} data - Data to download
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast(`Downloaded: ${filename}`, 'success');
}

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects
 * @param {Array} headers - Optional header mapping [{key, label}]
 * @returns {string} CSV string
 */
function convertToCSV(data, headers = null) {
    if (!data || data.length === 0) return '';

    const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
    const labels = headers ? headers.map(h => h.label) : keys;

    const csvRows = [];
    // Header row
    csvRows.push(labels.map(l => `"${l}"`).join(','));

    // Data rows
    for (const row of data) {
        const values = keys.map(key => {
            const value = row[key] !== null && row[key] !== undefined ? row[key] : '';
            // Escape quotes and wrap in quotes if contains comma or quote
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
 * Initialize page title with app name
 * @param {string} title - Page-specific title
 */
function setPageTitle(title) {
    document.title = title ? `${title} | InventoryPro` : 'InventoryPro';
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================
// DATA TABLE HELPERS
// ============================================================

/**
 * Sort data by a column
 * @param {Array} data - Array of objects
 * @param {string} column - Column key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
function sortData(data, column, direction = 'asc') {
    return [...data].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Handle null/undefined
        if (valA == null) valA = '';
        if (valB == null) valB = '';

        // Handle dates
        if (column.includes('date') || column.includes('_at')) {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }
        // Handle numbers
        else if (typeof valA === 'number' && typeof valB === 'number') {
            // Keep as numbers
        }
        // Default to string comparison
        else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filter data by search term across multiple fields
 * @param {Array} data - Array of objects
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
function filterData(data, searchTerm, fields = []) {
    if (!searchTerm || searchTerm.trim() === '') return data;

    const term = searchTerm.toLowerCase().trim();

    return data.filter(item => {
        if (fields.length === 0) {
            // Search all fields
            return Object.values(item).some(val => 
                val != null && String(val).toLowerCase().includes(term)
            );
        }
        // Search specific fields
        return fields.some(field => {
            const val = item[field];
            return val != null && String(val).toLowerCase().includes(term);
        });
    });
}

/**
 * Paginate data
 * @param {Array} data - Array of objects
 * @param {number} page - Current page (1-based)
 * @param {number} perPage - Items per page
 * @returns {Object} Paginated data and metadata
 */
function paginateData(data, page = 1, perPage = 10) {
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

// ============================================================
// CHART HELPERS
// ============================================================

/**
 * Get chart colors based on current theme
 * @returns {Object} Color object for charts
 */
function getChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    
    return {
        primary: isDark ? '#60A5FA' : '#3B82F6',
        primaryLight: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        success: isDark ? '#34D399' : '#10B981',
        successLight: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.2)',
        warning: isDark ? '#FBBF24' : '#F59E0B',
        danger: isDark ? '#F87171' : '#EF4444',
        grid: isDark ? '#334155' : '#E2E8F0',
        text: isDark ? '#94A3B8' : '#475569',
        textPrimary: isDark ? '#F1F5F9' : '#0F172A'
    };
}

/**
 * Common Chart.js options
 * @returns {Object} Default Chart.js options
 */
function getDefaultChartOptions() {
    const colors = getChartColors();
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: colors.text,
                    font: { family: 'Inter', size: 12 }
                }
            }
        },
        scales: {
            x: {
                grid: { color: colors.grid, drawBorder: false },
                ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
            },
            y: {
                grid: { color: colors.grid, drawBorder: false },
                ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
            }
        }
    };
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize common features on every page
 * Call this from each page's init function
 */
function initApp() {
    // Initialize tooltips
    initTooltips();
    
    // Handle window resize for responsive layouts
    window.addEventListener('resize', debounce(() => {
        // Refresh any layout-dependent components
        document.dispatchEvent(new CustomEvent('layout:resize'));
    }, 250));
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const text = e.target.dataset.tooltip;
            let tooltip = document.querySelector('.app-tooltip');
            
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'app-tooltip';
                tooltip.style.cssText = `
                    position: fixed;
                    background: var(--text-primary);
                    color: var(--bg-card);
                    padding: 0.35rem 0.75rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    font-weight: 500;
                    white-space: nowrap;
                    z-index: ${getComputedStyle(document.documentElement).getPropertyValue('--z-tooltip') || 400};
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                `;
                document.body.appendChild(tooltip);
            }
            
            tooltip.textContent = text;
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 40}px`;
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.opacity = '1';
        });
        
        el.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.app-tooltip');
            if (tooltip) tooltip.style.opacity = '0';
        });
    });
}

// Make key functions available globally
window.showToast = showToast;
window.dismissToast = dismissToast;
window.showModal = showModal;
window.closeModal = closeModal;
window.showConfirm = showConfirm;
window.escapeHtml = escapeHtml;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.truncateText = truncateText;
window.generateSKU = generateSKU;
window.debounce = debounce;
window.copyToClipboard = copyToClipboard;
window.downloadFile = downloadFile;
window.convertToCSV = convertToCSV;
window.sortData = sortData;
window.filterData = filterData;
window.paginateData = paginateData;
window.getChartColors = getChartColors;
window.getDefaultChartOptions = getDefaultChartOptions;
window.showFieldError = showFieldError;
window.clearFieldErrors = clearFieldErrors;
window.isValidEmail = isValidEmail;
window.isRequired = isRequired;
window.isPositiveNumber = isPositiveNumber;
window.setPageTitle = setPageTitle;
window.capitalizeWords = capitalizeWords;

// Export for ES modules
// ===============================
// DOM REFRESH HELPER
// ===============================
/**
 * Refresh a DOM container by fetching fresh HTML content.
 * @param {string} containerId - ID of the element to update.
 * @param {Function} fetchFn - Async function returning HTML string for the container.
 */
async function refreshSection(containerId, fetchFn) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`refreshSection: No element with ID ${containerId}`);
        return;
    }
    // Show loading placeholder
    container.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="skeleton" style="height: 200px;"></div></td></tr>`;
    try {
        const html = await fetchFn();
        container.innerHTML = html;
    } catch (err) {
        console.error('refreshSection error:', err);
        container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-error">Error loading data.</td></tr>`;
    }
}

// Export for ES modules
window.refreshSection = refreshSection;
export { refreshSection };


