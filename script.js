// DOM Elements
const authForms = document.getElementById('authForms');
const todoApp = document.getElementById('todoApp');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const usernameDisplay = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');

const taskInput = document.getElementById('taskInput');
const linkInput = document.getElementById('linkInput');
const imageInput = document.getElementById('imageInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedButton = document.getElementById('clearCompleted');

// State
let tasks = [];
let currentFilter = 'all';
let currentImage = null;

// Auth Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    console.log('Attempting login...');
    const result = await auth.login(username, password);
    console.log('Login result:', result);

    if (result.success) {
        tasks = auth.getCurrentUser().todos;
        showTodoApp();
        renderTasks();
    } else {
        alert(result.message);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    console.log('Attempting signup...');
    const result = await auth.signUp(username, password);
    console.log('Signup result:', result);

    if (result.success) {
        alert(result.message);
        toggleForms();
    } else {
        alert(result.message);
    }
});

showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms();
});

logoutBtn.addEventListener('click', handleLogout);

// Todo Event Listeners
addButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
clearCompletedButton.addEventListener('click', clearCompleted);
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks();
    });
});

imageInput.addEventListener('change', handleImageSelect);

// Auth Functions
function handleLogout() {
    const username = auth.getCurrentUser()?.username;
    console.log('Logging out:', username);
    auth.logout();
    showAuthForms();
    tasks = [];
    currentImage = null;
    clearInputs();
}

function toggleForms() {
    const forms = document.querySelectorAll('.form-container');
    forms.forEach(form => form.classList.toggle('hidden'));
}

function showTodoApp() {
    authForms.classList.add('hidden');
    todoApp.classList.remove('hidden');
    usernameDisplay.textContent = auth.getCurrentUser().username;
}

function showAuthForms() {
    authForms.classList.remove('hidden');
    todoApp.classList.add('hidden');
}

// Todo Functions
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImage = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText) {
        console.log('Adding new task:', taskText);
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            link: linkInput.value.trim() || null,
            image: currentImage || null
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
        clearInputs();
    }
}

function clearInputs() {
    taskInput.value = '';
    linkInput.value = '';
    imageInput.value = '';
    currentImage = null;
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

async function saveTasks() {
    await auth.updateUserTodos(tasks);
}

function renderTasks() {
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                onclick="toggleTask(${task.id})">
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                ${task.link ? `<a href="${task.link}" target="_blank" class="task-link">${task.link}</a>` : ''}
                ${task.image ? `<img src="${task.image}" alt="Task image" class="task-image">` : ''}
            </div>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
}

// Initial setup
console.log('Initializing application...');
if (auth.isLoggedIn()) {
    const user = auth.getCurrentUser();
    console.log('User already logged in:', user.username);
    tasks = user.todos;
    showTodoApp();
    renderTasks();
} else {
    console.log('No user logged in, showing auth forms');
    showAuthForms();
} 