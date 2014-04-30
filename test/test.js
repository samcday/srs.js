var sinon = require("sinon"),
    chai  = require("chai");

var expect = chai.expect;

var SRS = require("..");

describe("SRS.js", function() {
  var clock = sinon.useFakeTimers(1398772288249);
  after(function() {
    clock.restore();
  });

  it("rewrites a standard address correctly", function() {

    var srs = new SRS({secret: "secret"});
    var rewritten = srs.rewrite("me", "samcday.com.au");
    expect(rewritten).to.equal("SRS0=5840=Z5=samcday.com.au=me");
  });

  it("rewrites an SRS0 address with guarded scheme", function() {
    var srs = new SRS({secret: "secret"});
    var rewritten = srs.rewrite("SRS0=5840=Z5=samcday.com.au=me", "forwarder.com");
    expect(rewritten).to.equal("SRS1=6b42=forwarder.com==5840=Z5=samcday.com.au=me");
  });

  it("rewrites an SRS1 address with guarded scheme to exactly the same address", function() {
    var srs = new SRS({secret: "secret"});
    var rewritten = srs.rewrite("SRS1=6b42=forwarder.com==5840=Z5=samcday.com.au=me", "forwarder.com");
    expect(rewritten).to.equal("SRS1=6b42=forwarder.com==5840=Z5=samcday.com.au=me");
  });

  it("rewrites an SRS1 address with guarded scheme with correct hash", function() {
    var srs = new SRS({secret: "secret1"});
    var rewritten = srs.rewrite("SRS1=6b42=forwarder.com==5840=Z5=samcday.com.au=me", "forwarder.com");
    expect(rewritten).to.equal("SRS1=d8ff=forwarder.com==5840=Z5=samcday.com.au=me");
  });

  it("reverses an SRS0 address correctly", function() {
    var clock = sinon.useFakeTimers(1398772288249);
    after(function() {
      clock.restore();
    });

    var srs = new SRS({secret: "secret"});
    var reversed = srs.reverse("SRS0=5840=Z5=samcday.com.au=me");
    expect(reversed[0]).to.equal("me");
    expect(reversed[1]).to.equal("samcday.com.au");
  });

  it("returns null when reversing non SRS addresses", function() {
    var srs = new SRS({secret: "secret"});
    expect(srs.reverse("foo")).to.be.null;
  });

  it("fails to reverse an invalid local", function() {
    var srs = new SRS({secret: "secret"});

    expect(function() {
      srs.reverse("SRS0=lolwat");
    }).to.throw(/Unrecognized SRS/);
  });

  it("fails to reverse an invalid hash", function() {
    var srs = new SRS({secret: "secret1"});
    expect(function() {
      srs.reverse("SRS0=5840=Z5=samcday.com.au=me");
    }).to.throw(/Invalid sig/);
  });

  it("reverses an SRS1 address correctly", function() {
    var srs = new SRS({secret: "secret"});
    var reversed = srs.reverse("SRS1=6b42=forwarder.com==5840=Z5=samcday.com.au=me");
    expect(reversed[0]).to.equal("SRS0=5840=Z5=samcday.com.au=me");
    expect(reversed[1]).to.equal("forwarder.com");
  });

  it("fails to reverse invalid SRS1 signature", function() {
    var srs = new SRS({secret: "secret"});
    expect(function() {
      srs.reverse("SRS1=666f=forwarder.com==5840=Z5=samcday.com.au=me");
    }).to.throw(/Invalid sig/);
  });

  
});
