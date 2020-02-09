# Rdo [![Travis CI Build Status](https://img.shields.io/travis/com/Richienb/rdo/master.svg?style=for-the-badge)](https://travis-ci.com/Richienb/rdo)

Random.org API client library for JavaScript.

[![NPM Badge](https://nodei.co/npm/rdo.png)](https://npmjs.com/package/rdo)

## Why?

- Simple syntax.
- Response normalisation.
- Sensible defaults.
- Automatic request encoding.
- Works in Node.js and in the browser.
- Actively Maintained.

## Install

```sh
npm install rdo
```

## Usage

```js
const Rdo = require("rdo");

const random = new Rdo({ apiKey: "Some api key" });

random.integer({ min: 0, max: 10 }).then(console.log);
// 6
```

## API

See the [documentation](https://richienb.github.io/rdo).
