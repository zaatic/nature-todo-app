class PerformanceMonitor {
    static init() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactions: 0
        };

        // Monitor page load
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now();
        });

        // Monitor interactions
        document.addEventListener('click', () => {
            this.metrics.interactions++;
        });
    }

    static startMeasure(label) {
        performance.mark(`${label}-start`);
    }

    static endMeasure(label) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        
        const measure = performance.getEntriesByName(label)[0];
        console.log(`${label} took ${measure.duration}ms`);
    }

    static getMetrics() {
        return this.metrics;
    }
} 