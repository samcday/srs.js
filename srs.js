"use strict";

var crypto = require("crypto");

// This timestamp code is based on the C libsrs2 implementation.
var timeBaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  timeSize = 2,
  timeBaseBits = 5,
  timePrecision = (60 * 60 * 24),
  timeSlots = (1<<(timeBaseBits<<(timeSize-1))),
  validSeparators = "=-+";

function makeTimestamp() {
  var now = Math.round(Date.now() / 1000 / timePrecision);
  var str = timeBaseChars[now & ((1 << timeBaseBits) - 1)];
  now = now >> timeBaseBits;
  str = timeBaseChars[now & ((1 << timeBaseBits) - 1)] + str;
  return str;
}

function createHash(secret, timestamp, domain, local) {
  var hmac = crypto.createHmac("sha1", secret);
  Array.prototype.slice.call(arguments, 1).forEach(function(data) {
    hmac.update(data);
  });
  return hmac.digest("hex").substring(0, 4);
}

function checkTimestamp(str, maxAge) {
  var then = 0;
  for (var i = 0; i < str.length; i++) {
    then = (then << timeBaseBits) | timeBaseChars.indexOf(str[i].toUpperCase());
  }

  var now = Math.round(Date.now() / 1000 / timePrecision) % timeSlots;
  while(now < then) {
    now = now + timeSlots;
  }

  return now <= then + maxAge;
}

function SRS(options) {
  options = options || {};
  this.secret = options.secret;
  this.separator = (options.separator || "=")[0];
  this.maxAge = options.maxAge || 21;

  if (!this.secret) {
    throw new TypeError("A secret must be provided");
  }

  if (validSeparators.indexOf(this.separator) < 0) {
    throw new TypeError("Invalid separator");
  }

  this.srs0Re = new RegExp("SRS0[\\-=+]([0-9a-f]{4})=" + 
                            "([" + timeBaseChars + "]{2})=" +
                            "([^=]*)=(.*)");

  this.srs1Re = new RegExp("SRS1[\\-=+]([0-9a-f]{4})=([^=]*)=(.*)");
}

SRS.prototype.isSrs0 = function(local) {
  return local.indexOf("SRS0") === 0;
};

SRS.prototype.isSrs1 = function(local) {
  return local.indexOf("SRS1") === 0;
};

SRS.prototype.rewrite = function(local, domain) {
  if (this.isSrs0(local)) {
    // Create a guarded address.
    var guarded = local.substring(4);
    return "SRS1" + this.separator + createHash(this.secret, domain, guarded) +
           this.separator + domain + this.separator + guarded;
  } else if (this.isSrs1(local)) {
    var match = this.srs1Re.exec(local);
    if (!match) {
      throw new Error("Attempted to rewrite invalid SRS1 address.");
    }
    return "SRS1" + this.separator + createHash(this.secret, match[2], match[3]) +
           "=" + match[2] + "=" + match[3];
  }

  var timestamp = makeTimestamp();
  var hash = createHash(this.secret, timestamp, domain, local);    

  return "SRS0" + this.separator + hash + "=" + timestamp +
                  "=" + domain + "=" + local;
};

SRS.prototype.reverse = function(address) {
  var matches, hash, timestamp, domain, local, expectedHash;

  if (this.isSrs0(address)) {
    matches = this.srs0Re.exec(address);
    if (!matches) {
      throw new TypeError("Unrecognized SRS0 format");
    }
    
    hash = matches[1];
    timestamp = matches[2];
    domain = matches[3];
    local = matches[4];

    expectedHash = createHash(this.secret, timestamp, domain, local);
    if (expectedHash !== hash) {
      throw new TypeError("Invalid signature");
    }

    if (!checkTimestamp(timestamp, this.maxAge)) {
      throw new TypeError("Address has expired");
    }

    return [local, domain];
  } else if (this.isSrs1(address)) {
    matches = this.srs1Re.exec(address);
    if (!matches) {
      throw new TypeError("Unrecognized SRS1 format");
    }
    
    hash = matches[1];
    domain = matches[2];
    local = matches[3];

    expectedHash = createHash(this.secret, domain, local);
    if (expectedHash !== hash) {
      throw new TypeError("Invalid signature");
    }

    return ["SRS0" + local, domain];
  }

  return null;
};

module.exports = SRS;
