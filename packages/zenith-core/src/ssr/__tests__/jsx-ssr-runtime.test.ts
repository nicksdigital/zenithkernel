import { renderToString } from '../jsx-ssr-runtime';

describe('SSR JSX Runtime', () => {
  it('renders a simple JSX element', () => {
    const html = renderToString(<div>Hello SSR</div>);
    expect(html).toBe('<div>Hello SSR</div>');
  });

  it('renders a component with props', () => {
    function Greet({ name }: { name: string }) {
      return <span>Hello, {name}!</span>;
    }
    const html = renderToString(<Greet name="Nick" />);
    expect(html).toBe('<span>Hello, Nick!</span>');
  });

  it('renders fragments and arrays', () => {
    const html = renderToString(<><h1>A</h1><h2>B</h2></>);
    expect(html).toBe('<h1>A</h1><h2>B</h2>');
    const arrHtml = renderToString([
      <li key="1">One</li>,
      <li key="2">Two</li>
    ]);
    expect(arrHtml).toBe('<li>One</li><li>Two</li>');
  });

  it('renders with ECS state context', () => {
    const context = { ecs: { user: 'Nick' } };
    function User() {
      // @ts-ignore
      return <b>{context.ecs.user}</b>;
    }
    const html = renderToString(<User />, context);
    expect(html).toBe('<b>Nick</b>');
  });

  it('handles null, undefined, and boolean children', () => {
    const html = renderToString(<div>{null}{false}{undefined}X</div>);
    expect(html).toBe('<div>X</div>');
  });
}); 