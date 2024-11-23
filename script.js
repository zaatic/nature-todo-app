document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskButton = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.completed) li.classList.add('completed');

        li.innerHTML = `
            <span class="task-content">${task.text}</span>
            <div class="task-actions">
                <button onclick="toggleTask(${task.id})">
                    <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return li;
    };

    const renderTasks = () => {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    };

    window.addTask = () => {
        const text = taskInput.value.trim();
        if (text) {
            const newTask = {
                id: Date.now(),
                text,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            taskList.appendChild(createTaskElement(newTask));
            taskInput.value = '';
        }
    };

    window.toggleTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    };

    window.deleteTask = (id) => {
        const taskElement = taskList.querySelector(`[onclick="deleteTask(${id})"]`).closest('.task-item');
        taskElement.style.animation = 'fadeOut 0.3s ease forwards';
        
        taskElement.addEventListener('animationend', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        });
    };

    addTaskButton.addEventListener('click', window.addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.addTask();
    });

    // Initial render
    renderTasks();
}); 