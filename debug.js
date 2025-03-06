class Debug {
    constructor() {
        this.isDebugMode = localStorage.getItem('debugMode') === 'true';
        this.logs = [];
        this.maxLogs = 100;
    }

    toggleDebugMode() {
        this.isDebugMode = !this.isDebugMode;
        localStorage.setItem('debugMode', this.isDebugMode);
        this.log('Debug mode ' + (this.isDebugMode ? 'enabled' : 'disabled'));
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            type
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        if (this.isDebugMode) {
            const color = this.getLogColor(type);
            console.log(`%c[${timestamp}] ${message}`, `color: ${color}`);
        }
    }

    error(message) {
        this.log(message, 'error');
        if (this.isDebugMode) {
            console.error(message);
        }
    }

    warn(message) {
        this.log(message, 'warning');
        if (this.isDebugMode) {
            console.warn(message);
        }
    }

    getLogColor(type) {
        switch (type) {
            case 'error': return '#FF6B6B';
            case 'warning': return '#FFD93D';
            case 'success': return '#6BCB77';
            default: return '#6B73FF';
        }
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

const debug = new Debug(); 