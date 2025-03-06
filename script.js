// DOM Elements
const taskInput = document.getElementById('taskInput');
const linkInput = document.getElementById('linkInput');
const imageInput = document.getElementById('imageInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedButton = document.getElementById('clearCompleted');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentImage = null;

// Event Listeners
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

// Functions
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

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
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

// Initial render
renderTasks(); 