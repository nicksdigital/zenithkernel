# ZenithKernel Test Application

This test application demonstrates the core functionality of ZenithKernel, including:

- ECS (Entity Component System)
- Routing with route guards and parameters
- Reactive state management with signals
- Island-based rendering with hydration strategies
- System management and messaging

## Project Structure

```
test-app/
├── src/
│   ├── components/      # ECS components
│   ├── systems/         # Custom systems
│   ├── islands/         # Island components
│   └── index.ts         # Main entry point
├── index.html           # Demo page
└── README.md            # This file
```

## Features Demonstrated

### 1. ECS System

The application includes a simple Counter component that demonstrates:
- Component registration
- Entity creation
- Component updates
- System integration

### 2. Routing

The router demonstrates:
- Route registration
- Route parameter handling
- Navigation API
- ZK verification requirements

### 3. Island Hydration

The CounterIsland component shows:
- Hydra JSX syntax
- Multiple hydration strategies
- Island-ECS integration
- Reactive updates

### 4. Systems

Custom systems demonstrate:
- System registration
- Message handling
- ECS integration
- Update lifecycle

## Running the Application

To run the application:

1. Make sure you have the ZenithKernel dependencies installed
2. Build the ZenithKernel library
3. Start a local web server in the project root:

```bash
npx serve .
# or
python -m http.server
# or
php -S localhost:8000
```

4. Open `http://localhost:8000/test-app/` in your browser

## Browser Support

The application requires modern browser features including:
- ES Modules
- Custom Elements
- Intersection Observer
- Performance API

## Architecture Notes

This application uses the following ZenithKernel concepts:

1. **Kernel Initialization**: The kernel is bootstrapped and systems are registered.
2. **ECS Pattern**: Entities are created with components that store data.
3. **System Loop**: Systems process entities and components on each update cycle.
4. **Reactive UI**: Islands use reactive state for UI updates.
5. **Message-based Communication**: Systems communicate via the kernel messaging system.

## Integration Points

The application demonstrates integration patterns for:
- Router -> ECS (creating entities based on routes)
- ECS -> Islands (passing entity IDs to islands)
- Islands -> ECS (updating components from island interactions)
- Systems -> Router (route guards based on system state)
