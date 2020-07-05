import Parser from '../Parser'

const MockedParser = jest.genMockFromModule<{default: typeof Parser}>('../Parser').default
Object.defineProperty(MockedParser.prototype, 'eventTimeOffset', {value: 0})

export default MockedParser
