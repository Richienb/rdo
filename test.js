import test from "ava"
import Rdo from "./src"

const unauthed = new Rdo()
const authed = new Rdo({
    apiKey: "e41c3411-661c-4fb7-bdd0-663832665127",
})

test("unauthed: integer", async (t) => {
    t.true([1, 2].includes((await unauthed.integer({ min: 1, max: 2 }))[0]))
})

test("authed: integer", async (t) => {
    t.true([1, 2, 3, 4, 5].includes((await authed.integer({ min: 1, max: 5 }))[0]))
})

test("unauthed: quota", async (t) => {
    t.is(typeof (await unauthed.quota()), "number")
})

test("authed: quota", async (t) => {
    t.deepEqual(Object.keys(await authed.quota()), ["running", "creationTime", "bitsLeft", "requestsLeft", "totalBits", "totalRequests"])
})
