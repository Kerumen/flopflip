export {
  createFlopFlipEnhancer,
  STATE_SLICE as FLOPFLIP_STATE_SLICE,
} from './store';
export {
  flopflipReducer,
  updateStatus,
  updateFlags,
  UPDATE_STATUS,
  UPDATE_FLAGS,
  selectFlags as selectFeatureFlags,
  selectFlag as selectFeatureFlag,
} from './ducks';
export {
  FeatureToggled,
  injectFeatureToggle,
  injectFeatureToggles,
  branchOnFeatureToggle,
  ConfigureFlopFlip,
} from './components';

export { version } from '../package.json';
