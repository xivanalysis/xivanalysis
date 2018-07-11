import mathjsCore from "mathjs/core"
const math = mathjsCore.create();

// Using require instead of imports to reduce clutter
/* global require */
math.import(require("mathjs/lib/function/statistics/mean"));
math.import(require("mathjs/lib/function/statistics/median"));
math.import(require("mathjs/lib/function/statistics/mode"));

export default math
