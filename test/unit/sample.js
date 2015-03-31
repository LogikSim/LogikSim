describe("A suite", function() {
  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });
});

describe("A suite is just a function", function() {
  var a;

  it("and so is a spec", function() {
    a = true;

    expect(a).toBe(true);
  });
});

describe("My suite", function() {
  it("should fail here", function() {
    expect(false).toBe(true);
  });
});

// https://www.npmjs.com/package/karma-jasmine-jquery
// https://github.com/velesin/jasmine-jquery
describe("My suite with fixture", function() {
  beforeEach(function() {
    loadFixtures('sample.html');
  });

  it("can find the element with ID bernd", function() {
    expect($j('#bernd')).toBeInDOM();
  });

  it("can't find the element with the ID burd", function() {
    expect($j('#burd')).not.toBeInDOM();
  });
});

describe("The backend foo placeholder", function() {
  it("receives some coverage", function() {
    expect(foo(5, 4)).toEqual(9);
  });
});
