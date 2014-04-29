"use strict";

// TODO: handle other separators and make sure they're propagated correctly.

var crypto = require("crypto");

// This timestamp code is based on the C libsrs2 implementation.
var timeBaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  timeSize = 2,
  timeBaseBits = 5,
  timePrecision = (60 * 60 * 24),
  timeSlots = (1<<(timeBaseBits<<(timeSize-1)));

function makeTimestamp() {
  var now = Math.round(Date.now() / 1000 / timePrecision);
  var str = timeBaseChars[now & ((1 << timeBaseBits) - 1)];
  now = now >> timeBaseBits;
  str = timeBaseChars[now & ((1 << timeBaseBits) - 1)] + str;
  return str;
}

function createHash(secret, timestamp, domain, local) {
  var hmac = crypto.createHmac("sha1", secret);
  hmac.update(timestamp);
  hmac.update(domain);
  hmac.update(local);
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
  this.separator = options.separator || "=";
  this.maxAge = options.maxAge || 21;

  if (!this.secret) {
    throw new TypeError("options.secret must be set");
  }

  this.parseRe = new RegExp("SRS[01]" + this.separator + "([0-9a-f]{4})" + 
                            this.separator + "([" + timeBaseChars + "]{2})" +
                            this.separator + "([^" + this.separator + "]*)" +
                            this.separator + "(.*)");
}

SRS.prototype.isSrs0 = function(local) {
  return local.indexOf("SRS0") === 0;
};

SRS.prototype.rewrite = function(local, domain) {
  if (this.isSrs0(local)) {
    // Create a guarded address.
  }

  var timestamp = makeTimestamp();
  var hash = createHash(this.secret, timestamp, domain, local);    

  return "SRS0" + this.separator + hash + this.separator + timestamp +
                  this.separator + domain + this.separator + local;
};

SRS.prototype.reverse = function(address) {
  if (address.indexOf("SRS") !== 0) {
    return null;
  }

  var matches = this.parseRe.exec(address);
  if (!matches) {
    throw new TypeError("Unrecognized SRS format");
  }
  
  var hash = matches[1],
      timestamp = matches[2],
      domain = matches[3],
      local = matches[4];

  var expectedHash = createHash(this.secret, timestamp, domain, local);
  if (expectedHash !== hash) {
    throw new TypeError("Invalid signature");
  }

  if (!checkTimestamp(timestamp, this.maxAge)) {
    throw new TypeError("Address has expired");
  }

  return [local, domain];
};

module.exports = SRS;
