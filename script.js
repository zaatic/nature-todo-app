// Constants
const STORAGE_KEYS = {
    TASKS: 'gardener_tasks',
    THEME: 'gardener_theme',
    SETTINGS: 'gardener_settings'
};

const VIEWS = {
    ALL: 'all',
    CALENDAR: 'calendar',
    ARCHIVED: 'archived',
    ANALYTICS: 'analytics',
    COMPLETED: 'completed'
};

// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
        this.subscribers = new Set();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.tasks));
        this.save();
    }

    save() {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
    }

    addTask(text, date = new Date()) {
        const newTask = {
            id: Date.now(),
            text,
            completed: false,
            archived: false,
            date: date.toISOString().split('T')[0],
            important: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.tasks.unshift(newTask); // Add to beginning of array
        this.notify();
        return newTask;
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            
            if (task.completed) {
                setTimeout(() => {
                    task.archived = true;
                    this.notify();
                }, 2000);
            }
            this.notify();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.notify();
    }

    toggleImportant(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.important = !task.important;
            task.updatedAt = new Date().toISOString();
            this.notify();
        }
    }

    getTasksByDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.tasks.filter(task => task.date === dateStr);
    }

    getAnalytics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const archived = this.tasks.filter(t => t.archived).length;
        const important = this.tasks.filter(t => t.important).length;
        
        return {
            total,
            completed,
            archived,
            important,
            completionRate: total ? Math.round((completed / total) * 100) : 0,
            weeklyProgress: this.getWeeklyProgress()
        };
    }

    getWeeklyProgress() {
        const today = new Date();
        const lastWeek = new Array(7).fill(0).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return lastWeek.map(date => ({
            date,
            completed: this.tasks.filter(t => t.date === date && t.completed).length,
            total: this.tasks.filter(t => t.date === date).length
        }));
    }
}

// UI Manager Class
class UIManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentView = VIEWS.ALL;
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCalendar();
        this.initializeTheme();
        
        // Subscribe to task changes
        this.taskManager.subscribe(() => this.updateUI());
    }

    initializeElements() {
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
    }

    initializeCalendar() {
        const calendarElement = document.getElementById('calendar');
        if (!calendarElement) return;

        this.calendar = flatpickr(calendarElement, {
            inline: true,
            onChange: (selectedDates) => {
                if (selectedDates[0]) {
                    this.showTasksForDate(selectedDates[0]);
                }
            },
            onMonthChange: () => this.updateCalendarView()
        });
    }

    setupEventListeners() {
        // Task input handlers
        this.elements.addTaskButton.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Menu handlers
        this.elements.menuToggle.addEventListener('click', () => this.toggleMenu());
        this.elements.menuOverlay.addEventListener('click', () => this.closeMenu());

        // View switching
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(link.dataset.view);
                if (window.innerWidth < 768) this.closeMenu();
            });
        });

        // Archive filters
        document.getElementById('archive-period')?.addEventListener('change', 
            () => this.updateArchivedView());
        document.getElementById('archive-sort')?.addEventListener('change', 
            () => this.updateArchivedView());
    }

    updateUI() {
        switch (this.currentView) {
            case VIEWS.CALENDAR:
                this.updateCalendarView();
                break;
            case VIEWS.ARCHIVED:
                this.updateArchivedView();
                break;
            case VIEWS.ANALYTICS:
                this.updateAnalyticsView();
                break;
            default:
                this.renderTasks();
        }
    }

    addTask() {
        const text = this.elements.taskInput.value.trim();
        if (text) {
            const date = this.calendar?.selectedDates[0] || new Date();
            const task = this.taskManager.addTask(text, date);
            this.animateTaskAddition(task);
            this.elements.taskInput.value = '';
            this.updateAnalytics();
        }
    }

    animateTaskAddition(task) {
        const taskElement = this.createTaskElement(task);
        taskElement.style.opacity = '0';
        taskElement.style.transform = 'translateY(20px)';
        this.elements.taskList.insertBefore(taskElement, this.elements.taskList.firstChild);
        
        requestAnimationFrame(() => {
            taskElement.style.opacity = '1';
            taskElement.style.transform = 'translateY(0)';
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}`;
        li.innerHTML = `
            <span class="task-content">${task.text}</span>
            <div class="task-actions">
                <button class="toggle-important" aria-label="${task.important ? 'Remove importance' : 'Mark as important'}">
                    <i class="fas fa-star ${task.important ? 'active' : ''}"></i>
                </button>
                <button class="toggle-complete" aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                    <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="delete-task" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <span class="task-date">${new Date(task.date).toLocaleDateString()}</span>
        `;

        // Add event listeners
        li.querySelector('.toggle-important').addEventListener('click', () => this.toggleImportant(task.id));
        li.querySelector('.toggle-complete').addEventListener('click', () => this.toggleTask(task.id));
        li.querySelector('.delete-task').addEventListener('click', () => this.deleteTask(task.id));

        return li;
    }

    updateCalendarView() {
        if (!this.calendar) return;

        const selectedDate = this.calendar.selectedDates[0] || new Date();
        const tasks = this.taskManager.getTasksByDate(selectedDate);
        
        // Update task counter
        const counter = document.querySelector('.calendar-stats .task-counter');
        if (counter) {
            counter.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''} today`;
        }

        // Update selected date
        const dateSpan = document.querySelector('.selected-date');
        if (dateSpan) {
            dateSpan.textContent = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        this.renderDailyTasks(tasks);
    }

    renderDailyTasks(tasks) {
        const dailyTasks = document.getElementById('daily-tasks');
        if (!dailyTasks) return;

        dailyTasks.innerHTML = tasks.length ? tasks.map(task => `
            <div class="daily-task ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}">
                <span class="task-content">${task.text}</span>
                <div class="task-actions">
                    ${!task.archived ? `
                        <button onclick="app.toggleImportant(${task.id})" aria-label="${task.important ? 'Remove importance' : 'Mark as important'}">
                            <i class="fas fa-star ${task.important ? 'active' : ''}"></i>
                        </button>
                        <button onclick="app.toggleTask(${task.id})" aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('') : '<p>No tasks for this date</p>';
    }

    updateArchivedView() {
        const archivedTasks = document.getElementById('archived-tasks');
        if (!archivedTasks) return;

        const period = document.getElementById('archive-period')?.value || 'all';
        const sort = document.getElementById('archive-sort')?.value || 'date-desc';
        
        let tasks = this.taskManager.tasks.filter(t => t.archived);
        
        // Apply period filter
        const now = new Date();
        if (period !== 'all') {
            const days = period === 'week' ? 7 : 30;
            tasks = tasks.filter(t => {
                const taskDate = new Date(t.date);
                return (now - taskDate) / (1000 * 60 * 60 * 24) <= days;
            });
        }

        // Apply sorting
        tasks.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sort === 'date-desc' ? dateB - dateA : dateA - dateB;
        });

        this.renderArchivedTasks(tasks);
    }

    renderArchivedTasks(tasks) {
        const container = document.getElementById('archived-tasks');
        if (!container) return;

        const groupedTasks = tasks.reduce((groups, task) => {
            const date = task.date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(task);
            return groups;
        }, {});

        container.innerHTML = Object.entries(groupedTasks).map(([date, tasks]) => `
            <div class="date-group">
                <div class="date-header">
                    <span>${new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                    <span class="task-counter">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
                </div>
                ${tasks.map(task => `
                    <div class="archived-task">
                        <span class="task-content ${task.important ? 'important' : ''}">${task.text}</span>
                        <span class="task-meta">
                            <span class="task-time">${new Date(task.createdAt).toLocaleTimeString()}</span>
                            ${task.important ? '<i class="fas fa-star"></i>' : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    updateAnalytics() {
        const analytics = this.taskManager.getAnalytics();
        
        // Update stat cards
        document.getElementById('total-tasks')?.textContent = analytics.total;
        document.getElementById('completed-tasks')?.textContent = analytics.completed;
        document.getElementById('archived-tasks')?.textContent = analytics.archived;
        document.getElementById('completion-rate')?.textContent = `${analytics.completionRate}%`;

        // Update weekly progress chart if available
        this.updateProductivityChart(analytics.weeklyProgress);
    }

    updateProductivityChart(weeklyData) {
        const canvas = document.getElementById('productivity-chart');
        if (!canvas) return;

        // Implementation for chart visualization would go here
        // You could use Chart.js or another library for this
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    app = new UIManager(taskManager);
}); 