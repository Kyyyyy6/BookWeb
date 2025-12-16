/*
 * LiteraVerse - Complete JavaScript Application
 * Version: 3.0.0
 * Author: LiteraVerse Team
 */

// Import Modules
import { BookManager } from './modules/BookManager.js';
import { UserManager } from './modules/UserManager.js';
import { UIHelper } from './modules/UIHelper.js';
import { ReadingEngine } from './modules/ReadingEngine.js';
import { Analytics } from './modules/Analytics.js';
import { Community } from './modules/Community.js';

// Main Application Class
class LiteraVerse {
    constructor() {
        this.config = {
            apiUrl: 'https://api.literaverse.com',
            appVersion: '3.0.0',
            debug: false,
            features: {
                offlineMode: true,
                pushNotifications: true,
                backgroundSync: true,
                voiceControl: false
            }
        };
        
        this.modules = {
            bookManager: null,
            userManager: null,
            uiHelper: null,
            readingEngine: null,
            analytics: null,
            community: null
        };
        
        this.state = {
            user: null,
            theme: 'light',
            readingProgress: {},
            notifications: [],
            offline: false
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Load configuration
            await this.loadConfig();
            
            // Initialize modules
            this.modules.bookManager = new BookManager(this.config);
            this.modules.userManager = new UserManager(this.config);
            this.modules.uiHelper = new UIHelper(this.config);
            this.modules.readingEngine = new ReadingEngine(this.config);
            this.modules.analytics = new Analytics(this.config);
            this.modules.community = new Community(this.config);
            
            // Load user data
            await this.loadUserData();
            
            // Initialize UI
            await this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load books data
            await this.loadBooksData();
            
            // Start background services
            this.startBackgroundServices();
            
            // Log initialization
            console.log('LiteraVerse initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize LiteraVerse:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    async loadConfig() {
        // Load configuration from localStorage or API
        const savedConfig = localStorage.getItem('literaverse_config');
        if (savedConfig) {
            this.config = { ...this.config, ...JSON.parse(savedConfig) };
        }
        
        // Detect system preferences
        this.detectSystemPreferences();
    }
    
    detectSystemPreferences() {
        // Detect theme preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.state.theme = 'dark';
        }
        
        // Detect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.config.features.animations = false;
        }
        
        // Update data-theme attribute
        document.documentElement.setAttribute('data-theme', this.state.theme);
    }
    
    async loadUserData() {
        try {
            this.state.user = await this.modules.userManager.getCurrentUser();
            
            if (!this.state.user) {
                // Create guest user
                this.state.user = await this.modules.userManager.createGuestUser();
            }
            
            // Load user preferences
            const preferences = localStorage.getItem('literaverse_preferences');
            if (preferences) {
                this.state.user.preferences = JSON.parse(preferences);
            }
            
            // Load reading progress
            const progress = localStorage.getItem('literaverse_progress');
            if (progress) {
                this.state.readingProgress = JSON.parse(progress);
            }
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }
    
    async initializeUI() {
        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100,
                disable: !this.config.features.animations
            });
        }
        
        // Initialize Swiper sliders
        this.initializeSliders();
        
        // Initialize search functionality
        this.initializeSearch();
        
        // Initialize notifications
        this.initializeNotifications();
        
        // Initialize theme toggle
        this.initializeThemeToggle();
        
        // Initialize quick actions
        this.initializeQuickActions();
        
        // Initialize modals
        this.initializeModals();
        
        // Update UI based on user state
        this.updateUserUI();
        
        // Hide preloader
        setTimeout(() => {
            document.getElementById('preloader').classList.add('loaded');
            document.body.classList.add('page-transition');
        }, 1000);
    }
    
    initializeSliders() {
        // Trending Books Slider
        if (typeof Swiper !== 'undefined') {
            this.trendingSwiper = new Swiper('.trending-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                navigation: {
                    nextEl: '.trending-next',
                    prevEl: '.trending-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                },
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                },
                loop: true,
                effect: 'slide',
                speed: 600,
                grabCursor: true
            });
            
            // Testimonials Slider
            this.testimonialsSwiper = new Swiper('.testimonials-swiper', {
                slidesPerView: 1,
                spaceBetween: 30,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                },
                autoplay: {
                    delay: 7000,
                },
                loop: true
            });
        }
    }
    
    initializeSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');
        
        if (!searchInput || !searchResults) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const results = await this.modules.bookManager.searchBooks(query, 10);
                    this.displaySearchResults(results);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }, 300);
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchResults.children.length > 0) {
                searchResults.style.display = 'block';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
    
    displaySearchResults(results) {
        const searchResults = document.querySelector('.search-results');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>No books found</p>
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }
        
        let html = `
            <div class="search-header">
                <h6>Search Results</h6>
                <small>${results.length} books found</small>
            </div>
        `;
        
        results.forEach(book => {
            html += `
                <a href="#" class="search-result-item" data-id="${book.id}">
                    <img src="${book.cover}" alt="${book.title}" class="search-result-img">
                    <div class="search-result-content">
                        <h6 class="search-result-title">${book.title}</h6>
                        <p class="search-result-author">${book.author}</p>
                        <div class="search-result-meta">
                            <span class="badge bg-primary">${book.category}</span>
                            <span class="rating">${book.rating} ★</span>
                        </div>
                    </div>
                </a>
            `;
        });
        
        html += `
            <div class="search-footer">
                <a href="#" class="view-all-results">View all results</a>
            </div>
        `;
        
        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
        
        // Add click handlers
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const bookId = item.dataset.id;
                this.openBookDetail(bookId);
                searchResults.style.display = 'none';
            });
        });
    }
    
    initializeNotifications() {
        // Load notifications
        this.loadNotifications();
        
        // Set up notification polling
        if (this.config.features.pushNotifications) {
            setInterval(() => this.checkForNewNotifications(), 60000); // Check every minute
        }
    }
    
    async loadNotifications() {
        try {
            const notifications = await this.modules.userManager.getNotifications();
            this.state.notifications = notifications;
            this.updateNotificationUI();
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }
    
    updateNotificationUI() {
        const notificationList = document.querySelector('.notification-list');
        const notificationCount = document.querySelector('.notification-count');
        
        if (!notificationList || !notificationCount) return;
        
        // Update count
        const unreadCount = this.state.notifications.filter(n => !n.read).length;
        notificationCount.textContent = unreadCount;
        notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        
        // Update list
        let html = '';
        const displayNotifications = this.state.notifications.slice(0, 5);
        
        displayNotifications.forEach(notification => {
            html += `
                <a href="#" class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                    <div class="notification-icon bg-${notification.type}">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-text">${notification.message}</p>
                        <small class="notification-time">${this.formatTime(notification.timestamp)}</small>
                    </div>
                </a>
            `;
        });
        
        notificationList.innerHTML = html;
        
        // Add click handlers
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const notificationId = item.dataset.id;
                await this.handleNotificationClick(notificationId);
            });
        });
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'info': 'info-circle',
            'book': 'book',
            'achievement': 'trophy',
            'community': 'users'
        };
        return icons[type] || 'bell';
    }
    
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        
        if (diff < minute) return 'Just now';
        if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
        if (diff < day) return `${Math.floor(diff / hour)}h ago`;
        if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
        
        return time.toLocaleDateString();
    }
    
    async handleNotificationClick(notificationId) {
        const notification = this.state.notifications.find(n => n.id === notificationId);
        if (!notification) return;
        
        // Mark as read
        notification.read = true;
        await this.modules.userManager.markNotificationRead(notificationId);
        
        // Handle notification action
        if (notification.action) {
            switch (notification.action.type) {
                case 'open_book':
                    this.openBookDetail(notification.action.bookId);
                    break;
                case 'open_url':
                    window.open(notification.action.url, '_blank');
                    break;
                case 'open_page':
                    window.location.hash = notification.action.page;
                    break;
            }
        }
        
        // Close dropdown
        const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('.notification-dropdown .btn-notification'));
        if (dropdown) dropdown.hide();
        
        // Update UI
        this.updateNotificationUI();
    }
    
    initializeThemeToggle() {
        const themeToggle = document.getElementById('darkModeToggle');
        if (!themeToggle) return;
        
        // Set initial state
        themeToggle.checked = this.state.theme === 'dark';
        
        // Add event listener
        themeToggle.addEventListener('change', (e) => {
            this.toggleTheme(e.target.checked);
        });
    }
    
    toggleTheme(isDark) {
        this.state.theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Save preference
        localStorage.setItem('literaverse_theme', this.state.theme);
        
        // Update UI
        this.updateThemeUI();
    }
    
    updateThemeUI() {
        // Update theme toggle
        const themeToggle = document.getElementById('darkModeToggle');
        if (themeToggle) {
            themeToggle.checked = this.state.theme === 'dark';
        }
        
        // Update quick action button
        const darkModeBtn = document.querySelector('#darkModeToggle');
        if (darkModeBtn) {
            darkModeBtn.innerHTML = this.state.theme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
        }
    }
    
    initializeQuickActions() {
        // Scroll to top
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            // Show/hide based on scroll position
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    scrollToTopBtn.style.opacity = '1';
                    scrollToTopBtn.style.visibility = 'visible';
                } else {
                    scrollToTopBtn.style.opacity = '0';
                    scrollToTopBtn.style.visibility = 'hidden';
                }
            });
        }
        
        // Quick search
        const quickSearchBtn = document.getElementById('quickSearch');
        if (quickSearchBtn) {
            quickSearchBtn.addEventListener('click', () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            });
        }
        
        // Quick read
        const quickReadBtn = document.getElementById('quickRead');
        if (quickReadBtn) {
            quickReadBtn.addEventListener('click', () => {
                this.openRandomBook();
            });
        }
    }
    
    initializeModals() {
        // Book detail modal
        this.bookDetailModal = new bootstrap.Modal(document.getElementById('bookDetailModal'));
        
        // Quick search modal
        this.quickSearchModal = new bootstrap.Modal(document.getElementById('quickSearchModal'));
        
        // Reading mode modal
        this.readingModeModal = new bootstrap.Modal(document.getElementById('readingModeModal'));
    }
    
    updateUserUI() {
        // Update user avatar
        const userAvatar = document.querySelector('.user-avatar img');
        if (userAvatar && this.state.user) {
            userAvatar.src = this.state.user.avatar || 
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.state.user.id}`;
        }
        
        // Update user name
        const userName = document.querySelector('.user-name');
        if (userName && this.state.user) {
            userName.textContent = this.state.user.name || 'Guest';
        }
        
        // Update reading stats
        this.updateReadingStatsUI();
    }
    
    updateReadingStatsUI() {
        const stats = this.calculateReadingStats();
        
        // Update stats in challenge section
        document.querySelectorAll('.stat-number').forEach((el, index) => {
            const values = Object.values(stats);
            if (values[index] !== undefined) {
                el.textContent = values[index];
            }
        });
        
        // Update progress bar
        const progressBar = document.querySelector('.challenge-progress .progress-bar');
        const progressLabel = document.querySelector('.challenge-progress .progress-label span:last-child');
        
        if (progressBar && progressLabel) {
            const progress = (stats.booksRead / 12) * 100; // Assuming 12 book challenge
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            progressLabel.textContent = `${stats.booksRead}/12 Books`;
        }
    }
    
    calculateReadingStats() {
        const progress = this.state.readingProgress;
        const books = Object.values(progress);
        
        return {
            booksRead: books.filter(book => book.progress === 100).length,
            readingHours: Math.floor(books.reduce((sum, book) => sum + (book.readingTime || 0), 0) / 60),
            achievements: this.state.user?.achievements?.length || 0,
            streak: this.state.user?.readingStreak || 0
        };
    }
    
    setupEventListeners() {
        // Window events
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        window.addEventListener('beforeunload', () => this.saveState());
        
        // Navigation events
        this.setupNavigationEvents();
        
        // Book events
        this.setupBookEvents();
        
        // Form events
        this.setupFormEvents();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    handleOnlineStatus(isOnline) {
        this.state.offline = !isOnline;
        
        if (isOnline) {
            this.showToast('You are back online!', 'success');
            this.syncData();
        } else {
            this.showToast('You are offline. Some features may be unavailable.', 'warning');
        }
    }
    
    async syncData() {
        try {
            // Sync reading progress
            await this.modules.userManager.syncReadingProgress(this.state.readingProgress);
            
            // Sync user data
            await this.modules.userManager.syncUserData(this.state.user);
            
            // Load fresh data
            await this.loadBooksData();
            await this.loadNotifications();
            
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
    
    setupNavigationEvents() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    setupBookEvents() {
        // Event delegation for book cards
        document.addEventListener('click', async (e) => {
            const target = e.target;
            
            // Read button
            if (target.closest('.btn-read')) {
                e.preventDefault();
                const bookId = target.closest('.btn-read').dataset.id;
                await this.startReading(bookId);
            }
            
            // Favorite button
            else if (target.closest('.btn-favorite')) {
                e.preventDefault();
                const bookId = target.closest('.btn-favorite').dataset.id;
                await this.toggleFavorite(bookId);
            }
            
            // Book card click (opens detail)
            else if (target.closest('.book-card') && !target.closest('.book-actions')) {
                e.preventDefault();
                const bookId = target.closest('.book-card').dataset.id;
                await this.openBookDetail(bookId);
            }
            
            // Trending book click
            else if (target.closest('.trending-book')) {
                e.preventDefault();
                const bookId = target.closest('.trending-book').dataset.id;
                await this.openBookDetail(bookId);
            }
        });
        
        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterBooksByCategory(e.target.value);
            });
        }
        
        // Sort filter
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortBooks(e.target.value);
            });
        }
    }
    
    setupFormEvents() {
        // Newsletter subscription
        const newsletterForm = document.querySelector('.footer-newsletter form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = newsletterForm.querySelector('input[type="email"]').value;
                await this.subscribeToNewsletter(email);
            });
        }
        
        // Search form
        const searchForm = document.querySelector('.search-box');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchForm.querySelector('.search-input').value;
                this.performSearch(query);
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Ctrl/Cmd + D for dark mode toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme(this.state.theme !== 'dark');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
    
    async loadBooksData() {
        try {
            // Load trending books
            const trendingBooks = await this.modules.bookManager.getTrendingBooks();
            this.displayTrendingBooks(trendingBooks);
            
            // Load new releases
            const newReleases = await this.modules.bookManager.getNewReleases();
            this.displayNewReleases(newReleases);
            
            // Load categories
            const categories = await this.modules.bookManager.getCategories();
            this.displayCategories(categories);
            
            // Load testimonials
            const testimonials = await this.modules.community.getTestimonials();
            this.displayTestimonials(testimonials);
            
        } catch (error) {
            console.error('Failed to load books data:', error);
            this.showError('Failed to load books. Please check your connection.');
        }
    }
    
    displayTrendingBooks(books) {
        const container = document.querySelector('#trendingBooks');
        if (!container) return;
        
        container.innerHTML = books.map(book => `
            <div class="swiper-slide">
                <div class="trending-book" data-id="${book.id}">
                    <img src="${book.cover}" alt="${book.title}" class="trending-book-cover">
                    <div class="trending-book-content">
                        <h5 class="trending-book-title">${book.title}</h5>
                        <p class="trending-book-author">${book.author}</p>
                        <div class="book-rating mb-3">
                            ${this.generateStarRating(book.rating)}
                            <small class="text-muted ms-2">(${book.reviews})</small>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 btn-read" data-id="${book.id}">
                            <i class="fas fa-book-open me-2"></i>Read Now
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    displayNewReleases(books) {
        const container = document.querySelector('#newReleasesGrid');
        if (!container) return;
        
        container.innerHTML = books.map(book => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="book-card" data-id="${book.id}">
                    <div class="book-card-cover">
                        <img src="${book.cover}" alt="${book.title}">
                        ${book.isNew ? '<span class="book-badge">New</span>' : ''}
                    </div>
                    <div class="book-card-content">
                        <div class="book-card-header">
                            <div>
                                <h5 class="book-card-title">${book.title}</h5>
                                <p class="book-card-author">${book.author}</p>
                            </div>
                            <div class="book-rating">
                                ${this.generateStarRating(book.rating)}
                            </div>
                        </div>
                        <p class="book-card-description">${book.description}</p>
                        <div class="book-card-footer">
                            <button class="btn btn-primary btn-sm btn-read" data-id="${book.id}">
                                <i class="fas fa-book-open me-2"></i>Read
                            </button>
                            <button class="btn btn-outline-primary btn-sm btn-favorite" data-id="${book.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    displayCategories(categories) {
        const container = document.querySelector('#categoriesGrid');
        if (!container) return;
        
        container.innerHTML = categories.map(category => `
            <div class="category-item">
                <a href="#" class="category-card" data-category="${category.id}">
                    <div class="category-icon" style="background: ${category.color}">
                        <i class="fas fa-${category.icon}"></i>
                    </div>
                    <h5 class="category-title">${category.name}</h5>
                    <p class="category-count">${category.count} Books</p>
                </a>
            </div>
        `).join('');
    }
    
    displayTestimonials(testimonials) {
        const container = document.querySelector('.testimonials-swiper .swiper-wrapper');
        if (!container) return;
        
        container.innerHTML = testimonials.map(testimonial => `
            <div class="swiper-slide">
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <div class="testimonial-rating">
                            ${this.generateStarRating(testimonial.rating)}
                        </div>
                        <p class="testimonial-text">"${testimonial.comment}"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="testimonial-avatar">
                            <img src="${testimonial.avatar}" alt="${testimonial.name}">
                        </div>
                        <div class="testimonial-info">
                            <h5>${testimonial.name}</h5>
                            <p>${testimonial.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
        
        return stars;
    }
    
    async openBookDetail(bookId) {
        try {
            const book = await this.modules.bookManager.getBook(bookId);
            if (!book) throw new Error('Book not found');
            
            const modalBody = document.querySelector('#bookDetailModal .modal-content');
            if (!modalBody) return;
            
            modalBody.innerHTML = this.renderBookDetail(book);
            
            // Show modal
            this.bookDetailModal.show();
            
            // Add event listeners for modal buttons
            this.setupBookDetailEvents(book);
            
        } catch (error) {
            console.error('Failed to open book detail:', error);
            this.showError('Failed to load book details.');
        }
    }
    
    renderBookDetail(book) {
        return `
            <div class="modal-header">
                <h5 class="modal-title">${book.title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-4 mb-4 mb-md-0">
                        <img src="${book.cover}" alt="${book.title}" class="img-fluid rounded">
                    </div>
                    <div class="col-md-8">
                        <h4>${book.title}</h4>
                        <p class="text-muted">by ${book.author}</p>
                        
                        <div class="d-flex align-items-center mb-3">
                            <div class="book-rating me-3">
                                ${this.generateStarRating(book.rating)}
                            </div>
                            <span class="text-muted">${book.rating}/5 (${book.reviews} reviews)</span>
                        </div>
                        
                        <div class="mb-3">
                            ${book.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('')}
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-6">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-book text-primary me-2"></i>
                                    <div>
                                        <small class="text-muted">Pages</small>
                                        <p class="mb-0 fw-bold">${book.pages}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-calendar text-primary me-2"></i>
                                    <div>
                                        <small class="text-muted">Published</small>
                                        <p class="mb-0 fw-bold">${new Date(book.published).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p class="mb-4">${book.description}</p>
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary flex-grow-1 btn-read" data-id="${book.id}">
                                <i class="fas fa-book-open me-2"></i>Start Reading
                            </button>
                            <button class="btn btn-outline-primary btn-favorite" data-id="${book.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupBookDetailEvents(book) {
        // Read button
        const readBtn = document.querySelector('#bookDetailModal .btn-read');
        if (readBtn) {
            readBtn.addEventListener('click', async () => {
                await this.startReading(book.id);
                this.bookDetailModal.hide();
            });
        }
        
        // Favorite button
        const favoriteBtn = document.querySelector('#bookDetailModal .btn-favorite');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', async () => {
                await this.toggleFavorite(book.id);
                
                // Update button state
                const isFavorite = await this.modules.userManager.isBookFavorite(book.id);
                favoriteBtn.innerHTML = isFavorite 
                    ? '<i class="fas fa-heart text-danger"></i>' 
                    : '<i class="fas fa-heart"></i>';
            });
        }
    }
    
    async startReading(bookId) {
        try {
            // Get book data
            const book = await this.modules.bookManager.getBook(bookId);
            if (!book) throw new Error('Book not found');
            
            // Initialize reading session
            const session = await this.modules.readingEngine.startSession(book, this.state.user);
            
            // Open reading interface
            this.openReadingInterface(session);
            
            // Track reading start
            this.modules.analytics.trackReadingStart(bookId);
            
        } catch (error) {
            console.error('Failed to start reading:', error);
            this.showError('Failed to open book for reading.');
        }
    }
    
    openReadingInterface(session) {
        // In a real implementation, this would open the reading interface
        // For now, we'll redirect to the reader page
        window.location.href = `reader.html?book=${session.book.id}&session=${session.id}`;
    }
    
    async toggleFavorite(bookId) {
        try {
            const isFavorite = await this.modules.userManager.isBookFavorite(bookId);
            
            if (isFavorite) {
                await this.modules.userManager.removeFromFavorites(bookId);
                this.showToast('Removed from favorites', 'info');
            } else {
                await this.modules.userManager.addToFavorites(bookId);
                this.showToast('Added to favorites', 'success');
            }
            
            // Update UI
            this.updateFavoriteButton(bookId, !isFavorite);
            
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            this.showError('Failed to update favorites.');
        }
    }
    
    updateFavoriteButton(bookId, isFavorite) {
        // Update all favorite buttons for this book
        document.querySelectorAll(`.btn-favorite[data-id="${bookId}"]`).forEach(btn => {
            btn.innerHTML = isFavorite 
                ? '<i class="fas fa-heart text-danger"></i>' 
                : '<i class="fas fa-heart"></i>';
        });
    }
    
    async openRandomBook() {
        try {
            const books = await this.modules.bookManager.getRandomBook();
            if (books.length > 0) {
                const randomBook = books[0];
                await this.startReading(randomBook.id);
            }
        } catch (error) {
            console.error('Failed to open random book:', error);
            this.showError('Failed to find a random book.');
        }
    }
    
    filterBooksByCategory(category) {
        const books = document.querySelectorAll('.book-card');
        books.forEach(book => {
            const bookCategory = book.dataset.category;
            if (category === 'all' || bookCategory === category) {
                book.style.display = 'block';
            } else {
                book.style.display = 'none';
            }
        });
    }
    
    sortBooks(sortBy) {
        const container = document.querySelector('#newReleasesGrid');
        if (!container) return;
        
        const books = Array.from(container.children);
        
        books.sort((a, b) => {
            const aData = this.getBookCardData(a);
            const bData = this.getBookCardData(b);
            
            switch (sortBy) {
                case 'popular':
                    return bData.reviews - aData.reviews;
                case 'newest':
                    return new Date(bData.published) - new Date(aData.published);
                case 'rating':
                    return bData.rating - aData.rating;
                case 'title':
                    return aData.title.localeCompare(bData.title);
                default:
                    return 0;
            }
        });
        
        // Reorder books
        books.forEach(book => container.appendChild(book));
    }
    
    getBookCardData(card) {
        return {
            title: card.querySelector('.book-card-title')?.textContent || '',
            author: card.querySelector('.book-card-author')?.textContent || '',
            rating: parseFloat(card.querySelector('.book-rating')?.dataset.rating || '0'),
            reviews: parseInt(card.querySelector('.book-rating small')?.textContent?.match(/\d+/)?.[0] || '0'),
            published: card.dataset.published || new Date().toISOString()
        };
    }
    
    async performSearch(query) {
        if (!query.trim()) return;
        
        try {
            const results = await this.modules.bookManager.searchBooks(query);
            
            // In a real implementation, this would navigate to search results page
            // For now, we'll show a toast
            this.showToast(`Found ${results.length} books for "${query}"`, 'info');
            
            // Update URL for sharing
            window.history.pushState({}, '', `#search=${encodeURIComponent(query)}`);
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed. Please try again.');
        }
    }
    
    async subscribeToNewsletter(email) {
        try {
            await this.modules.community.subscribeToNewsletter(email);
            this.showToast('Successfully subscribed to newsletter!', 'success');
            
            // Clear form
            const form = document.querySelector('.footer-newsletter form');
            if (form) form.reset();
            
        } catch (error) {
            console.error('Failed to subscribe:', error);
            this.showError('Failed to subscribe. Please try again.');
        }
    }
    
    async checkForNewNotifications() {
        if (this.state.offline) return;
        
        try {
            const newNotifications = await this.modules.userManager.checkNewNotifications();
            
            if (newNotifications.length > 0) {
                // Add new notifications
                this.state.notifications = [...newNotifications, ...this.state.notifications];
                
                // Update UI
                this.updateNotificationUI();
                
                // Show desktop notification
                if (Notification.permission === 'granted') {
                    new Notification('LiteraVerse', {
                        body: `You have ${newNotifications.length} new notification(s)`,
                        icon: '/assets/icons/icon-192x192.png'
                    });
                }
            }
            
        } catch (error) {
            console.error('Failed to check notifications:', error);
        }
    }
    
    showToast(message, type = 'info') {
        if (typeof Toastify === 'undefined') return;
        
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: this.getToastColor(type),
            stopOnFocus: true
        }).showToast();
    }
    
    getToastColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    saveState() {
        try {
            // Save user preferences
            if (this.state.user?.preferences) {
                localStorage.setItem('literaverse_preferences', JSON.stringify(this.state.user.preferences));
            }
            
            // Save reading progress
            localStorage.setItem('literaverse_progress', JSON.stringify(this.state.readingProgress));
            
            // Save theme
            localStorage.setItem('literaverse_theme', this.state.theme);
            
            // Save config
            localStorage.setItem('literaverse_config', JSON.stringify(this.config));
            
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    startBackgroundServices() {
        // Periodic sync
        setInterval(() => this.syncData(), 5 * 60 * 1000); // Every 5 minutes
        
        // Analytics heartbeat
        setInterval(() => this.modules.analytics.sendHeartbeat(), 60 * 1000); // Every minute
        
        // Cache cleanup
        setInterval(() => this.cleanupCache(), 24 * 60 * 60 * 1000); // Daily
    }
    
    async cleanupCache() {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                const currentCache = 'literaverse-v3';
                
                for (const cacheName of cacheNames) {
                    if (cacheName !== currentCache) {
                        await caches.delete(cacheName);
                    }
                }
            }
        } catch (error) {
            console.error('Cache cleanup failed:', error);
        }
    }
}

// Export main class
window.LiteraVerse = LiteraVerse;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for service worker support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        });
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Create and initialize app
    window.app = new LiteraVerse();
});

// Export utility functions for debugging
window.debugApp = {
    getState: () => window.app?.state,
    getConfig: () => window.app?.config,
    reloadBooks: () => window.app?.loadBooksData(),
    clearCache: () => {
        localStorage.clear();
        location.reload();
    }
};