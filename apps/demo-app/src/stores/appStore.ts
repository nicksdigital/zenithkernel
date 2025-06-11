/**
 * Application Store using ZenithStore
 * 
 * This demonstrates ZenithKernel's type-safe state management system
 * with immutable updates, middleware, and time travel debugging.
 */

import { createStore, createAction, middleware } from '@core/store';

/**
 * Application State Interface
 */
export interface AppState {
  // App metadata
  isInitialized: boolean;
  currentView: 'home' | 'counter' | 'todos' | 'signals';
  theme: 'light' | 'dark';
  
  // User state
  user: {
    name: string;
    preferences: Record<string, any>;
  };
  
  // Counter state (ECS demo)
  counter: {
    value: number;
    history: number[];
    lastUpdated: number;
  };
  
  // Todos state (Store demo)
  todos: {
    items: Todo[];
    filter: 'all' | 'active' | 'completed';
    nextId: number;
  };
  
  // Signals demo state
  signals: {
    textInput: string;
    computedLength: number;
    effectCount: number;
  };
}

/**
 * Todo Item Interface
 */
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Initial Application State
 */
const initialState: AppState = {
  isInitialized: false,
  currentView: 'home',
  theme: 'light',
  
  user: {
    name: 'Demo User',
    preferences: {}
  },
  
  counter: {
    value: 0,
    history: [0],
    lastUpdated: Date.now()
  },
  
  todos: {
    items: [],
    filter: 'all',
    nextId: 1
  },
  
  signals: {
    textInput: '',
    computedLength: 0,
    effectCount: 0
  }
};

/**
 * Action Types
 */
export const actions = {
  // App actions
  setInitialized: createAction<boolean>('SET_INITIALIZED'),
  setCurrentView: createAction<AppState['currentView']>('SET_CURRENT_VIEW'),
  setTheme: createAction<AppState['theme']>('SET_THEME'),
  
  // Counter actions
  incrementCounter: createAction('INCREMENT_COUNTER'),
  decrementCounter: createAction('DECREMENT_COUNTER'),
  resetCounter: createAction('RESET_COUNTER'),
  setCounter: createAction<number>('SET_COUNTER'),
  
  // Todo actions
  addTodo: createAction<string>('ADD_TODO'),
  toggleTodo: createAction<number>('TOGGLE_TODO'),
  deleteTodo: createAction<number>('DELETE_TODO'),
  editTodo: createAction<{ id: number; text: string }>('EDIT_TODO'),
  setTodoFilter: createAction<AppState['todos']['filter']>('SET_TODO_FILTER'),
  clearCompletedTodos: createAction('CLEAR_COMPLETED_TODOS'),
  
  // Signals actions
  setTextInput: createAction<string>('SET_TEXT_INPUT'),
  incrementEffectCount: createAction('INCREMENT_EFFECT_COUNT')
};

/**
 * Reducer function
 */
function appReducer(state: AppState, action: any): AppState {
  switch (action.type) {
    // App reducers
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
      
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
      
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    // Counter reducers
    case 'INCREMENT_COUNTER':
      const newValue = state.counter.value + 1;
      return {
        ...state,
        counter: {
          value: newValue,
          history: [...state.counter.history, newValue],
          lastUpdated: Date.now()
        }
      };
      
    case 'DECREMENT_COUNTER':
      const decrementedValue = state.counter.value - 1;
      return {
        ...state,
        counter: {
          value: decrementedValue,
          history: [...state.counter.history, decrementedValue],
          lastUpdated: Date.now()
        }
      };
      
    case 'RESET_COUNTER':
      return {
        ...state,
        counter: {
          value: 0,
          history: [...state.counter.history, 0],
          lastUpdated: Date.now()
        }
      };
      
    case 'SET_COUNTER':
      return {
        ...state,
        counter: {
          value: action.payload,
          history: [...state.counter.history, action.payload],
          lastUpdated: Date.now()
        }
      };
    
    // Todo reducers
    case 'ADD_TODO':
      const newTodo: Todo = {
        id: state.todos.nextId,
        text: action.payload,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      return {
        ...state,
        todos: {
          ...state.todos,
          items: [...state.todos.items, newTodo],
          nextId: state.todos.nextId + 1
        }
      };
      
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.map(todo =>
            todo.id === action.payload
              ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
              : todo
          )
        }
      };
      
    case 'DELETE_TODO':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.filter(todo => todo.id !== action.payload)
        }
      };
      
    case 'EDIT_TODO':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.map(todo =>
            todo.id === action.payload.id
              ? { ...todo, text: action.payload.text, updatedAt: Date.now() }
              : todo
          )
        }
      };
      
    case 'SET_TODO_FILTER':
      return {
        ...state,
        todos: { ...state.todos, filter: action.payload }
      };
      
    case 'CLEAR_COMPLETED_TODOS':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.filter(todo => !todo.completed)
        }
      };
    
    // Signals reducers
    case 'SET_TEXT_INPUT':
      return {
        ...state,
        signals: {
          ...state.signals,
          textInput: action.payload,
          computedLength: action.payload.length
        }
      };
      
    case 'INCREMENT_EFFECT_COUNT':
      return {
        ...state,
        signals: {
          ...state.signals,
          effectCount: state.signals.effectCount + 1
        }
      };
    
    default:
      return state;
  }
}

/**
 * Create and configure the application store
 */
export function createAppStore() {
  const store = createStore({
    initialState,
    reducer: appReducer,
    middleware: [
      // Logger middleware for debugging
      middleware.logger({
        collapsed: true,
        predicate: () => process.env.NODE_ENV === 'development'
      }),
      
      // Performance middleware
      middleware.performance({
        warnAfter: 16 // Warn if action takes longer than 16ms
      }),
      
      // Persistence middleware (optional)
      middleware.persistence({
        key: 'zenith-demo-app',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        whitelist: ['theme', 'user.preferences', 'todos.items']
      })
    ]
  });
  
  return store;
}

/**
 * Selectors for efficient state access
 */
export const selectors = {
  // App selectors
  getIsInitialized: (state: AppState) => state.isInitialized,
  getCurrentView: (state: AppState) => state.currentView,
  getTheme: (state: AppState) => state.theme,
  
  // Counter selectors
  getCounterValue: (state: AppState) => state.counter.value,
  getCounterHistory: (state: AppState) => state.counter.history,
  
  // Todo selectors
  getAllTodos: (state: AppState) => state.todos.items,
  getActiveTodos: (state: AppState) => state.todos.items.filter(todo => !todo.completed),
  getCompletedTodos: (state: AppState) => state.todos.items.filter(todo => todo.completed),
  getTodoFilter: (state: AppState) => state.todos.filter,
  getFilteredTodos: (state: AppState) => {
    const { items, filter } = state.todos;
    switch (filter) {
      case 'active':
        return items.filter(todo => !todo.completed);
      case 'completed':
        return items.filter(todo => todo.completed);
      default:
        return items;
    }
  },
  
  // Signals selectors
  getTextInput: (state: AppState) => state.signals.textInput,
  getComputedLength: (state: AppState) => state.signals.computedLength,
  getEffectCount: (state: AppState) => state.signals.effectCount
};
