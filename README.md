srs.js `v0.1.0`
===============

[![Build Status](http://img.shields.io/travis/samcday/srs.js.svg?style=flat-square)](https://travis-ci.org/samcday/srs.js) [![Code Climate](http://img.shields.io/codeclimate/github/samcday/srs.js.svg?style=flat-square)](https://codeclimate.com/github/samcday/srs.js)

```npm install srs.js```

Javascript implementation of [Sender Rewriting Scheme](https://en.wikipedia.org/wiki/Sender_Rewriting_Scheme). Loosely based on the [libsrs2](https://github.com/shevek/libsrs2) implementation, though compatibility with libsrs2/Mail::SRS is not guaranteed.

## Usage

```
var SRS = require("srs.js");
var rewriter = new SRS({
    secret: "asecretkey"
});

// Rewrite the email orig@example.org
var rewritten = rewriter.forward("orig", "example.org");
// -> rewritten: SRS0=HHH=TT=example.org=orig
// Note that rewritten address does not include domain part (@example.org)

var reversed = rewriter.reverse(rewritten);
// -> reversed: ["orig", "example.org"]
```

## License

[Apache 2.0](LICENSE)
