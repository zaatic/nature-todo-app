// Constants and configurations
const CONFIG = {
    STORAGE_KEYS: {
        TASKS: 'gardener_tasks',
        THEME: 'gardener_theme',
        SETTINGS: 'gardener_settings'
    },
    VIEWS: {
        ALL: 'all',
        CALENDAR: 'calendar',
        ARCHIVED: 'archived',
        ANALYTICS: 'analytics',
        COMPLETED: 'completed'
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check if required elements exist
        const requiredElements = [
            'task-input',
            'task-list',
            'menu-toggle',
            'theme-toggle'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }

        // Initialize managers
        const taskManager = new TaskManager();
        window.app = new UIManager(taskManager);

        // Add test task if needed
        if (taskManager.tasks.length === 0) {
            taskManager.addTask('Welcome to Gardener! This is a sample task.');
        }

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        // Show user-friendly error message
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Oops! Something went wrong</h1>
                <p>Please try refreshing the page. If the problem persists, contact support.</p>
                <button onclick="location.reload()">Refresh Page</button>
            </div>
        `;
    }
}); 