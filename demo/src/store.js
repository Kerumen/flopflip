import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
//import { createFlopFlipEnhancer } from '@flopflip/react-redux';
import rootReducer from './modules';

const initialState = {};
const enhancers = [
  // createFlopFlipEnhancer('596788417a20200c2b70c89e', {
  //   key: 'ld@tdeekens.name',
  // }),
];
const middleware = [thunk, logger];

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);

const store = createStore(rootReducer, initialState, composedEnhancers);

export default store;
