/**
 * Complete Hydra Demo - Comprehensive Example
 * 
 * This example demonstrates:
 * - Multiple hydration strategies
 * - ZK proof verification
 * - ECS component integration
 * - Island registration and discovery
 * - Real-time state updates
 * - Quantum consensus integration
 */

import React, { useState, useEffect } from 'react';
import { jsx } from '../src/modules/Rendering/jsx-runtime';
import { HydraLoader } from '../src/components/hydra/HydraLoader';
import { useECSState } from '../src/hooks/useECSState';
import { useHydraRegistry } from '../src/hooks/useHydraRegistry';
import { triggerHydration } from '../src/components/hydra/HydraLoader';
import type { HydraContext, IslandComponent, IslandRegistration } from '../src/modules/Rendering/types';

// Example 1: ECS Counter Island with ZK Verification
export const ECSCounterIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: any, context?: HydraContext) => {
    const { initialValue = 0, label = 'Counter' } = props;
    
    // Use ECS state for counter value
    const [count, setCount] = useState(initialValue);
    const [verified, setVerified] = useState(false);
    
    // Verify ZK proof if provided
    if (context?.zkProof) {
      try {
        // Simulate ZK verification
        const isValid = await verifyZKProof(context.zkProof, context.peerId);
        setVerified(isValid);
      } catch (error) {
        console.error('ZK verification failed:', error);
      }
    }
    
    const container = (
      <div className="ecs-counter-island">
        <div className="header">
          <h3>{label}</h3>
          {context?.zkProof && (
            <div className={`zk-status ${verified ? 'verified' : 'unverified'}`}>
              🔒 {verified ? 'Verified' : 'Unverified'}
            </div>
          )}
        </div>
        
        <div className="counter-display">
          <span className="count">{count}</span>
        </div>
        
        <div className="controls">
          <button className="decrement">-</button>
          <button className="increment">+</button>
          <button className="reset">Reset</button>
        </div>
        
        <div className="info">
          <p>Peer ID: {context?.peerId || 'anonymous'}</p>
          <p>Trust Level: {context?.trustLevel || 'unverified'}</p>
        </div>
      </div>
    ) as HTMLElement;
    
    // Add event listeners
    const incrementBtn = container.querySelector('.increment');
    const decrementBtn = container.querySelector('.decrement');
    const resetBtn = container.querySelector('.reset');
    const countSpan = container.querySelector('.count');
    
    incrementBtn?.addEventListener('click', () => {
      setCount(prev => {
        const newCount = prev + 1;
        if (countSpan) countSpan.textContent = String(newCount);
        return newCount;
      });
    });
    
    decrementBtn?.addEventListener('click', () => {
      setCount(prev => {
        const newCount = prev - 1;
        if (countSpan) countSpan.textContent = String(newCount);
        return newCount;
      });
    });
    
    resetBtn?.addEventListener('click', () => {
      setCount(initialValue);
      if (countSpan) countSpan.textContent = String(initialValue);
    });
    
    // Mount to DOM
    element.innerHTML = '';
    element.appendChild(container);
    
    return () => {
      console.log('ECSCounterIsland cleanup');
    };
  },
  
  view: (props: any) => {
    return (
      <div className="ecs-counter-island loading">
        <h3>{props.label || 'Counter'}</h3>
        <p>Loading...</p>
      </div>
    ) as HTMLElement;
  }
};

// Example 2: Real-time Status Island with Quantum Integration
export const QuantumStatusIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: any, context?: HydraContext) => {
    const [quantumState, setQuantumState] = useState<any>(null);
    const [consensusStatus, setConsensusStatus] = useState('pending');
    
    // Connect to quantum consensus system
    useEffect(() => {
      const updateQuantumState = async () => {
        try {
          // Simulate quantum state polling
          const state = await getQuantumConsensusState();
          setQuantumState(state);
          setConsensusStatus(state.consensusValid ? 'valid' : 'invalid');
        } catch (error) {
          console.error('Quantum state error:', error);
          setConsensusStatus('error');
        }
      };
      
      const interval = setInterval(updateQuantumState, 5000);
      updateQuantumState(); // Initial load
      
      return () => clearInterval(interval);
    }, []);
    
    const container = (
      <div className="quantum-status-island">
        <h3>🌊 Quantum Consensus Status</h3>
        
        <div className="status-grid">
          <div className="status-item">
            <label>Consensus:</label>
            <span className={`status-value ${consensusStatus}`}>
              {consensusStatus.toUpperCase()}
            </span>
          </div>
          
          {quantumState && (
            <>
              <div className="status-item">
                <label>Leader:</label>
                <span className="status-value">
                  {quantumState.leader?.measurements?.join('') || 'N/A'}
                </span>
              </div>
              
              <div className="status-item">
                <label>ZK Valid:</label>
                <span className={`status-value ${quantumState.zk?.valid ? 'valid' : 'invalid'}`}>
                  {quantumState.zk?.valid ? 'YES' : 'NO'}
                </span>
              </div>
              
              <div className="status-item">
                <label>Trust Score:</label>
                <span className="status-value">
                  {context?.trustLevel === 'verified' ? '95%' : '60%'}
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="quantum-visualization">
          <canvas width="200" height="100" className="quantum-canvas"></canvas>
        </div>
      </div>
    ) as HTMLElement;
    
    // Mount and setup visualization
    element.innerHTML = '';
    element.appendChild(container);
    
    // Setup quantum visualization
    setupQuantumVisualization(container.querySelector('.quantum-canvas') as HTMLCanvasElement);
    
    return () => {
      console.log('QuantumStatusIsland cleanup');
    };
  }
};

// Example 3: Interactive Hydra Registry Explorer
export const HydraRegistryIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: any, context?: HydraContext) => {
    const [registeredIslands, setRegisteredIslands] = useState<any[]>([]);
    const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
    
    // Load registry data
    useEffect(() => {
      const loadRegistry = async () => {
        try {
          const islands = await getHydraRegistry();
          setRegisteredIslands(islands);
        } catch (error) {
          console.error('Failed to load Hydra registry:', error);
        }
      };
      
      loadRegistry();
    }, []);
    
    const container = (
      <div className="hydra-registry-island">
        <h3>🏝️ Hydra Registry Explorer</h3>
        
        <div className="registry-stats">
          <div className="stat-item">
            <span className="stat-value">{registeredIslands.length}</span>
            <span className="stat-label">Registered Islands</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {registeredIslands.filter(i => i.trustLevel === 'verified').length}
            </span>
            <span className="stat-label">Verified</span>
          </div>
        </div>
        
        <div className="island-list">
          {registeredIslands.map(island => (
            <div key={island.name} className={`island-item ${selectedIsland === island.name ? 'selected' : ''}`}>
              <div className="island-header">
                <span className="island-name">{island.name}</span>
                <span className={`trust-badge ${island.trustLevel}`}>
                  {island.trustLevel}
                </span>
              </div>
              <div className="island-details">
                <span>Type: {island.execType}</span>
                <span>Hash: {island.hash?.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="actions">
          <button className="refresh-btn">🔄 Refresh Registry</button>
          <button className="verify-all-btn">✅ Verify All</button>
        </div>
      </div>
    ) as HTMLElement;
    
    // Add event listeners
    const refreshBtn = container.querySelector('.refresh-btn');
    const verifyBtn = container.querySelector('.verify-all-btn');
    const islandItems = container.querySelectorAll('.island-item');
    
    refreshBtn?.addEventListener('click', async () => {
      const islands = await getHydraRegistry();
      setRegisteredIslands(islands);
      // Re-render the list
      renderIslandList(container, islands, selectedIsland, setSelectedIsland);
    });
    
    verifyBtn?.addEventListener('click', async () => {
      console.log('Verifying all islands...');
      // Simulate verification process
      for (const island of registeredIslands) {
        if (island.zkProof) {
          await verifyZKProof(island.zkProof, island.peerId);
        }
      }
    });
    
    islandItems.forEach(item => {
      item.addEventListener('click', () => {
        const islandName = item.querySelector('.island-name')?.textContent;
        setSelectedIsland(islandName || null);
        
        // Update visual selection
        islandItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
    
    // Mount to DOM
    element.innerHTML = '';
    element.appendChild(container);
    
    return () => {
      console.log('HydraRegistryIsland cleanup');
    };
  }
};

// Example 4: Manual Hydration Demo
export const ManualHydrationDemo: React.FC = () => {
  const [hydrationStates, setHydrationStates] = useState<Record<string, boolean>>({});
  
  const handleManualHydration = async (elementId: string) => {
    try {
      await triggerHydration(elementId);
      setHydrationStates(prev => ({ ...prev, [elementId]: true }));
    } catch (error) {
      console.error('Manual hydration failed:', error);
    }
  };
  
  return (
    <div className="manual-hydration-demo">
      <h2>Manual Hydration Control</h2>
      
      <div className="hydration-controls">
        <button 
          onClick={() => handleManualHydration('manual-counter')}
          disabled={hydrationStates['manual-counter']}
        >
          {hydrationStates['manual-counter'] ? '✅ Hydrated' : '🌊 Hydrate Counter'}
        </button>
        
        <button 
          onClick={() => handleManualHydration('manual-status')}
          disabled={hydrationStates['manual-status']}
        >
          {hydrationStates['manual-status'] ? '✅ Hydrated' : '🌊 Hydrate Status'}
        </button>
      </div>
      
      <div className="manual-islands">
        <HydraLoader
          id="manual-counter"
          entry="ECSCounterIsland"
          execType="local"
          strategy="manual"
          context={{ 
            peerId: 'user-manual',
            trustLevel: 'local'
          }}
          props={{ label: 'Manual Counter', initialValue: 100 }}
        />
        
        <HydraLoader
          id="manual-status"
          entry="QuantumStatusIsland"
          execType="local"
          strategy="manual"
          context={{ 
            peerId: 'user-manual',
            trustLevel: 'verified',
            zkProof: 'zk:manual-proof-data'
          }}
        />
      </div>
    </div>
  );
};

// Complete Demo App
export const CompleteHydraDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState('overview');
  
  return (
    <div className="complete-hydra-demo">
      <header className="demo-header">
        <h1>🌊 ZenithKernel Hydra Complete Demo</h1>
        <p>Comprehensive showcase of Hydra island architecture with quantum consensus</p>
      </header>
      
      <nav className="demo-nav">
        <button 
          className={activeDemo === 'overview' ? 'active' : ''}
          onClick={() => setActiveDemo('overview')}
        >
          Overview
        </button>
        <button 
          className={activeDemo === 'strategies' ? 'active' : ''}
          onClick={() => setActiveDemo('strategies')}
        >
          Hydration Strategies
        </button>
        <button 
          className={activeDemo === 'quantum' ? 'active' : ''}
          onClick={() => setActiveDemo('quantum')}
        >
          Quantum Integration
        </button>
        <button 
          className={activeDemo === 'manual' ? 'active' : ''}
          onClick={() => setActiveDemo('manual')}
        >
          Manual Control
        </button>
      </nav>
      
      <main className="demo-content">
        {activeDemo === 'overview' && (
          <div className="overview-section">
            <h2>System Overview</h2>
            
            {/* Immediate hydration demo */}
            <section className="demo-section">
              <h3>Immediate Hydration</h3>
              <p>These islands hydrate immediately when the component mounts.</p>
              <div className="island-grid">
                <HydraLoader
                  id="overview-counter-1"
                  entry="ECSCounterIsland"
                  execType="local"
                  strategy="immediate"
                  context={{ 
                    peerId: 'user-123',
                    trustLevel: 'verified',
                    zkProof: 'zk:verified-proof'
                  }}
                  props={{ label: 'Verified Counter', initialValue: 42 }}
                />
                
                <HydraLoader
                  id="overview-registry"
                  entry="HydraRegistryIsland"
                  execType="local"
                  strategy="immediate"
                  context={{ 
                    peerId: 'admin-user',
                    trustLevel: 'verified'
                  }}
                />
              </div>
            </section>
            
            {/* Visible hydration demo */}
            <section className="demo-section">
              <h3>Lazy Loading (Visible)</h3>
              <p>These islands hydrate when they become visible in the viewport.</p>
              <div style={{ height: '200vh', paddingTop: '100vh' }}>
                <HydraLoader
                  id="lazy-quantum-status"
                  entry="QuantumStatusIsland"
                  execType="local"
                  strategy="visible"
                  context={{ 
                    peerId: 'quantum-observer',
                    trustLevel: 'community'
                  }}
                />
              </div>
            </section>
          </div>
        )}
        
        {activeDemo === 'strategies' && (
          <div className="strategies-section">
            <h2>Hydration Strategies Comparison</h2>
            
            <div className="strategy-grid">
              <div className="strategy-demo">
                <h3>Immediate Strategy</h3>
                <HydraLoader
                  id="strategy-immediate"
                  entry="ECSCounterIsland"
                  execType="local"
                  strategy="immediate"
                  context={{ peerId: 'immediate-user', trustLevel: 'local' }}
                  props={{ label: 'Immediate', initialValue: 1 }}
                />
              </div>
              
              <div className="strategy-demo">
                <h3>Interaction Strategy</h3>
                <HydraLoader
                  id="strategy-interaction"
                  entry="ECSCounterIsland"
                  execType="local"
                  strategy="interaction"
                  context={{ peerId: 'interaction-user', trustLevel: 'local' }}
                  props={{ label: 'Click to Hydrate', initialValue: 10 }}
                />
              </div>
              
              <div className="strategy-demo">
                <h3>Idle Strategy</h3>
                <HydraLoader
                  id="strategy-idle"
                  entry="ECSCounterIsland"
                  execType="local"
                  strategy="idle"
                  context={{ peerId: 'idle-user', trustLevel: 'local' }}
                  props={{ label: 'Idle Hydration', initialValue: 100 }}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeDemo === 'quantum' && (
          <div className="quantum-section">
            <h2>Quantum Consensus Integration</h2>
            
            <div className="quantum-grid">
              <HydraLoader
                id="quantum-main-status"
                entry="QuantumStatusIsland"
                execType="local"
                strategy="immediate"
                context={{ 
                  peerId: 'quantum-main',
                  trustLevel: 'verified',
                  zkProof: 'zk:quantum-consensus-proof'
                }}
              />
              
              <div className="quantum-controls">
                <h3>Quantum Operations</h3>
                <button onclick="initializeQuantumState()">Initialize Quantum State</button>
                <button onclick="runConsensusRound()">Run Consensus Round</button>
                <button onclick="generateZKProof()">Generate ZK Proof</button>
                <button onclick="verifyQuantumState()">Verify State</button>
              </div>
            </div>
          </div>
        )}
        
        {activeDemo === 'manual' && <ManualHydrationDemo />}
      </main>
      
      <footer className="demo-footer">
        <p>ZenithKernel Hydra Demo - Quantum-powered Decentralized Frontend Framework</p>
        <p>Visit <a href="/api/hydra/islands">Island Registry API</a> for technical details</p>
      </footer>
    </div>
  );
};

// Utility functions
async function verifyZKProof(zkProof: string, peerId?: string): Promise<boolean> {
  // Simulate ZK proof verification
  await new Promise(resolve => setTimeout(resolve, 100));
  return zkProof.startsWith('zk:') && !!peerId;
}

async function getQuantumConsensusState(): Promise<any> {
  // Simulate quantum consensus state retrieval
  return {
    leader: { measurements: [1, 0, 1] },
    consensusValid: true,
    zk: { valid: true, proof: 'quantum-proof-data' }
  };
}

async function getHydraRegistry(): Promise<any[]> {
  // Simulate registry data retrieval
  return [
    { 
      name: 'ECSCounterIsland', 
      trustLevel: 'verified', 
      execType: 'local', 
      hash: 'abc123def456',
      zkProof: 'zk:counter-proof'
    },
    { 
      name: 'QuantumStatusIsland', 
      trustLevel: 'verified', 
      execType: 'local', 
      hash: 'xyz789uvw012',
      zkProof: 'zk:quantum-proof'
    },
    { 
      name: 'HydraRegistryIsland', 
      trustLevel: 'community', 
      execType: 'local', 
      hash: 'mno345pqr678'
    }
  ];
}

function setupQuantumVisualization(canvas: HTMLCanvasElement): void {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Simple quantum state visualization
  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw quantum superposition visualization
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 30;
    
    for (let i = 0; i < 3; i++) {
      const angle = (frame * 0.02) + (i * Math.PI * 2 / 3);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${120 * i}, 70%, 60%)`;
      ctx.fill();
    }
    
    frame++;
    requestAnimationFrame(animate);
  };
  animate();
}

function renderIslandList(container: HTMLElement, islands: any[], selectedIsland: string | null, setSelectedIsland: (name: string | null) => void): void {
  const listContainer = container.querySelector('.island-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = islands.map(island => `
    <div class="island-item ${selectedIsland === island.name ? 'selected' : ''}" data-island="${island.name}">
      <div class="island-header">
        <span class="island-name">${island.name}</span>
        <span class="trust-badge ${island.trustLevel}">${island.trustLevel}</span>
      </div>
      <div class="island-details">
        <span>Type: ${island.execType}</span>
        <span>Hash: ${island.hash?.slice(0, 8)}...</span>
      </div>
    </div>
  `).join('');
  
  // Re-attach event listeners
  listContainer.querySelectorAll('.island-item').forEach(item => {
    item.addEventListener('click', () => {
      const islandName = item.getAttribute('data-island');
      setSelectedIsland(islandName);
      
      listContainer.querySelectorAll('.island-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });
}

// Global functions for quantum operations
(window as any).initializeQuantumState = async () => {
  console.log('🌊 Initializing quantum state...');
  // Simulate quantum initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ Quantum state initialized');
};

(window as any).runConsensusRound = async () => {
  console.log('🔄 Running consensus round...');
  // Simulate consensus round
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('✅ Consensus round completed');
};

(window as any).generateZKProof = async () => {
  console.log('🔐 Generating ZK proof...');
  // Simulate ZK proof generation
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('✅ ZK proof generated');
};

(window as any).verifyQuantumState = async () => {
  console.log('🔍 Verifying quantum state...');
  // Simulate state verification
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log('✅ Quantum state verified');
};

// Export metadata for island registration
export const metadata = {
  name: 'CompleteHydraDemo',
  trustLevel: 'local' as const,
  execType: 'local' as const,
  ecsComponents: ['Counter', 'QuantumState', 'TrustScore'],
  dependencies: ['react', '@zenithkernel/hydra-core', '@zenithkernel/quantum']
};

export default CompleteHydraDemo;
