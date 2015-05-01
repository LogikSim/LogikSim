# LogikSim
[![Build Status](https://travis-ci.org/LogikSim/LogikSim.svg?branch=master)](https://travis-ci.org/LogikSim/LogikSim) [![Test Coverage](https://codeclimate.com/github/LogikSim/LogikSim/badges/coverage.svg)](https://codeclimate.com/github/LogikSim/LogikSim) [![Code Climate](https://codeclimate.com/github/LogikSim/LogikSim/badges/gpa.svg)](https://codeclimate.com/github/LogikSim/LogikSim) 

Our vision is to build the world's best software to understand digital
circuits; A logic simulator that makes it easy and fun to explore and
design digital circuits starting from simple AND gates, up to complex
computing systems as we use them today.

### Demo ###
Our current demo is available at:

https://rawgit.com/LogikSim/LogikSim/master/src/index.html

### Who uses LogikSim ###

Our target audience are newcomers to the field of digital electronics
of any age. We specifically target educational programs. For which
we provide a free solution to gain practical experience in upper
high school or university level courses. With our software students
can design logic circuits by themselves and learn key lessons
from firsthand experience. We are sure this will both increase the
depth and quality of courses covering digital circuits.

### Why we create LogikSim ###

We have always been fascinated by the huge levels of abstraction that
make it possible to build processors from simple two input logic
functions like AND. With LogikSim we are sharing our fascination.
Through LogikSim you will be able to see these abstraction layer for
yourself, one by one. At first you will start with simple digital elements.
From there, you will quickly transition to more complex functions like
adders. The next step will be to introduce feedbacks and build circuits
that can store information. This will enable you to build flip-flops,
opening the door to sequential logic. By introducing clocks you can build
state machines and more complex memories. Your final task will be to
abstract from the logic layer. First you will think about how to build
programmable state machines that operate on programs stored in memories.
This will lead the path to a formalized instruction set and memory
sub-systems. This final step will bridge the gap to software programming
and make you grasp how today processors operate on a fundamental level.

### How to build LogikSim ###
If you want to contribute to LogikSim as a developer you will want to be
able to build LogikSim locally. LogikSim uses [*npm*](https://www.npmjs.com/) to manage development
dependencies as well as [*gulp*](http://gulpjs.com/) as a build tool. As such all you need to get
started is *npm* installed on your system. After cloning our repository enter
it with a console and use
```bash
npm install
npm install --global gulp
```
To pull in all development dependencies and to install the *gulp* build tool to
your system. After that you can use
```bash
gulp help
```
to figure out which commands are available.
