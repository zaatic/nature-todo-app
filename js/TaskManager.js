if (typeof window.TaskManager === 'undefined') {
    window.TaskManager = class TaskManager {
        constructor() {
            if (!window.CONFIG) {
                throw new Error('CONFIG is not defined. Make sure config.js is loaded first.');
            }
            this.loadTasks();
            this.subscribers = new Set();
        }

        loadTasks() {
            try {
                this.tasks = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TASKS)) || [];
            } catch (error) {
                ErrorHandler.handle(error, 'Load Tasks');
                this.tasks = [];
            }
        }

        subscribe(callback) {
            this.subscribers.add(callback);
        }

        notify() {
            this.subscribers.forEach(callback => callback(this.tasks));
            this.save();
        }

        save() {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
            } catch (error) {
                ErrorHandler.handle(error, 'Save Tasks');
            }
        }

        addTask(text, date = new Date()) {
            const task = {
                id: Date.now(),
                text,
                completed: false,
                archived: false,
                date: date.toISOString().split('T')[0],
                important: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.tasks.unshift(task);
            this.notify();
            return task;
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

        toggleImportant(id) {
            const task = this.tasks.find(t => t.id === id);
            if (task) {
                task.important = !task.important;
                task.updatedAt = new Date().toISOString();
                this.notify();
            }
        }

        deleteTask(id) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.notify();
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
            return Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayTasks = this.tasks.filter(t => t.date === dateStr);
                
                return {
                    date: dateStr,
                    total: dayTasks.length,
                    completed: dayTasks.filter(t => t.completed).length
                };
            }).reverse();
        }
    };
} 