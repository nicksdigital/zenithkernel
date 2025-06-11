/**
 * TodoList Component for ZenithStore Demo
 * 
 * This demonstrates ZenithKernel's store integration with reactive
 * state management and immutable updates.
 */

import { Signal, signal, computed } from '@core/signals';
import { ZenithStore } from '@core/store';
import { AppState, Todo, selectors } from '../stores/appStore';

/**
 * TodoList Component
 * 
 * This component manages a list of todos using ZenithStore
 * and provides reactive signals for UI updates.
 */
export class TodoListComponent {
  private store: ZenithStore<AppState>;
  
  // Reactive signals
  public todos: Signal<Todo[]>;
  public filter: Signal<'all' | 'active' | 'completed'>;
  public filteredTodos: Signal<Todo[]>;
  public activeCount: Signal<number>;
  public completedCount: Signal<number>;
  public allCompleted: Signal<boolean>;
  
  // Input state
  public newTodoText: Signal<string>;
  public editingTodo: Signal<number | null>;
  public editText: Signal<string>;
  
  constructor(store: ZenithStore<AppState>) {
    this.store = store;
    
    // Initialize signals
    this.setupSignals();
    
    // Subscribe to store changes
    this.subscribeToStore();
  }
  
  /**
   * Add a new todo
   */
  addTodo(text: string): void {
    if (!text.trim()) return;
    
    this.store.dispatch({
      type: 'ADD_TODO',
      payload: text.trim()
    });
    
    // Clear input
    this.newTodoText.value = '';
  }
  
  /**
   * Toggle todo completion status
   */
  toggleTodo(id: number): void {
    this.store.dispatch({
      type: 'TOGGLE_TODO',
      payload: id
    });
  }
  
  /**
   * Delete a todo
   */
  deleteTodo(id: number): void {
    this.store.dispatch({
      type: 'DELETE_TODO',
      payload: id
    });
  }
  
  /**
   * Start editing a todo
   */
  startEditing(id: number): void {
    const todo = this.todos.value.find(t => t.id === id);
    if (todo) {
      this.editingTodo.value = id;
      this.editText.value = todo.text;
    }
  }
  
  /**
   * Save edited todo
   */
  saveEdit(): void {
    const id = this.editingTodo.value;
    const text = this.editText.value.trim();
    
    if (id && text) {
      this.store.dispatch({
        type: 'EDIT_TODO',
        payload: { id, text }
      });
    }
    
    this.cancelEdit();
  }
  
  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingTodo.value = null;
    this.editText.value = '';
  }
  
  /**
   * Set filter for todos
   */
  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.store.dispatch({
      type: 'SET_TODO_FILTER',
      payload: filter
    });
  }
  
  /**
   * Clear all completed todos
   */
  clearCompleted(): void {
    this.store.dispatch({
      type: 'CLEAR_COMPLETED_TODOS'
    });
  }
  
  /**
   * Toggle all todos completion status
   */
  toggleAll(): void {
    const allCompleted = this.allCompleted.value;
    const todos = this.todos.value;
    
    // If all are completed, mark all as incomplete
    // If not all are completed, mark all as complete
    todos.forEach(todo => {
      if (todo.completed === allCompleted) {
        this.toggleTodo(todo.id);
      }
    });
  }
  
  /**
   * Get todo statistics
   */
  getStats(): {
    total: number;
    active: number;
    completed: number;
    percentComplete: number;
  } {
    const todos = this.todos.value;
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, active, completed, percentComplete };
  }
  
  /**
   * Export todos as JSON
   */
  exportTodos(): string {
    return JSON.stringify(this.todos.value, null, 2);
  }
  
  /**
   * Import todos from JSON
   */
  importTodos(jsonData: string): boolean {
    try {
      const todos = JSON.parse(jsonData) as Todo[];
      
      // Validate todo structure
      if (!Array.isArray(todos)) {
        throw new Error('Invalid format: expected array');
      }
      
      todos.forEach((todo, index) => {
        if (!todo.id || !todo.text || typeof todo.completed !== 'boolean') {
          throw new Error(`Invalid todo at index ${index}`);
        }
      });
      
      // Clear existing todos and add imported ones
      const state = this.store.getState();
      const clearedState = {
        ...state,
        todos: {
          ...state.todos,
          items: [],
          nextId: 1
        }
      };
      
      // Add each todo
      todos.forEach(todo => {
        this.store.dispatch({
          type: 'ADD_TODO',
          payload: todo.text
        });
        
        if (todo.completed) {
          this.store.dispatch({
            type: 'TOGGLE_TODO',
            payload: todo.id
          });
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import todos:', error);
      return false;
    }
  }
  
  /**
   * Dispose of the component
   */
  dispose(): void {
    // Dispose all signals
    this.todos.dispose();
    this.filter.dispose();
    this.filteredTodos.dispose();
    this.activeCount.dispose();
    this.completedCount.dispose();
    this.allCompleted.dispose();
    this.newTodoText.dispose();
    this.editingTodo.dispose();
    this.editText.dispose();
  }
  
  /**
   * Set up reactive signals
   */
  private setupSignals(): void {
    const state = this.store.getState();
    
    // Basic signals
    this.todos = signal(selectors.getAllTodos(state), { name: 'todos' });
    this.filter = signal(selectors.getTodoFilter(state), { name: 'todo-filter' });
    this.newTodoText = signal('', { name: 'new-todo-text' });
    this.editingTodo = signal<number | null>(null, { name: 'editing-todo' });
    this.editText = signal('', { name: 'edit-text' });
    
    // Computed signals
    this.filteredTodos = computed(() => {
      const todos = this.todos.value;
      const filter = this.filter.value;
      
      switch (filter) {
        case 'active':
          return todos.filter(todo => !todo.completed);
        case 'completed':
          return todos.filter(todo => todo.completed);
        default:
          return todos;
      }
    }, { name: 'filtered-todos' });
    
    this.activeCount = computed(() => {
      return this.todos.value.filter(todo => !todo.completed).length;
    }, { name: 'active-count' });
    
    this.completedCount = computed(() => {
      return this.todos.value.filter(todo => todo.completed).length;
    }, { name: 'completed-count' });
    
    this.allCompleted = computed(() => {
      const todos = this.todos.value;
      return todos.length > 0 && todos.every(todo => todo.completed);
    }, { name: 'all-completed' });
  }
  
  /**
   * Subscribe to store changes
   */
  private subscribeToStore(): void {
    this.store.subscribe((state) => {
      // Update signals when store changes
      this.todos.value = selectors.getAllTodos(state);
      this.filter.value = selectors.getTodoFilter(state);
    });
  }
}

/**
 * Create a TodoList component instance
 */
export function createTodoList(store: ZenithStore<AppState>): TodoListComponent {
  return new TodoListComponent(store);
}
