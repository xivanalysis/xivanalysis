import mathjsCore from 'mathjs/core'
const math = mathjsCore.create()

math.import(require('mathjs/lib/function/statistics/mean'))
math.import(require('mathjs/lib/function/statistics/median'))
math.import(require('mathjs/lib/function/statistics/mode'))

export default math
