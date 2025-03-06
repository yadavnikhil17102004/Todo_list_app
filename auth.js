class Auth {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.loadUsers();
    }

    async loadUsers() {
        try {
            console.log('Loading users...');
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const safeUsers = await response.json();
            // Store full user data in memory
            this.users = safeUsers;
            console.log(`Loaded ${this.users.length} users`);
            
            // Check for existing session
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                const storedUser = JSON.parse(currentUserStr);
                // Find the user in the loaded users array
                const currentUser = this.users.find(u => u.id === storedUser.id);
                if (currentUser) {
                    this.currentUser = currentUser;
                    console.log('Restored current user:', this.currentUser.username);
                } else {
                    // If user not found in server data, clear the session
                    localStorage.removeItem('currentUser');
                    console.log('Stored user not found in server data, clearing session');
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users. Please refresh the page.');
        }
    }

    async signUp(username, password) {
        console.log('Attempting signup for:', username);
        if (!username || !password) {
            return { success: false, message: 'Username and password are required' };
        }

        if (this.users.find(user => user.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        try {
            const hashedPassword = await this.hashPassword(password);
            const user = {
                id: Date.now(),
                username,
                password: hashedPassword,
                todos: []
            };

            console.log('Sending signup request...');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }

            const result = await response.json();
            // Reload users after successful signup
            await this.loadUsers();
            console.log('Signup successful:', username);
            return { success: true, message: 'User created successfully' };
        } catch (error) {
            console.error('Error during signup:', error);
            return { success: false, message: error.message || 'Server error' };
        }
    }

    async login(username, password) {
        console.log('Attempting login for:', username);
        if (!username || !password) {
            return { success: false, message: 'Username and password are required' };
        }

        try {
            // Reload users before login attempt
            await this.loadUsers();
            
            const user = this.users.find(u => u.username === username);
            if (!user) {
                return { success: false, message: 'Invalid username or password' };
            }

            const hashedInput = await this.hashPassword(password);
            console.log('Comparing hashes:', {
                input: hashedInput,
                stored: user.password
            });

            if (hashedInput === user.password) {
                this.currentUser = { ...user };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                console.log('Login successful:', username);
                return { success: true, message: 'Login successful' };
            }
            return { success: false, message: 'Invalid username or password' };
        } catch (error) {
            console.error('Error during login:', error);
            return { success: false, message: 'Server error' };
        }
    }

    logout() {
        if (this.currentUser) {
            console.log('Logging out:', this.currentUser.username);
        }
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('Error hashing password:', error);
            throw error;
        }
    }

    async updateUserTodos(todos) {
        if (!this.currentUser) {
            console.error('Cannot update todos: No user logged in');
            return false;
        }

        try {
            console.log('Updating todos for:', this.currentUser.username);
            const response = await fetch(`/api/users/${this.currentUser.id}/todos`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todos)
            });

            if (!response.ok) {
                throw new Error('Failed to update todos');
            }

            this.currentUser.todos = todos;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            console.log('Todos updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating todos:', error);
            return false;
        }
    }
}

const auth = new Auth(); 