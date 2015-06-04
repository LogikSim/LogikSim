"use strict";

//
// scene
//

/** Define simple point for interconnect.
 */
function p(x, y) {
    return { x: x, y: y, type: "point" };
}

/** Define point for interconnect that is connected to an input of an element.
 * @param elem_id the id of the connected element
 * @param con_num the index of the input the interconnect is connected to, starting with 1
 */
function i(x, y, elem_id, con_num) {
    return { x: x, y: y, type: "input", elem_id: elem_id, con_num: con_num };
}

/** Define point for interconnect that is connected to an output of an element.
 * @param elem_id the id of the connected element
 * @param con_num the index of the output the interconnect is connected to, starting with 1
 */
function o(x, y, elem_id, con_num) {
    return { x: x, y: y, type: "output", elem_id: elem_id, con_num: con_num };
}

/** Define point that can be triggered by the mouse.
 */
function t(x, y) {
    return { x: x, y: y, type: "trigger" };
}


var halfadder_sim = new LogikSim.Frontend.Scene("halfadder", {
    scene_width: 30, // scene width in scene coordinates
    scene_height: 15, // scene height in scene coordinates
    scale: 10, // number of pixels for one scene coordinate
    items: [
        { type: "AND", id: 1, x: 10, y: 4 },
        { type: "OR", id: 2, x: 10, y: 8 },
        { type: "XOR", id: 3, x: 16, y: 6 },
        { type: "Interconnect", tree: [t(5, 4), p(7, 4), [i(10, 4, 1, 1)], [p(7, 8), i(10, 8, 2, 1)]] },
        { type: "Interconnect", tree: [t(5, 5), i(10, 5, 1, 2)] },
        { type: "Interconnect", tree: [t(5, 6), p(8, 6), [i(10, 6, 1, 3)], [p(8, 10), i(10, 10, 2, 3)]] },
        { type: "Interconnect", tree: [o(12, 5, 1, 1), p(14, 5), p(14, 6), i(16, 6, 3, 1)] },
        { type: "Interconnect", tree: [o(12, 9, 2, 1), p(14, 9), p(14, 8), i(16, 8, 3, 3)] },
        { type: "Interconnect", tree: [o(18, 7, 3, 1), p(23, 7)] }
    ]
});

/*
new LogikSim.Frontend.Scene("flipflop", {
    scene_width: 30, // scene width in scene coordinates
    scene_height: 15, // scene height in scene coordinates
    scale: 10, // number of pixels for one scene coordinate
    items: [
        { type: "AND", id: 1, x: 7, y: 4 },
        { type: "AND", id: 2, x: 7, y: 10 },
        { type: "AND", id: 3, x: 13, y: 4 },
        { type: "AND", id: 4, x: 13, y: 10 },
        { type: "Interconnect", tree: [o(9, 5, 1, 1), i(13, 5, 2, 2)] }, // connect stage 1 to stage 2
        { type: "Interconnect", tree: [o(9, 11, 3, 1), i(13, 11, 4, 2)] }, // connect stage 1 to stage 2
        { type: "Interconnect", tree: [t(2, 8), p(6, 8), [p(6, 6), i(7, 6, 1, 3)], [p(6, 10), i(7, 10, 3, 1)]] }, // Clock input
        { type: "Interconnect", tree: [t(2, 5), i(7, 5, 1, 2)] }, // J input
        { type: "Interconnect", tree: [t(2, 11), i(7, 11, 3, 2)] }, // K input
        { type: "Interconnect", tree: [o(15, 5, 2, 1), p(17, 5), [p(17, 7), [p(12, 7), p(12, 10), i(13, 10, 4, 1)], [p(17, 13), p(6, 13), p(6, 12), i(7, 12, 3, 3)]], [p(20, 5)]] }, // Q output
        { type: "Interconnect", tree: [o(15, 11, 4, 1), p(16, 11), [p(16, 9), [p(11, 9), p(11, 6), i(13, 6, 2, 3)], [p(16, 3), p(6, 3), p(6, 4), i(7, 4, 1, 1)]], [p(20, 11)]] }, // !Q output
    ]
});
*/

var fulladder_sim = new LogikSim.Frontend.Scene("flipflop", {
    scene_width: 30, // scene width in scene coordinates
    scene_height: 15, // scene height in scene coordinates
    scale: 10, // number of pixels for one scene coordinate
    items: [
        { type: "AND", id: 1, x: 7, y: 4 },
        { type: "AND", id: 2, x: 7, y: 10 },
        { type: "Interconnect", tree: [o(9, 5, 1, 1), i(13, 5, 2, 2)] }, // connect stage 1 to stage 2
        { type: "Interconnect", tree: [o(9, 11, 3, 1), i(13, 11, 4, 2)] }, // connect stage 1 to stage 2
        { type: "Interconnect", tree: [t(2, 8), p(6, 8), [p(6, 6), i(7, 6, 1, 3)], [p(6, 10), i(7, 10, 3, 1)]] }, // Clock input
        { type: "Interconnect", tree: [t(2, 5), i(7, 5, 1, 2)] }, // J input
        { type: "Interconnect", tree: [t(2, 11), i(7, 11, 3, 2)] }, // K input
        { type: "Interconnect", tree: [o(15, 5, 2, 1), p(17, 5), [p(17, 7), [p(12, 7), p(12, 10), i(13, 10, 4, 1)], [p(17, 13), p(6, 13), p(6, 12), i(7, 12, 3, 3)]], [p(20, 5)]] }, // Q output
        { type: "Interconnect", tree: [o(15, 11, 4, 1), p(16, 11), [p(16, 9), [p(11, 9), p(11, 6), i(13, 6, 2, 3)], [p(16, 3), p(6, 3), p(6, 4), i(7, 4, 1, 1)]], [p(20, 11)]] }, // !Q output
    ]
});

