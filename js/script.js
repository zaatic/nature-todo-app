window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    return false;
};

class TaskManager {
    constructor() {
        try {
            this.tasks = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TASKS)) || [];
            this.subscribers = new Set();
        } catch (error) {
            console.error('Failed to initialize TaskManager:', error);
            this.tasks = [];
            this.subscribers = new Set();
        }
    }

    // ... rest of TaskManager methods ...

    save() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
            // Show user-friendly error message
            if (error.name === 'QuotaExceededError') {
                alert('Storage full. Please delete some tasks.');
            }
        }
    }
}

class UIManager {
    constructor(taskManager) {
        try {
            this.taskManager = taskManager;
            this.currentView = CONFIG.VIEWS.ALL;
            this.calendar = null;
            this.initializeElements();
            this.setupEventListeners();
            this.initializeTheme();
            this.initializeCalendar();
            
            // Subscribe to task changes
            this.taskManager.subscribe(() => this.updateUI());
        } catch (error) {
            console.error('Failed to initialize UIManager:', error);
            throw error;
        }
    }

    initializeElements() {
        try {
            this.elements = {
                taskInput: document.getElementById('task-input'),
                addTaskButton: document.getElementById('add-task'),
                taskList: document.getElementById('task-list'),
                menuToggle: document.getElementById('menu-toggle'),
                sidebar: document.querySelector('.sidebar'),
                container: document.querySelector('.container'),
                menuOverlay: document.querySelector('.menu-overlay'),
                themeToggle: document.getElementById('theme-toggle'),
                views: {
                    main: document.getElementById('main-view'),
                    calendar: document.getElementById('calendar-view'),
                    archived: document.getElementById('archived-view'),
                    analytics: document.getElementById('analytics-view')
                }
            };

            // Validate required elements
            Object.entries(this.elements).forEach(([key, element]) => {
                if (!element && key !== 'views') {
                    throw new Error(`Required element not found: ${key}`);
                }
            });
        } catch (error) {
            console.error('Failed to initialize elements:', error);
            throw error;
        }
    }

    toggleMenu() {
        this.elements.sidebar.classList.toggle('active');
        this.elements.container.classList.toggle('shifted');
        this.elements.menuOverlay.classList.toggle('active');
    }

    closeMenu() {
        this.elements.sidebar.classList.remove('active');
        this.elements.container.classList.remove('shifted');
        this.elements.menuOverlay.classList.remove('active');
    }

    switchView(view) {
        this.currentView = view;
        
        // Hide all views
        Object.values(this.elements.views).forEach(viewElement => {
            if (viewElement) {
                viewElement.classList.add('hidden');
            }
        });

        // Show selected view
        switch(view) {
            case VIEWS.CALENDAR:
                this.elements.views.calendar.classList.remove('hidden');
                this.updateCalendarView();
                break;
            case VIEWS.ARCHIVED:
                this.elements.views.archived.classList.remove('hidden');
                this.updateArchivedView();
                break;
            case VIEWS.ANALYTICS:
                this.elements.views.analytics.classList.remove('hidden');
                this.updateAnalytics();
                break;
            default:
                this.elements.views.main.classList.remove('hidden');
                this.renderTasks();
        }

        // Update active menu item
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.toggle('active', link.dataset.view === view);
        });
    }

    renderDailyTasks(tasks) {
        const dailyTasks = document.getElementById('daily-tasks');
        if (!dailyTasks) return;

        dailyTasks.innerHTML = tasks.length ? tasks.map(task => `
            <div class="daily-task ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}">
                <span class="task-content">${task.text}</span>
                <div class="task-actions">
                    ${!task.archived ? `
                        <button class="toggle-important" data-id="${task.id}">
                            <i class="fas fa-star ${task.important ? 'active' : ''}"></i>
                        </button>
                        <button class="toggle-complete" data-id="${task.id}">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('') : '<p>No tasks for this date</p>';

        // Add event listeners
        dailyTasks.querySelectorAll('.toggle-important').forEach(btn => {
            btn.addEventListener('click', () => this.toggleImportant(parseInt(btn.dataset.id)));
        });
        dailyTasks.querySelectorAll('.toggle-complete').forEach(btn => {
            btn.addEventListener('click', () => this.toggleTask(parseInt(btn.dataset.id)));
        });
    }

    updateUI() {
        try {
            document.body.classList.add('loading');
            switch (this.currentView) {
                case VIEWS.CALENDAR:
                    this.updateCalendarView();
                    break;
                case VIEWS.ARCHIVED:
                    this.updateArchivedView();
                    break;
                case VIEWS.ANALYTICS:
                    this.updateAnalytics();
                    break;
                default:
                    this.renderTasks();
            }
        } catch (error) {
            console.error('UI update failed:', error);
        } finally {
            document.body.classList.remove('loading');
        }
    }

    // ... rest of your UIManager methods ...
}

// Initialize the application with global scope for event handlers
window.app = null;
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    window.app = new UIManager(taskManager);
    
    // Add a test task if no tasks exist
    if (taskManager.tasks.length === 0) {
        taskManager.addTask('Welcome to Gardener! This is a sample task.');
    }
}); 