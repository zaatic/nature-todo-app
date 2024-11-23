// Add this at the top of app.js
console.log('App.js loaded');

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error:', msg, '\nURL:', url, '\nLine:', lineNo);
    return false;
};

// Make sure classes are available globally
window.TaskManager = TaskManager;
window.UIManager = UIManager;

class App {
    static async init() {
        try {
            console.log('Initializing app...');
            
            // Check if required scripts are loaded
            if (!window.TaskManager) {
                console.error('TaskManager not loaded');
                throw new Error('Required classes not loaded: TaskManager');
            }
            if (!window.UIManager) {
                console.error('UIManager not loaded');
                throw new Error('Required classes not loaded: UIManager');
            }
            if (!window.CONFIG) {
                console.error('CONFIG not loaded');
                throw new Error('Required configuration not loaded');
            }

            // Initialize managers
            const taskManager = new TaskManager();
            window.app = new UIManager(taskManager);

            // Add welcome task if needed
            if (taskManager.tasks.length === 0) {
                taskManager.addTask('Welcome to Gardener! This is a sample task.');
            }

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorScreen(error);
        }
    }

    static showErrorScreen(error) {
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Oops! Something went wrong</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()">Refresh Page</button>
                <div class="error-details">
                    <pre>${error.stack}</pre>
                </div>
            </div>
        `;
    }
}

// Initialize when everything is loaded
window.addEventListener('load', () => {
    console.log('Window loaded, initializing app...');
    App.init();
}); 