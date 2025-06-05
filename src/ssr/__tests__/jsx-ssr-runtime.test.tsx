import { jsx, jsxs, Fragment } from '../jsx-ssr-virtual-runtime';
import { renderToString } from '../jsx-ssr-runtime';

describe('SSR JSX Runtime', () => {
  it('renders a simple JSX element', () => {
    const element = jsx('div', { children: 'Hello SSR' });
    const html = renderToString(element);
    expect(html).toBe('<div>Hello SSR</div>');
  });

  it('renders a component with props', () => {
    function Greet(props: { name: string }) {
      return jsx('span', { children: `Hello, ${props.name}!` });
    }
    const element = jsx(Greet, { name: 'Nick' });
    const html = renderToString(element);
    expect(html).toBe('<span>Hello, Nick!</span>');
  });

  it('renders fragments and arrays', () => {
    const element = jsx(Fragment, {
      children: [
        jsx('h1', { children: 'A' }),
        jsx('h2', { children: 'B' })
      ]
    });
    const html = renderToString(element);
    expect(html).toBe('<h1>A</h1><h2>B</h2>');

    const arrElement = [
      jsx('li', { children: 'One' }),
      jsx('li', { children: 'Two' })
    ];
    const arrHtml = renderToString(arrElement);
    expect(arrHtml).toBe('<li>One</li><li>Two</li>');
  });

  it('renders with ECS state context', () => {
    const context = { ecs: { user: 'Nick' } };
    function User(props: any) {
      return jsx('b', { children: props.context.ecs.user });
    }
    const element = jsx(User, { context });
    const html = renderToString(element, context);
    expect(html).toBe('<b>Nick</b>');
  });

  it('handles null, undefined, and boolean children', () => {
    const element = jsx('div', {
      children: [null, false, undefined, 'X']
    });
    const html = renderToString(element);
    expect(html).toBe('<div>X</div>');
  });
}); 