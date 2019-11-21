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
    t.true([1, 2].includes((await authed.integer({ min: 1, max: 2 }))[0]))
})

test("unauthed: quota", async (t) => {
    console.log(await unauthed.quota())
    t.pass()
})

test("authed: quota", async (t) => {
    console.log(await authed.quota())
    t.pass()
})
