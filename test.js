import test from "ava"
import isUUID from "is-uuid"
import isBlob from "is-blob"
import Blob from "cross-blob"
import Rdo from "./src"
globalThis.Blob = Blob

const unauthed = new Rdo()
const authed = new Rdo({
    apiKey: "e41c3411-661c-4fb7-bdd0-663832665127",
})
const signed = new Rdo({
    apiKey: "e41c3411-661c-4fb7-bdd0-663832665127",
    signed: true,
})

test("unauthed: integer", async (t) => {
    t.true([1, 2].includes((await unauthed.integer({ min: 1, max: 2 }))[0]))
})

test("authed: integer", async (t) => {
    t.true([1, 2, 3, 4, 5].includes((await authed.integer({ min: 1, max: 5 }))[0]))
})

test("signed: integer", async (t) => {
    t.true([1, 2, 3, 4, 5].includes((await signed.integer({ min: 1, max: 5 }))[0]))
})

test("authed: decimal", async (t) => {
    t.is(typeof (await authed.decimal())[0], "number")
})

test("signed: decimal", async (t) => {
    t.is(typeof (await signed.decimal())[0], "number")
})

test("unauthed: quota", async (t) => {
    t.is(typeof (await unauthed.quota()), "number")
})

test("authed: quota", async (t) => {
    t.deepEqual(Object.keys(await authed.quota()), ["running", "creationTime", "bitsLeft", "requestsLeft", "totalBits", "totalRequests"])
})

test("signed: quota", async (t) => {
    t.deepEqual(Object.keys(await signed.quota()), ["running", "creationTime", "bitsLeft", "requestsLeft", "totalBits", "totalRequests"])
})

test("authed: sequence", async (t) => {
    t.is(typeof (await authed.sequence({ min: 0, max: 10 }))[0][0], "number")
})

test("signed: sequence", async (t) => {
    t.is(typeof (await signed.sequence({ min: 0, max: 10 }))[0][0], "number")
})

test("authed: gaussian", async (t) => {
    t.is(typeof (await authed.gaussian({ mean: 10, standardDeviation: 10, significantDigits: 10 }))[0], "number")
})

test("signed: gaussian", async (t) => {
    t.is(typeof (await signed.gaussian({ mean: 10, standardDeviation: 10, significantDigits: 10 }))[0], "number")
})

test("unauthed: string", async (t) => {
    t.is(typeof (await unauthed.string())[0], "string")
})

test("authed: string", async (t) => {
    t.is(typeof (await authed.string())[0], "string")
})

test("signed: string", async (t) => {
    t.is(typeof (await signed.string())[0], "string")
})

test("authed: uuid", async (t) => {
    t.true(isUUID.v4((await authed.uuid())[0]))
})

test("signed: uuid", async (t) => {
    t.true(isUUID.v4((await signed.uuid())[0]))
})

test("authed: blob", async (t) => {
    t.true(isBlob((await authed.blob())[0]))
})

test("signed: blob", async (t) => {
    t.true(isBlob((await signed.blob())[0]))
})
