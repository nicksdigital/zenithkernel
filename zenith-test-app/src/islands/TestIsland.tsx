// src/islands/TestIsland.tsx
import {
    jsx,
    useState, // Assuming this is the reactive useState from your system
    useEffect,
    // Import these if they are not automatically part of the jsx-runtime's scope for islands
    //initializeComponent,
    //withComponent,
    //cleanupComponent
} from '../zenith-framework/rendering'; // Adjust path/alias as needed

import type { IslandComponent } from '../zenith-framework/rendering'; // Adjust path/alias
import type { HydraContext } from '../zenith-framework/hydra-runtime/hydra-runtime';
import {initializeComponent, withComponent, cleanupComponent} from "../../../src/core/reactive-state";
import {getECS} from "../../../src/modules/Rendering/utils/kernel-access"; // Adjust path/alias

export const metadata = {
    name: 'TestIsland',
    version: '1.0.0',
};

/**
 * This is the actual "component" function where reactive hooks like useState can be used.
 * It will be called within a context established by `withComponent`.
 */
function TestIslandInnerRenderer(props: {
    element: HTMLElement,
    initialProps: any,
    initialContext?: HydraContext
}) {
    const { element, initialProps, initialContext } = props;
    console.log('[TestIsland.tsx] TestIslandInnerRenderer: STARTING. Props:', initialProps);

    const [getCount, setCount] = useState(0);
    console.log('[TestIsland.tsx] TestIslandInnerRenderer: useState for count initialized.');

    const increment = () => {
        setCount(getCount.valueOf() + 1);
    };

    useEffect(() => {
        console.log('[TestIsland.tsx] TestIslandInnerRenderer: Count changed or initial effect:', getCount);
    }, [getCount]);

    const buildUI = () => {
        console.log('[TestIsland.tsx] TestIslandInnerRenderer: buildUI called (SIMPLIFIED). Count:', getCount);
        // SIMPLIFIED UI FOR TESTING VISIBILITY
        // @ts-ignore
        return jsx('div', null, null, { style: { border: '2px solid blue', padding: '10px', color: 'black', backgroundColor: 'lightyellow' } },
            'test',
            jsx('span', null, getCount, {}, 'count-value') // Still include reactive part to ensure it doesn't break
        );
        // Original complex UI:
        // return jsx('div', null,
        //   jsx('h3', null, 'Hello from TestIsland! (Reactive)'),
        //   jsx('p', null, `Initial Props: ${JSON.stringify(initialProps)}`),
        //   jsx('p', null, `Context Peer ID: ${initialContext?.peerId || 'N/A'}`),
        //   jsx('p', null,
        //     'Count: ',
        //     jsx('span', { id: 'count-value' }, getCount)
        //   ),
        //   jsx('button', { id: 'increment-btn', onClick: increment }, 'Increment')
        // );
    };

    const uiTree = buildUI();
    element.innerHTML = ''; // Clear placeholder
    element.appendChild(uiTree);
    console.log('[TestIsland.tsx] TestIslandInnerRenderer: UI appended.');

    return () => {
        console.log('[TestIsland.tsx] TestIslandInnerRenderer: Cleanup.');
    };
}

const TestIsland: IslandComponent = {
    mount: (element: HTMLElement, props: any, context?: HydraContext) => {
        console.log('[TestIsland.tsx] Mount called.', { element, props, context });

        const reactiveInstance = initializeComponent(
            element,
            context?.ecsEntity,
            undefined
        );
        console.log('[TestIsland.tsx] Reactive instance from initializeComponent:', reactiveInstance);

        let innerRendererCleanup: (() => void) | void | undefined;

        try {
            console.log('[TestIsland.tsx] Calling withComponent...');
            withComponent(reactiveInstance, () => {
                console.log('[TestIsland.tsx] Inside withComponent callback, calling TestIslandInnerRenderer.');
                innerRendererCleanup = TestIslandInnerRenderer({
                    element,
                    initialProps: props,
                    initialContext: context
                });
            });
            console.log('[TestIsland.tsx] Returned from withComponent.');
        } catch (error) {
            console.error('[TestIsland.tsx] Error during withComponent/TestIslandInnerRenderer:', error);
            element.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }

        return () => {
            console.log('[TestIsland.tsx] Unmount: Cleaning up TestIsland.');
            if (typeof innerRendererCleanup === 'function') {
                innerRendererCleanup();
            }
            cleanupComponent(element);
            element.innerHTML = '';
        };
    },
};
export default TestIsland;
