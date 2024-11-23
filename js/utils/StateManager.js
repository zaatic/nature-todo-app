class StateManager {
    constructor() {
        this.state = {
            tasks: [],
            currentView: 'all',
            theme: 'light',
            filters: {
                period: 'all',
                sort: 'date-desc'
            }
        };
        this.subscribers = new Map();
    }

    setState(key, value) {
        this.state[key] = value;
        this.notifySubscribers(key);
    }

    getState(key) {
        return this.state[key];
    }

    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
    }

    unsubscribe(key, callback) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).delete(callback);
        }
    }

    notifySubscribers(key) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback => {
                callback(this.state[key]);
            });
        }
    }
} 