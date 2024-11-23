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
    },
    ANIMATION: {
        DURATION: 300,
        EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    THEME: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    ARCHIVE: {
        DELAY: 2000, // ms before completed tasks are archived
        PERIODS: {
            WEEK: 'week',
            MONTH: 'month',
            ALL: 'all'
        }
    },
    DEFAULTS: {
        THEME: 'light',
        VIEW: 'all',
        ARCHIVE_PERIOD: 'week',
        ARCHIVE_SORT: 'date-desc'
    }
};

// Freeze the config to prevent modifications
Object.freeze(CONFIG); 