/**
 * @typedef {Object} Task
 * @property {number} id - The unique identifier of the task.
 * @property {string} title - The title or name of the task.
 * @property {number} hours - The esimated or recorded hours for the task.
 * @property {number} costs - The cost associated with the task.
 * @property {Task[]} children - An array of subtassks associated with the task.
 **/

/**
 * @type {Task[]}
 **/
let allTasks = [
    {id: 1, title: "Task 1", hours: 3, costs: 12.5, children: []},
    {id: 2, title: "Task 2", hours: 2, costs: 7.5,  children: []},
    {id: 3, title: "Task 3", hours: 4, costs: 17.5, children: []},
    {id: 4, title: "Task 4", hours: 5, costs: 18.5, children: [
        {id: 5, title: "Task 5", hours: 1, costs: 1.5, children: [
            {id: 6, title: "Task 6", hours: 4, costs: 5, children: []}
        ]},
    ]},
]

const tbodyPosition = document.querySelector("tbody#content").getBoundingClientRect()
let offsetX = 0

/**
 * Prepare data at the start of drag.
 *
 * @param {DragEvent} event
 * @returns {void}
 **/
function handleDragStart(event) {
    offsetX = event.clientX - tbodyPosition.left;
    event.dataTransfer.setData("text/plain", event.target.dataset.id)
}

/**
 * @param {DragEvent} event
 * @returns {void}
 **/
function handleDragOver(event) {
    event.preventDefault();
}

/**
 * @param {DragEvent} event
 * @returns {void}
 **/
function handleDragEnter(event) {
    event.currentTarget.style.borderBottom = 'solid 30px transparent';
}

/**
 * @param {DragEvent} event
 * @returns {void}
 **/
function handleDragLeave(event) {
    event.currentTarget.style.borderBottom = 'solid 0px transparent';
}

/**
 * Recursively emoves a task with a specified ID from a list of tasks.
 *
 * @param {int} id - Id of the task to remove.
 * @param {Task[]} tasks - The list of all tasks.
 * @returns {Task} task - Returns the removed task.
 **/
function removeTask(id, tasks) {
    let index = tasks.findIndex(task => task.id == id)
    if (index > -1) {
        const target = tasks[index]
        tasks.splice(index, 1)
        return target
    }
    for (let task of tasks) {
        const target = removeTask(id, task.children)
        if (target != null) {
            return target
        }
    }
    return null
}

/**
 * Recursively searches for a task with specified id from a list of tasks & returns it.
 *
 * @param {int} id - Id of the task to remove.
 * @param {Task[]} tasks - The list of all tasks.
 * @returns {[Task|null, number[]]} task - Returns the removed task or null if not found.
 **/
function findTask(id, tasks) {
    let index = tasks.findIndex(task => task.id == id)
    if (index > -1) {
        return [tasks[index], [index]]
    }
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        const [target, innerIndex] = findTask(id, task.children)
        if (target != null) {
            return [target, [i, ...innerIndex]]
        }
    }
    return [null, []]
}

/**
 * Recursively searches for a task one before specified id from a list of tasks & returns it.
 *
 * @param {int} id - Id of the task to remove.
 * @param {Task[]} tasks - The list of all tasks.
 * @returns {[Task|null, number[]} task - Returns the removed task or null if not found.
 **/
function findTaskOneBefore(id, taskList) {
    let index = taskList.findIndex(task => task.id == id)
    if (index > -1) {
        return [taskList[Math.max(index-1, 0)], [Math.max(index-1, 0)]]
    }
    for (let i = 0; i < taskList.length; i++) {
        const task = taskList[i]
        const [target, innerIndex] = findTask(id, task.children)
        if (target != null) {
            return [target, [i, ...innerIndex]]
        }
    }
    return [null, []]
}

/**
 * Find tasks at given level or nearest level
 *
 * @param {Task[]} tasks- a list of tasks
 * @param {number} level
 * @returns {Task[]}
 * */
function getTasksOfNearestLevel(tasks, level) {
    let currentLevel = 0;
    let currTasks = tasks;
    while (true) {
        if (currentLevel >= level) {
            break
        }
        let resultTasks = []
        for (let task of currTasks) {
            resultTasks = [...resultTasks, ...task.children]
        }
        if (resultTasks.length == 0) {
            break
        }
        currTasks = resultTasks;
        currentLevel += 1

    }
    return currTasks;
}

/**
 * Recursively checks if passed task is parent of task with given task id
 *
 * @param {Task} possibleParentTask
 * @param {number} childTaskId
 * @returns {Task}
 **/
function isParentTaskOf(possibleParentTask, childTaskId) {
    for (let task of possibleParentTask.children) {
        if (task.id == childTaskId) {
            return true
        }
        if (task.children.some(task => isParentTaskOf(task, childTaskId))) {
            return true
        }
    }
    return false
}

/**
 * @param {Task[]} tasks
 * @param {Task} droppedTask
 * @param {Task} targetTask
 * @param {number[]} targetIndexChain
 * @param {number} level
 * @returns {Task[]}
 **/
function updateTaskOrder(tasks, droppedTask, targetTask, targetIndexChain, level) {
    console.log(tasks, droppedTask, targetTask, targetIndexChain, level)
    const targetIndex = targetIndexChain[targetIndexChain.length-1]
    if (level == 0) {
        return [
            ...tasks.slice(0, targetIndex+1), droppedTask, ...tasks.slice(targetIndex+1)
        ]
    } else {
        // searching tasks level-1 because the parent is going to one level up than the child task
        const possibleParentTasks = getTasksOfNearestLevel(tasks, level-1);
        const confirmedParent = (possibleParentTasks.includes(targetTask)) ?
            possibleParentTasks.find(task => task == targetTask)
            :
            // adding this condition because target task a nested child of the parent task
            // but we have to find the parent at the correct level & add the droppedTask to
            // the correct level parent which is in possibleParentTasks
            possibleParentTasks.find(task => isParentTaskOf(task, targetTask.id));
        console.log(possibleParentTasks.includes(targetTask), confirmedParent, possibleParentTasks, level-1);
        confirmedParent.children = [
            ...confirmedParent.children.slice(0, targetIndex+1), droppedTask, ...confirmedParent.children.slice(targetIndex+1)
        ]
        return tasks;
    }
}

/**
 * @param {number} clientX1
 * @param {number} margin
 * @returns {number}
*/
function getLevel(clientX1, margin = 50) {
    const level = Math.floor(Math.abs(tbodyPosition.left - clientX1) / margin)
    console.log("tbody.left", tbodyPosition.left, "offseted clientX", clientX1, "original offsetX", offsetX, "level", level)
    return level;
}

/**
 * @param {DragEvent} event
 * @returns {void}
*/
function handleDrop(event) {
    const allTaskCopy = JSON.parse(JSON.stringify(allTasks))
    try {
        const level = getLevel(event.clientX-offsetX)
        const droppedId = event.dataTransfer.getData("text/plain");
        const targetId = event.currentTarget.dataset.id;
        const [droppedTask, droppedIndex] = findTask(droppedId, allTasks)
        if (droppedId == targetId && level == droppedIndex.length-1) {
            handleDragLeave(event)
            return
        }
        if (droppedTask == null) {
            console.log("Dropped Tasks is null???", droppedIndex, droppedTask)
            return
        }
        if (droppedId == targetId) {
            let [targetTask, targetIndex] = findTaskOneBefore(targetId, allTasks)
            removeTask(droppedId, allTasks)
            if (level < (targetIndex.length-1)) {
                targetIndex = targetIndex.slice(0, level+1)
            }
            allTasks = updateTaskOrder(allTasks, droppedTask, targetTask, targetIndex, level)
        } else {
            removeTask(droppedId, allTasks)
            let [targetTask, targetIndex] = findTask(targetId, allTasks)
            if (level < (targetIndex.length-1)) {
                targetIndex = targetIndex.slice(0, level+1)
            }
            allTasks = updateTaskOrder(allTasks, droppedTask, targetTask, targetIndex, level)
        }

        updateRowsHTML(allTasks)
    } catch (e) {
        console.error(e)
        allTasks = allTaskCopy;
        updateRowsHTML(allTasks)
    }
}

function getRecursiveSum(task, key) {
    let sum = task[key];
    for (let innerTask of task.children) {
        sum += getRecursiveSum(innerTask, key);
    }
    return sum;
}

function getRowHtml(item, paddingLeft = 0) {
    let title = item.title;
    let costs = item.costs;
    let hours = item.hours;
    if (item.children.length) {
        title += ` + ${item.children.map(t => t.title).join(' + ')}`;
        costs = getRecursiveSum(item, "costs")
        hours = getRecursiveSum(item, "hours")
    }
    return `
    <tr
        draggable="true"
        ondragstart="handleDragStart(event)"
        ondragenter="handleDragEnter(event)"
        ondragleave="handleDragLeave(event)"
        ondragover="handleDragOver(event)"
        ondrop="handleDrop(event)"
        data-id="${item.id}"
        style="border-left: solid ${paddingLeft}px transparent;"
    >
        <td> ⦾ ${title}</td>
        <td>${hours}</td>
        <td>${costs}</td>
        ${item.children.map(child => getRowHtml(child, paddingLeft+100)).join("\n")}
    </tr>
    `;
}

function updateRowsHTML(rows) {
    const tableBody = document.querySelector("tbody#content")
    tableBody.innerHTML = "";
    rows.forEach(item => {
        tableBody.innerHTML += getRowHtml(item)
    })
}

updateRowsHTML(allTasks)
