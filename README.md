srs.js
======

Javascript implementation of Sender Rewriting Scheme.

```npm install srs.js```

## Usage

```
var SRS = require("srs.js");
var rewriter = new SRS({
    secret: "asecretkey"
});
var rewritten = rewriter.forward("orig", "example.org", "forwarder.com");
// -> rewritten: SRS0=HHH=TT=example.org=orig@forwarder.com"

var reversed = rewriter.reverse(rewritten);
// -> reversed: orig@example.org
```
