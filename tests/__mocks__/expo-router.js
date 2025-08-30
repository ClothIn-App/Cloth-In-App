// __mocks__/expo-router.js  (repo root)
const mock = { replace: jest.fn(), push: jest.fn() };
module.exports = { __esModule: true, useRouter: () => mock, __mock: mock };
