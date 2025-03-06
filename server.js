const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Debug logging
const debug = {
    log: (message, type = 'info') => {
        const timestamp = new Date().toISOString();
        const color = {
            info: '\x1b[36m', // Cyan
            error: '\x1b[31m', // Red
            warning: '\x1b[33m', // Yellow
            success: '\x1b[32m' // Green
        }[type] || '\x1b[36m';
        console.log(`${color}[${timestamp}] ${message}\x1b[0m`);
    }
};

// User data storage
let users = [];
const USERS_FILE = 'users.json';

// Load users from file
try {
    if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        debug.log(`Loaded ${users.length} users from file`, 'info');
    } else {
        debug.log('No users file found, starting fresh', 'info');
    }
} catch (error) {
    debug.log(`Error loading users: ${error.message}`, 'error');
}

// Save users to file
function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        debug.log('Users saved successfully', 'success');
    } catch (error) {
        debug.log(`Error saving users: ${error.message}`, 'error');
    }
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const server = http.createServer((req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    // Add CORS headers to all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // API endpoints
    if (req.url.startsWith('/api/')) {
        handleApiRequest(req, res);
        return;
    }

    // Static file serving
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                debug.log(`Server Error: ${error.code}`, 'error');
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

function handleApiRequest(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = body ? JSON.parse(body) : null;
            debug.log(`Received ${req.method} request to ${req.url}`, 'info');
            
            if (req.url === '/api/users' && req.method === 'GET') {
                // Get all users (without passwords)
                const safeUsers = users.map(user => ({
                    id: user.id,
                    username: user.username,
                    todos: user.todos
                }));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(safeUsers));
                debug.log('Users retrieved successfully', 'success');
            }
            
            else if (req.url === '/api/users' && req.method === 'POST') {
                // Create new user
                const { username, password, todos } = data;
                debug.log(`Attempting to create user: ${username}`, 'info');

                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Username and password are required' }));
                    debug.log('Failed to create user: Missing credentials', 'error');
                    return;
                }

                if (users.find(u => u.username === username)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Username already exists' }));
                    debug.log(`Failed to create user: ${username} - Username exists`, 'error');
                    return;
                }
                
                const newUser = {
                    id: Date.now(),
                    username,
                    password, // Already hashed by client
                    todos: todos || []
                };
                
                users.push(newUser);
                saveUsers();
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User created successfully' }));
                debug.log(`User created successfully: ${username}`, 'success');
            }
            
            else if (req.url.match(/^\/api\/users\/\d+\/todos$/) && req.method === 'PUT') {
                // Update user todos
                const userId = parseInt(req.url.split('/')[2]);
                const user = users.find(u => u.id === userId);
                
                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'User not found' }));
                    debug.log(`Failed to update todos: User ${userId} not found`, 'error');
                    return;
                }
                
                user.todos = data;
                saveUsers();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Todos updated successfully' }));
                debug.log(`Todos updated for user: ${user.username}`, 'success');
            }
            
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
                debug.log(`Invalid API endpoint: ${req.url}`, 'error');
            }
        } catch (error) {
            debug.log(`API Error: ${error.message}`, 'error');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    debug.log(`Server running at http://localhost:${PORT}/`, 'success');
}); 