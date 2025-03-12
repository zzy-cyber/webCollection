// 数据管理
class DataManager {
    constructor() {
        this.sites = JSON.parse(localStorage.getItem('sites')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || ['常用'];
        this.currentCategory = localStorage.getItem('currentCategory') || '常用';
    }

    saveSites() {
        localStorage.setItem('sites', JSON.stringify(this.sites));
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('currentCategory', this.currentCategory);
    }

    addSite(site) {
        this.sites.push(site);
        this.saveSites();
    }

    deleteSite(url) {
        if (this.currentCategory === '常用') {
            this.sites = this.sites.filter(site => !(site.url === url && site.category === '常用'));
        } else {
            this.sites = this.sites.filter(site => site.url !== url);
        }
        this.saveSites();
    }

    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories.push(category);
            this.saveCategories();
        }
    }

    editCategory(oldName, newName) {
        const index = this.categories.indexOf(oldName);
        if (index !== -1) {
            this.categories[index] = newName;
            if (this.currentCategory === oldName) {
                this.currentCategory = newName;
            }
            this.sites.forEach(site => {
                if (site.category === oldName) {
                    site.category = newName;
                }
            });
            this.saveCategories();
            this.saveSites();
        }
    }

    deleteCategory(category) {
        if (category === '常用') return;
        const index = this.categories.indexOf(category);
        if (index !== -1) {
            this.categories.splice(index, 1);
            this.sites = this.sites.filter(site => site.category !== category);
            if (this.currentCategory === category) {
                this.currentCategory = '常用';
            }
            this.saveCategories();
            this.saveSites();
        }
    }

    getSitesByCategory(category) {
        return this.sites.filter(site => site.category === category);
    }
}

// UI管理
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.initializeUI();
        this.setupEventListeners();
        this.renderSites();
        this.renderCategories();
        this.updateCategorySelect();
    }

    initializeUI() {
        this.sitesGrid = document.getElementById('sitesGrid');
        this.categoryList = document.getElementById('categoryList');
        this.addSiteBtn = document.getElementById('addSiteBtn');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.addSiteModal = document.getElementById('addSiteModal');
        this.addCategoryModal = document.getElementById('addCategoryModal');
        this.addSiteForm = document.getElementById('addSiteForm');
        this.addCategoryForm = document.getElementById('addCategoryForm');
        this.siteCategorySelect = document.getElementById('siteCategory');
    }

    setupEventListeners() {
        // 添加网站
        this.addSiteBtn.addEventListener('click', () => this.showModal(this.addSiteModal));
        this.addSiteForm.addEventListener('submit', (e) => this.handleAddSite(e));

        // 添加分类
        this.addCategoryBtn.addEventListener('click', () => this.showModal(this.addCategoryModal));
        this.addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));

        // 关闭模态框
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // 分类切换
        this.categoryList.addEventListener('click', (e) => {
            const categoryItem = e.target.closest('.category-item');
            if (categoryItem) {
                if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-category-btn')) {
                    this.handleCategoryClick(categoryItem);
                } else if (e.target.classList.contains('edit-btn')) {
                    e.stopPropagation();
                    this.handleEditCategory(categoryItem);
                }
            }
        });

        // 添加到常用分类
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-common-btn')) {
                e.stopPropagation();
                const siteCard = e.target.closest('.site-card');
                const url = siteCard.dataset.url;
                const site = this.dataManager.sites.find(s => s.url === url);
                if (site) {
                    const commonSite = {...site, category: '常用'};
                    if (!this.dataManager.sites.some(s => s.url === url && s.category === '常用')) {
                        this.dataManager.addSite(commonSite);
                        alert('已添加到常用分类！');
                    } else {
                        alert('该网站已在常用分类中！');
                    }
                }
            }
        });
    }

    async handleAddSite(e) {
        e.preventDefault();
        const siteName = document.getElementById('siteName').value;
        const siteUrl = document.getElementById('siteUrl').value;
        const category = document.getElementById('siteCategory').value;

        const site = {
            name: siteName,
            url: siteUrl,
            category: category,
            icon: await this.getFavicon(siteUrl)
        };

        this.dataManager.addSite(site);
        this.renderSites();
        this.closeModals();
        this.addSiteForm.reset();
    }

    handleAddCategory(e) {
        e.preventDefault();
        const categoryName = document.getElementById('categoryName').value;
        this.dataManager.addCategory(categoryName);
        this.renderCategories();
        this.updateCategorySelect();
        this.closeModals();
        this.addCategoryForm.reset();
    }

    handleEditCategory(categoryItem) {
        const category = categoryItem.dataset.category;
        if (category === '常用') return;

        const newName = prompt('请输入新的分类名称：', category);
        if (newName && newName !== category) {
            this.dataManager.editCategory(category, newName);
            this.renderCategories();
            this.updateCategorySelect();
            this.renderSites();
        }
    }

    handleCategoryClick(categoryItem) {
        const category = categoryItem.dataset.category;
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        categoryItem.classList.add('active');
        this.dataManager.currentCategory = category;
        this.dataManager.saveCategories();
        this.renderSites();
    }

    async getFavicon(url) {
        try {
            const urlObj = new URL(url);
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            return googleFaviconUrl;
        } catch (error) {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23555"/></svg>';
        }
    }

    renderSites() {
        const sites = this.dataManager.getSitesByCategory(this.dataManager.currentCategory);
        this.sitesGrid.innerHTML = sites.map(site => this.createSiteCard(site)).join('');

        // 添加删除事件监听
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = e.target.closest('.site-card').dataset.url;
                this.dataManager.deleteSite(url);
                this.renderSites();
            });
        });

        // 添加点击跳转事件
        document.querySelectorAll('.site-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.dataset.url;
                window.open(url, '_blank');
            });
        });
    }

    createSiteCard(site) {
        return `
            <div class="site-card" data-url="${site.url}">
                <button class="delete-btn">×</button>
                ${this.dataManager.currentCategory !== '常用' ? `<button class="add-to-common-btn" title="添加到常用">★</button>` : ''}
                <img class="site-icon" src="${site.icon}" alt="${site.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%23555\'/></svg>'">
                <div class="site-name">${site.name}</div>
            </div>
        `;
    }

    renderCategories() {
        this.categoryList.innerHTML = this.dataManager.categories.map(category => `
            <li class="category-item ${category === this.dataManager.currentCategory ? 'active' : ''}" data-category="${category}">
                <span>${category}</span>
                ${category !== '常用' ? `
                    <div class="category-buttons">
                        <button class="edit-btn">编辑</button>
                        <button class="delete-category-btn">删除</button>
                    </div>
                ` : ''}
            </li>
        `).join('');

        // 添加分类删除事件监听
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = e.target.closest('.category-item').dataset.category;
                if (confirm(`确定要删除分类「${category}」吗？`)) {
                    this.dataManager.deleteCategory(category);
                    this.renderCategories();
                    this.renderSites();
                }
            });
        });
    }

    updateCategorySelect() {
        this.siteCategorySelect.innerHTML = this.dataManager.categories.map(category =>
            `<option value="${category}">${category}</option>`
        ).join('');
    }

    showModal(modal) {
        modal.classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const dataManager = new DataManager();
    new UIManager(dataManager);
});