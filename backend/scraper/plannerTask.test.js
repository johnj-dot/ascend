import assert from 'node:assert';

// Test Planner Task Edit & Update Logic
function updateTaskHelper(tasks, id, updates) {
  return tasks.map(t => (t.id === id ? { ...t, ...updates } : t));
}

const initialTasks = [
  { id: '1', name: 'Math HW', type: 'Homework', dueDate: '2026-08-30', completed: false },
  { id: '2', name: 'Science Lab', type: 'Lab', dueDate: '2026-09-01', completed: true },
];

// Test 1: Update task name and dueDate
const updated1 = updateTaskHelper(initialTasks, '1', { name: 'Math HW Ch 4', dueDate: '2026-08-31' });
assert.strictEqual(updated1[0].name, 'Math HW Ch 4');
assert.strictEqual(updated1[0].dueDate, '2026-08-31');
assert.strictEqual(updated1[0].completed, false); // Preserved

// Test 2: Ensure other tasks unaffected
assert.strictEqual(updated1[1].name, 'Science Lab');
assert.strictEqual(updated1[1].completed, true);

console.log('✔ All planner task edit tests passed successfully!');
