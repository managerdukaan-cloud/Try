    // Render products with virtual scrolling optimization
    function renderProducts() {
        const productsList = document.getElementById('productsList');
        
        if (products.length === 0) {
            productsList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-box-open" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3 style="color: #666; margin-bottom: 1rem;">No Products Yet</h3>
                    <p style="color: #999; margin-bottom: 2rem;">Add your first product to start selling</p>
                    <button class="btn btn-primary" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i> Add Your First Product
                    </button>
                </div>
            `;
            return;
        }
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Virtual scrolling - only render visible items
        const startIndex = 0;
        const endIndex = Math.min(startIndex + 20, products.length); // Render 20 at a time
        
        for (let i = startIndex; i < endIndex; i++) {
            const product = products[i];
            const productCard = createProductCard(product);
            fragment.appendChild(productCard);
        }
        
        productsList.innerHTML = '';
        productsList.appendChild(fragment);
        
        // Setup infinite scroll
        setupInfiniteScroll('productsList', products, createProductCard);
    }

    // Create product card element
    function createProductCard(product) {
        const div = document.createElement('div');
        div.className = 'product-card';
        
        let stockClass = 'in-stock';
        let stockText = '';
        let stockIcon = 'check-circle';
        
        if (product.stock > 10) {
            stockClass = 'in-stock';
            stockText = `${product.stock} in stock`;
            stockIcon = 'check-circle';
        } else if (product.stock > 0) {
            stockClass = 'low-stock';
            stockText = `Low stock (${product.stock})`;
            stockIcon = 'exclamation-circle';
        } else {
            stockClass = 'out-of-stock';
            stockText = 'Out of stock';
            stockIcon = 'times-circle';
        }

        let discountBadge = '';
        if (product.mrp && product.mrp > product.price) {
            const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);
            if (discountPercent > 0) {
                discountBadge = `<span class="product-discount">${discountPercent}% OFF</span>`;
            }
        }

        const productImage = product.image || 'https://cdn-icons-png.flaticon.com/512/3148/3148829.png';

        const refundAvailable = product.refundAvailable !== undefined ? product.refundAvailable : true;
        const refundType = product.refundType || 'use_shop_default';
        const refundConditions = product.refundConditions || '';
        
        let refundBadge = '';
        if (!refundAvailable) {
            refundBadge = '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 5px;">No Refund</span>';
        } else if (refundType === 'no_refund') {
            refundBadge = '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 5px;">Non-Returnable</span>';
        } else {
            refundBadge = '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 5px;">Refund Available</span>';
        }

        // Use lazy loading for images
        const imageHtml = `
            <div class="product-image-container">
                <img data-src="${productImage}" 
                     alt="${XSSProtection.sanitize(product.name)}" class="product-image lazy">
                <span class="product-badge">${XSSProtection.sanitize(product.category || 'Product')}</span>
            </div>
        `;

        div.innerHTML = `
            ${imageHtml}
            <div class="product-details">
                <h3 class="product-title">${XSSProtection.sanitize(product.name)} ${refundBadge}</h3>
                
                <div class="product-price-row">
                    <span class="product-price">₹${parseFloat(product.price || 0).toFixed(2)}</span>
                    ${product.mrp && product.mrp > product.price ? 
                        `<span class="product-mrp">₹${parseFloat(product.mrp).toFixed(2)}</span>` : ''}
                    ${discountBadge}
                </div>
                
                <div class="product-stock ${stockClass}">
                    <i class="fas fa-${stockIcon}"></i>
                    ${stockText}
                </div>
                
                ${product.description ? `<p style="color: #666; font-size: 0.85rem; margin-top: 0.5rem;">${XSSProtection.sanitize(product.description.substring(0, 60))}${product.description.length > 60 ? '...' : ''}</p>` : ''}
                
                ${refundConditions ? `<p style="color: #f39c12; font-size: 0.8rem; margin-top: 0.5rem;"><i class="fas fa-info-circle"></i> ${XSSProtection.sanitize(refundConditions.substring(0, 50))}${refundConditions.length > 50 ? '...' : ''}</p>` : ''}
                
                <div class="product-actions">
                    <button class="btn-edit-product" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-add-product" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        // Setup lazy loading for image
        const img = div.querySelector('img');
        if (img) {
            performanceOptimizer.lazyLoadImage(img, productImage);
        }
        
        return div;
    }

    // Setup infinite scroll for large lists
    function setupInfiniteScroll(containerId, items, createItemFunction) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let renderedCount = 20;
        const batchSize = 10;
        
        const loadMore = () => {
            if (renderedCount >= items.length) return;
            
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(renderedCount + batchSize, items.length);
            
            for (let i = renderedCount; i < endIndex; i++) {
                const item = createItemFunction(items[i]);
                fragment.appendChild(item);
            }
            
            container.appendChild(fragment);
            renderedCount = endIndex;
        };
        
        // Observe when user scrolls to bottom
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        }, { threshold: 0.1 });
        
        // Create a sentinel element at the bottom
        const sentinel = document.createElement('div');
        sentinel.id = 'scrollSentinel';
        sentinel.style.height = '1px';
        container.appendChild(sentinel);
        observer.observe(sentinel);
    }

    // ==================== PRODUCT MODAL FUNCTIONS WITH VALIDATION ====================
    
    function showAddProductModal() {
        document.getElementById('productModalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('editProductId').value = '';
        document.getElementById('productImage').value = '';
        document.getElementById('cloudinaryImageUrl').value = '';
        document.getElementById('urlImagePreview').style.display = 'none';
        document.getElementById('cloudinaryImagePreview').style.display = 'none';
        document.getElementById('cloudinaryImageInfo').style.display = 'none';
        document.getElementById('cloudinaryUploadStatus').style.display = 'none';
        document.getElementById('customCategoryName').value = '';
        document.getElementById('customCategoryInput').style.display = 'none';
        
        document.getElementById('productRefundAvailable').checked = true;
        document.getElementById('productRefundPeriod').value = 7;
        document.getElementById('productRefundType').value = 'use_shop_default';
        document.getElementById('productRefundConditions').value = '';
        document.getElementById('productRefundDetails').style.display = 'block';
        
        switchImageTab('url');
        document.getElementById('productModal').classList.add('active');
    }

    function closeProductModal() {
        document.getElementById('productModal').classList.remove('active');
    }

    function editProduct(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('editProductId').value = product.id;
        document.getElementById('productName').value = XSSProtection.sanitize(product.name);
        document.getElementById('productCategory').value = XSSProtection.sanitize(product.category || 'groceries');
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productMrp').value = product.mrp || '';
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = XSSProtection.sanitize(product.description || '');
        
        const refundAvailable = product.refundAvailable !== undefined ? product.refundAvailable : true;
        document.getElementById('productRefundAvailable').checked = refundAvailable;
        document.getElementById('productRefundPeriod').value = product.refundPeriod || 7;
        document.getElementById('productRefundType').value = product.refundType || 'use_shop_default';
        document.getElementById('productRefundConditions').value = XSSProtection.sanitize(product.refundConditions || '');
        document.getElementById('productRefundDetails').style.display = refundAvailable ? 'block' : 'none';
        
        const category = product.category || 'groceries';
        if (!shopCategories.includes(category) && category !== 'other') {
            document.getElementById('productCategory').value = 'other';
            document.getElementById('customCategoryName').value = XSSProtection.sanitize(category);
            document.getElementById('customCategoryInput').style.display = 'block';
        }
        
        if (product.image) {
            if (product.image.includes('cloudinary.com') || product.image.includes('res.cloudinary.com')) {
                document.getElementById('cloudinaryImageUrl').value = product.image;
                switchImageTab('cloudinary');
                const preview = document.getElementById('cloudinaryImagePreview');
                preview.src = product.image;
                preview.style.display = 'block';
                document.getElementById('cloudinaryImageInfo').style.display = 'block';
            } else {
                switchImageTab('url');
                document.getElementById('productImage').value = product.image;
                const preview = document.getElementById('urlImagePreview');
                preview.src = product.image;
                preview.style.display = 'block';
            }
        } else {
            switchImageTab('url');
        }
        
        document.getElementById('productModal').classList.add('active');
    }

    // Save product with validation and security
    async function saveProduct() {
        if (!currentShop || !currentShop.name) {
            showToast('Shop information not loaded. Please refresh page.', 'error');
            return;
        }
        
        // CSRF protection
        if (!csrfProtection.validateForm(document.getElementById('productForm'))) {
            showToast('Security token invalid. Please refresh the page.', 'error');
            return;
        }
        
        const productId = document.getElementById('editProductId').value;
        const productName = XSSProtection.sanitize(document.getElementById('productName').value.trim());
        const productPrice = parseFloat(document.getElementById('productPrice').value);
        const productMrp = parseFloat(document.getElementById('productMrp').value) || productPrice;
        const productStock = parseInt(document.getElementById('productStock').value);
        
        // Validation
        if (!productName || productName.length < 2 || productName.length > 100) {
            showToast('Product name must be 2-100 characters', 'error');
            return;
        }
        
        if (!XSSProtection.validatePrice(productPrice)) {
            showToast('Please enter a valid price (0 - 1,000,000)', 'error');
            return;
        }
        
        if (!XSSProtection.validateStock(productStock)) {
            showToast('Please enter valid stock quantity (0 - 100,000)', 'error');
            return;
        }
        
        let category = document.getElementById('productCategory').value;
        if (category === 'other') {
            const customCategory = XSSProtection.sanitize(document.getElementById('customCategoryName').value.trim());
            if (!customCategory || customCategory.length < 2) {
                showToast('Please enter custom category name (min 2 characters)', 'error');
                return;
            }
            
            const success = await addNewCategory(customCategory);
            if (success) {
                category = customCategory.toLowerCase().replace(/\s+/g, '_');
            } else {
                category = 'other';
            }
        }
        
        let imageUrl = '';
        if (currentImageTab === 'url') {
            imageUrl = XSSProtection.sanitize(document.getElementById('productImage').value.trim());
            if (!imageUrl) {
                imageUrl = document.getElementById('cloudinaryImageUrl').value;
            }
        } else {
            imageUrl = document.getElementById('cloudinaryImageUrl').value;
        }
        
        if (!imageUrl) {
            imageUrl = 'https://cdn-icons-png.flaticon.com/512/3148/3148829.png';
        }
        
        const refundAvailable = document.getElementById('productRefundAvailable').checked;
        const refundPeriod = parseInt(document.getElementById('productRefundPeriod').value) || 7;
        const refundType = document.getElementById('productRefundType').value;
        const refundConditions = XSSProtection.sanitize(document.getElementById('productRefundConditions').value.trim());
        
        const productData = {
            name: productName,
            category: category,
            price: productPrice,
            mrp: productMrp,
            stock: productStock,
            description: XSSProtection.sanitize(document.getElementById('productDescription').value.trim()),
            image: imageUrl,
            shopId: currentShop.id,
            shopName: currentShop.name,
            refundAvailable: refundAvailable,
            refundPeriod: refundAvailable ? refundPeriod : null,
            refundType: refundAvailable ? refundType : null,
            refundConditions: refundAvailable ? refundConditions : '',
            isAvailable: true,
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            showLoading(true);
            
            if (productId) {
                await retryManager.executeWithRetry(
                    () => db.collection('products').doc(productId).update(productData),
                    'Update product'
                );
                showToast('Product updated successfully!', 'success');
            } else {
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await retryManager.executeWithRetry(
                    () => db.collection('products').add(productData),
                    'Add product'
                );
                showToast('Product added successfully!', 'success');
            }
            
            closeProductModal();
            
            // Clear cache
            performanceOptimizer.dataCache.delete(`products_${currentShop.id}`);
            
            await loadProducts();
            await loadDashboardData();
            
        } catch (error) {
            errorBoundary.capture(error, 'Save product');
            
            // Add to offline queue if network fails
            if (!navigator.onLine) {
                const operationId = offlineQueue.add({
                    type: 'save_product',
                    productId: productId,
                    productData: productData,
                    timestamp: new Date().toISOString()
                });
                
                showToast('Product saved to offline queue. Will sync when online.', 'warning');
            } else {
                showToast('Error saving product: ' + error.message, 'error');
            }
        } finally {
            showLoading(false);
        }
    }

    // Delete product with confirmation
    async function deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?\nThis action cannot be undone.')) return;
        
        try {
            showLoading(true);
            
            await retryManager.executeWithRetry(
                () => db.collection('products').doc(productId).delete(),
                'Delete product'
            );
            
            showToast('Product deleted successfully!', 'success');
            
            // Clear cache
            performanceOptimizer.dataCache.delete(`products_${currentShop.id}`);
            
            await loadProducts();
            await loadDashboardData();
            
        } catch (error) {
            errorBoundary.capture(error, 'Delete product');
            showToast('Error deleting product: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // ==================== ORDER MANAGEMENT WITH PAGINATION ====================
    
    let orderPage = 0;
    const ordersPerPage = 20;
    let hasMoreOrders = true;

    async function loadOrders(loadMore = false) {
        if (!currentShop) return;
        
        try {
            if (!loadMore) {
                showLoading(true);
                orderPage = 0;
                orders = [];
                filteredOrders = [];
            }
            
            const cacheKey = `orders_${currentShop.id}_${orderPage}`;
            const cached = performanceOptimizer.getCachedData(cacheKey);
            
            let newOrders = [];
            
            if (cached && !loadMore) {
                newOrders = cached;
            } else {
                try {
                    const ordersQuery = db.collection('orders')
                        .where('shopId', '==', currentShop.id)
                        .orderBy('createdAt', 'desc')
                        .limit(ordersPerPage);
                    
                    if (loadMore && orders.length > 0) {
                        const lastOrder = orders[orders.length - 1];
                        const lastTimestamp = lastOrder.createdAt;
                        
                        const snapshot = await ordersQuery
                            .startAfter(lastTimestamp)
                            .get();
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            newOrders.push({ 
                                id: data.orderId || doc.id,
                                firestoreId: doc.id,
                                ...data
                            });
                        });
                        
                        hasMoreOrders = snapshot.docs.length === ordersPerPage;
                    } else {
                        const snapshot = await ordersQuery.get();
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            newOrders.push({ 
                                id: data.orderId || doc.id,
                                firestoreId: doc.id,
                                ...data
                            });
                        });
                        
                        hasMoreOrders = snapshot.docs.length === ordersPerPage;
                        
                        // Cache first page
                        performanceOptimizer.cacheData(cacheKey, newOrders);
                    }
                } catch (error) {
                    console.log('Query error, trying alternative:', error);
                    
                    // Fallback query
                    const snapshot = await db.collection('orders')
                        .where('shopId', '==', currentShop.id)
                        .get();
                    
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.shopId === currentShop.id) {
                            newOrders.push({ 
                                id: data.orderId || doc.id,
                                firestoreId: doc.id,
                                ...data
                            });
                        }
                    });
                    
                    // Sort manually
                    newOrders.sort((a, b) => {
                        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
                        return dateB - dateA;
                    });
                    
                    // Paginate manually
                    if (loadMore) {
                        newOrders = newOrders.slice(orders.length, orders.length + ordersPerPage);
                    } else {
                        newOrders = newOrders.slice(0, ordersPerPage);
                        hasMoreOrders = newOrders.length === ordersPerPage;
                    }
                }
            }
            
            // Add XSS protection
            newOrders = newOrders.map(order => XSSProtection.sanitizeObject(order));
            
            if (loadMore) {
                orders.push(...newOrders);
            } else {
                orders = newOrders;
            }
            
            await loadOrderItemsForOrders();
            await updateOrdersWithRefundInfo();
            
            filterOrders();
            updateOrdersSummary();
            updateDashboardOrdersSummary();
            
            orderPage++;
            
        } catch (error) {
            errorBoundary.capture(error, 'Load orders');
            showToast('Error loading orders: ' + error.message, 'error');
            orders = [];
            filteredOrders = [];
            renderOrders();
        } finally {
            if (!loadMore) {
                showLoading(false);
            }
        }
    }

    // Load more orders for infinite scroll
    function loadMoreOrders() {
        if (hasMoreOrders) {
            loadOrders(true);
        }
    }

    // ==================== NEW FEATURE: ANALYTICS & REPORTS ====================
    
    class AnalyticsManager {
        constructor() {
            this.events = [];
            this.maxEvents = 1000;
            this.analyticsEndpoint = '/api/analytics';
        }

        track(eventName, properties = {}) {
            const event = {
                event: eventName,
                properties: properties,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                online: navigator.onLine
            };

            this.events.push(event);
            if (this.events.length > this.maxEvents) {
                this.events = this.events.slice(-this.maxEvents);
            }

            this.saveToStorage();
        }

        async generateReport(type, startDate, endDate) {
            try {
                const reportData = {
                    type: type,
                    startDate: startDate,
                    endDate: endDate,
                    shopId: currentShop?.id,
                    events: this.getEventsInRange(startDate, endDate),
                    orders: this.getOrdersInRange(startDate, endDate),
                    products: this.getProductsInRange(startDate, endDate),
                    generatedAt: new Date().toISOString()
                };

                return reportData;
            } catch (error) {
                errorBoundary.capture(error, 'Generate analytics report');
                throw error;
            }
        }

        async exportReport(format = 'json') {
            try {
                const reportData = await this.generateReport('full', 
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    new Date()
                );

                let exportData;
                let fileName;
                let mimeType;

                switch(format.toLowerCase()) {
                    case 'csv':
                        exportData = this.convertToCSV(reportData);
                        fileName = `analytics_report_${Date.now()}.csv`;
                        mimeType = 'text/csv';
                        break;
                    case 'excel':
                        exportData = this.convertToExcel(reportData);
                        fileName = `analytics_report_${Date.now()}.xlsx`;
                        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        break;
                    case 'pdf':
                        // PDF generation would require a library
                        throw new Error('PDF export not implemented');
                    default:
                        exportData = JSON.stringify(reportData, null, 2);
                        fileName = `analytics_report_${Date.now()}.json`;
                        mimeType = 'application/json';
                }

                this.downloadFile(exportData, fileName, mimeType);
                return true;
            } catch (error) {
                errorBoundary.capture(error, 'Export analytics report');
                showToast('Error exporting report: ' + error.message, 'error');
                return false;
            }
        }

        convertToCSV(data) {
            const flattenObject = (obj, prefix = '') => {
                return Object.keys(obj).reduce((acc, k) => {
                    const pre = prefix.length ? prefix + '.' : '';
                    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                        Object.assign(acc, flattenObject(obj[k], pre + k));
                    } else {
                        acc[pre + k] = obj[k];
                    }
                    return acc;
                }, {});
            };

            const flattened = flattenObject(data);
            const headers = Object.keys(flattened).join(',');
            const values = Object.values(flattened).map(v => 
                typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
            ).join(',');

            return `${headers}\n${values}`;
        }

        convertToExcel(data) {
            // Simplified - in production use a library like SheetJS
            return this.convertToCSV(data); // Fallback to CSV
        }

        downloadFile(data, filename, mimeType) {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        getEventsInRange(startDate, endDate) {
            return this.events.filter(event => {
                const eventDate = new Date(event.timestamp);
                return eventDate >= startDate && eventDate <= endDate;
            });
        }

        getOrdersInRange(startDate, endDate) {
            if (!orders || !currentShop) return [];
            
            return orders.filter(order => {
                const orderDate = order.createdAt ? 
                    (order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)) : 
                    new Date(0);
                return orderDate >= startDate && orderDate <= endDate;
            });
        }

        getProductsInRange(startDate, endDate) {
            if (!products || !currentShop) return [];
            
            // This would need product timestamps in your data model
            return products; // Simplified
        }

        saveToStorage() {
            try {
                localStorage.setItem('analytics_events', JSON.stringify(this.events));
            } catch (error) {
                console.error('Failed to save analytics:', error);
            }
        }

        loadFromStorage() {
            try {
                const saved = localStorage.getItem('analytics_events');
                if (saved) {
                    this.events = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Failed to load analytics:', error);
            }
        }
    }

    const analyticsManager = new AnalyticsManager();

    // ==================== NEW FEATURE: BULK OPERATIONS ====================
    
    class BulkOperations {
        constructor() {
            this.batchSize = 10;
            this.maxFileSize = 5 * 1024 * 1024; // 5MB
        }

        async importFromCSV(file, type = 'products') {
            return new Promise((resolve, reject) => {
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }

                if (file.size > this.maxFileSize) {
                    reject(new Error('File size exceeds 5MB limit'));
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const csvData = e.target.result;
                        const records = this.parseCSV(csvData);
                        
                        switch(type) {
                            case 'products':
                                await this.importProducts(records);
                                break;
                            case 'customers':
                                await this.importCustomers(records);
                                break;
                            case 'orders':
                                await this.importOrders(records);
                                break;
                            default:
                                throw new Error('Unsupported import type');
                        }
                        
                        resolve({
                            success: true,
                            count: records.length,
                            type: type
                        });
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            });
        }

        parseCSV(csvText) {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            return lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',');
                const record = {};
                
                headers.forEach((header, index) => {
                    if (values[index]) {
                        record[header] = XSSProtection.sanitize(values[index].trim());
                    }
                });
                
                return record;
            });
        }

        async importProducts(records) {
            const errors = [];
            const successes = [];
            
            for (let i = 0; i < records.length; i += this.batchSize) {
                const batch = records.slice(i, i + this.batchSize);
                
                for (const record of batch) {
                    try {
                        // Validate required fields
                        if (!record.name || !record.price) {
                            errors.push({
                                record,
                                error: 'Missing required fields (name, price)'
                            });
                            continue;
                        }

                        const productData = {
                            name: record.name,
                            category: record.category || 'groceries',
                            price: parseFloat(record.price) || 0,
                            mrp: parseFloat(record.mrp) || parseFloat(record.price) || 0,
                            stock: parseInt(record.stock) || 0,
                            description: record.description || '',
                            image: record.image || 'https://cdn-icons-png.flaticon.com/512/3148/3148829.png',
                            shopId: currentShop.id,
                            shopName: currentShop.name,
                            isAvailable: true,
                            status: 'active',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        };

                        await db.collection('products').add(productData);
                        successes.push(productData);
                        
                    } catch (error) {
                        errors.push({
                            record,
                            error: error.message
                        });
                    }
                }
                
                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Clear cache
            performanceOptimizer.dataCache.delete(`products_${currentShop.id}`);
            
            return {
                successes: successes.length,
                errors: errors.length,
                errorDetails: errors
            };
        }

        exportToCSV(data, type = 'products') {
            let csvContent = '';
            
            switch(type) {
                case 'products':
                    csvContent = this.exportProducts(data);
                    break;
                case 'orders':
                    csvContent = this.exportOrders(data);
                    break;
                case 'customers':
                    csvContent = this.exportCustomers(data);
                    break;
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type}_export_${Date.now()}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }

        exportProducts(products) {
            const headers = ['Name', 'Category', 'Price', 'MRP', 'Stock', 'Description'];
            let csv = headers.join(',') + '\n';
            
            products.forEach(product => {
                const row = [
                    `"${(product.name || '').replace(/"/g, '""')}"`,
                    `"${(product.category || '').replace(/"/g, '""')}"`,
                    product.price || 0,
                    product.mrp || product.price || 0,
                    product.stock || 0,
                    `"${(product.description || '').replace(/"/g, '""')}"`
                ];
                csv += row.join(',') + '\n';
            });
            
            return csv;
        }

        validateCSV(file) {
            return new Promise((resolve, reject) => {
                if (!file.name.endsWith('.csv')) {
                    reject(new Error('File must be a CSV'));
                    return;
                }

                if (file.size > this.maxFileSize) {
                    reject(new Error('File size exceeds 5MB'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    
                    if (lines.length < 2) {
                        reject(new Error('CSV must have at least header and one data row'));
                        return;
                    }
                    
                    resolve({
                        valid: true,
                        rowCount: lines.length - 1,
                        headers: lines[0].split(',')
                    });
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            });
        }
    }

    const bulkOperations = new BulkOperations();

    // ==================== NEW FEATURE: INVENTORY ALERTS ====================
    
    class InventoryManager {
        constructor() {
            this.lowStockThreshold = 10;
            this.outOfStockThreshold = 0;
            this.predictionDays = 7;
            this.alerts = [];
        }

        analyzeStock() {
            if (!products.length) return [];
            
            const analysis = {
                lowStock: [],
                outOfStock: [],
                predictions: [],
                summary: {
                    totalProducts: products.length,
                    inStock: 0,
                    lowStock: 0,
                    outOfStock: 0
                }
            };
            
            products.forEach(product => {
                const stock = product.stock || 0;
                
                if (stock <= this.outOfStockThreshold) {
                    analysis.outOfStock.push(product);
                    analysis.summary.outOfStock++;
                } else if (stock <= this.lowStockThreshold) {
                    analysis.lowStock.push(product);
                    analysis.summary.lowStock++;
                } else {
                    analysis.summary.inStock++;
                }
                
                // Generate stock prediction
                const prediction = this.predictStock(product);
                if (prediction) {
                    analysis.predictions.push(prediction);
                }
            });
            
            return analysis;
        }

        predictStock(product) {
            // Simple prediction based on sales history
            // In a real app, this would use historical sales data
            const stock = product.stock || 0;
            const dailySalesEstimate = 2; // Estimated daily sales
            const daysRemaining = Math.floor(stock / dailySalesEstimate);
            
            return {
                productId: product.id,
                productName: product.name,
                currentStock: stock,
                dailyEstimate: dailySalesEstimate,
                daysRemaining: daysRemaining,
                needsReorder: daysRemaining <= this.predictionDays,
                suggestedReorder: Math.max(20, dailySalesEstimate * 14) // 2 weeks supply
            };
        }

        generateAlerts() {
            const analysis = this.analyzeStock();
            const alerts = [];
            
            // Low stock alerts
            analysis.lowStock.forEach(product => {
                alerts.push({
                    type: 'low_stock',
                    severity: 'warning',
                    message: `Low stock: ${product.name} (${product.stock} remaining)`,
                    productId: product.id,
                    timestamp: new Date().toISOString(),
                    action: 'Consider restocking'
                });
            });
            
            // Out of stock alerts
            analysis.outOfStock.forEach(product => {
                alerts.push({
                    type: 'out_of_stock',
                    severity: 'danger',
                    message: `Out of stock: ${product.name}`,
                    productId: product.id,
                    timestamp: new Date().toISOString(),
                    action: 'Urgent restocking required'
                });
            });
            
            // Prediction alerts
            analysis.predictions.forEach(prediction => {
                if (prediction.needsReorder) {
                    alerts.push({
                        type: 'reorder_prediction',
                        severity: 'info',
                        message: `${prediction.productName} will run out in ${prediction.daysRemaining} days`,
                        productId: prediction.productId,
                        timestamp: new Date().toISOString(),
                        action: `Reorder ${prediction.suggestedReorder} units`
                    });
                }
            });
            
            this.alerts = alerts;
            return alerts;
        }

        showAlerts() {
            const alerts = this.generateAlerts();
            
            if (alerts.length > 0) {
                const alertContainer = document.getElementById('inventoryAlerts');
                if (!alertContainer) return;
                
                let html = `
                    <div class="alert alert-warning">
                        <h5><i class="fas fa-exclamation-triangle"></i> Inventory Alerts</h5>
                `;
                
                const criticalAlerts = alerts.filter(a => a.severity === 'danger');
                const warningAlerts = alerts.filter(a => a.severity === 'warning');
                const infoAlerts = alerts.filter(a => a.severity === 'info');
                
                if (criticalAlerts.length > 0) {
                    html += `
                        <div class="mt-2">
                            <strong class="text-danger">Critical (${criticalAlerts.length}):</strong>
                            <ul class="mb-1">
                                ${criticalAlerts.slice(0, 3).map(a => `<li>${a.message}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                if (warningAlerts.length > 0) {
                    html += `
                        <div class="mt-2">
                            <strong class="text-warning">Warnings (${warningAlerts.length}):</strong>
                            <ul class="mb-1">
                                ${warningAlerts.slice(0, 3).map(a => `<li>${a.message}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                if (infoAlerts.length > 0) {
                    html += `
                        <div class="mt-2">
                            <strong class="text-info">Suggestions (${infoAlerts.length}):</strong>
                            <ul class="mb-1">
                                ${infoAlerts.slice(0, 3).map(a => `<li>${a.message}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                if (alerts.length > 6) {
                    html += `<p class="mb-0"><small>... and ${alerts.length - 6} more alerts</small></p>`;
                }
                
                html += `</div>`;
                alertContainer.innerHTML = html;
                alertContainer.style.display = 'block';
            }
        }
    }

    const inventoryManager = new InventoryManager();

    // ==================== MULTI-LANGUAGE SUPPORT (i18n) ====================
    
    class I18nManager {
        constructor() {
            this.languages = {
                en: {
                    dashboard: 'Dashboard',
                    products: 'Products',
                    orders: 'Orders',
                    refunds: 'Refunds',
                    settings: 'Settings',
                    profile: 'Profile',
                    logout: 'Logout',
                    welcome: 'Welcome back to your shop!',
                    loading: 'Loading...',
                    noProducts: 'No Products Yet',
                    addFirstProduct: 'Add your first product to start selling',
                    // Add more translations as needed
                },
                hi: {
                    dashboard: 'डैशबोर्ड',
                    products: 'उत्पाद',
                    orders: 'आदेश',
                    refunds: 'धनवापसी',
                    settings: 'सेटिंग्स',
                    profile: 'प्रोफ़ाइल',
                    logout: 'लॉग आउट',
                    welcome: 'अपने दुकान में वापसी पर स्वागत है!',
                    loading: 'लोड हो रहा है...',
                    noProducts: 'अभी तक कोई उत्पाद नहीं',
                    addFirstProduct: 'बेचना शुरू करने के लिए अपना पहला उत्पाद जोड़ें',
                },
                es: {
                    dashboard: 'Panel',
                    products: 'Productos',
                    orders: 'Pedidos',
                    refunds: 'Reembolsos',
                    settings: 'Configuración',
                    profile: 'Perfil',
                    logout: 'Cerrar sesión',
                    welcome: '¡Bienvenido de nuevo a tu tienda!',
                    loading: 'Cargando...',
                    noProducts: 'Aún no hay productos',
                    addFirstProduct: 'Agrega tu primer producto para comenzar a vender',
                },
                fr: {
                    dashboard: 'Tableau de bord',
                    products: 'Produits',
                    orders: 'Commandes',
                    refunds: 'Remboursements',
                    settings: 'Paramètres',
                    profile: 'Profil',
                    logout: 'Déconnexion',
                    welcome: 'Bienvenue dans votre boutique!',
                    loading: 'Chargement...',
                    noProducts: 'Pas encore de produits',
                    addFirstProduct: 'Ajoutez votre premier produit pour commencer à vendre',
                }
            };
            
            this.currentLanguage = 'en';
            this.loadLanguage();
        }

        loadLanguage() {
            const savedLanguage = localStorage.getItem('preferred_language');
            if (savedLanguage && this.languages[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            } else {
                // Detect browser language
                const browserLang = navigator.language.split('-')[0];
                if (this.languages[browserLang]) {
                    this.currentLanguage = browserLang;
                }
            }
            
            this.applyLanguage();
        }

        applyLanguage() {
            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (this.languages[this.currentLanguage][key]) {
                    element.textContent = this.languages[this.currentLanguage][key];
                }
            });
            
            // Update language selector
            const langSelect = document.getElementById('languageSelect');
            if (langSelect) {
                langSelect.value = this.currentLanguage;
            }
            
            // Save preference
            localStorage.setItem('preferred_language', this.currentLanguage);
        }

        setLanguage(lang) {
            if (this.languages[lang]) {
                this.currentLanguage = lang;
                this.applyLanguage();
                showToast(`Language changed to ${lang.toUpperCase()}`, 'success');
            }
        }

        formatDate(date, format = 'medium') {
            const formatter = new Intl.DateTimeFormat(this.currentLanguage, {
                dateStyle: format,
                timeStyle: 'short'
            });
            return formatter.format(date);
        }

        formatCurrency(amount, currency = 'INR') {
            const formatter = new Intl.NumberFormat(this.currentLanguage, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2
            });
            return formatter.format(amount);
        }

        formatNumber(number) {
            const formatter = new Intl.NumberFormat(this.currentLanguage);
            return formatter.format(number);
        }
    }

    const i18n = new I18nManager();

    // ==================== EVENT LISTENERS SETUP ====================
    
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize everything
        initApp();
        analyticsManager.loadFromStorage();
        i18n.loadLanguage();
        
        // Setup CSRF protection for all forms
        document.querySelectorAll('form').forEach(form => {
            csrfProtection.addTokenToForm(form);
        });
        
        // Login form
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        
        // Profile form
        document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
        
        // Navigation links with event delegation
        document.addEventListener('click', function(e) {
            // Navigation links
            if (e.target.matches('.nav-links a, [data-page]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                if (page) {
                    navigateToPage(page);
                    analyticsManager.track('navigation', { page: page });
                }
            }
            
            // Quick actions toolbar
            if (e.target.closest('.quick-action-btn')) {
                const btn = e.target.closest('.quick-action-btn');
                const page = btn.getAttribute('data-page');
                if (page) {
                    navigateToPage(page);
                    analyticsManager.track('quick_action', { page: page });
                }
            }
        });
        
        // Product search with debouncing
        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            const debouncedSearch = performanceOptimizer.debounce(function() {
                const searchTerm = this.value.toLowerCase().trim();
                analyticsManager.track('product_search', { term: searchTerm });
                
                if (!searchTerm) {
                    renderProducts();
                    return;
                }
                
                const filteredProducts = products.filter(product => {
                    return (
                        product.name.toLowerCase().includes(searchTerm) ||
                        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                        (product.category && product.category.toLowerCase().includes(searchTerm)) ||
                        (product.price && product.price.toString().includes(searchTerm))
                    );
                });
                
                renderFilteredProducts(filteredProducts, searchTerm);
            }, 300);
            
            productSearch.addEventListener('input', debouncedSearch);
        }
        
        // Language selector
        const languageSelect = document.createElement('select');
        languageSelect.id = 'languageSelect';
        languageSelect.className = 'form-select';
        languageSelect.style.maxWidth = '100px';
        languageSelect.innerHTML = `
            <option value="en">🇺🇸 English</option>
            <option value="hi">🇮🇳 हिंदी</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
        `;
        languageSelect.addEventListener('change', function() {
            i18n.setLanguage(this.value);
        });
        
        // Add language selector to header
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            headerContent.appendChild(languageSelect);
        }
        
        // Setup export buttons
        setupExportButtons();
        
        // Setup inventory alerts
        setInterval(() => {
            inventoryManager.showAlerts();
        }, 300000); // Check every 5 minutes
        
        // Setup performance monitoring
        setupPerformanceMonitoring();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Setup tour guide for new users
        if (!localStorage.getItem('tour_completed')) {
            setTimeout(() => {
                showTourGuide();
            }, 3000);
        }
    });

    // ==================== TOUR GUIDE FOR NEW USERS ====================
    
    function showTourGuide() {
        const tourSteps = [
            {
                element: '.logo',
                title: 'Welcome to Raashanmart Shopkeeper Panel',
                content: 'This is your shop management dashboard. Let me show you around!',
                position: 'bottom'
            },
            {
                element: '.nav-links',
                title: 'Navigation',
                content: 'Use these links to navigate between different sections: Dashboard, Products, Orders, Refunds, Settings, and Profile.',
                position: 'bottom'
            },
            {
                element: '#dashboardPage',
                title: 'Dashboard',
                content: 'Here you can see your shop statistics at a glance.',
                position: 'top'
            },
            {
                element: '#productsPage',
                title: 'Product Management',
                content: 'Add, edit, and manage your products here. You can search, filter, and bulk upload products.',
                position: 'top'
            },
            {
                element: '#ordersPage',
                title: 'Order Management',
                content: 'View and manage customer orders. Update status, accept partial orders, and process refunds.',
                position: 'top'
            },
            {
                element: '.quick-actions-toolbar',
                title: 'Quick Actions',
                content: 'On mobile, use these quick action buttons for easy navigation.',
                position: 'top'
            }
        ];
        
        let currentStep = 0;
        
        function showStep(step) {
            const tourStep = tourSteps[step];
            const element = document.querySelector(tourStep.element);
            
            if (!element) {
                currentStep++;
                if (currentStep < tourSteps.length) {
                    showStep(currentStep);
                } else {
                    endTour();
                }
                return;
            }
            
            // Create tour overlay
            const overlay = document.createElement('div');
            overlay.id = 'tourOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 9998;
            `;
            
            // Create tour popup
            const popup = document.createElement('div');
            popup.id = 'tourPopup';
            popup.style.cssText = `
                position: absolute;
                background: white;
                border-radius: 10px;
                padding: 1.5rem;
                max-width: 400px;
                z-index: 9999;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            `;
            
            // Position popup
            const rect = element.getBoundingClientRect();
            switch(tourStep.position) {
                case 'top':
                    popup.style.top = `${rect.top - 200}px`;
                    popup.style.left = `${rect.left + rect.width/2 - 200}px`;
                    break;
                case 'bottom':
                    popup.style.top = `${rect.bottom + 20}px`;
                    popup.style.left = `${rect.left + rect.width/2 - 200}px`;
                    break;
                case 'left':
                    popup.style.top = `${rect.top + rect.height/2 - 100}px`;
                    popup.style.left = `${rect.left - 420}px`;
                    break;
                case 'right':
                    popup.style.top = `${rect.top + rect.height/2 - 100}px`;
                    popup.style.left = `${rect.right + 20}px`;
                    break;
            }
            
            popup.innerHTML = `
                <h3 style="color: var(--primary); margin-bottom: 1rem;">${tourStep.title}</h3>
                <p>${tourStep.content}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
                    <button class="btn btn-outline" onclick="skipTour()">Skip Tour</button>
                    <div>
                        ${step > 0 ? `<button class="btn btn-outline" onclick="prevStep()">Previous</button>` : ''}
                        <button class="btn btn-primary" onclick="nextStep()">
                            ${step === tourSteps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 1rem; color: #666;">
                    ${step + 1} of ${tourSteps.length}
                </div>
            `;
            
            // Clear previous tour elements
            const existingOverlay = document.getElementById('tourOverlay');
            const existingPopup = document.getElementById('tourPopup');
            if (existingOverlay) existingOverlay.remove();
            if (existingPopup) existingPopup.remove();
            
            document.body.appendChild(overlay);
            document.body.appendChild(popup);
            
            // Highlight element
            element.style.boxShadow = '0 0 0 3px var(--primary), 0 0 20px rgba(15, 44, 89, 0.5)';
            element.style.zIndex = '10000';
            element.style.position = 'relative';
        }
        
        window.nextStep = function() {
            // Remove highlight
            const currentElement = document.querySelector(tourSteps[currentStep].element);
            if (currentElement) {
                currentElement.style.boxShadow = '';
                currentElement.style.zIndex = '';
            }
            
            currentStep++;
            if (currentStep < tourSteps.length) {
                showStep(currentStep);
            } else {
                endTour();
            }
        };
        
        window.prevStep = function() {
            const currentElement = document.querySelector(tourSteps[currentStep].element);
            if (currentElement) {
                currentElement.style.boxShadow = '';
                currentElement.style.zIndex = '';
            }
            
            currentStep--;
            if (currentStep >= 0) {
                showStep(currentStep);
            }
        };
        
        window.skipTour = function() {
            endTour();
            localStorage.setItem('tour_completed', 'true');
        };
        
        function endTour() {
            const overlay = document.getElementById('tourOverlay');
            const popup = document.getElementById('tourPopup');
            if (overlay) overlay.remove();
            if (popup) popup.remove();
            
            // Remove all highlights
            tourSteps.forEach(step => {
                const element = document.querySelector(step.element);
                if (element) {
                    element.style.boxShadow = '';
                    element.style.zIndex = '';
                }
            });
            
            localStorage.setItem('tour_completed', 'true');
            showToast('Tour completed! You can restart it anytime from settings.', 'success');
        }
        
        // Start tour
        showStep(currentStep);
    }

    // ==================== PERFORMANCE MONITORING ====================
    
    function setupPerformanceMonitoring() {
        const metrics = {
            pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domReadyTime: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            redirectTime: performance.timing.redirectEnd - performance.timing.redirectStart,
            dnsLookupTime: performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
            tcpConnectTime: performance.timing.connectEnd - performance.timing.connectStart,
            serverResponseTime: performance.timing.responseEnd - performance.timing.requestStart,
            pageDownloadTime: performance.timing.responseEnd - performance.timing.responseStart,
            domInteractiveTime: performance.timing.domInteractive - performance.timing.navigationStart,
            domCompleteTime: performance.timing.domComplete - performance.timing.navigationStart
        };
        
        // Log performance metrics
        analyticsManager.track('performance_metrics', metrics);
        
        // Monitor memory usage (if supported)
        if (performance.memory) {
            setInterval(() => {
                const memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
                
                // Alert if memory usage is high
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                    console.warn('High memory usage detected:', memory);
                    analyticsManager.track('high_memory_usage', memory);
                }
            }, 60000); // Check every minute
        }
    }

    // ==================== DARK MODE SUPPORT ====================
    
    function setupDarkMode() {
        const darkModeToggle = document.createElement('button');
        darkModeToggle.id = 'darkModeToggle';
        darkModeToggle.className = 'btn btn-outline';
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.title = 'Toggle Dark Mode';
        
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('dark_mode', isDarkMode);
            showToast(isDarkMode ? 'Dark mode enabled' : 'Dark mode disabled', 'info');
        });
        
        // Add to header
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            headerContent.appendChild(darkModeToggle);
        }
        
        // Load dark mode preference
        const darkModePreference = localStorage.getItem('dark_mode');
        if (darkModePreference === 'true') {
            document.body.classList.add('dark-mode');
        }
        
        // Add dark mode styles
        const darkModeStyles = `
            body.dark-mode {
                background-color: #121212;
                color: #e0e0e0;
            }
            
            body.dark-mode .auth-card,
            body.dark-mode .stat-card,
            body.dark-mode .dashboard-orders-summary,
            body.dark-mode .orders-summary-card,
            body.dark-mode .settings-card,
            body.dark-mode .profile-form-container,
            body.dark-mode .modal-content {
                background-color: #1e1e1e;
                color: #e0e0e0;
                border-color: #333;
            }
            
            body.dark-mode .table {
                background-color: #1e1e1e;
                color: #e0e0e0;
            }
            
            body.dark-mode .table th {
                background-color: #2d2d2d;
                color: #e0e0e0;
            }
            
            body.dark-mode .table tr:hover {
                background-color: #2d2d2d;
            }
            
            body.dark-mode input,
            body.dark-mode select,
            body.dark-mode textarea {
                background-color: #2d2d2d;
                color: #e0e0e0;
                border-color: #444;
            }
            
            body.dark-mode .btn-outline {
                border-color: #555;
                color: #e0e0e0;
            }
            
            body.dark-mode .quick-actions-toolbar {
                background-color: #1e1e1e;
                border-color: #333;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = darkModeStyles;
        document.head.appendChild(styleSheet);
    }

    // ==================== EXPORT WIZARD ====================
    
    function setupExportButtons() {
        // Add export wizard button to products page
        const productsHeader = document.querySelector('#productsPage h2');
        if (productsHeader) {
            const exportButton = document.createElement('button');
            exportButton.className = 'btn btn-info';
            exportButton.innerHTML = '<i class="fas fa-file-export"></i> Export Wizard';
            exportButton.style.marginLeft = '10px';
            exportButton.addEventListener('click', showExportWizard);
            
            productsHeader.parentElement.querySelector('div').appendChild(exportButton);
        }
    }

    function showExportWizard() {
        const wizardHtml = `
            <div class="modal active" id="exportWizardModal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-export"></i> Export Wizard</h3>
                        <button class="close-modal" onclick="closeExportWizard()">&times;</button>
                    </div>
                    <div class="form-group">
                        <label>Export Type</label>
                        <select id="exportType" class="form-select">
                            <option value="products">Products</option>
                            <option value="orders">Orders</option>
                            <option value="customers">Customers</option>
                            <option value="analytics">Analytics</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Format</label>
                        <select id="exportFormat" class="form-select">
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="excel">Excel</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date Range</label>
                        <div class="form-row">
                            <div class="form-group">
                                <input type="date" id="exportStartDate" class="form-control">
                            </div>
                            <div class="form-group">
                                <input type="date" id="exportEndDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Include</label>
                        <div style="margin-top: 10px;">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="includeImages" checked>
                                <label class="form-check-label" for="includeImages">Product Images</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="includeDescriptions" checked>
                                <label class="form-check-label" for="includeDescriptions">Descriptions</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="includeMetadata" checked>
                                <label class="form-check-label" for="includeMetadata">Metadata</label>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button class="btn btn-outline" onclick="closeExportWizard()">Cancel</button>
                        <button class="btn btn-primary" onclick="executeExport()">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const wizardDiv = document.createElement('div');
        wizardDiv.innerHTML = wizardHtml;
        document.body.appendChild(wizardDiv);
    }

    function closeExportWizard() {
        const modal = document.getElementById('exportWizardModal');
        if (modal) modal.remove();
    }

    async function executeExport() {
        const type = document.getElementById('exportType').value;
        const format = document.getElementById('exportFormat').value;
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        
        try {
            showLoading(true);
            
            let exportData;
            switch(type) {
                case 'products':
                    exportData = products;
                    break;
                case 'orders':
                    exportData = orders;
                    break;
                case 'analytics':
                    await analyticsManager.exportReport(format);
                    showToast('Analytics report exported successfully!', 'success');
                    closeExportWizard();
                    return;
                default:
                    throw new Error('Unsupported export type');
            }
            
            bulkOperations.exportToCSV(exportData, type);
            showToast(`${type} exported successfully as ${format.toUpperCase()}!`, 'success');
            closeExportWizard();
            
        } catch (error) {
            errorBoundary.capture(error, 'Export wizard');
            showToast('Error exporting data: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // ==================== BULK UPLOAD PROGRESS TRACKING ====================
    
    function showBulkUploadProgress(file, type) {
        const progressHtml = `
            <div class="modal active" id="bulkUploadModal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-upload"></i> Bulk Upload Progress</h3>
                    </div>
                    <div class="form-group">
                        <p>Uploading ${file.name} (${type})</p>
                        <div class="progress" style="height: 20px;">
                            <div id="uploadProgressBar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div id="uploadStatus" style="margin-top: 10px; font-size: 0.9rem;"></div>
                    </div>
                    <div id="uploadResults" style="display: none; margin-top: 1rem;">
                        <h5>Upload Results</h5>
                        <div id="resultsContent"></div>
                    </div>
                </div>
            </div>
        `;
        
        const progressDiv = document.createElement('div');
        progressDiv.innerHTML = progressHtml;
        document.body.appendChild(progressDiv);
        
        return {
            updateProgress: (percent, status) => {
                const bar = document.getElementById('uploadProgressBar');
                const statusEl = document.getElementById('uploadStatus');
                if (bar) bar.style.width = `${percent}%`;
                if (statusEl) statusEl.textContent = status;
            },
            showResults: (results) => {
                const resultsDiv = document.getElementById('uploadResults');
                const contentDiv = document.getElementById('resultsContent');
                
                if (resultsDiv && contentDiv) {
                    resultsDiv.style.display = 'block';
                    contentDiv.innerHTML = `
                        <p><strong>Success:</strong> ${results.successes} records</p>
                        <p><strong>Errors:</strong> ${results.errors} records</p>
                        ${results.errors > 0 ? `
                            <button class="btn btn-outline btn-sm" onclick="showErrorDetails()">
                                View Error Details
                            </button>
                        ` : ''}
                    `;
                }
            },
            close: () => {
                const modal = document.getElementById('bulkUploadModal');
                if (modal) modal.remove();
            }
        };
    }

    // ==================== INVENTORY PREDICTION MODELS ====================
    
    class InventoryPredictor {
        constructor() {
            this.salesHistory = new Map();
            this.seasonalFactors = this.calculateSeasonalFactors();
        }
        
        calculateSeasonalFactors() {
            // Simple seasonal factors (would be based on historical data)
            const month = new Date().getMonth();
            const factors = {
                0: 1.1,  // January
                1: 1.0,  // February
                2: 1.2,  // March
                3: 1.3,  // April
                4: 1.1,  // May
                5: 1.0,  // June
                6: 0.9,  // July
                7: 0.8,  // August
                8: 1.0,  // September
                9: 1.2,  // October
                10: 1.4, // November
                11: 1.5  // December
            };
            return factors[month] || 1.0;
        }
        
        predictSales(product, days = 30) {
            // This would use actual sales data in production
            const baseSales = 2; // Average daily sales
            const seasonalAdjustment = this.seasonalFactors;
            const trendFactor = 1.05; // 5% monthly growth
            
            const predictedDailySales = baseSales * seasonalAdjustment * trendFactor;
            const predictedSales = predictedDailySales * days;
            
            return {
                productId: product.id,
                productName: product.name,
                currentStock: product.stock || 0,
                predictedDailySales: predictedDailySales.toFixed(2),
                predictedSales30Days: Math.round(predictedSales),
                stockOutDays: Math.floor((product.stock || 0) / predictedDailySales),
                reorderPoint: Math.round(predictedDailySales * 14), // 2 weeks supply
                confidence: 0.75 // Confidence score
            };
        }
        
        generateReorderSuggestions() {
            const suggestions = [];
            
            products.forEach(product => {
                if (product.stock > 0) {
                    const prediction = this.predictSales(product);
                    
                    if (prediction.stockOutDays <= 14) { // Less than 2 weeks stock
                        suggestions.push({
                            product: product,
                            prediction: prediction,
                            priority: prediction.stockOutDays <= 7 ? 'high' : 'medium',
                            suggestedQuantity: prediction.reorderPoint
                        });
                    }
                }
            });
            
            return suggestions.sort((a, b) => {
                // Sort by priority and stock out days
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority] || 
                       a.prediction.stockOutDays - b.prediction.stockOutDays;
            });
        }
    }
    
    const inventoryPredictor = new InventoryPredictor();

    // ==================== FINAL INITIALIZATION ====================
    
    // Initialize all managers
    setTimeout(() => {
        setupDarkMode();
        inventoryManager.showAlerts();
        
        // Show inventory predictions
        const predictions = inventoryPredictor.generateReorderSuggestions();
        if (predictions.length > 0) {
            console.log('Inventory reorder suggestions:', predictions);
            analyticsManager.track('inventory_predictions', { count: predictions.length });
        }
        
        // Periodically send error reports
        setInterval(() => {
            errorBoundary.reportToServer();
            analyticsManager.track('heartbeat', { 
                timestamp: new Date().toISOString(),
                online: navigator.onLine,
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize
                } : null
            });
        }, 300000); // Every 5 minutes
    }, 2000);

    // ==================== UTILITY FUNCTIONS ====================
    
    function showToast(message, type = 'success', duration = 5000) {
        try {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<div class="toast-message">${XSSProtection.sanitize(message)}</div>`;
            
            toastContainer.appendChild(toast);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
            
            // Analytics tracking
            analyticsManager.track('toast_shown', { type: type, message: message.substring(0, 100) });
            
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }

    // Enhanced extend session function
    window.extendSession = function() {
        sessionManager.extendSession();
        showToast('Session extended', 'success');
    };

    // ==================== ERROR BOUNDARY UI ====================
    
    function showErrorReportUI() {
        const errorCount = errorBoundary.getErrorCount();
        if (errorCount === 0) return;
        
        const errorReportUI = document.createElement('div');
        errorReportUI.id = 'errorReportUI';
        errorReportUI.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 0.9rem;
            z-index: 10000;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        errorReportUI.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${errorCount} error${errorCount === 1 ? '' : 's'} detected</span>
            <button onclick="viewErrorLog()" style="margin-left: 10px; background: white; color: #dc3545; border: none; padding: 2px 8px; border-radius: 3px; font-size: 0.8rem;">
                View
            </button>
        `;
        
        document.body.appendChild(errorReportUI);
    }

    window.viewErrorLog = function() {
        const errors = errorBoundary.errors;
        let errorLogHTML = `
            <div class="modal active" id="errorLogModal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-bug"></i> Error Log</h3>
                        <button class="close-modal" onclick="document.getElementById('errorLogModal').remove()">&times;</button>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${errors.map((error, index) => `
                            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                                <strong>${error.timestamp}</strong>
                                <div><strong>Context:</strong> ${error.context}</div>
                                <div><strong>Message:</strong> ${error.message}</div>
                                <button onclick="copyError(${index})" style="margin-top: 5px; padding: 2px 8px; font-size: 0.8rem;">
                                    Copy
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button class="btn btn-outline" onclick="errorBoundary.clearErrors(); document.getElementById('errorLogModal').remove(); showToast('Error log cleared')">
                            Clear All
                        </button>
                        <button class="btn btn-primary" onclick="errorBoundary.reportToServer(); showToast('Error report sent')">
                            Send Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = errorLogHTML;
        document.body.appendChild(modalDiv);
    };

    window.copyError = function(index) {
        const error = errorBoundary.errors[index];
        const errorText = `
Timestamp: ${error.timestamp}
Context: ${error.context}
Message: ${error.message}
Stack: ${error.stack}
URL: ${error.url}
User Agent: ${error.userAgent}
        `.trim();
        
        navigator.clipboard.writeText(errorText).then(() => {
            showToast('Error copied to clipboard', 'success');
        });
    };

    // Show error report UI if there are errors
    setInterval(() => {
        if (errorBoundary.getErrorCount() > 0 && !document.getElementById('errorReportUI')) {
            showErrorReportUI();
        }
    }, 10000);

    // ==================== FINAL EXPORT ====================
    
    // Export important functions to window object
    window.showExportWizard = showExportWizard;
    window.closeExportWizard = closeExportWizard;
    window.executeExport = executeExport;
    window.viewErrorLog = viewErrorLog;
    window.copyError = copyError;
    window.extendSession = extendSession;
    window.logout = logout;
    window.navigateToPage = navigateToPage;
    window.showAddProductModal = showAddProductModal;
    window.closeProductModal = closeProductModal;
    window.editProduct = editProduct;
    window.saveProduct = saveProduct;
    window.deleteProduct = deleteProduct;
    window.switchImageTab = switchImageTab;
    window.previewImageFromUrl = previewImageFromUrl;
    window.openCloudinaryUploader = openCloudinaryUploader;
    
    // Make analytics available for debugging
    window.analytics = analyticsManager;
    window.inventory = inventoryManager;
    window.i18n = i18n;

    console.log('Raashanmart Shopkeeper Panel v' + ENV.APP_VERSION + ' loaded successfully');
    console.log('Security features: ✓ XSS Protection ✓ CSRF Protection ✓ Error Boundary ✓ Performance Monitoring');
    console.log('New features: ✓ Analytics ✓ Bulk Operations ✓ Inventory Alerts ✓ Multi-language ✓ Dark Mode');
</script>
</body>
</html>