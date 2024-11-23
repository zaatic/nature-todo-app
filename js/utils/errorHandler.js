class ErrorHandler {
    static handle(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const message = this.getUserFriendlyMessage(error);
        this.showErrorToast(message);
        
        // Log to analytics service (if available)
        this.logError(error, context);
    }

    static getUserFriendlyMessage(error) {
        switch(error.name) {
            case 'QuotaExceededError':
                return 'Storage is full. Please delete some tasks.';
            case 'NetworkError':
                return 'Network connection issue. Please check your internet connection.';
            case 'SecurityError':
                return 'Permission denied. Please try refreshing the page.';
            default:
                return 'Something went wrong. Please try again.';
        }
    }

    static showErrorToast(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => toast.remove(), 5000);
    }

    static logError(error, context) {
        // Implement error logging to your analytics service
        // Example: sendToAnalytics(error, context);
    }
} 