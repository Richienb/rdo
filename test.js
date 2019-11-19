import test from "ava"
import Rdo from "./src"

test("main", async (t) => {
    const random = new Rdo()
    t.true([1, 2].includes((await random.integer({ min: 1, max: 2 }))[0]))
})
