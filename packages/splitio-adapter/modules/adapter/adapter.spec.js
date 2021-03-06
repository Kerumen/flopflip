import splitio from '@splitsoftware/splitio';
import adapter, {
  camelCaseFlags,
  createAnonymousUserKey,
  normalizeFlag,
} from './adapter';

jest.mock('@splitsoftware/splitio', () =>
  jest.fn(() => ({
    client: jest.fn(() => ({
      on: jest.fn((_, cb) => cb()),
      getTreatments: jest.fn(() => ({})),
      Event: {
        SDK_READY: 'SDK_READY',
        SDK_UPDATE: 'SDK_UPDATE',
      },
    })),
    manager: jest.fn(() => ({
      names: jest.fn(() => []),
    })),
  }))
);

const authorizationKey = '123-abc';
const userWithKey = { key: 'foo-user' };
const userWithoutKey = {
  group: 'foo-group',
};
const names = ['some-flag-1', 'some-flag-2'];
const flags = { 'some-flag-1': true, 'some-flag-2': false };

describe('when configuring', () => {
  let onStatusStateChange;
  let onFlagsStateChange;

  beforeEach(() => {
    onStatusStateChange = jest.fn();
    onFlagsStateChange = jest.fn();
  });

  describe('with user key', () => {
    beforeEach(() => {
      return adapter.configure({
        authorizationKey,
        user: userWithKey,
        onStatusStateChange,
        onFlagsStateChange,
      });
    });

    it('should initialize the `splitio` client with `authorizationKey` and given `user`', () => {
      expect(splitio).toHaveBeenCalledWith({
        core: {
          authorizationKey,
          key: userWithKey.key,
        },
      });
    });
  });

  describe('without key', () => {
    beforeEach(() =>
      adapter.configure({
        authorizationKey,
        user: userWithoutKey,
        onStatusStateChange,
        onFlagsStateChange,
      })
    );

    it('should initialize the `splitio` with `authorizationKey` and random `user` `key`', () => {
      expect(splitio).toHaveBeenCalledWith({
        core: {
          authorizationKey,
          key: expect.any(String),
        },
      });
    });
  });

  describe('when reconfiguring before configured', () => {
    it('should reject reconfiguration', () => {
      return expect(adapter.reconfigure({ user: userWithKey })).rejects.toEqual(
        expect.any(Error)
      );
    });
  });

  describe('when ready', () => {
    let factory;
    let onStub;
    let onStatusStateChange;
    let onFlagsStateChange;

    beforeEach(() => {
      onStatusStateChange = jest.fn();
      onFlagsStateChange = jest.fn();
      onStub = jest.fn((_, cb) => cb());

      factory = {
        client: jest.fn(() => ({
          on: onStub,
          getTreatments: jest.fn(() => flags),
          Event: {
            SDK_READY: 'SDK_READY',
            SDK_UPDATE: 'SDK_UPDATE',
          },
        })),
        manager: jest.fn(() => ({
          names: jest.fn(() => names),
        })),
      };

      splitio.mockReturnValue(factory);

      return adapter.configure({
        authorizationKey,
        user: userWithKey,
        onStatusStateChange,
        onFlagsStateChange,
      });
    });

    describe('when `splitio` is ready', () => {
      it('should `dispatch` `onUpdateStatus` action with `isReady`', () => {
        expect(onStatusStateChange).toHaveBeenCalledWith({
          isReady: true,
        });
      });

      it('should `dispatch` `onStatusStateChange`', () => {
        expect(onFlagsStateChange).toHaveBeenCalledWith({
          someFlag1: true,
          someFlag2: false,
        });
      });

      it('should register callbacks to receive flag updates', () => {
        expect(onStub).toHaveBeenCalledWith(
          factory.client().Event.SDK_UPDATE,
          expect.any(Function)
        );
      });
    });

    describe('when reconfiguring', () => {
      const nextUser = { key: 'bar-user' };
      let namesStub;
      let getTreatmentsStub;
      let factory;

      beforeEach(() => {
        onStatusStateChange = jest.fn();
        onFlagsStateChange = jest.fn();
        namesStub = jest.fn(() => names);
        getTreatmentsStub = jest.fn(() => flags);

        factory = {
          client: jest.fn(() => ({
            on: jest.fn((_, cb) => cb()),
            getTreatments: getTreatmentsStub,
            Event: {
              SDK_READY: 'SDK_READY',
              SDK_UPDATE: 'SDK_UPDATE',
            },
          })),
          manager: jest.fn(() => ({
            names: namesStub,
          })),
        };

        splitio.mockReturnValue(factory);

        return adapter
          .configure({
            authorizationKey,
            user: userWithKey,
            onStatusStateChange,
            onFlagsStateChange,
          })
          .then(() => {
            // NOTE: Clearing stubs as they are invoked
            // first during `configure`.
            namesStub.mockClear();
            getTreatmentsStub.mockClear();

            adapter.reconfigure({
              user: nextUser,
              onStatusStateChange,
              onFlagsStateChange,
            });
          });
      });

      it('should invoke `names` after getting a new `manager`', () => {
        expect(factory.manager().names).toHaveBeenCalled();
      });

      it('should invoke `getTreatments` on the `client` with the new `user`', () => {
        expect(factory.client().getTreatments).toHaveBeenCalledWith(
          names,
          nextUser
        );
      });
    });
  });
});

describe('camelCasedFlags', () => {
  describe('with dashes', () => {
    const rawFlags = {
      'a-flag': true,
      'flag-b-c': false,
    };

    it('should camel case to uppercased flag names', () => {
      expect(camelCaseFlags(rawFlags)).toEqual({ aFlag: true, flagBC: false });
    });
  });

  describe('with spaces', () => {
    const rawFlags = {
      'a flag': true,
      'flag b-c': false,
    };

    it('should camel case to uppercased flag names', () => {
      expect(camelCaseFlags(rawFlags)).toEqual({ aFlag: true, flagBC: false });
    });
  });
});

describe('create anonymous user', () => {
  it('should create user with uuid in key property', () => {
    expect(createAnonymousUserKey()).toBeDefined();
  });

  it('should create uuid of length `foo-random-id`', () => {
    expect(createAnonymousUserKey().length).toBeGreaterThan(0);
  });
});

describe('normalizeFlag', () => {
  const flagName = 'fooFlag';

  describe('with `flagValue` being `null`', () => {
    it('should return `false`', () => {
      expect(normalizeFlag(flagName, null)).toEqual({
        flagName,
        flagValue: false,
      });
    });
  });

  describe('with `flagValue` being `on`', () => {
    it('should return `true`', () => {
      expect(normalizeFlag(flagName, 'on')).toEqual({
        flagName,
        flagValue: true,
      });
    });
  });

  describe('with `flagValue` being `off`', () => {
    it('should return `false`', () => {
      expect(normalizeFlag(flagName, 'off')).toEqual({
        flagName,
        flagValue: false,
      });
    });
  });

  describe('with anoy other `flagValue`', () => {
    describe('with a `String`', () => {
      it('should the `String`', () => {
        expect(normalizeFlag(flagName, 'Yeehaaw')).toEqual({
          flagName,
          flagValue: 'Yeehaaw',
        });
      });
    });

    describe('with a `Number`', () => {
      it('should the `Number`', () => {
        expect(normalizeFlag(flagName, 42)).toEqual({
          flagName,
          flagValue: 42,
        });
      });
    });
  });
});
