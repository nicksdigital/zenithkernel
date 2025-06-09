/**
 * Streaming implementation for progressive rendering
 */

/**
 * Type definition for a chunk of streamed content
 */
export type StreamChunk = string | Uint8Array;

/**
 * Interface for stream controller
 */
export interface StreamController {
  write(chunk: StreamChunk): void;
  flush(): Promise<void>;
  close(): void;
  error(err: Error): void;
}

/**
 * Options for the renderer stream
 */
export interface StreamOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  bufferSize?: number;
  flushInterval?: number;
}

/**
 * Streaming renderer for progressive content delivery
 */
export class StreamingRenderer {
  private buffer: StreamChunk[] = [];
  private bufferSize: number;
  private flushInterval: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private closed: boolean = false;
  private onChunk: (chunk: StreamChunk) => void;
  private onError: (error: Error) => void;
  private onClose: () => void;
  
  constructor(options: StreamOptions = {}) {
    this.bufferSize = options.bufferSize || 4096;
    this.flushInterval = options.flushInterval || 100;
    this.onChunk = options.onChunk || (() => {});
    this.onError = options.onError || ((err) => console.error(err));
    this.onClose = options.onClose || (() => {});
  }
  
  /**
   * Create a controller for this stream
   */
  createController(): StreamController {
    return {
      write: this.write.bind(this),
      flush: this.flush.bind(this),
      close: this.close.bind(this),
      error: this.handleError.bind(this)
    };
  }
  
  /**
   * Write content to the stream
   */
  write(chunk: StreamChunk): void {
    if (this.closed) {
      throw new Error('Cannot write to closed stream');
    }
    
    this.buffer.push(chunk);
    
    // Start flush timer if not already running
    if (this.flushTimer === null) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
    
    // If buffer exceeds size, flush immediately
    if (this.getBufferSize() >= this.bufferSize) {
      this.flush();
    }
  }
  
  /**
   * Flush the buffer to the stream
   */
  async flush(): Promise<void> {
    if (this.closed || this.buffer.length === 0) return;
    
    // Clear any pending flush timer
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Get chunks to flush
    const chunks = [...this.buffer];
    this.buffer = [];
    
    // Send each chunk
    for (const chunk of chunks) {
      try {
        this.onChunk(chunk);
      } catch (err) {
        this.handleError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }
  
  /**
   * Close the stream
   */
  async close(): Promise<void> {
    if (this.closed) return;
    
    // Flush any remaining content
    await this.flush();
    
    this.closed = true;
    
    // Clear any pending flush timer
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.onClose();
  }
  
  /**
   * Handle stream errors
   */
  handleError(error: Error): void {
    this.onError(error);
    
    // Close the stream after error
    this.close().catch(err => {
      console.error('Error while closing stream after error:', err);
    });
  }
  
  /**
   * Get current buffer size (approximate)
   */
  private getBufferSize(): number {
    return this.buffer.reduce((size, chunk) => {
      if (typeof chunk === 'string') {
        // Approximate string size (2 bytes per char for UTF-16)
        return size + chunk.length * 2;
      } else {
        return size + chunk.byteLength;
      }
    }, 0);
  }
  
  /**
   * Check if the stream is closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Create a streaming HTML renderer
 */
export function createStreamingRenderer(options?: StreamOptions): {
  renderer: StreamingRenderer;
  controller: StreamController;
} {
  const renderer = new StreamingRenderer(options);
  const controller = renderer.createController();
  
  return { renderer, controller };
}

/**
 * Create a streaming HTML template renderer
 * Allows inserting async content into HTML templates
 */
export function streamTemplate(
  strings: TemplateStringsArray,
  ...values: Array<StreamChunk | Promise<StreamChunk>>
): (controller: StreamController) => Promise<void> {
  return async (controller: StreamController) => {
    for (let i = 0; i < strings.length; i++) {
      // Write static part
      const str = strings[i];
      if (str) {
        controller.write(str);
      }
      
      // Write dynamic part if available
      if (i < values.length) {
        const value = values[i];
        if (value instanceof Promise) {
          try {
            const resolved = await value;
            controller.write(resolved);
          } catch (err) {
            controller.error(err instanceof Error ? err : new Error(String(err)));
            return;
          }
        } else if (value !== undefined && value !== null) {
          controller.write(value);
        }
      }
      
      // Flush after each segment to enable progressive rendering
      await controller.flush();
    }
  };
}
