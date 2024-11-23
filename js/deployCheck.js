(function() {
    const requiredFiles = [
        'css/styles.css',
        'js/config.js',
        'js/TaskManager.js',
        'js/UIManager.js',
        'js/app.js'
    ];

    const checkFiles = async () => {
        try {
            console.log('Checking required files...');
            for (const file of requiredFiles) {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`Failed to load ${file}`);
                }
                console.log(`✓ ${file} loaded successfully`);
            }
            console.log('All files loaded successfully');
        } catch (error) {
            console.error('Deployment check failed:', error);
            document.body.innerHTML = `
                <div class="error-container">
                    <h1>Failed to load required files</h1>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Retry</button>
                    <div class="error-details">
                        <pre>${error.stack}</pre>
                    </div>
                </div>
            `;
        }
    };

    // Run check when page loads
    window.addEventListener('load', checkFiles);
})(); 