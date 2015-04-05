// https://www.npmjs.com/package/karma-jasmine-jquery
// https://github.com/velesin/jasmine-jquery
describe("This sample suite with fixture", function() {
  beforeEach(function() {
    loadFixtures('sample.html');
  });

  it("should find the element with ID bernd", function() {
    expect($j('#bernd')).toBeInDOM();
  });

  it("shouldn't find the element with the ID burd", function() {
    expect($j('#burd')).not.toBeInDOM();
  });
});
