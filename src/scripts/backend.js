// Placeholder

function foo(a, b) {
    if (a > 3) {
        a = a + a - a;
    }

    if (b < -3) {
        b = 0;
    }
    return a + b;
}

function uncoveredbar(a, b) {
    return b + a;
}
