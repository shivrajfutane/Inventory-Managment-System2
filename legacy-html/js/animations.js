/**
 * ============================================================
 * ANIMATIONS MODULE
 * ============================================================
 * Provides smooth animations and transitions for UI elements.
 * Uses a combination of CSS animations and JavaScript for
 * maximum performance and browser compatibility.
 * ============================================================
 */

/**
 * Animate elements when they come into view (Intersection Observer)
 * @param {string} selector - CSS selector for elements to animate
 * @param {string} animationClass - CSS animation class to add
 * @param {Object} options - Intersection observer options
 */
function animateOnScroll(selector, animationClass = 'page-fade-in', options = {}) {
    const defaultOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observerOptions = { ...defaultOptions, ...options };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(animationClass);
                entry.target.style.opacity = '1';
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

/**
 * Stagger animation for child elements
 * Adds stagger delays to elements for a cascading effect
 * @param {string} selector - CSS selector for parent container
 * @param {string} childSelector - Selector for children to stagger
 * @param {number} delay - Base delay between items in ms
 */
function staggerAnimation(selector, childSelector = '.card-stagger', delay = 80) {
    const container = document.querySelector(selector);
    if (!container) return;

    const children = container.querySelectorAll(childSelector);
    children.forEach((child, index) => {
        child.style.opacity = '0';
        child.style.animationDelay = `${index * delay}ms`;
        
        // Trigger animation after a small delay
        setTimeout(() => {
            child.style.opacity = '1';
        }, index * delay);
    });
}

/**
 * Counter animation - counts up to a target number
 * @param {HTMLElement} element - Element to animate
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 * @param {string} prefix - Optional prefix (e.g., '$')
 * @param {string} suffix - Optional suffix (e.g., '%')
 * @param {number} decimals - Number of decimal places
 */
function animateCounter(element, target, duration = 1500, prefix = '', suffix = '', decimals = 0) {
    if (!element) return;

    const startTime = performance.now();
    const startValue = 0;

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function - ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (target - startValue) * easeOut;
        
        element.textContent = prefix + currentValue.toFixed(decimals) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            // Ensure final value is exact
            element.textContent = prefix + target.toFixed(decimals) + suffix;
            // Add pop animation
            element.classList.add('counter-pop');
            setTimeout(() => element.classList.remove('counter-pop'), 300);
        }
    }

    requestAnimationFrame(updateCounter);
}

/**
 * Animate a progress bar
 * @param {HTMLElement} element - Progress bar element
 * @param {number} percentage - Target percentage (0-100)
 * @param {number} duration - Animation duration in ms
 */
function animateProgressBar(element, percentage, duration = 1000) {
    if (!element) return;
    
    element.style.width = '0%';
    element.classList.add('progress-fill');
    element.style.transition = `width ${duration}ms ease-out`;
    
    // Trigger reflow
    void element.offsetWidth;
    
    // Set the final width
    requestAnimationFrame(() => {
        element.style.width = `${Math.min(percentage, 100)}%`;
    });
}

/**
 * Page transition - fade out current page
 * @param {Function} callback - Function to call after fade out
 * @param {number} duration - Fade duration in ms
 */
function pageTransitionOut(callback, duration = 200) {
    const mainContent = document.querySelector('.content-area') || document.body;
    mainContent.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(8px)';

    setTimeout(() => {
        callback();
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'translateY(0)';
    }, duration);
}

/**
 * Show loading skeleton for a container
 * @param {string} selector - Container selector
 * @param {number} rows - Number of skeleton rows
 */
function showSkeleton(selector, rows = 5) {
    const container = document.querySelector(selector);
    if (!container) return;

    let skeletonHTML = '<div class="skeleton-wrapper">';
    for (let i = 0; i < rows; i++) {
        skeletonHTML += `
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                    <div class="skeleton" style="height: 16px; border-radius: 4px; margin-bottom: 8px; width: 60%;"></div>
                    <div class="skeleton" style="height: 12px; border-radius: 4px; width: 40%;"></div>
                </div>
            </div>
        `;
    }
    skeletonHTML += '</div>';

    container.innerHTML = skeletonHTML;
    container.dataset.skeletonActive = 'true';
}

/**
 * Hide skeleton and show actual content
 * @param {string} selector - Container selector
 * @param {string} content - HTML content to show
 */
function hideSkeleton(selector, content) {
    const container = document.querySelector(selector);
    if (!container) return;

    container.style.transition = 'opacity 0.3s ease';
    container.style.opacity = '0';

    setTimeout(() => {
        container.innerHTML = content;
        container.style.opacity = '1';
        container.dataset.skeletonActive = 'false';
    }, 150);
}

/**
 * Smooth scroll to an element
 * @param {string} selector - Element selector to scroll to
 * @param {number} offset - Offset from top in pixels
 */
function smoothScrollTo(selector, offset = 80) {
    const element = document.querySelector(selector);
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

/**
 * Add ripple effect to button click
 * @param {HTMLElement} button - Button element
 * @param {Event} event - Click event
 */
function addRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
    `;

    // Add ripple animation keyframes if not already added
    if (!document.querySelector('#ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ripple-keyframes';
        style.textContent = `
            @keyframes rippleEffect {
                to {
                    transform: scale(2.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

/**
 * Initialize sidebar collapse animation
 * @param {string} sidebarSelector - Sidebar element selector
 * @param {string} toggleSelector - Toggle button selector
 * @param {string} contentSelector - Main content selector
 */
function initSidebarCollapse(sidebarSelector = '.sidebar', toggleSelector = '#sidebarToggle', contentSelector = '.main-content') {
    const sidebar = document.querySelector(sidebarSelector);
    const toggleBtn = document.querySelector(toggleSelector);
    const mainContent = document.querySelector(contentSelector);

    if (!sidebar || !toggleBtn) return;

    // Check saved preference
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent?.classList.add('expanded');
    }

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent?.classList.toggle('expanded');
        
        const collapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', collapsed.toString());
    });
}

/**
 * Initialize mobile sidebar
 * @param {string} sidebarSelector - Sidebar element selector
 * @param {string} overlaySelector - Overlay element selector
 */
function initMobileSidebar(sidebarSelector = '.sidebar', overlaySelector = '.mobile-overlay') {
    const sidebar = document.querySelector(sidebarSelector);
    const overlay = document.querySelector(overlaySelector);
    
    if (!sidebar || !overlay) return;

    // Open sidebar
    window.openMobileSidebar = () => {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close sidebar
    window.closeMobileSidebar = () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    overlay.addEventListener('click', window.closeMobileSidebar);

    // Close on route change (link click)
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', window.closeMobileSidebar);
    });
}

/**
 * Initialize dropdown menus
 * @param {string} triggerSelector - Dropdown trigger button selector
 */
function initDropdowns(triggerSelector = '[data-dropdown]') {
    const triggers = document.querySelectorAll(triggerSelector);

    triggers.forEach(trigger => {
        const dropdownId = trigger.dataset.dropdown;
        const dropdown = document.getElementById(dropdownId);
        
        if (!dropdown) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(d => {
                if (d !== dropdown) d.classList.add('hidden');
            });

            dropdown.classList.toggle('hidden');
            
            if (!dropdown.classList.contains('hidden')) {
                dropdown.classList.add('dropdown-enter');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(d => {
            d.classList.add('hidden');
        });
    });
}

/**
 * Initialize theme toggle (dark/light mode)
 * @param {string} toggleSelector - Theme toggle button/selector
 */
function initThemeToggle(toggleSelector = '#themeToggle') {
    const toggle = document.querySelector(toggleSelector);
    if (!toggle) return;

    // Determine current theme based on localStorage / system preference
    const savedTheme = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'true' || (savedTheme === null && systemPrefersDark);

    // Apply initial theme class (in case head script didn't run)
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Sync icons to match current state
    updateThemeIcons();

    toggle.addEventListener('click', () => {
        const currentlyDark = document.documentElement.classList.contains('dark');
        if (currentlyDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        }
        updateThemeIcons();
    });
}

/**
 * Sync the sun/moon icon visibility with the current theme
 */
function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    const lightIcon = document.getElementById('lightIcon');
    const darkIcon = document.getElementById('darkIcon');
    if (lightIcon) lightIcon.classList.toggle('hidden', isDark);
    if (darkIcon) darkIcon.classList.toggle('hidden', !isDark);
}


/**
 * Add shake animation to an element
 * @param {HTMLElement} element - Element to shake
 */
function shakeElement(element) {
    if (!element) return;
    
    element.style.animation = 'shake 0.5s ease-in-out';
    
    // Add shake keyframes if not present
    if (!document.querySelector('#shake-keyframes')) {
        const style = document.createElement('style');
        style.id = 'shake-keyframes';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

/**
 * Show a spinner inside a button
 * @param {HTMLElement} button - Button element
 * @param {string} originalText - Original button text to restore
 */
function showButtonLoading(button, originalText) {
    button.dataset.originalText = originalText;
    button.disabled = true;
    button.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="31.42" stroke-dashoffset="10"/>
        </svg>
        <span>Loading...</span>
    `;
}

/**
 * Restore button after loading
 * @param {HTMLElement} button - Button element
 */
function hideButtonLoading(button) {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Submit';
}

/**
 * Initialize all common animations on page load
 */
function initAnimations() {
    // Initialize page fade in
    document.body.classList.add('page-fade-in');

    // Initialize scroll animations
    animateOnScroll('.stat-card', 'card-stagger');
    
    // Initialize sidebar
    initSidebarCollapse();
    initMobileSidebar();
    
    // Initialize dropdowns
    initDropdowns();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize tooltips on sidebar when collapsed
    initSidebarTooltips();
}

/**
 * Initialize tooltips for collapsed sidebar
 */
function initSidebarTooltips() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        const text = link.querySelector('.sidebar-text');
        if (text && !link.querySelector('.tooltip')) {
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            tooltip.textContent = text.textContent;
            link.appendChild(tooltip);
        }
    });
}

// Export all animation functions
export {
    animateOnScroll,
    staggerAnimation,
    animateCounter,
    animateProgressBar,
    pageTransitionOut,
    showSkeleton,
    hideSkeleton,
    smoothScrollTo,
    addRippleEffect,
    initSidebarCollapse,
    initMobileSidebar,
    initDropdowns,
    initThemeToggle,
    updateThemeIcons,
    shakeElement,
    showButtonLoading,
    hideButtonLoading,
    initAnimations
};

// Also make available globally for non-module scripts
window.Animations = {
    animateOnScroll,
    staggerAnimation,
    animateCounter,
    animateProgressBar,
    pageTransitionOut,
    showSkeleton,
    hideSkeleton,
    smoothScrollTo,
    addRippleEffect,
    initSidebarCollapse,
    initMobileSidebar,
    initDropdowns,
    initThemeToggle,
    updateThemeIcons,
    shakeElement,
    showButtonLoading,
    hideButtonLoading,
    initAnimations
};

