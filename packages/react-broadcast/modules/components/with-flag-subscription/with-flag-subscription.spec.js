import React from 'react';
import { shallow } from 'enzyme';
import withFlagSubscription from './with-flag-subscription';

const TestComponent = () => <div />;

describe('rendering', () => {
  let wrapper;

  beforeEach(() => {
    const Component = withFlagSubscription('foo-prop-key')(TestComponent);
    wrapper = shallow(<Component />);
  });

  it('should match snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('should render a `Subscriber`', () => {
    expect(wrapper).toRender('Subscriber');
  });

  it('should supply a `channel` to the `Subscriber`', () => {
    expect(wrapper.find('Subscriber')).toHaveProp('channel');
  });
});

describe('statics', () => {
  let Component;
  beforeEach(() => {
    Component = withFlagSubscription('foo-prop-key')(TestComponent);
  });

  it('should set the `displayName`', () => {
    expect(Component.displayName).toEqual(
      'withFlagSubscription(TestComponent)'
    );
  });
});
