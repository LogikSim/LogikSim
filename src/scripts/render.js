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
        { type: "Interconnect", tree: [t(5, 4), p(7, 4), [i(10, 4, 1, 1)], [p(7, 8), i(10, 8, 2, 1)]] },
        { type: "Interconnect", tree: [t(5, 5), p(8, 5), [i(10, 5, 1, 2)], [p(8, 9), i(10, 9, 2, 2)]] },
        { type: "Interconnect", tree: [o(13, 5, 1, 1), p(14, 5), p(14, 6), i(16, 6, 3, 1)] },
        { type: "Interconnect", tree: [o(13, 9, 2, 1), p(14, 9), p(14, 7), i(16, 7, 3, 2)] },
        { type: "Interconnect", tree: [o(19, 7, 3, 1), p(23, 7)] },
        { type: "AND", id: 1, x: 10, y: 4 },
        { type: "OR", id: 2, x: 10, y: 8 },
        { type: "XOR", id: 3, x: 16, y: 6 },
    ]
});

var fulladder_sim = new LogikSim.Frontend.Scene("flipflop", {
    scene_width: 15, // scene width in scene coordinates
    scene_height: 15, // scene height in scene coordinates
    scale: 10, // number of pixels for one scene coordinate
    items: [
        { type: "Interconnect", tree: [t(2, 4), i(6, 4, 1, 1)] }, // J input
        { type: "Interconnect", tree: [t(2, 11), i(6, 11, 2, 2)] }, // K input
        { type: "Interconnect", tree: [o(9, 5, 1, 1), p(11, 5), [p(11, 7), p(4, 7), p(4, 9), i(6, 9, 2, 1)], [p(13, 5)] ] }, // Q output
        { type: "Interconnect", tree: [o(9, 10, 2, 1), p(11, 10), [p(11, 8), p(3, 8), p(3, 6), i(6, 6, 1, 2)], [p(13, 10)]] }, // !Q output
        { type: "NAND", id: 1, x: 6, y: 4 },
        { type: "NAND", id: 2, x: 6, y: 9 },
    ]
});

