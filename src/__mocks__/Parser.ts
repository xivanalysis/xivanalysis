jest.mock('parser/core/Parser')
import Parser from 'parser/core/Parser'

export const MockedParser = Parser as jest.Mock<Parser>
