/**
 * Async & Concurrent Rendering implementation
 */

// Priority levels for rendering tasks
export enum RenderPriority {
  IMMEDIATE = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
  IDLE = 4
}

// Task status
export type TaskStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'error';

// Render task interface
interface RenderTask {
  id: number;
  callback: () => Promise<any> | any;
  priority: RenderPriority;
  startTime: number;
  status: TaskStatus;
  abortController?: AbortController;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Async Renderer for managing concurrent rendering tasks
 */
export class AsyncRenderer {
  // Task queue sorted by priority
  private tasks: RenderTask[] = [];
  
  // Currently running tasks
  private runningTasks: Set<number> = new Set();
  
  // Maximum concurrent tasks
  private maxConcurrent: number = 4;
  
  // Next task ID
  private nextTaskId: number = 1;
  
  // Flag to track if the renderer is processing
  private isProcessing: boolean = false;
  
  // Time budget for each task batch (in milliseconds)
  private timeBudgetPerBatch: number = 5;
  
  constructor(options: { maxConcurrent?: number, timeBudgetPerBatch?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 4;
    this.timeBudgetPerBatch = options.timeBudgetPerBatch ?? 5;
    
    // Start processing cycle
    this.processTasks();
  }
  
  /**
   * Schedule a render task
   */
  scheduleTask<T = any>(
    callback: () => Promise<T> | T,
    options: {
      priority?: RenderPriority,
      onComplete?: (result: T) => void,
      onError?: (error: Error) => void
    } = {}
  ): number {
    const priority = options.priority ?? RenderPriority.NORMAL;
    const abortController = new AbortController();
    
    const task: RenderTask = {
      id: this.nextTaskId++,
      callback,
      priority,
      startTime: performance.now(),
      status: 'pending',
      abortController,
      onComplete: options.onComplete,
      onError: options.onError
    };
    
    // Insert task in priority order
    const insertIndex = this.tasks.findIndex(t => t.priority > priority);
    if (insertIndex === -1) {
      this.tasks.push(task);
    } else {
      this.tasks.splice(insertIndex, 0, task);
    }
    
    // Wake up processor if it's idle
    if (!this.isProcessing) {
      this.processTasks();
    }
    
    return task.id;
  }
  
  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId: number): boolean {
    const index = this.tasks.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      // Remove from pending queue
      const [task] = this.tasks.splice(index, 1);
      task.status = 'cancelled';
      return true;
    }
    
    // Check if it's running
    if (this.runningTasks.has(taskId)) {
      // Try to abort if possible
      const task = Array.from(this.tasks).find(t => t.id === taskId);
      if (task && task.abortController) {
        task.abortController.abort();
        task.status = 'cancelled';
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Process pending tasks
   */
  private async processTasks(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      while (this.tasks.length > 0 && this.runningTasks.size < this.maxConcurrent) {
        const startTime = performance.now();
        let processedCount = 0;
        
        // Process a batch of tasks within time budget
        while (
          this.tasks.length > 0 && 
          this.runningTasks.size < this.maxConcurrent &&
          performance.now() - startTime < this.timeBudgetPerBatch
        ) {
          // Get next task
          const task = this.tasks.shift();
          if (!task) break;
          
          // Mark as running
          task.status = 'running';
          this.runningTasks.add(task.id);
          
          // Execute async
          this.executeTask(task).finally(() => {
            this.runningTasks.delete(task.id);
            
            // Wake up processor if needed
            if (!this.isProcessing && this.tasks.length > 0) {
              this.processTasks();
            }
          });
          
          processedCount++;
        }
        
        if (processedCount === 0 && this.tasks.length === 0) {
          break;
        }
        
        // Yield to browser
        if (this.tasks.length > 0 || this.runningTasks.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } finally {
      // If we still have tasks but no running tasks, schedule another cycle
      if (this.tasks.length > 0 && this.runningTasks.size === 0) {
        setTimeout(() => this.processTasks(), 0);
      } else {
        this.isProcessing = false;
      }
    }
  }
  
  /**
   * Execute a task and handle its result
   */
  private async executeTask(task: RenderTask): Promise<void> {
    try {
      // Setup signal for task abortion
      const signal = task.abortController?.signal;
      
      // Execute the task with abort signal available
      const originalCallback = task.callback;
      const callbackResult = originalCallback();
      
      // Handle result (whether synchronous or asynchronous)
      const result = callbackResult instanceof Promise 
        ? await callbackResult 
        : callbackResult;
      
      // Check if cancelled during execution
      if (signal?.aborted) {
        task.status = 'cancelled';
        return;
      }
      
      // Mark as completed and call completion handler
      task.status = 'completed';
      if (task.onComplete) {
        task.onComplete(result);
      }
    } catch (error) {
      // Mark as error and call error handler
      task.status = 'error';
      if (task.onError) {
        task.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * Get current task count
   */
  getTaskCount(): number {
    return this.tasks.length + this.runningTasks.size;
  }
  
  /**
   * Get current pending task count
   */
  getPendingTaskCount(): number {
    return this.tasks.length;
  }
  
  /**
   * Get current running task count
   */
  getRunningTaskCount(): number {
    return this.runningTasks.size;
  }
  
  /**
   * Clear all pending tasks
   */
  clearPendingTasks(): number {
    const count = this.tasks.length;
    this.tasks = [];
    return count;
  }
  
  /**
   * Abort all running tasks
   */
  abortAllRunningTasks(): number {
    let count = 0;
    
    for (const task of this.tasks) {
      if (task.status === 'running' && task.abortController) {
        task.abortController.abort();
        task.status = 'cancelled';
        count++;
      }
    }
    
    return count;
  }
}

/**
 * Create an async renderer instance with default settings
 */
export const createAsyncRenderer = (options?: { maxConcurrent?: number, timeBudgetPerBatch?: number }): AsyncRenderer => {
  return new AsyncRenderer(options);
};

// Default global instance
export const globalAsyncRenderer = new AsyncRenderer();
