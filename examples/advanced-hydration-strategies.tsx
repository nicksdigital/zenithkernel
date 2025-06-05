/**
 * Advanced Hydration Strategies Example
 * 
 * This example demonstrates all available hydration strategies
 * in the ZenithKernel Hydra system, including performance optimizations
 * and real-world use cases.
 */

import React, { useState, useEffect, useRef } from 'react';
import { jsx } from '../src/modules/Rendering/jsx-runtime';
import { HydraLoader } from '../src/components/hydra/HydraLoader';
import { triggerHydration } from '../src/components/hydra/HydraLoader';
import type { IslandComponent, HydraContext } from '../src/modules/Rendering/types';

// Performance monitoring island
export const PerformanceMonitorIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: any, context?: HydraContext) => {
    const { trackingId = 'default' } = props;
    const startTime = performance.now();
    let metrics = {
      hydrationTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: 0
    };

    const container = (
      <div className="performance-monitor-island">
        <h4>📊 Performance Monitor ({trackingId})</h4>
        <div className="metrics-grid">
          <div className="metric">
            <label>Hydration:</label>
            <span className="hydration-time">-</span>
          </div>
          <div className="metric">
            <label>Render:</label>
            <span className="render-time">-</span>
          </div>
          <div className="metric">
            <label>Interaction:</label>
            <span className="interaction-time">-</span>
          </div>
          <div className="metric">
            <label>Memory:</label>
            <span className="memory-usage">-</span>
          </div>
        </div>
        <div className="strategy-info">
          <span>Strategy: {context?.strategy || 'immediate'}</span>
          <span>Trust: {context?.trustLevel || 'unverified'}</span>
        </div>
      </div>
    ) as HTMLElement;

    // Calculate hydration time
    const hydrationEnd = performance.now();
    metrics.hydrationTime = hydrationEnd - startTime;

    // Measure render time
    const renderStart = performance.now();
    element.innerHTML = '';
    element.appendChild(container);
    const renderEnd = performance.now();
    metrics.renderTime = renderEnd - renderStart;

    // Measure memory usage (if available)
    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Update UI with metrics
    const updateMetrics = () => {
      (container.querySelector('.hydration-time') as HTMLElement).textContent = `${metrics.hydrationTime.toFixed(2)}ms`;
      (container.querySelector('.render-time') as HTMLElement).textContent = `${metrics.renderTime.toFixed(2)}ms`;
      (container.querySelector('.interaction-time') as HTMLElement).textContent = `${metrics.interactionTime.toFixed(2)}ms`;
      (container.querySelector('.memory-usage') as HTMLElement).textContent = `${metrics.memoryUsage.toFixed(1)}MB`;
    };

    updateMetrics();

    // Track interaction time
    const interactionStart = performance.now();
    container.addEventListener('click', () => {
      const interactionEnd = performance.now();
      metrics.interactionTime = interactionEnd - interactionStart;
      updateMetrics();
    });

    console.log(`📊 Performance metrics for ${trackingId}:`, metrics);

    return () => {
      console.log(`🧹 Cleanup performance monitor ${trackingId}`);
    };
  }
};

// Heavy computation island for testing strategies
export const HeavyComputationIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: any, context?: HydraContext) => {
    const { iterations = 1000000, label = 'Heavy Task' } = props;
    const [isComputing, setIsComputing] = useState(false);
    const [result, setResult] = useState<number | null>(null);

    const container = (
      <div className="heavy-computation-island">
        <h4>⚡ {label}</h4>
        <div className="computation-status">
          <div className="status">
            Status: {isComputing ? 'Computing...' : (result !== null ? 'Complete' : 'Ready')}
          </div>
          <div className="iterations">Iterations: {iterations.toLocaleString()}</div>
          {result !== null && (
            <div className="result">Result: {result.toFixed(6)}</div>
          )}
        </div>
        <div className="controls">
          <button className="compute-btn" disabled={isComputing}>
            {isComputing ? '⏳ Computing...' : '🚀 Start Computation'}
          </button>
          <button className="reset-btn">🔄 Reset</button>
        </div>
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress" style="width: 0%"></div>
          </div>
        </div>
      </div>
    ) as HTMLElement;

    const performHeavyComputation = async () => {
      setIsComputing(true);
      setResult(null);
      updateUI();

      const progressBar = container.querySelector('.progress') as HTMLElement;
      let computationResult = 0;

      // Simulate heavy computation with progress updates
      for (let i = 0; i < iterations; i++) {
        // Expensive operation
        computationResult += Math.sin(i) * Math.cos(i) * Math.sqrt(i + 1);
        
        // Update progress periodically
        if (i % (iterations / 100) === 0) {
          const progress = (i / iterations) * 100;
          progressBar.style.width = `${progress}%`;
          
          // Yield to browser to keep UI responsive
          if (i % (iterations / 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }

      progressBar.style.width = '100%';
      setResult(computationResult);
      setIsComputing(false);
      updateUI();
    };

    const resetComputation = () => {
      setIsComputing(false);
      setResult(null);
      const progressBar = container.querySelector('.progress') as HTMLElement;
      progressBar.style.width = '0%';
      updateUI();
    };

    const updateUI = () => {
      const computeBtn = container.querySelector('.compute-btn') as HTMLButtonElement;
      const statusDiv = container.querySelector('.status') as HTMLElement;
      const resultDiv = container.querySelector('.result') as HTMLElement;

      computeBtn.disabled = isComputing;
      computeBtn.textContent = isComputing ? '⏳ Computing...' : '🚀 Start Computation';
      statusDiv.textContent = `Status: ${isComputing ? 'Computing...' : (result !== null ? 'Complete' : 'Ready')}`;
      
      if (result !== null) {
        resultDiv.textContent = `Result: ${result.toFixed(6)}`;
        resultDiv.style.display = 'block';
      } else {
        resultDiv.style.display = 'none';
      }
    };

    // Event listeners
    const computeBtn = container.querySelector('.compute-btn');
    const resetBtn = container.querySelector('.reset-btn');

    computeBtn?.addEventListener('click', performHeavyComputation);
    resetBtn?.addEventListener('click', resetComputation);

    // Mount to DOM
    element.innerHTML = '';
    element.appendChild(container);
    updateUI();

    return () => {
      console.log(`🧹 Cleanup heavy computation: ${label}`);
    };
  }
};

// Intersection observer demo island
export const VisibilityDetectorIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: any, context?: HydraContext) => {
    const { threshold = 0.5 } = props;
    const [isVisible, setIsVisible] = useState(false);
    const [intersectionCount, setIntersectionCount] = useState(0);

    const container = (
      <div className="visibility-detector-island">
        <h4>👁️ Visibility Detector</h4>
        <div className="visibility-status">
          <div className={`status-indicator ${isVisible ? 'visible' : 'hidden'}`}>
            {isVisible ? '✅ Visible' : '❌ Hidden'}
          </div>
          <div className="intersection-count">
            Intersections: {intersectionCount}
          </div>
          <div className="threshold-info">
            Threshold: {threshold * 100}%
          </div>
        </div>
        <div className="visibility-history">
          <div className="history-list"></div>
        </div>
      </div>
    ) as HTMLElement;

    const updateVisibilityStatus = () => {
      const statusIndicator = container.querySelector('.status-indicator') as HTMLElement;
      const countDiv = container.querySelector('.intersection-count') as HTMLElement;
      
      statusIndicator.className = `status-indicator ${isVisible ? 'visible' : 'hidden'}`;
      statusIndicator.textContent = isVisible ? '✅ Visible' : '❌ Hidden';
      countDiv.textContent = `Intersections: ${intersectionCount}`;
    };

    const addHistoryEntry = (visible: boolean) => {
      const historyList = container.querySelector('.history-list') as HTMLElement;
      const timestamp = new Date().toLocaleTimeString();
      
      const entry = document.createElement('div');
      entry.className = 'history-entry';
      entry.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="status ${visible ? 'visible' : 'hidden'}">
          ${visible ? 'Became visible' : 'Became hidden'}
        </span>
      `;
      
      historyList.insertBefore(entry, historyList.firstChild);
      
      // Keep only last 10 entries
      while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild!);
      }
    };

    // Setup intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const wasVisible = isVisible;
          const nowVisible = entry.isIntersecting;
          
          if (wasVisible !== nowVisible) {
            setIsVisible(nowVisible);
            setIntersectionCount(prev => prev + 1);
            addHistoryEntry(nowVisible);
            updateVisibilityStatus();
            
            console.log(`👁️ Visibility changed: ${nowVisible ? 'visible' : 'hidden'}`);
          }
        });
      },
      { threshold }
    );

    // Mount to DOM and start observing
    element.innerHTML = '';
    element.appendChild(container);
    observer.observe(element);
    updateVisibilityStatus();

    return () => {
      observer.disconnect();
      console.log('🧹 Cleanup visibility detector');
    };
  }
};

// Strategy comparison component
export const HydrationStrategiesDemo: React.FC = () => {
  const [activeStrategy, setActiveStrategy] = useState<string>('all');
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});

  const strategies = [
    { id: 'immediate', name: 'Immediate', description: 'Hydrates immediately when component mounts' },
    { id: 'visible', name: 'Visible', description: 'Hydrates when component becomes visible' },
    { id: 'interaction', name: 'Interaction', description: 'Hydrates on first user interaction' },
    { id: 'idle', name: 'Idle', description: 'Hydrates during browser idle time' },
    { id: 'manual', name: 'Manual', description: 'Requires explicit hydration trigger' }
  ];

  const triggerManualHydration = async (elementId: string) => {
    try {
      await triggerHydration(elementId);
      console.log(`🌊 Manually triggered hydration for ${elementId}`);
    } catch (error) {
      console.error(`❌ Manual hydration failed for ${elementId}:`, error);
    }
  };

  const collectPerformanceData = () => {
    // Simulate collecting performance data from all islands
    const data = {
      immediate: { hydration: 2.5, render: 1.2, memory: 15.4 },
      visible: { hydration: 0, render: 1.8, memory: 12.1 },
      interaction: { hydration: 0, render: 2.1, memory: 10.8 },
      idle: { hydration: 3.1, render: 1.5, memory: 13.2 },
      manual: { hydration: 0, render: 1.9, memory: 11.5 }
    };
    setPerformanceData(data);
  };

  useEffect(() => {
    // Collect performance data after a delay
    const timer = setTimeout(collectPerformanceData, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hydration-strategies-demo">
      <header className="demo-header">
        <h1>🌊 Hydration Strategies Comparison</h1>
        <p>Performance and behavior analysis of different hydration strategies</p>
      </header>

      <nav className="strategy-nav">
        <button 
          className={activeStrategy === 'all' ? 'active' : ''}
          onClick={() => setActiveStrategy('all')}
        >
          All Strategies
        </button>
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            className={activeStrategy === strategy.id ? 'active' : ''}
            onClick={() => setActiveStrategy(strategy.id)}
          >
            {strategy.name}
          </button>
        ))}
      </nav>

      <div className="performance-summary">
        <h3>📊 Performance Summary</h3>
        <div className="performance-table">
          <div className="table-header">
            <span>Strategy</span>
            <span>Hydration (ms)</span>
            <span>Render (ms)</span>
            <span>Memory (MB)</span>
          </div>
          {Object.entries(performanceData).map(([strategy, data]) => (
            <div key={strategy} className="table-row">
              <span>{strategy}</span>
              <span>{data.hydration}</span>
              <span>{data.render}</span>
              <span>{data.memory}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="strategies-content">
        {(activeStrategy === 'all' || activeStrategy === 'immediate') && (
          <section className="strategy-section">
            <h2>⚡ Immediate Strategy</h2>
            <p>Hydrates immediately when the component mounts. Best for critical, above-the-fold content.</p>
            
            <div className="demo-grid">
              <HydraLoader
                id="immediate-perf"
                entry="PerformanceMonitorIsland"
                execType="local"
                strategy="immediate"
                context={{ 
                  peerId: 'immediate-user',
                  trustLevel: 'local',
                  strategy: 'immediate'
                }}
                props={{ trackingId: 'immediate-1' }}
              />
              
              <HydraLoader
                id="immediate-heavy"
                entry="HeavyComputationIsland"
                execType="local"
                strategy="immediate"
                context={{ peerId: 'immediate-user', trustLevel: 'local' }}
                props={{ iterations: 500000, label: 'Immediate Heavy Task' }}
              />
            </div>
          </section>
        )}

        {(activeStrategy === 'all' || activeStrategy === 'visible') && (
          <section className="strategy-section">
            <h2>👁️ Visible Strategy</h2>
            <p>Hydrates when component becomes visible in viewport. Excellent for below-the-fold content.</p>
            
            <div style={{ height: '50vh', overflow: 'auto', border: '1px solid #ccc', padding: '20px' }}>
              <div style={{ height: '200vh' }}>
                <p>Scroll down to see the lazy-loaded components...</p>
                
                <div style={{ marginTop: '100vh' }}>
                  <HydraLoader
                    id="visible-detector"
                    entry="VisibilityDetectorIsland"
                    execType="local"
                    strategy="visible"
                    context={{ peerId: 'visible-user', trustLevel: 'local' }}
                    props={{ threshold: 0.3 }}
                  />
                </div>
                
                <div style={{ marginTop: '20px' }}>
                  <HydraLoader
                    id="visible-perf"
                    entry="PerformanceMonitorIsland"
                    execType="local"
                    strategy="visible"
                    context={{ 
                      peerId: 'visible-user',
                      trustLevel: 'local',
                      strategy: 'visible'
                    }}
                    props={{ trackingId: 'visible-1' }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {(activeStrategy === 'all' || activeStrategy === 'interaction') && (
          <section className="strategy-section">
            <h2>🖱️ Interaction Strategy</h2>
            <p>Hydrates on first user interaction (click, hover, touch). Perfect for interactive widgets.</p>
            
            <div className="interaction-demo">
              <div className="interaction-placeholder" 
                   style={{ padding: '40px', border: '2px dashed #ccc', textAlign: 'center', cursor: 'pointer' }}>
                <p>👆 Click or hover to hydrate the performance monitor</p>
                <HydraLoader
                  id="interaction-perf"
                  entry="PerformanceMonitorIsland"
                  execType="local"
                  strategy="interaction"
                  context={{ 
                    peerId: 'interaction-user',
                    trustLevel: 'local',
                    strategy: 'interaction'
                  }}
                  props={{ trackingId: 'interaction-1' }}
                />
              </div>
              
              <div className="interaction-placeholder" 
                   style={{ padding: '40px', border: '2px dashed #ccc', textAlign: 'center', cursor: 'pointer', marginTop: '20px' }}>
                <p>🖱️ Interact to load heavy computation</p>
                <HydraLoader
                  id="interaction-heavy"
                  entry="HeavyComputationIsland"
                  execType="local"
                  strategy="interaction"
                  context={{ peerId: 'interaction-user', trustLevel: 'local' }}
                  props={{ iterations: 750000, label: 'Interactive Heavy Task' }}
                />
              </div>
            </div>
          </section>
        )}

        {(activeStrategy === 'all' || activeStrategy === 'idle') && (
          <section className="strategy-section">
            <h2>😴 Idle Strategy</h2>
            <p>Hydrates during browser idle time using requestIdleCallback. Great for non-critical content.</p>
            
            <div className="idle-demo">
              <p>These components will hydrate when the browser is idle:</p>
              
              <HydraLoader
                id="idle-perf"
                entry="PerformanceMonitorIsland"
                execType="local"
                strategy="idle"
                context={{ 
                  peerId: 'idle-user',
                  trustLevel: 'local',
                  strategy: 'idle'
                }}
                props={{ trackingId: 'idle-1' }}
              />
              
              <HydraLoader
                id="idle-visibility"
                entry="VisibilityDetectorIsland"
                execType="local"
                strategy="idle"
                context={{ peerId: 'idle-user', trustLevel: 'local' }}
                props={{ threshold: 0.8 }}
              />
            </div>
          </section>
        )}

        {(activeStrategy === 'all' || activeStrategy === 'manual') && (
          <section className="strategy-section">
            <h2>🎛️ Manual Strategy</h2>
            <p>Requires explicit hydration trigger. Provides complete control over when components hydrate.</p>
            
            <div className="manual-demo">
              <div className="manual-controls">
                <button onClick={() => triggerManualHydration('manual-perf-1')}>
                  🌊 Hydrate Performance Monitor
                </button>
                <button onClick={() => triggerManualHydration('manual-heavy-1')}>
                  🌊 Hydrate Heavy Computation
                </button>
                <button onClick={() => triggerManualHydration('manual-visibility-1')}>
                  🌊 Hydrate Visibility Detector
                </button>
              </div>
              
              <div className="manual-islands">
                <HydraLoader
                  id="manual-perf-1"
                  entry="PerformanceMonitorIsland"
                  execType="local"
                  strategy="manual"
                  context={{ 
                    peerId: 'manual-user',
                    trustLevel: 'local',
                    strategy: 'manual'
                  }}
                  props={{ trackingId: 'manual-1' }}
                />
                
                <HydraLoader
                  id="manual-heavy-1"
                  entry="HeavyComputationIsland"
                  execType="local"
                  strategy="manual"
                  context={{ peerId: 'manual-user', trustLevel: 'local' }}
                  props={{ iterations: 1000000, label: 'Manual Heavy Task' }}
                />
                
                <HydraLoader
                  id="manual-visibility-1"
                  entry="VisibilityDetectorIsland"
                  execType="local"
                  strategy="manual"
                  context={{ peerId: 'manual-user', trustLevel: 'local' }}
                  props={{ threshold: 0.9 }}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="demo-footer">
        <div className="strategy-recommendations">
          <h3>📋 Strategy Recommendations</h3>
          <ul>
            <li><strong>Immediate:</strong> Critical UI, navigation, header content</li>
            <li><strong>Visible:</strong> Below-the-fold content, images, secondary features</li>
            <li><strong>Interaction:</strong> Modals, dropdowns, interactive widgets</li>
            <li><strong>Idle:</strong> Analytics, non-critical tracking, background features</li>
            <li><strong>Manual:</strong> Progressive enhancement, A/B testing, conditional features</li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

// Export metadata for island registration
export const PerformanceMonitorMetadata = {
  name: 'PerformanceMonitorIsland',
  trustLevel: 'local' as const,
  execType: 'local' as const,
  ecsComponents: ['PerformanceMetrics'],
  dependencies: ['performance-api']
};

export const HeavyComputationMetadata = {
  name: 'HeavyComputationIsland',
  trustLevel: 'local' as const,
  execType: 'local' as const,
  ecsComponents: ['ComputationTask'],
  dependencies: ['web-workers']
};

export const VisibilityDetectorMetadata = {
  name: 'VisibilityDetectorIsland',
  trustLevel: 'local' as const,
  execType: 'local' as const,
  ecsComponents: ['VisibilityState'],
  dependencies: ['intersection-observer']
};

export const metadata = {
  name: 'HydrationStrategiesDemo',
  trustLevel: 'local' as const,
  execType: 'local' as const,
  ecsComponents: ['HydrationStrategy', 'PerformanceMetrics'],
  dependencies: ['react', '@zenithkernel/hydra-core']
};

export default HydrationStrategiesDemo;
