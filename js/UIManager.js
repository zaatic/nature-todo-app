if (typeof window.UIManager === 'undefined') {
    window.UIManager = class UIManager {
        constructor(taskManager) {
            if (!taskManager) {
                throw new Error('TaskManager instance is required');
            }
            if (!window.CONFIG) {
                throw new Error('CONFIG is not defined. Make sure config.js is loaded first.');
            }
            if (!window.flatpickr) {
                throw new Error('Flatpickr is not loaded');
            }
            if (!window.Chart) {
                throw new Error('Chart.js is not loaded');
            }
            
            try {
                this.taskManager = taskManager;
                this.currentView = CONFIG.VIEWS.ALL;
                this.calendar = null;
                
                this.initializeElements();
                this.setupEventListeners();
                this.initializeTheme();
                this.initializeCalendar();
                
                // Subscribe to task changes
                this.taskManager.subscribe(() => this.safeUpdateUI());
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
                const requiredElements = ['taskInput', 'addTaskButton', 'taskList', 'menuToggle'];
                requiredElements.forEach(elementKey => {
                    if (!this.elements[elementKey]) {
                        throw new Error(`Required element not found: ${elementKey}`);
                    }
                });
            } catch (error) {
                console.error('Failed to initialize elements:', error);
                throw error;
            }
        }

        setupEventListeners() {
            try {
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
                const archivePeriod = document.getElementById('archive-period');
                const archiveSort = document.getElementById('archive-sort');
                
                if (archivePeriod) {
                    archivePeriod.addEventListener('change', () => this.updateArchivedView());
                }
                if (archiveSort) {
                    archiveSort.addEventListener('change', () => this.updateArchivedView());
                }
            } catch (error) {
                console.error('Failed to setup event listeners:', error);
                throw error;
            }
        }

        initializeTheme() {
            try {
                const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
                document.documentElement.setAttribute('data-theme', savedTheme);
                this.elements.themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'light' ? 'moon' : 'sun'}"></i>`;
                
                this.elements.themeToggle.addEventListener('click', () => {
                    const currentTheme = document.documentElement.getAttribute('data-theme');
                    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, newTheme);
                    this.elements.themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'light' ? 'moon' : 'sun'}"></i>`;
                });
            } catch (error) {
                console.error('Failed to initialize theme:', error);
                throw error;
            }
        }

        initializeCalendar() {
            try {
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
            } catch (error) {
                console.error('Failed to initialize calendar:', error);
                // Don't throw here as calendar is not critical
                this.calendar = null;
            }
        }

        safeUpdateUI() {
            try {
                document.body.classList.add('loading');
                this.updateUI();
            } catch (error) {
                console.error('UI update failed:', error);
                ErrorHandler.handle(error, 'UI Update');
            } finally {
                document.body.classList.remove('loading');
            }
        }

        addTask() {
            try {
                const text = this.elements.taskInput.value.trim();
                if (!text) return;

                const task = this.taskManager.addTask(text, this.calendar?.selectedDates[0] || new Date());
                this.elements.taskInput.value = '';
                this.renderTask(task);
                this.updateUI();
            } catch (error) {
                ErrorHandler.handle(error, 'Add Task');
            }
        }

        renderTask(task) {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}`;
            taskElement.dataset.taskId = task.id;
            
            taskElement.innerHTML = `
                <span class="task-content">${task.text}</span>
                <div class="task-actions">
                    <button class="toggle-important" aria-label="Toggle Important">
                        <i class="fas fa-star ${task.important ? 'active' : ''}"></i>
                    </button>
                    <button class="toggle-complete" aria-label="Toggle Complete">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-task" aria-label="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            this.elements.taskList.insertBefore(taskElement, this.elements.taskList.firstChild);
        }

        setupEventDelegation() {
            this.elements.taskList.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const taskItem = button.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);

                if (button.classList.contains('toggle-complete')) {
                    this.toggleTask(taskId);
                } else if (button.classList.contains('toggle-important')) {
                    this.toggleImportant(taskId);
                } else if (button.classList.contains('delete-task')) {
                    this.deleteTask(taskId);
                }
            });
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

            // Update selected date display
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

        updateArchivedView() {
            const archivedContainer = document.getElementById('archived-tasks');
            if (!archivedContainer) return;

            const period = document.getElementById('archive-period')?.value || CONFIG.DEFAULTS.ARCHIVE_PERIOD;
            const sort = document.getElementById('archive-sort')?.value || CONFIG.DEFAULTS.ARCHIVE_SORT;
            
            let archivedTasks = this.taskManager.tasks.filter(t => t.archived);
            
            // Apply period filter
            const now = new Date();
            if (period !== CONFIG.ARCHIVE.PERIODS.ALL) {
                const days = period === CONFIG.ARCHIVE.PERIODS.WEEK ? 7 : 30;
                archivedTasks = archivedTasks.filter(t => {
                    const taskDate = new Date(t.date);
                    return (now - taskDate) / (1000 * 60 * 60 * 24) <= days;
                });
            }

            // Apply sorting
            archivedTasks.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return sort === 'date-desc' ? dateB - dateA : dateA - dateB;
            });

            this.renderArchivedTasks(archivedTasks);
        }

        updateAnalytics() {
            const analytics = this.taskManager.getAnalytics();
            
            // Update stat cards
            document.getElementById('total-tasks')?.textContent = analytics.total;
            document.getElementById('completed-tasks')?.textContent = analytics.completed;
            document.getElementById('archived-tasks')?.textContent = analytics.archived;
            document.getElementById('completion-rate')?.textContent = `${analytics.completionRate}%`;

            // Update chart
            this.updateProductivityChart(analytics.weeklyProgress);
        }

        updateProductivityChart(weeklyData) {
            const canvas = document.getElementById('productivity-chart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart if it exists
            if (this.productivityChart) {
                this.productivityChart.destroy();
            }

            this.productivityChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: weeklyData.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })),
                    datasets: [
                        {
                            label: 'Completed Tasks',
                            data: weeklyData.map(d => d.completed),
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--success-color'),
                            tension: 0.4
                        },
                        {
                            label: 'Total Tasks',
                            data: weeklyData.map(d => d.total),
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary'),
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
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

            container.innerHTML = Object.entries(groupedTasks)
                .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                .map(([date, tasks]) => `
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

        toggleTask(id) {
            try {
                this.taskManager.toggleTask(id);
                this.updateUI();
            } catch (error) {
                ErrorHandler.handle(error, 'Toggle Task');
            }
        }

        toggleImportant(id) {
            try {
                this.taskManager.toggleImportant(id);
                this.updateUI();
            } catch (error) {
                ErrorHandler.handle(error, 'Toggle Important');
            }
        }

        deleteTask(id) {
            try {
                const taskElement = document.querySelector(`.task-item[data-task-id="${id}"]`);
                if (taskElement) {
                    taskElement.style.animation = 'fadeOut 0.3s ease forwards';
                    taskElement.addEventListener('animationend', () => {
                        this.taskManager.deleteTask(id);
                        this.updateUI();
                    });
                }
            } catch (error) {
                ErrorHandler.handle(error, 'Delete Task');
            }
        }

        renderDailyTasks(tasks) {
            const dailyTasks = document.getElementById('daily-tasks');
            if (!dailyTasks) return;

            dailyTasks.innerHTML = tasks.length ? tasks.map(task => `
                <div class="daily-task ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}"
                     data-task-id="${task.id}">
                    <span class="task-content">${task.text}</span>
                    <div class="task-actions">
                        <button class="toggle-important" aria-label="Toggle Important">
                            <i class="fas fa-star ${task.important ? 'active' : ''}"></i>
                        </button>
                        <button class="toggle-complete" aria-label="Toggle Complete">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                    </div>
                </div>
            `).join('') : '<p>No tasks for this date</p>';

            // Add event delegation
            dailyTasks.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const taskElement = button.closest('.daily-task');
                const taskId = parseInt(taskElement.dataset.taskId);

                if (button.classList.contains('toggle-complete')) {
                    this.toggleTask(taskId);
                } else if (button.classList.contains('toggle-important')) {
                    this.toggleImportant(taskId);
                }
            });
        }

        updateUI() {
            try {
                PerformanceMonitor.startMeasure('updateUI');
                document.body.classList.add('loading');

                switch (this.currentView) {
                    case CONFIG.VIEWS.CALENDAR:
                        this.updateCalendarView();
                        break;
                    case CONFIG.VIEWS.ARCHIVED:
                        this.updateArchivedView();
                        break;
                    case CONFIG.VIEWS.ANALYTICS:
                        this.updateAnalytics();
                        break;
                    default:
                        this.renderTasks();
                }

                PerformanceMonitor.endMeasure('updateUI');
            } catch (error) {
                ErrorHandler.handle(error, 'Update UI');
            } finally {
                document.body.classList.remove('loading');
            }
        }

        renderTasks() {
            try {
                const tasks = this.taskManager.tasks.filter(t => !t.archived);
                this.elements.taskList.innerHTML = '';
                
                const fragment = document.createDocumentFragment();
                tasks.forEach(task => {
                    const taskElement = this.createTaskElement(task);
                    fragment.appendChild(taskElement);
                });
                
                this.elements.taskList.appendChild(fragment);
            } catch (error) {
                ErrorHandler.handle(error, 'Render Tasks');
            }
        }

        showTasksForDate(date) {
            try {
                const tasks = this.taskManager.getTasksByDate(date);
                const dateStr = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                document.querySelector('.selected-date').textContent = dateStr;
                this.renderDailyTasks(tasks);
            } catch (error) {
                ErrorHandler.handle(error, 'Show Tasks For Date');
            }
        }

        // ... rest of your UIManager methods ...
    };
} 