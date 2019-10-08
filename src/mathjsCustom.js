import mathjsCore from 'mathjs/core'
const math = mathjsCore.create()

// Using require instead of imports to reduce clutter
math.import(require('mathjs/lib/function/statistics/mean'))
math.import(require('mathjs/lib/function/statistics/median'))
math.import(require('mathjs/lib/function/statistics/mode'))
math.import(require('mathjs/lib/function/statistics/sum'))
math.import(require('mathjs/lib/function/statistics/std')) // SORRY ACK, I NEED IT FOR REASONS

export default math
