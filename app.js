// Telegram WebApp initialization
let tg = null;
let adminsData = [];
let selectedAdmin = null;
let currentFilter = 'all';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initTelegramWebApp();
    setupEventListeners();
    loadAdmins();
});

// Telegram WebApp setup
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Apply theme
        if (tg.colorScheme === 'dark') {
            document.body.classList.add('tg-theme-dark');
        }

        // Apply Telegram theme colors
        if (tg.themeParams) {
            const root = document.documentElement;
            Object.keys(tg.themeParams).forEach(key => {
                const cssKey = `--tg-theme-${key.replace(/_/g, '-')}`;
                root.style.setProperty(cssKey, tg.themeParams[key]);
            });
        }

        console.log('✅ Telegram WebApp initialized');
    } else {
        console.warn('⚠️ Telegram WebApp not available');
    }
}

// Event listeners setup
function setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setFilter(filter);
        });
    });

    // Modal backdrop clicks
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'selectionModal') {
                closeSelectionModal();
            } else if (modal.id === 'successModal') {
                closeSuccessModal();
            }
        });
    });
}

// Load admins data
async function loadAdmins() {
    showLoading(true);

    try {
        console.log('📡 Loading admins data...');

        // Try to fetch from GitHub
        const response = await fetch('https://roman9990.github.io/ddd/admins.json');
        let data;

        if (response.ok) {
            data = await response.json();
            console.log('✅ Data loaded from GitHub:', data);
        } else {
            console.warn('⚠️ GitHub fetch failed, using mock data');
            // Fallback mock data
            data = {
                admins: [
                    {
                        id: "5518423575",
                        tag: "owner",
                        role: "Владелец",
                        rating: 5.0,
                        status: "available",
                        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 0,
                        response_time: "1 мин",
                        specialization: "Все вопросы"
                    },
                    {
                        id: "123456789",
                        tag: "support_master",
                        role: "Техподдержка",
                        rating: 4.8,
                        status: "online",
                        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 245,
                        response_time: "2 мин",
                        specialization: "Технические вопросы"
                    },
                    {
                        id: "987654321",
                        tag: "helper_anna",
                        role: "Консультант",
                        rating: 4.9,
                        status: "available",
                        avatar: "https://images.unsplash.com/photo-1494790108755-2616b25082ba?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 189,
                        response_time: "1 мин",
                        specialization: "Общие вопросы"
                    },
                    {
                        id: "555666777",
                        tag: "expert_pro",
                        role: "Эксперт",
                        rating: 4.7,
                        status: "busy",
                        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 156,
                        response_time: "5 мин",
                        specialization: "Сложные вопросы"
                    }
                ],
                unavailable_admins: []
            };
        }

        adminsData = data.admins || [];
        console.log(`📊 Loaded ${adminsData.length} admins`);

        displayAdmins();
        updateFilterCounts();

    } catch (error) {
        console.error('❌ Error loading admins:', error);
        showError('Ошибка загрузки данных');
    } finally {
        showLoading(false);
    }
}

// Display admins
function displayAdmins() {
    const filteredAdmins = getFilteredAdmins();
    const container = document.getElementById('adminsList');
    const emptyState = document.getElementById('emptyState');

    console.log(`🎨 Displaying ${filteredAdmins.length} admins`);

    if (filteredAdmins.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    container.innerHTML = filteredAdmins.map((admin, index) => `
        <div class="admin-card" onclick="selectAdmin('${admin.tag}', '${admin.id}')" style="animation-delay: ${index * 0.1}s">
            <div class="admin-header">
                <div class="admin-avatar">
                    <img src="${admin.avatar}" 
                         alt="${admin.tag}" 
                         onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'">
                    <div class="admin-status ${admin.status}"></div>
                </div>
                <div class="admin-info">
                    <div class="admin-tag">${admin.tag}</div>
                    <div class="admin-role">${admin.role}</div>
                    <div class="admin-rating">
                        <span class="rating-stars">${generateStars(admin.rating)}</span>
                        <span class="rating-text">${admin.rating.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            <div class="admin-details">
                <div class="admin-stat">
                    <i class="fas fa-comments"></i>
                    <span>${admin.dialogs_count} диалогов</span>
                </div>

                <div class="admin-stat">
                    <i class="fas fa-clock"></i>
                    <span>~${admin.response_time}</span>
                </div>

                <div class="admin-stat">
                    <i class="fas fa-circle status-${admin.status}"></i>
                    <span>${getStatusText(admin.status)}</span>
                </div>

                <div class="admin-stat">
                    <i class="fas fa-star"></i>
                    <span>${admin.rating.toFixed(1)}/5.0</span>
                </div>

                <div class="admin-specialization">
                    <i class="fas fa-tags"></i>
                    ${admin.specialization}
                </div>
            </div>
        </div>
    `).join('');
}

// Filter functions
function setFilter(filter) {
    console.log(`🔍 Setting filter: ${filter}`);
    currentFilter = filter;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    displayAdmins();

    // Haptic feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
}

function getFilteredAdmins() {
    if (currentFilter === 'all') {
        return adminsData;
    }
    return adminsData.filter(admin => admin.status === currentFilter);
}

function updateFilterCounts() {
    const allCount = adminsData.length;
    const availableCount = adminsData.filter(a => a.status === 'available').length;
    const onlineCount = adminsData.filter(a => a.status === 'online').length;

    document.getElementById('count-all').textContent = allCount;
    document.getElementById('count-available').textContent = availableCount;
    document.getElementById('count-online').textContent = onlineCount;
}

// Admin selection
function selectAdmin(adminTag, adminId) {
    console.log(`👤 Selected admin: ${adminTag} (${adminId})`);

    const admin = adminsData.find(a => a.tag === adminTag);
    if (!admin) {
        console.error('❌ Admin not found:', adminTag);
        return;
    }

    selectedAdmin = admin;

    // Haptic feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }

    // Highlight selected card
    document.querySelectorAll('.admin-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Show selection modal
    showSelectionModal(admin);
}

function showSelectionModal(admin) {
    console.log('📱 Showing selection modal for:', admin.tag);

    // Fill modal data
    document.getElementById('selectedAdminAvatar').src = admin.avatar;
    document.getElementById('selectedAdminStatus').className = `admin-status ${admin.status}`;
    document.getElementById('selectedAdminTag').textContent = '@' + admin.tag;
    document.getElementById('selectedAdminRole').textContent = admin.role;
    document.getElementById('selectedAdminRating').innerHTML = generateStars(admin.rating);
    document.getElementById('selectedAdminRatingText').textContent = admin.rating.toFixed(1);
    document.getElementById('selectedAdminSpec').textContent = admin.specialization;
    document.getElementById('selectedAdminTime').textContent = admin.response_time;
    document.getElementById('selectedAdminDialogs').textContent = admin.dialogs_count;

    // Show modal
    const modal = document.getElementById('selectionModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSelectionModal() {
    console.log('❌ Closing selection modal');
    document.getElementById('selectionModal').classList.add('hidden');
    document.body.style.overflow = '';

    // Remove selection highlight
    document.querySelectorAll('.admin-card').forEach(card => {
        card.classList.remove('selected');
    });

    selectedAdmin = null;
}

function confirmSelection() {
    if (!selectedAdmin) {
        console.error('❌ No admin selected');
        return;
    }

    console.log('✅ Confirming selection:', selectedAdmin.tag);

    // Haptic feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    // Send data to bot
    sendToBot(selectedAdmin);

    // Close selection modal
    closeSelectionModal();

    // Show success modal
    showSuccessModal(selectedAdmin);
}

function sendToBot(admin) {
    console.log('📤 Sending to bot:', admin);

    const data = {
        action: 'select_admin',
        admin_id: admin.id,
        admin_tag: admin.tag,
        admin_role: admin.role,
        admin_rating: admin.rating,
        timestamp: Date.now()
    };

    if (tg) {
        tg.sendData(JSON.stringify(data));
        console.log('✅ Data sent to bot via Telegram WebApp');
    } else {
        console.warn('⚠️ Telegram WebApp not available, data not sent:', data);
        // For testing without Telegram
        alert(`Выбран администратор: @${admin.tag} (${admin.role})\nДанные: ${JSON.stringify(data, null, 2)}`);
    }
}

function showSuccessModal(admin) {
    console.log('🎉 Showing success modal for:', admin.tag);

    document.getElementById('successAdminTag').textContent = '@' + admin.tag;
    document.getElementById('successResponseTime').textContent = admin.response_time;

    const modal = document.getElementById('successModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Auto-close after delay
    setTimeout(() => {
        if (!modal.classList.contains('hidden')) {
            closeSuccessModal();
        }
    }, 5000);
}

function closeSuccessModal() {
    console.log('✅ Closing success modal');
    document.getElementById('successModal').classList.add('hidden');
    document.body.style.overflow = '';

    // Close the WebApp
    if (tg) {
        setTimeout(() => {
            tg.close();
        }, 500);
    }
}

// Utility functions
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star star"></i>';
    }

    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt star"></i>';
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star star"></i>';
    }

    return stars;
}

function getStatusText(status) {
    const statusTexts = {
        available: 'Доступен',
        online: 'Онлайн',
        busy: 'Занят',
        offline: 'Оффлайн'
    };
    return statusTexts[status] || 'Неизвестно';
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('mainContent');

    if (show) {
        loading.classList.remove('hidden');
        content.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        content.classList.remove('hidden');
    }
}

function showError(message) {
    console.error('💥 Error:', message);
    document.getElementById('adminsList').innerHTML = `
        <div class="error-message" style="
            text-align: center;
            padding: 3rem 2rem;
            background: var(--surface-color);
            border-radius: var(--radius-xl);
            border: 2px dashed var(--border-color);
        ">
            <i class="fas fa-exclamation-triangle" style="
                font-size: 3rem;
                color: #ef4444;
                margin-bottom: 1rem;
                display: block;
            "></i>
            <h3 style="margin-bottom: 1rem; color: var(--text-color);">Ошибка загрузки</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">${message}</p>
            <button onclick="refreshAdmins()" class="btn btn-primary">
                <i class="fas fa-redo"></i>
                Попробовать снова
            </button>
        </div>
    `;
}

function refreshAdmins() {
    console.log('🔄 Refreshing admins...');

    // Animate FAB
    const fab = document.querySelector('.fab');
    fab.style.transform = 'scale(0.9) rotate(360deg)';
    setTimeout(() => {
        fab.style.transform = '';
    }, 600);

    // Haptic feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }

    loadAdmins();
}

// Debug functions for testing
window.debugWebApp = {
    adminsData: () => adminsData,
    selectedAdmin: () => selectedAdmin,
    currentFilter: () => currentFilter,
    setTestData: (data) => {
        adminsData = data;
        displayAdmins();
        updateFilterCounts();
    },
    simulateSelection: (tag) => {
        const admin = adminsData.find(a => a.tag === tag);
        if (admin) selectAdmin(tag, admin.id);
    }
};

console.log('🚀 WebApp initialized successfully');