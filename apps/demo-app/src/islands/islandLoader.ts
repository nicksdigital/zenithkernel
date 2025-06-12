/**
 * Island Loader for ZenithKernel Demo App
 * 
 * This handles client-side hydration of interactive islands
 * using ZenithKernel's islands architecture.
 */

import { signal, computed, effect } from '@core/signals';
import { createAppStore } from '../stores/appStore';

// Simple counter creator function
function createCounter(initialValue = 0, options: any = {}) {
  const count = signal(initialValue);
  const updateCount = signal(0);
  const min = options.min;
  const max = options.max;

  const isAtMin = computed(() => min !== undefined ? count.value <= min : false);
  const isAtMax = computed(() => max !== undefined ? count.value >= max : false);

  return {
    valueSignal: count, // For compatibility
    count,
    updateCount,
    isAtMin,
    isAtMax,
    increment() {
      if (max === undefined || count.value < max) {
        count.value++;
        updateCount.value++;
      }
    },
    decrement() {
      if (min === undefined || count.value > min) {
        count.value--;
        updateCount.value++;
      }
    },
    reset() {
      count.value = initialValue;
      updateCount.value++;
    },
    dispose() {
      // Cleanup function
    }
  };
}

// Simple todo list creator function
function createTodoList(store: any) {
  const todos = signal([] as any[]);
  const newTodoText = signal('');
  const filteredTodos = computed(() => todos.value);

  return {
    todos,
    newTodoText,
    filteredTodos,
    addTodo(text: string) {
      const newTodo = {
        id: Date.now(),
        text,
        completed: false
      };
      todos.value = [...todos.value, newTodo];
      newTodoText.value = '';
      store.dispatch({ type: 'ADD_TODO', payload: text });
    },
    toggleTodo(id: number) {
      todos.value = todos.value.map((todo: any) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      store.dispatch({ type: 'TOGGLE_TODO', payload: id });
    },
    deleteTodo(id: number) {
      todos.value = todos.value.filter((todo: any) => todo.id !== id);
      store.dispatch({ type: 'DELETE_TODO', payload: id });
    },
    dispose() {
      // Cleanup function
    }
  };
}

/**
 * Island Registry
 */
interface IslandDefinition {
  name: string;
  selector: string;
  hydrate: (element: HTMLElement) => () => void; // Returns cleanup function
}

/**
 * Global island registry
 */
const islandRegistry = new Map<string, IslandDefinition>();

/**
 * Active island instances
 */
const activeIslands = new Map<HTMLElement, () => void>();

/**
 * Register an island type
 */
function registerIsland(definition: IslandDefinition): void {
  islandRegistry.set(definition.name, definition);
}

/**
 * Counter Island Implementation
 */
function hydrateCounterIsland(element: HTMLElement): () => void {
  console.log('🏝️ Hydrating counter island');
  
  // Create counter component
  const counter = createCounter(0, { min: 0, max: 100 });
  
  // Get DOM elements
  const valueDisplay = element.querySelector('.counter-value') as HTMLElement;
  const incrementBtn = element.querySelector('[data-action="increment"]') as HTMLButtonElement;
  const decrementBtn = element.querySelector('[data-action="decrement"]') as HTMLButtonElement;
  const resetBtn = element.querySelector('[data-action="reset"]') as HTMLButtonElement;
  
  if (!valueDisplay || !incrementBtn || !decrementBtn || !resetBtn) {
    console.error('Counter island: Missing required DOM elements');
    return () => {};
  }
  
  // Set up reactive updates
  const updateDisplay = effect(() => {
    valueDisplay.textContent = counter.valueSignal.value.toString();
    
    // Update button states
    decrementBtn.disabled = counter.isAtMin.value;
    incrementBtn.disabled = counter.isAtMax.value;
  });
  
  // Set up event listeners
  const handleIncrement = () => counter.increment();
  const handleDecrement = () => counter.decrement();
  const handleReset = () => counter.reset();
  
  incrementBtn.addEventListener('click', handleIncrement);
  decrementBtn.addEventListener('click', handleDecrement);
  resetBtn.addEventListener('click', handleReset);
  
  // Add visual feedback
  element.classList.add('hydrated');
  
  // Return cleanup function
  return () => {
    updateDisplay.dispose();
    counter.dispose();
    incrementBtn.removeEventListener('click', handleIncrement);
    decrementBtn.removeEventListener('click', handleDecrement);
    resetBtn.removeEventListener('click', handleReset);
    element.classList.remove('hydrated');
  };
}

/**
 * Todos Island Implementation
 */
function hydrateTodosIsland(element: HTMLElement): () => void {
  console.log('🏝️ Hydrating todos island');
  
  // Create store and todo list
  const store = createAppStore();
  const todoList = createTodoList(store);
  
  // Get DOM elements
  const inputField = element.querySelector('.todo-input-field') as HTMLInputElement;
  const addBtn = element.querySelector('[data-action="add-todo"]') as HTMLButtonElement;
  const todoListContainer = element.querySelector('.todo-list') as HTMLElement;
  
  if (!inputField || !addBtn || !todoListContainer) {
    console.error('Todos island: Missing required DOM elements');
    return () => {};
  }
  
  // Set up reactive todo list rendering
  const updateTodoList = effect(() => {
    const todos = todoList.filteredTodos.value;
    
    todoListContainer.innerHTML = todos.length === 0 
      ? '<div class="empty-state">No todos yet. Add one above!</div>'
      : todos.map(todo => `
          <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" data-action="delete">×</button>
          </div>
        `).join('');
    
    // Add event listeners to new todo items
    setupTodoItemListeners();
  });
  
  // Set up input synchronization
  const syncInput = effect(() => {
    inputField.value = todoList.newTodoText.value;
  });
  
  // Event handlers
  const handleAddTodo = () => {
    const text = inputField.value.trim();
    if (text) {
      todoList.addTodo(text);
      inputField.value = '';
    }
  };
  
  const handleInputChange = () => {
    todoList.newTodoText.value = inputField.value;
  };
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };
  
  // Set up todo item event listeners
  function setupTodoItemListeners() {
    const checkboxes = todoListContainer.querySelectorAll('.todo-checkbox');
    const deleteButtons = todoListContainer.querySelectorAll('.todo-delete');
    
    checkboxes.forEach(checkbox => {
      const todoItem = checkbox.closest('.todo-item') as HTMLElement;
      const todoId = parseInt(todoItem.dataset.id || '0');
      
      checkbox.addEventListener('change', () => {
        todoList.toggleTodo(todoId);
      });
    });
    
    deleteButtons.forEach(button => {
      const todoItem = button.closest('.todo-item') as HTMLElement;
      const todoId = parseInt(todoItem.dataset.id || '0');
      
      button.addEventListener('click', () => {
        todoList.deleteTodo(todoId);
      });
    });
  }
  
  // Add event listeners
  addBtn.addEventListener('click', handleAddTodo);
  inputField.addEventListener('input', handleInputChange);
  inputField.addEventListener('keypress', handleKeyPress);
  
  // Add visual feedback
  element.classList.add('hydrated');
  
  // Return cleanup function
  return () => {
    updateTodoList.dispose();
    syncInput.dispose();
    todoList.dispose();
    addBtn.removeEventListener('click', handleAddTodo);
    inputField.removeEventListener('input', handleInputChange);
    inputField.removeEventListener('keypress', handleKeyPress);
    element.classList.remove('hydrated');
  };
}

/**
 * Signals Island Implementation
 */
function hydrateSignalsIsland(element: HTMLElement): () => void {
  console.log('🏝️ Hydrating signals island');
  
  // Create signals
  const textInput = signal('', { name: 'demo-text-input' });
  const computedLength = computed(() => textInput.value.length, { name: 'demo-computed-length' });
  
  // Get DOM elements
  const inputField = element.querySelector('.signal-input') as HTMLInputElement;
  const outputSpan = element.querySelector('.signal-value') as HTMLElement;
  const lengthSpan = element.querySelector('.computed-value') as HTMLElement;
  
  if (!inputField || !outputSpan || !lengthSpan) {
    console.error('Signals island: Missing required DOM elements');
    return () => {};
  }
  
  // Set up reactive updates
  const updateOutput = effect(() => {
    outputSpan.textContent = textInput.value;
  });
  
  const updateLength = effect(() => {
    lengthSpan.textContent = computedLength.value.toString();
  });
  
  // Event handlers
  const handleInput = () => {
    textInput.value = inputField.value;
  };
  
  // Add event listeners
  inputField.addEventListener('input', handleInput);
  
  // Add visual feedback
  element.classList.add('hydrated');
  
  // Return cleanup function
  return () => {
    updateOutput.dispose();
    updateLength.dispose();
    textInput.dispose();
    inputField.removeEventListener('input', handleInput);
    element.classList.remove('hydrated');
  };
}

/**
 * Register all island types
 */
function registerAllIslands(): void {
  registerIsland({
    name: 'counter',
    selector: '[data-island="counter"]',
    hydrate: hydrateCounterIsland
  });
  
  registerIsland({
    name: 'todos',
    selector: '[data-island="todos"]',
    hydrate: hydrateTodosIsland
  });
  
  registerIsland({
    name: 'signals',
    selector: '[data-island="signals"]',
    hydrate: hydrateSignalsIsland
  });
}

/**
 * Hydrate all islands on the page
 */
function hydrateAllIslands(): void {
  islandRegistry.forEach((definition) => {
    const elements = document.querySelectorAll(definition.selector);
    
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Skip if already hydrated
      if (activeIslands.has(htmlElement)) {
        return;
      }
      
      try {
        const cleanup = definition.hydrate(htmlElement);
        activeIslands.set(htmlElement, cleanup);
        console.log(`✅ Hydrated ${definition.name} island`);
      } catch (error) {
        console.error(`❌ Failed to hydrate ${definition.name} island:`, error);
      }
    });
  });
}

/**
 * Clean up all islands
 */
function cleanupAllIslands(): void {
  activeIslands.forEach((cleanup) => {
    try {
      cleanup();
    } catch (error) {
      console.error('Error during island cleanup:', error);
    }
  });
  
  activeIslands.clear();
}

/**
 * Initialize the island system
 */
export function initializeIslands(): void {
  console.log('🏝️ Initializing islands system...');
  
  // Register all island types
  registerAllIslands();
  
  // Hydrate existing islands
  hydrateAllIslands();
  
  // Set up mutation observer for dynamic islands
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver(() => {
      hydrateAllIslands();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanupAllIslands);
  }
  
  console.log('✅ Islands system initialized');
}

/**
 * Utility function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
