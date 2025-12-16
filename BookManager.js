export class BookManager {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }
    
    async getTrendingBooks(limit = 10) {
        const cacheKey = `trending_${limit}`;
        return this.cachedFetch(cacheKey, async () => {
            // In a real app, this would fetch from API
            return this.getSampleBooks().slice(0, limit);
        });
    }
    
    async getNewReleases(limit = 8) {
        const cacheKey = `new_releases_${limit}`;
        return this.cachedFetch(cacheKey, async () => {
            // In a real app, this would fetch from API
            return this.getSampleBooks()
                .sort((a, b) => new Date(b.published) - new Date(a.published))
                .slice(0, limit);
        });
    }
    
    async getBook(bookId) {
        const cacheKey = `book_${bookId}`;
        return this.cachedFetch(cacheKey, async () => {
            // In a real app, this would fetch from API
            const books = this.getSampleBooks();
            return books.find(book => book.id === bookId) || null;
        });
    }
    
    async searchBooks(query, limit = 20) {
        const cacheKey = `search_${query}_${limit}`;
        return this.cachedFetch(cacheKey, async () => {
            // In a real app, this would fetch from API
            const books = this.getSampleBooks();
            const searchTerm = query.toLowerCase();
            
            return books.filter(book => 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                book.description.toLowerCase().includes(searchTerm)
            ).slice(0, limit);
        });
    }
    
    async getRandomBook() {
        const cacheKey = 'random_books';
        return this.cachedFetch(cacheKey, async () => {
            const books = this.getSampleBooks();
            const shuffled = [...books].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 1);
        });
    }
    
    async getCategories() {
        const cacheKey = 'categories';
        return this.cachedFetch(cacheKey, async () => {
            return [
                { id: 'fiction', name: 'Fiction', icon: 'book', color: '#667eea', count: 1245 },
                { id: 'non-fiction', name: 'Non-Fiction', icon: 'globe', color: '#10b981', count: 892 },
                { id: 'science', name: 'Science', icon: 'flask', color: '#3b82f6', count: 567 },
                { id: 'technology', name: 'Technology', icon: 'laptop-code', color: '#8b5cf6', count: 789 },
                { id: 'history', name: 'History', icon: 'landmark', color: '#f59e0b', count: 423 },
                { id: 'romance', name: 'Romance', icon: 'heart', color: '#ef4444', count: 654 }
            ];
        });
    }
    
    async cachedFetch(key, fetchFunction) {
        const cached = this.cache.get(key);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp < this.cacheDuration)) {
            return cached.data;
        }
        
        try {
            const data = await fetchFunction();
            this.cache.set(key, { data, timestamp: now });
            return data;
        } catch (error) {
            // Return cached data even if stale, if available
            if (cached) {
                return cached.data;
            }
            throw error;
        }
    }
    
    getSampleBooks() {
        return [
            {
                id: '1',
                title: "The Digital Frontier",
                author: "Alexandra Chen",
                category: "technology",
                pages: 320,
                cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                description: "A thrilling journey through the evolution of digital technology and its impact on society.",
                rating: 4.8,
                reviews: 245,
                published: "2023-03-15",
                tags: ["Technology", "Future", "Innovation"],
                isFeatured: true,
                isNew: true
            },
            // ... more sample books
        ];
    }
}