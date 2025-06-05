/**
 * Vue-Style Reactive Bindings Demo
 * 
 * This example demonstrates the Vue-style reactive binding syntax using the colon (:) prefix
 * for dynamic attribute binding in the Zenith framework.
 */

import { jsx, useState, useRef, useEffect } from '../src/modules/Rendering/jsx-runtime';

// Example 1: Basic Vue-style attribute bindings
function BasicBindingsExample(): HTMLElement {
  const [message, setMessage] = useState('Hello, Zenith!');
  const [isVisible, setIsVisible] = useState(true);
  const [color, setColor] = useState('#3b82f6');
  const [fontSize, setFontSize] = useState(16);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Basic Vue-Style Bindings (:attribute)</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          Message: 
          <input 
            type="text" 
            value={message}
            onInput={(e) => setMessage((e.target as HTMLInputElement).value)}
            style={{ marginLeft: '8px', padding: '4px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={isVisible}
            onChange={(e) => setIsVisible((e.target as HTMLInputElement).checked)}
          />
          Visible
        </label>
        
        <label style={{ marginLeft: '15px' }}>
          Color: 
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor((e.target as HTMLInputElement).value)}
          />
        </label>
        
        <label style={{ marginLeft: '15px' }}>
          Size: 
          <input 
            type="range" 
            min="12" 
            max="32" 
            value={fontSize}
            onChange={(e) => setFontSize(parseInt((e.target as HTMLInputElement).value))}
          />
          {fontSize}px
        </label>
      </div>
      
      <div 
        reactive={true}
        :style={() => ({
          color: color,
          fontSize: `${fontSize}px`,
          display: isVisible ? 'block' : 'none',
          padding: '10px',
          backgroundColor: '#f8fafc',
          border: '2px solid',
          borderColor: color,
          borderRadius: '8px',
          transition: 'all 0.3s ease'
        })}
        :data-message={() => message}
        :title={() => `Message: ${message} | Size: ${fontSize}px`}
      >
        {message}
      </div>
    </div>
  ) as HTMLElement;
}

// Example 2: Vue-style class bindings
function ClassBindingsExample(): HTMLElement {
  const [isActive, setIsActive] = useState(false);
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState('light');
  const [size, setSize] = useState('medium');
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Vue-Style Class Bindings (:class)</h3>
      
      <style>
        {`
          .demo-box {
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
          .active { background-color: #10b981; color: white; }
          .error { background-color: #ef4444; color: white; }
          .light { background-color: #f8fafc; color: #1f2937; }
          .dark { background-color: #1f2937; color: #f8fafc; }
          .small { font-size: 14px; padding: 10px; }
          .medium { font-size: 16px; padding: 20px; }
          .large { font-size: 20px; padding: 30px; }
        `}
      </style>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => setIsActive(!isActive)}>
          Toggle Active: {isActive ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => setIsError(!isError)} style={{ marginLeft: '8px' }}>
          Toggle Error: {isError ? 'ON' : 'OFF'}
        </button>
        <select 
          value={theme} 
          onChange={(e) => setTheme((e.target as HTMLSelectElement).value)}
          style={{ marginLeft: '8px', padding: '4px' }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <select 
          value={size} 
          onChange={(e) => setSize((e.target as HTMLSelectElement).value)}
          style={{ marginLeft: '8px', padding: '4px' }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
      
      {/* Object-style class binding */}
      <div 
        reactive={true}
        :class={() => ({
          'demo-box': true,
          'active': isActive,
          'error': isError,
          [theme]: true,
          [size]: true
        })}
      >
        Object-style class binding
      </div>
      
      {/* Array-style class binding */}
      <div 
        reactive={true}
        :class={() => [
          'demo-box',
          theme,
          size,
          isActive && 'active',
          isError && 'error'
        ]}
      >
        Array-style class binding
      </div>
      
      {/* String-style class binding */}
      <div 
        reactive={true}
        :class={() => `demo-box ${theme} ${size} ${isActive ? 'active' : ''} ${isError ? 'error' : ''}`}
      >
        String-style class binding
      </div>
    </div>
  ) as HTMLElement;
}

// Example 3: Dynamic attributes and data bindings
function DynamicAttributesExample(): HTMLElement {
  const [progress, setProgress] = useState(50);
  const [status, setStatus] = useState('in-progress');
  const [tooltip, setTooltip] = useState('Progress indicator');
  const [isDisabled, setIsDisabled] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          setStatus('completed');
          return 100;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Dynamic Attributes (:data-*, :aria-*, etc.)</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => setProgress(0)}>Reset</button>
        <button onClick={() => setIsDisabled(!isDisabled)} style={{ marginLeft: '8px' }}>
          Toggle Disabled: {isDisabled ? 'ON' : 'OFF'}
        </button>
        <input 
          type="text" 
          value={tooltip}
          onInput={(e) => setTooltip((e.target as HTMLInputElement).value)}
          placeholder="Tooltip text"
          style={{ marginLeft: '8px', padding: '4px' }}
        />
      </div>
      
      <div 
        reactive={true}
        :data-progress={() => progress}
        :data-status={() => status}
        :aria-valuenow={() => progress}
        :aria-valuemin={() => 0}
        :aria-valuemax={() => 100}
        :aria-disabled={() => isDisabled}
        :title={() => tooltip}
        :style={() => ({
          width: '300px',
          height: '30px',
          backgroundColor: '#e5e7eb',
          borderRadius: '15px',
          overflow: 'hidden',
          position: 'relative',
          opacity: isDisabled ? 0.5 : 1,
          cursor: isDisabled ? 'not-allowed' : 'default'
        })}
        role="progressbar"
      >
        <div 
          reactive={true}
          :style={() => ({
            width: `${progress}%`,
            height: '100%',
            backgroundColor: status === 'completed' ? '#10b981' : '#3b82f6',
            transition: 'all 0.3s ease',
            borderRadius: '15px'
          })}
        />
        <span 
          reactive={true}
          :style={() => ({
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: progress > 50 ? 'white' : '#1f2937',
            fontSize: '14px',
            fontWeight: 'bold'
          })}
        >
          {progress}%
        </span>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
        Status: {status} | Disabled: {isDisabled ? 'Yes' : 'No'}
      </div>
    </div>
  ) as HTMLElement;
}

// Example 4: Form input bindings
function FormBindingsExample(): HTMLElement {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 25,
    subscribe: false,
    country: 'us',
    interests: [] as string[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    if (field === 'name' && !value.trim()) {
      newErrors.name = 'Name is required';
    }
    if (field === 'email' && value && !value.includes('@')) {
      newErrors.email = 'Invalid email';
    }
    setErrors(newErrors);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Form Input Bindings with Validation</h3>
      
      <div style={{ display: 'grid', gap: '15px', maxWidth: '400px' }}>
        <div>
          <label>Name:</label>
          <input 
            type="text"
            value={formData.name}
            onInput={(e) => updateField('name', (e.target as HTMLInputElement).value)}
            reactive={true}
            :class={() => ({
              'input': true,
              'error': !!errors.name
            })}
            :style={() => ({
              width: '100%',
              padding: '8px',
              border: `2px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '4px',
              outline: 'none'
            })}
          />
          {errors.name && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors.name}
            </div>
          )}
        </div>
        
        <div>
          <label>Email:</label>
          <input 
            type="email"
            value={formData.email}
            onInput={(e) => updateField('email', (e.target as HTMLInputElement).value)}
            reactive={true}
            :style={() => ({
              width: '100%',
              padding: '8px',
              border: `2px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '4px',
              outline: 'none'
            })}
          />
          {errors.email && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors.email}
            </div>
          )}
        </div>
        
        <div>
          <label>Age: {formData.age}</label>
          <input 
            type="range"
            min="18"
            max="100"
            value={formData.age}
            onChange={(e) => updateField('age', parseInt((e.target as HTMLInputElement).value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox"
              checked={formData.subscribe}
              onChange={(e) => updateField('subscribe', (e.target as HTMLInputElement).checked)}
            />
            Subscribe to newsletter
          </label>
        </div>
      </div>
      
      <div 
        reactive={true}
        :style={() => ({
          marginTop: '20px',
          padding: '15px',
          backgroundColor: Object.keys(errors).length > 0 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${Object.keys(errors).length > 0 ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px'
        })}
      >
        <h4>Form Data:</h4>
        <pre style={{ fontSize: '12px', margin: 0 }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  ) as HTMLElement;
}

// Main demo component
function VueStyleBindingsDemo(): HTMLElement {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Vue-Style Reactive Bindings Demo</h1>
      <p>
        This demo showcases Vue-style reactive binding syntax using the colon (:) prefix
        for dynamic attribute binding in the Zenith framework.
      </p>
      
      <BasicBindingsExample />
      <ClassBindingsExample />
      <DynamicAttributesExample />
      <FormBindingsExample />
      
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        <h3>Vue-Style Binding Syntax Summary:</h3>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li><code>:attribute={() => value}</code> - Dynamic attribute binding</li>
          <li><code>:class={() => classObject}</code> - Dynamic class binding (object/array/string)</li>
          <li><code>:style={() => styleObject}</code> - Dynamic style binding</li>
          <li><code>:data-name={() => value}</code> - Dynamic data attributes</li>
          <li><code>:aria-label={() => value}</code> - Dynamic ARIA attributes</li>
          <li><code>:disabled={() => boolean}</code> - Dynamic boolean attributes</li>
        </ul>
      </div>
    </div>
  ) as HTMLElement;
}

export default VueStyleBindingsDemo;
