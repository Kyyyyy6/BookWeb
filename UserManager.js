export class UserManager {
    constructor(config) {
        this.config = config;
        this.storageKey = 'literaverse_user_data';
    }
    
    async getCurrentUser() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
            
            // Try to fetch from API
            if (navigator.onLine) {
                const response = await fetch(`${this.config.apiUrl}/user`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const user = await response.json();
                    this.saveUser(user);
                    return user;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }
    
    async createGuestUser() {
        const guestUser = {
            id: `guest_${Date.now()}`,
            name: 'Guest Reader',
            email: null,
            role: 'guest',
            preferences: {
                theme: 'system',
                fontSize: 'medium',
                fontFamily: 'default',
                lineHeight: 1.6,
                autoNightMode: true,
                notifications: true
            },
            readingStats: {
                totalBooks: 0,
                totalPages: 0,
                readingTime: 0,
                averageSpeed: 200
            },
            achievements: [],
            readingStreak: 0,
            createdAt: new Date().toISOString()
        };
        
        this.saveUser(guestUser);
        return guestUser;
    }
    
    saveUser(user) {
        localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
    
    async updateUser(updates) {
        try {
            const currentUser = await this.getCurrentUser();
            const updatedUser = { ...currentUser, ...updates };
            
            this.saveUser(updatedUser);
            
            // Sync with server if online
            if (navigator.onLine && currentUser.role !== 'guest') {
                await fetch(`${this.config.apiUrl}/user`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                    credentials: 'include'
                });
            }
            
            return updatedUser;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }
    
    async getNotifications() {
        try {
            // Try to fetch from API
            if (navigator.onLine) {
                const response = await fetch(`${this.config.apiUrl}/notifications`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    return await response.json();
                }
            }
            
            // Fallback to local storage
            const stored = localStorage.getItem('literaverse_notifications');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Return sample notifications
            return this.getSampleNotifications();
        } catch (error) {
            console.error('Failed to get notifications:', error);
            return this.getSampleNotifications();
        }
    }
    
    async markNotificationRead(notificationId) {
        try {
            // Update locally
            const notifications = await this.getNotifications();
            const updated = notifications.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            );
            
            localStorage.setItem('literaverse_notifications', JSON.stringify(updated));
            
            // Sync with server if online
            if (navigator.onLine) {
                await fetch(`${this.config.apiUrl}/notifications/${notificationId}/read`, {
                    method: 'POST',
                    credentials: 'include'
                });
            }
            
        } catch (error) {
            console.error('Failed to mark notification read:', error);
        }
    }
    
    async checkNewNotifications() {
        try {
            if (!navigator.onLine) return [];
            
            const response = await fetch(`${this.config.apiUrl}/notifications/new`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return [];
        } catch (error) {
            console.error('Failed to check new notifications:', error);
            return [];
        }
    }
    
    async isBookFavorite(bookId) {
        try {
            const user = await this.getCurrentUser();
            const favorites = user?.favorites || [];
            return favorites.includes(bookId);
        } catch (error) {
            console.error('Failed to check favorite:', error);
            return false;
        }
    }
    
    async addToFavorites(bookId) {
        try {
            const user = await this.getCurrentUser();
            const favorites = user?.favorites || [];
            
            if (!favorites.includes(bookId)) {
                const updated = [...favorites, bookId];
                await this.updateUser({ favorites: updated });
            }
        } catch (error) {
            console.error('Failed to add to favorites:', error);
            throw error;
        }
    }
    
    async removeFromFavorites(bookId) {
        try {
            const user = await this.getCurrentUser();
            const favorites = user?.favorites || [];
            
            const updated = favorites.filter(id => id !== bookId);
            await this.updateUser({ favorites: updated });
        } catch (error) {
            console.error('Failed to remove from favorites:', error);
            throw error;
        }
    }
    
    async syncReadingProgress(progress) {
        try {
            if (navigator.onLine) {
                await fetch(`${this.config.apiUrl}/progress/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(progress),
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.error('Failed to sync progress:', error);
            // Progress is saved locally, so we can retry later
        }
    }
    
    async syncUserData(user) {
        try {
            if (navigator.onLine && user.role !== 'guest') {
                await fetch(`${this.config.apiUrl}/user/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user),
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.error('Failed to sync user data:', error);
        }
    }
    
    getSampleNotifications() {
        return [
            {
                id: '1',
                type: 'book',
                message: 'New book added: "The Digital Frontier"',
                read: false,
                timestamp: Date.now() - 3600000, // 1 hour ago
                action: { type: 'open_book', bookId: '1' }
            },
            {
                id: '2',
                type: 'achievement',
                message: 'You earned the "Book Explorer" badge!',
                read: false,
                timestamp: Date.now() - 86400000, // 1 day ago
                action: { type: 'open_page', page: '#achievements' }
            },
            {
                id: '3',
                type: 'info',
                message: 'Your reading streak: 7 days in a row!',
                read: true,
                timestamp: Date.now() - 172800000, // 2 days ago
                action: null
            }
        ];
    }
}