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
            this.users = await response.json();
            console.log(`Loaded ${this.users.length} users`);
            
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                this.currentUser = JSON.parse(currentUserStr);
                console.log('Restored current user:', this.currentUser.username);
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
            this.users.push(user);
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

        const user = this.users.find(u => u.username === username);
        if (!user) {
            return { success: false, message: 'Invalid username or password' };
        }

        try {
            const isValid = await this.verifyPassword(password, user.password);
            if (isValid) {
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

    async verifyPassword(password, hashedPassword) {
        try {
            const hashedInput = await this.hashPassword(password);
            return hashedInput === hashedPassword;
        } catch (error) {
            console.error('Error verifying password:', error);
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