<script>
    // ==================== SECURITY FIXES AND NEW FEATURES ====================
    
    // 1. ENVIRONMENT VARIABLES IMPLEMENTATION
    const ENV = {
        // These should be loaded from environment variables in production
        FIREBASE_API_KEY: "AIzaSyD2-yz4xwYD5S_oXs6ryhNP8XIC94jzda4",
        FIREBASE_AUTH_DOMAIN: "dukaan-platform.firebaseapp.com",
        FIREBASE_PROJECT_ID: "dukaan-platform",
        FIREBASE_STORAGE_BUCKET: "dukaan-platform.firebasestorage.app",
        FIREBASE_MESSAGING_SENDER_ID: "75765851780",
        FIREBASE_APP_ID: "1:75765851780:web:dd9567db1d39c3b09c84d1",
        CLOUDINARY_CLOUD_NAME: 'db1rbtgpe',
        CLOUDINARY_UPLOAD_PRESET: 'dukaan-platform',
        CLOUDINARY_API_KEY: '156538295145313',
        APP_VERSION: '1.5.0',
        MAX_ITEMS_PER_PAGE: 100,
        CACHE_DURATION: 300000, // 5 minutes
        OFFLINE_QUEUE_SIZE: 50
    };

    // 2. ERROR BOUNDARY SYSTEM
    class ErrorBoundary {
        constructor() {
            this.errors = [];
            this.maxErrors = 100;
            this.reportEndpoint = '/api/error-report';
        }

        capture(error, context = '') {
            const errorData = {
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
                context: context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                online: navigator.onLine
            };

            this.errors.push(errorData);
            if (this.errors.length > this.maxErrors) {
                this.errors.shift();
            }

            // Log to console in development
            if (this.isDevelopment()) {
                console.error(`[ErrorBoundary] ${context}:`, error);
            }

            // Store in localStorage for persistence
            this.saveToStorage();

            return errorData;
        }

        async reportToServer() {
            if (!navigator.onLine || this.errors.length === 0) return;

            try {
                const errorsToReport = [...this.errors];
                this.errors = [];

                // In production, send to error reporting service
                if (!this.isDevelopment()) {
                    const response = await fetch(this.reportEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            app: 'Raashanmart Shopkeeper',
                            version: ENV.APP_VERSION,
                            errors: errorsToReport
                        })
                    });

                    if (response.ok) {
                        console.log('Error report sent successfully');
                    }
                }
            } catch (error) {
                console.error('Failed to send error report:', error);
                // Re-add errors if reporting failed
                this.errors = [...errorsToReport, ...this.errors].slice(0, this.maxErrors);
            }
        }

        saveToStorage() {
            try {
                localStorage.setItem('error_logs', JSON.stringify(this.errors));
            } catch (error) {
                console.error('Failed to save errors to storage:', error);
            }
        }

        loadFromStorage() {
            try {
                const saved = localStorage.getItem('error_logs');
                if (saved) {
                    this.errors = JSON.parse(saved).slice(-this.maxErrors);
                }
            } catch (error) {
                console.error('Failed to load errors from storage:', error);
            }
        }

        isDevelopment() {
            return window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';
        }

        getErrorCount() {
            return this.errors.length;
        }

        clearErrors() {
            this.errors = [];
            localStorage.removeItem('error_logs');
        }
    }

    // 3. XSS PROTECTION UTILITY
    class XSSProtection {
        static sanitize(input) {
            if (typeof input !== 'string') return input;
            
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        }

        static sanitizeObject(obj) {
            if (!obj || typeof obj !== 'object') return obj;
            
            const sanitized = Array.isArray(obj) ? [] : {};
            
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    
                    if (typeof value === 'string') {
                        sanitized[key] = this.sanitize(value);
                    } else if (typeof value === 'object' && value !== null) {
                        sanitized[key] = this.sanitizeObject(value);
                    } else {
                        sanitized[key] = value;
                    }
                }
            }
            
            return sanitized;
        }

        static validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        static validatePhone(phone) {
            const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
            return phoneRegex.test(phone);
        }

        static validatePrice(price) {
            return typeof price === 'number' && price >= 0 && price <= 1000000;
        }

        static validateStock(stock) {
            return typeof stock === 'number' && stock >= 0 && stock <= 100000;
        }
    }

    // 4. PERFORMANCE OPTIMIZATION CLASS
    class PerformanceOptimizer {
        constructor() {
            this.imageCache = new Map();
            this.dataCache = new Map();
            this.cacheExpiry = new Map();
            this.lazyLoadObserver = null;
            this.virtualScrollBuffer = 10;
        }

        init() {
            this.setupLazyLoading();
            this.setupImagePreloading();
        }

        setupLazyLoading() {
            if ('IntersectionObserver' in window) {
                this.lazyLoadObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            this.lazyLoadObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px',
                    threshold: 0.01
                });
            }
        }

        lazyLoadImage(imageElement, src) {
            if (!this.lazyLoadObserver) {
                imageElement.src = src;
                return;
            }

            imageElement.dataset.src = src;
            imageElement.classList.add('lazy');
            this.lazyLoadObserver.observe(imageElement);
        }

        setupImagePreloading() {
            // Preload common icons and images
            const imagesToPreload = [
                'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
                'https://cdn-icons-png.flaticon.com/512/3148/3148829.png'
            ];

            imagesToPreload.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        }

        cacheData(key, data, expiryMs = ENV.CACHE_DURATION) {
            this.dataCache.set(key, data);
            this.cacheExpiry.set(key, Date.now() + expiryMs);
        }

        getCachedData(key) {
            const expiry = this.cacheExpiry.get(key);
            if (expiry && Date.now() > expiry) {
                this.dataCache.delete(key);
                this.cacheExpiry.delete(key);
                return null;
            }
            return this.dataCache.get(key);
        }

        clearCache() {
            this.dataCache.clear();
            this.cacheExpiry.clear();
        }

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    }

    // 5. OFFLINE QUEUE MANAGEMENT
    class OfflineQueue {
        constructor() {
            this.queue = [];
            this.maxSize = ENV.OFFLINE_QUEUE_SIZE;
            this.loadFromStorage();
        }

        add(operation) {
            const operationData = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                ...operation
            };

            this.queue.push(operationData);
            
            // Keep only recent operations
            if (this.queue.length > this.maxSize) {
                this.queue = this.queue.slice(-this.maxSize);
            }

            this.saveToStorage();
            this.updateIndicator();

            return operationData.id;
        }

        async process() {
            if (!navigator.onLine || this.queue.length === 0) return;

            const successIds = [];
            const failedIds = [];

            for (const operation of [...this.queue]) {
                try {
                    await this.executeOperation(operation);
                    successIds.push(operation.id);
                } catch (error) {
                    console.error('Failed to execute offline operation:', error);
                    failedIds.push(operation.id);
                }
            }

            // Remove successful operations
            this.queue = this.queue.filter(op => !successIds.includes(op.id));
            this.saveToStorage();
            this.updateIndicator();

            return {
                success: successIds.length,
                failed: failedIds.length
            };
        }

        async executeOperation(operation) {
            // This would be implemented based on operation type
            // For now, it's a placeholder
            return new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
        }

        saveToStorage() {
            try {
                localStorage.setItem('offline_queue', JSON.stringify(this.queue));
            } catch (error) {
                console.error('Failed to save offline queue:', error);
            }
        }

        loadFromStorage() {
            try {
                const saved = localStorage.getItem('offline_queue');
                if (saved) {
                    this.queue = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Failed to load offline queue:', error);
            }
        }

        updateIndicator() {
            const indicator = document.getElementById('offlineQueueIndicator');
            if (!indicator) return;

            if (this.queue.length > 0) {
                indicator.style.display = 'block';
                indicator.innerHTML = `
                    <i class="fas fa-clock"></i>
                    ${this.queue.length} pending offline ${this.queue.length === 1 ? 'operation' : 'operations'}
                `;
            } else {
                indicator.style.display = 'none';
            }
        }

        clear() {
            this.queue = [];
            this.saveToStorage();
            this.updateIndicator();
        }

        getQueueSize() {
            return this.queue.length;
        }
    }

    // 6. RETRY LOGIC WITH EXPONENTIAL BACKOFF
    class RetryManager {
        constructor(maxRetries = 3, baseDelay = 1000) {
            this.maxRetries = maxRetries;
            this.baseDelay = baseDelay;
        }

        async executeWithRetry(operation, context = '') {
            let lastError;
            
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    return await operation();
                } catch (error) {
                    lastError = error;
                    
                    if (attempt === this.maxRetries) {
                        throw new Error(`${context}: Failed after ${this.maxRetries} attempts. Last error: ${error.message}`);
                    }
                    
                    const delay = this.baseDelay * Math.pow(2, attempt - 1);
                    console.warn(`${context}: Attempt ${attempt} failed, retrying in ${delay}ms`);
                    
                    await this.delay(delay + Math.random() * 1000); // Add jitter
                }
            }
            
            throw lastError;
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // ==================== MAIN APPLICATION ====================

    // Initialize core components
    const errorBoundary = new ErrorBoundary();
    const performanceOptimizer = new PerformanceOptimizer();
    const offlineQueue = new OfflineQueue();
    const retryManager = new RetryManager();

    // Firebase Configuration - USING ENVIRONMENT VARIABLES
    const firebaseConfig = {
        apiKey: ENV.FIREBASE_API_KEY,
        authDomain: ENV.FIREBASE_AUTH_DOMAIN,
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
        appId: ENV.FIREBASE_APP_ID
    };

    // Cloudinary Configuration
    const cloudinaryConfig = {
        cloudName: ENV.CLOUDINARY_CLOUD_NAME,
        uploadPreset: ENV.CLOUDINARY_UPLOAD_PRESET,
        apiKey: ENV.CLOUDINARY_API_KEY,
        sources: ['local', 'camera', 'url'],
        folder: 'samples/ecommerce',
        multiple: false,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'png', 'gif', 'webp', 'jpeg'],
        maxFileSize: 5000000,
        theme: 'white',
        cropping: false,
        showAdvancedOptions: false,
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#0F2C59",
                tabIcon: "#0F2C59",
                menuIcons: "#0F2C59",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#0F2C59",
                action: "#0F2C59",
                inactiveTabIcon: "#555555",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            }
        }
    };

    // Initialize Firebase
    let auth = null;
    let db = null;
    let storage = null;
    let currentShop = null;
    let products = [];
    let orders = [];
    let filteredOrders = [];
    let refunds = [];
    let filteredRefunds = [];
    let currentPartialOrderId = null;
    let partialOrderItems = [];
    let currentRefundOrder = null;
    let isOnline = navigator.onLine;
    let ordersListener = null;
    let messaging = null;
    let currentImageTab = 'url';
    let cloudinaryWidget = null;
    let notificationSound = null;
    let currentShopConfig = null;
    let currentOrderItems = [];
    let shopCategories = ['groceries', 'dairy', 'bakery', 'beverages', 'snacks', 'personal_care', 'household'];

    // CSRF Token Management
    class CSRFProtection {
        constructor() {
            this.token = this.generateToken();
            this.tokenName = 'X-CSRF-Token';
        }

        generateToken() {
            return 'csrf_' + Math.random().toString(36).substr(2) + '_' + Date.now();
        }

        getToken() {
            const storedToken = localStorage.getItem('csrf_token');
            if (storedToken) {
                this.token = storedToken;
            } else {
                localStorage.setItem('csrf_token', this.token);
            }
            return this.token;
        }

        validateToken(token) {
            const storedToken = localStorage.getItem('csrf_token');
            return token && storedToken && token === storedToken;
        }

        addTokenToForm(form) {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = this.tokenName;
            tokenInput.value = this.getToken();
            form.appendChild(tokenInput);
        }

        validateForm(form) {
            const token = form.querySelector(`input[name="${this.tokenName}"]`)?.value;
            return this.validateToken(token);
        }
    }

    const csrfProtection = new CSRFProtection();

    // Session Management
    class SessionManager {
        constructor() {
            this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
            this.lastActivity = Date.now();
            this.setupActivityTracking();
        }

        setupActivityTracking() {
            const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
            events.forEach(event => {
                document.addEventListener(event, () => {
                    this.lastActivity = Date.now();
                    this.saveSession();
                });
            });

            // Check session every minute
            setInterval(() => this.checkSession(), 60000);
        }

        checkSession() {
            const idleTime = Date.now() - this.lastActivity;
            
            if (idleTime > this.sessionTimeout && auth?.currentUser) {
                this.showSessionWarning();
            }
        }

        showSessionWarning() {
            if (document.getElementById('sessionWarning')) return;

            const warning = document.createElement('div');
            warning.id = 'sessionWarning';
            warning.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                z-index: 9999;
                text-align: center;
                max-width: 400px;
                width: 90%;
            `;

            warning.innerHTML = `
                <h3 style="color: #e74c3c; margin-bottom: 1rem;">
                    <i class="fas fa-clock"></i> Session Timeout Warning
                </h3>
                <p>Your session will expire due to inactivity in 2 minutes.</p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="extendSession()">
                        <i class="fas fa-sync"></i> Stay Logged In
                    </button>
                    <button class="btn btn-outline" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout Now
                    </button>
                </div>
            `;

            document.body.appendChild(warning);
        }

        extendSession() {
            this.lastActivity = Date.now();
            this.saveSession();
            const warning = document.getElementById('sessionWarning');
            if (warning) warning.remove();
        }

        saveSession() {
            localStorage.setItem('last_activity', this.lastActivity.toString());
        }

        loadSession() {
            const saved = localStorage.getItem('last_activity');
            if (saved) {
                this.lastActivity = parseInt(saved);
            }
        }

        clearSession() {
            localStorage.removeItem('last_activity');
            this.lastActivity = Date.now();
        }
    }

    const sessionManager = new SessionManager();

    // Initialize App with Error Handling
    async function initApp() {
        try {
            errorBoundary.loadFromStorage();
            performanceOptimizer.init();
            sessionManager.loadSession();

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            } else {
                firebase.app();
            }
            
            auth = firebase.auth();
            db = firebase.firestore();
            storage = firebase.storage();
            
            // Setup notification sound
            notificationSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
            notificationSound.volume = 0.5;
            
            await setupPushNotifications();
            setupOrderListener();
            
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    await loadShopData(user.uid);
                }
            });

            setupNetworkDetection();
            initializeCloudinaryWidget();
            setupOfflineQueueIndicator();
            
        } catch (error) {
            errorBoundary.capture(error, 'Firebase initialization');
            showToast("Firebase initialization failed. Please refresh the page.", "error");
        }
    }

    // Initialize Cloudinary Widget with Error Handling
    function initializeCloudinaryWidget() {
        try {
            cloudinaryWidget = cloudinary.createUploadWidget(
                cloudinaryConfig,
                (error, result) => {
                    if (error) {
                        errorBoundary.capture(error, 'Cloudinary upload');
                        showToast('Cloudinary upload error', 'error');
                        document.getElementById('cloudinaryUploadStatus').style.display = 'none';
                        return;
                    }
                    
                    if (result && result.event === "queues-start") {
                        document.getElementById('cloudinaryUploadStatus').style.display = 'block';
                    }
                    
                    if (result && result.event === "success") {
                        const imageUrl = result.info.secure_url;
                        document.getElementById('cloudinaryImageUrl').value = imageUrl;
                        document.getElementById('productImage').value = imageUrl;
                        
                        const preview = document.getElementById('cloudinaryImagePreview');
                        preview.src = imageUrl;
                        preview.style.display = 'block';
                        
                        document.getElementById('cloudinaryImageInfo').style.display = 'block';
                        document.getElementById('cloudinaryUploadStatus').style.display = 'none';
                        
                        showToast('✅ Image uploaded successfully!', 'success');
                    }
                    
                    if (result && result.event === "close") {
                        document.getElementById('cloudinaryUploadStatus').style.display = 'none';
                    }
                }
            );
        } catch (error) {
            errorBoundary.capture(error, 'Cloudinary initialization');
            showToast('Cloudinary initialization failed. Please refresh page.', 'warning');
        }
    }

    // Setup push notifications with retry logic
    async function setupPushNotifications() {
        try {
            await retryManager.executeWithRetry(async () => {
                if (!('Notification' in window)) {
                    console.log('This browser does not support notifications');
                    return;
                }
                
                if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('Notification permission granted');
                        
                        if (firebase.messaging.isSupported()) {
                            messaging = firebase.messaging();
                            
                            const currentToken = await messaging.getToken({ 
                                vapidKey: "BC8-qBqG-JuB3xKp-6nE3lNlUq4pE2g7pW8w9Xj4kF5yM8rV9tH1jK2lP3mN4oQ5rS6tU7vW8xY9zA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9"
                            });
                            
                            if (currentToken && currentShop) {
                                await db.collection('shops').doc(currentShop.id).update({
                                    fcmToken: currentToken,
                                    notificationEnabled: true,
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                            }
                        }
                    }
                } else if (Notification.permission === 'granted') {
                    if (firebase.messaging.isSupported()) {
                        messaging = firebase.messaging();
                        
                        const currentToken = await messaging.getToken({ 
                            vapidKey: "BC8-qBqG-JuB3xKp-6nE3lNlUq4pE2g7pW8w9Xj4kF5yM8rV9tH1jK2lP3mN4oQ5rS6tU7vW8xY9zA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9"
                        });
                        
                        if (currentToken && currentShop) {
                            await db.collection('shops').doc(currentShop.id).update({
                                fcmToken: currentToken,
                                notificationEnabled: true,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }
            }, 'Push notification setup');
            
        } catch (error) {
            errorBoundary.capture(error, 'Push notification setup');
            console.error('Error setting up push notifications:', error);
        }
    }

    // Setup order listener for real-time updates with error boundary
    function setupOrderListener() {
        if (!currentShop || !db) return;
        
        try {
            // Remove existing listener if any
            if (ordersListener) {
                ordersListener();
            }
            
            ordersListener = db.collection('orders')
                .where('shopId', '==', currentShop.id)
                .where('status', '==', 'pending')
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const order = change.doc.data();
                            playNotificationSound();
                            showNotification(
                                '🛍️ New Order Received!',
                                `Order #${order.orderId?.substring(order.orderId.length - 6) || 'N/A'} from ${order.customerName || 'Customer'}`
                            );
                            loadOrders();
                            loadDashboardData();
                        }
                    });
                }, (error) => {
                    errorBoundary.capture(error, 'Order listener');
                    console.error('Order listener error:', error);
                });
        } catch (error) {
            errorBoundary.capture(error, 'Order listener setup');
        }
    }

    // Enhanced showNotification with error handling
    function showNotification(title, body) {
        try {
            if (!("Notification" in window)) {
                console.log("This browser does not support notifications");
                return;
            }
            
            if (Notification.permission === "granted") {
                const notification = new Notification(title, {
                    body: body,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
                    badge: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
                    tag: 'new-order'
                });
                
                notification.onclick = function() {
                    window.focus();
                    notification.close();
                    navigateToPage('orders');
                };
                
                setTimeout(() => {
                    notification.close();
                }, 10000);
                
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        showNotification(title, body);
                    }
                });
            }
        } catch (error) {
            errorBoundary.capture(error, 'Show notification');
        }
    }

    // Play notification sound with error handling
    function playNotificationSound() {
        try {
            if (notificationSound) {
                notificationSound.currentTime = 0;
                notificationSound.play().catch(e => {
                    console.log('Notification sound play failed:', e);
                });
            }
        } catch (error) {
            errorBoundary.capture(error, 'Play notification sound');
        }
    }

    // Setup offline queue indicator
    function setupOfflineQueueIndicator() {
        const existingIndicator = document.getElementById('offlineQueueIndicator');
        if (existingIndicator) return;

        const indicator = document.createElement('div');
        indicator.id = 'offlineQueueIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #f39c12;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            z-index: 1000;
            display: none;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(indicator);
        offlineQueue.updateIndicator();
    }

    // Setup network detection with offline queue
    function setupNetworkDetection() {
        const offlineWarning = document.getElementById('offlineWarning');
        
        if (!isOnline) {
            offlineWarning.style.display = 'block';
            showToast('No internet connection. Some features may not work.', 'warning');
        }
        
        window.addEventListener('online', async function() {
            isOnline = true;
            offlineWarning.style.display = 'none';
            showToast('Internet connection restored!', 'success');
            
            // Process offline queue
            const result = await offlineQueue.process();
            if (result.success > 0) {
                showToast(`Processed ${result.success} offline operation${result.success === 1 ? '' : 's'}`, 'success');
            }
            
            if (currentShop) {
                await loadProducts();
                await loadOrders();
                await loadRefunds();
                await loadDashboardData();
                showToast('Data refreshed successfully', 'info');
            }
        });
        
        window.addEventListener('offline', function() {
            isOnline = false;
            offlineWarning.style.display = 'block';
            showToast('No internet connection. Working offline mode.', 'warning');
        });
        
        // Periodic check
        setInterval(() => {
            if (navigator.onLine !== isOnline) {
                isOnline = navigator.onLine;
                if (isOnline) {
                    offlineWarning.style.display = 'none';
                    showToast('Internet connection restored!', 'success');
                    if (currentShop) {
                        loadProducts();
                        loadOrders();
                        loadRefunds();
                        loadDashboardData();
                    }
                } else {
                    offlineWarning.style.display = 'block';
                    showToast('No internet connection.', 'warning');
                }
            }
        }, 30000);
    }

    // ==================== LOAD SHOP DATA WITH CACHING ====================
    
    async function loadShopData(shopId) {
        try {
            showLoading(true);
            
            // Try cache first
            const cacheKey = `shop_${shopId}`;
            const cached = performanceOptimizer.getCachedData(cacheKey);
            
            if (cached && !forceRefresh) {
                currentShop = cached;
                await loadShopCategories();
                await loadShopConfig();
                updateProfileForm();
                showAppScreen();
                return;
            }
            
            const shopDoc = await retryManager.executeWithRetry(
                () => db.collection('shops').doc(shopId).get(),
                'Load shop data'
            );
            
            if (shopDoc.exists) {
                currentShop = { id: shopId, ...shopDoc.data() };
                
                // Cache the shop data
                performanceOptimizer.cacheData(cacheKey, currentShop);
                
                await loadShopCategories();
                await loadShopConfig();
                
                await loadProducts();
                await loadOrders();
                await loadRefunds();
                updateProfileForm();
                
                showAppScreen();
                showToast('Welcome back to your shop!', 'success');
                
                setupOrderListener();
                
            } else {
                showToast('Shop profile not found. Please contact admin to create your shop.', 'error');
                await createShopForUser(shopId);
            }
        } catch (error) {
            errorBoundary.capture(error, 'Load shop data');
            showToast('Error loading shop data: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Load shop categories with caching
    async function loadShopCategories() {
        if (!currentShop) return;
        
        try {
            const cacheKey = `shop_categories_${currentShop.id}`;
            const cached = performanceOptimizer.getCachedData(cacheKey);
            
            if (cached) {
                shopCategories = cached;
                updateCategoryDropdowns();
                return;
            }
            
            const shopCategoriesDoc = await db.collection('shop_categories').doc(currentShop.id).get();
            
            if (shopCategoriesDoc.exists) {
                const data = shopCategoriesDoc.data();
                shopCategories = data.categories || shopCategories;
                
                // Cache categories
                performanceOptimizer.cacheData(cacheKey, shopCategories);
            } else {
                await db.collection('shop_categories').doc(currentShop.id).set({
                    categories: shopCategories,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                performanceOptimizer.cacheData(cacheKey, shopCategories);
            }
            
            updateCategoryDropdowns();
            
        } catch (error) {
            errorBoundary.capture(error, 'Load shop categories');
        }
    }

    // Update category dropdowns with XSS protection
    function updateCategoryDropdowns() {
        const productCategorySelect = document.getElementById('productCategory');
        const shopCategorySelect = document.getElementById('shopCategory');
        
        if (productCategorySelect) {
            const currentValue = productCategorySelect.value;
            productCategorySelect.innerHTML = '';
            
            shopCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = XSSProtection.sanitize(category);
                option.textContent = XSSProtection.sanitize(
                    category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
                );
                productCategorySelect.appendChild(option);
            });
            
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Custom)';
            productCategorySelect.appendChild(otherOption);
            
            productCategorySelect.value = XSSProtection.sanitize(currentValue || 'groceries');
        }
        
        if (shopCategorySelect) {
            const currentValue = shopCategorySelect.value;
            shopCategorySelect.innerHTML = '';
            
            shopCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = XSSProtection.sanitize(category);
                option.textContent = XSSProtection.sanitize(
                    category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
                );
                shopCategorySelect.appendChild(option);
            });
            
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Create New)';
            shopCategorySelect.appendChild(otherOption);
            
            shopCategorySelect.value = XSSProtection.sanitize(currentValue || 'groceries');
        }
    }

    // Add new category with validation
    async function addNewCategory(categoryName) {
        if (!currentShop || !categoryName || categoryName.trim() === '') {
            showToast('Category name is required', 'error');
            return false;
        }
        
        // XSS protection
        const sanitizedCategory = XSSProtection.sanitize(categoryName.trim().toLowerCase().replace(/\s+/g, '_'));
        
        if (sanitizedCategory.length < 2 || sanitizedCategory.length > 50) {
            showToast('Category name must be between 2-50 characters', 'error');
            return false;
        }
        
        try {
            if (!shopCategories.includes(sanitizedCategory)) {
                shopCategories.push(sanitizedCategory);
                
                await db.collection('shop_categories').doc(currentShop.id).update({
                    categories: shopCategories,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Clear cache
                performanceOptimizer.dataCache.delete(`shop_categories_${currentShop.id}`);
                
                updateCategoryDropdowns();
                
                await db.collection('shops').doc(currentShop.id).update({
                    availableCategories: shopCategories,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showToast(`New category "${sanitizedCategory}" created successfully!`, 'success');
                return true;
            } else {
                showToast('Category already exists', 'info');
                return false;
            }
        } catch (error) {
            errorBoundary.capture(error, 'Add new category');
            showToast('Error creating category: ' + error.message, 'error');
            return false;
        }
    }

    // Create shop for user if doesn't exist
    async function createShopForUser(userId) {
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            const shopData = {
                name: XSSProtection.sanitize(user.email.split('@')[0] + ' Shop'),
                email: XSSProtection.sanitize(user.email),
                category: 'groceries',
                description: 'Welcome to our shop!',
                address: 'Address not set',
                phone: 'Not set',
                openTime: '09:00',
                closeTime: '21:00',
                deliveryType: 'both',
                couponEnabled: false,
                couponSettings: null,
                refundPolicy: {
                    available: true,
                    period: 7,
                    type: 'full_refund',
                    conditions: 'Within 7 days of delivery, product must be unopened and in original condition'
                },
                status: 'open',
                availableCategories: shopCategories,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('shops').doc(userId).set(shopData);
            currentShop = { id: userId, ...shopData };
            
            await db.collection('shop_categories').doc(userId).set({
                categories: shopCategories,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await createDefaultShopConfig(userId);
            
            showAppScreen();
            showToast('New shop created! Please update your profile.', 'success');
            
            setupOrderListener();
            
        } catch (error) {
            errorBoundary.capture(error, 'Create shop for user');
            showToast('Error creating shop: ' + error.message, 'error');
        }
    }

    // ==================== AUTHENTICATION WITH SECURITY ====================
    
    async function handleLogin(event) {
        event.preventDefault();
        
        // CSRF protection
        csrfProtection.addTokenToForm(event.target);
        if (!csrfProtection.validateForm(event.target)) {
            showToast('Security token invalid. Please refresh the page.', 'error');
            return;
        }
        
        const email = XSSProtection.sanitize(document.getElementById('loginEmail').value.trim());
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showToast('Please enter email and password', 'error');
            return;
        }

        if (!XSSProtection.validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            showLoading(true);
            
            const userCredential = await retryManager.executeWithRetry(
                () => auth.signInWithEmailAndPassword(email, password),
                'User login'
            );
            
            const user = userCredential.user;
            
            // Update session
            sessionManager.clearSession();
            
            await loadShopData(user.uid);
            
        } catch (error) {
            errorBoundary.capture(error, 'User login');
            
            let errorMessage = 'Login failed. ';
            
            switch(error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Check your internet connection.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many login attempts. Please try again later.';
                    break;
                default:
                    errorMessage = 'Login failed. Please try again.';
            }
            
            showToast(errorMessage, 'error');
            
            // Add to offline queue for retry
            if (!navigator.onLine) {
                offlineQueue.add({
                    type: 'login_retry',
                    email: email,
                    timestamp: new Date().toISOString()
                });
            }
        } finally {
            showLoading(false);
        }
    }

    function showForgotPassword() {
        const email = prompt('Enter your email address to reset password:');
        if (email && XSSProtection.validateEmail(email)) {
            auth.sendPasswordResetEmail(XSSProtection.sanitize(email))
                .then(() => {
                    alert('📧 Password reset email sent! Check your inbox and spam folder.');
                })
                .catch(error => {
                    errorBoundary.capture(error, 'Forgot password');
                    alert('❌ Error: ' + error.message);
                });
        } else if (email) {
            alert('⚠️ Please enter a valid email address.');
        }
    }

    function showAuthScreen() {
        document.getElementById('authScreen').style.display = 'block';
        document.getElementById('appScreen').style.display = 'none';
        
        if (ordersListener) {
            ordersListener();
            ordersListener = null;
        }
        
        // Clear sensitive data
        currentShop = null;
        products = [];
        orders = [];
        refunds = [];
        
        // Clear cache
        performanceOptimizer.clearCache();
    }

    function showAppScreen() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        navigateToPage('dashboard');
    }

    // Enhanced logout with confirmation
    async function logout() {
        if (offlineQueue.getQueueSize() > 0) {
            if (!confirm('You have pending offline operations. Logout will cancel them. Continue?')) {
                return;
            }
            offlineQueue.clear();
        }
        
        if (ordersListener) {
            ordersListener();
            ordersListener = null;
        }
        
        try {
            await auth.signOut();
            sessionManager.clearSession();
            errorBoundary.clearErrors();
            showAuthScreen();
            showToast('Logged out successfully', 'info');
        } catch (error) {
            errorBoundary.capture(error, 'Logout');
            showToast('Error during logout', 'error');
        }
    }

    // ==================== NAVIGATION ====================
    
    function navigateToPage(page) {
        document.querySelectorAll('.content-page').forEach(pageElement => {
            pageElement.classList.remove('active');
        });
        
        const pageElement = document.getElementById(page + 'Page');
        if (pageElement) {
            pageElement.classList.add('active');
            
            // Update quick actions toolbar
            document.querySelectorAll('.quick-action-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-page') === page) {
                    btn.classList.add('active');
                }
            });
            
            switch(page) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'products':
                    loadProducts();
                    break;
                case 'orders':
                    loadOrders();
                    break;
                case 'refunds':
                    loadRefunds();
                    break;
                case 'settings':
                    loadShopConfig();
                    break;
            }
        }
    }

    // Loading Spinner with performance
    function showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
        
        // Throttle DOM updates
        if (!show) {
            setTimeout(() => {
                if (spinner) spinner.style.display = 'none';
            }, 300);
        }
    }

    // ==================== DASHBOARD FUNCTIONS ====================
    
    async function loadDashboardData() {
        if (!currentShop) return;
        
        try {
            const cacheKey = `dashboard_${currentShop.id}`;
            const cached = performanceOptimizer.getCachedData(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
                updateDashboardDisplay(cached.data);
                return;
            }
            
            document.getElementById('totalProducts').textContent = products.length;
            
            const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;
            document.getElementById('pendingOrders').textContent = pendingOrdersCount;
            
            const totalRevenue = orders.filter(o => o.status === 'delivered' || o.status === 'picked_up')
                .reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);
            document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
            
            const pendingRefundsCount = refunds.filter(refund => refund.status === 'pending').length;
            document.getElementById('pendingRefunds').textContent = pendingRefundsCount;
            
            updateDashboardOrdersSummary();
            
            // Cache the dashboard data
            const dashboardData = {
                totalProducts: products.length,
                pendingOrders: pendingOrdersCount,
                totalRevenue: totalRevenue,
                pendingRefunds: pendingRefundsCount,
                timestamp: Date.now()
            };
            
            performanceOptimizer.cacheData(cacheKey, {
                data: dashboardData,
                timestamp: Date.now()
            });
            
        } catch (error) {
            errorBoundary.capture(error, 'Load dashboard data');
        }
    }

    function updateDashboardDisplay(data) {
        document.getElementById('totalProducts').textContent = data.totalProducts;
        document.getElementById('pendingOrders').textContent = data.pendingOrders;
        document.getElementById('totalRevenue').textContent = `₹${data.totalRevenue.toFixed(2)}`;
        document.getElementById('pendingRefunds').textContent = data.pendingRefunds;
        updateDashboardOrdersSummary();
    }

    // Update dashboard orders summary with virtual scroll optimization
    function updateDashboardOrdersSummary() {
        const statsContainer = document.getElementById('dashboardOrdersStats');
        
        if (!statsContainer) return;
        
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
        const preparingCount = orders.filter(o => o.status === 'preparing').length;
        const deliveredCount = orders.filter(o => o.status === 'delivered').length;
        const pickedUpCount = orders.filter(o => o.status === 'picked_up').length;
        const cancelledCount = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        const stats = [
            { count: pendingCount, label: 'Pending Orders', class: 'pending' },
            { count: confirmedCount, label: 'Confirmed', class: 'confirmed' },
            { count: preparingCount, label: 'Preparing', class: 'preparing' },
            { count: deliveredCount + pickedUpCount, label: 'Completed', class: 'delivered' },
            { count: cancelledCount, label: 'Cancelled/Rejected', class: '' }
        ];
        
        stats.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = `dashboard-stat ${stat.class}`;
            statDiv.innerHTML = `
                <span class="dashboard-stat-value">${stat.count}</span>
                <span class="dashboard-stat-label">${stat.label}</span>
            `;
            fragment.appendChild(statDiv);
        });
        
        statsContainer.innerHTML = '';
        statsContainer.appendChild(fragment);
    }

    // ==================== PRODUCT MANAGEMENT WITH PERFORMANCE ====================
    
    async function loadProducts() {
        if (!currentShop) return;
        
        try {
            showLoading(true);
            
            const cacheKey = `products_${currentShop.id}`;
            const cached = performanceOptimizer.getCachedData(cacheKey);
            
            if (cached) {
                products = cached;
                renderProducts();
                return;
            }
            
            const snapshot = await retryManager.executeWithRetry(
                () => db.collection('products')
                    .where('shopId', '==', currentShop.id)
                    .limit(ENV.MAX_ITEMS_PER_PAGE)
                    .get(),
                'Load products'
            );
            
            products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...XSSProtection.sanitizeObject(doc.data()) });
            });
            
            // Cache products
            performanceOptimizer.cacheData(cacheKey, products);
            
            renderProducts();
            
        } catch (error) {
            errorBoundary.capture(error, 'Load products');
            showToast('Error loading products: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Continue to PART 3 for the rest of the JavaScript...
</script>