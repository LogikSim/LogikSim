"use strict";

//
// scene
//

function p(x, y) {
    return { x: x, y: y };
}

new LogikSim.Frontend.Scene("halfadder", {
    scene_width: 30, // scene width in scene coordinates
    scene_height: 15, // scene height in scene coordinates
    scale: 10, // number of pixels for one scene coordinate
    items: [
        { type: "AND", x: 10, y: 4 },
        { type: "OR", x: 10, y: 8 },
        { type: "XOR", x: 16, y: 6 },
        { type: "Interconnect", tree: [p(5, 4), p(7, 4), [p(10, 4)], [p(7, 8), p(10, 8)]] },
        { type: "Interconnect", tree: [p(5, 6), p(8, 6), [p(10, 6)], [p(8, 10), p(10, 10)]] },
        { type: "Interconnect", tree: [p(12, 5), p(14, 5), p(14, 6), p(16, 6)] },
        { type: "Interconnect", tree: [p(12, 9), p(14, 9), p(14, 8), p(16, 8)] },
        { type: "Interconnect", tree: [p(18, 7), p(23, 7)] }
    ]
});

new LogikSim.Frontend.Scene("flipflop", {
    scene_width: 30, // scene width in scene coordinates
    scene_height: 15, // scene height in scene coordinates
    scale: 10, // number of pixels for one scene coordinate
    items: [
        { type: "AND", x: 7, y: 4 },
        { type: "AND", x: 7, y: 10 },
        { type: "AND", x: 13, y: 4 },
        { type: "AND", x: 13, y: 10 },
        { type: "Interconnect", tree: [p(9, 5), p(13, 5)] }, // connect stage 1 to stage 2
        { type: "Interconnect", tree: [p(9, 11), p(13, 11)] }, // connect stage 1 to stage 2
        { type: "Interconnect", tree: [p(2, 8), p(6, 8), [p(6, 6), p(7, 6)], [p(6, 10), p(7, 10)]] }, // Clock input
        { type: "Interconnect", tree: [p(2, 5), p(7, 5)] }, // J input
        { type: "Interconnect", tree: [p(2, 11), p(7, 11)] }, // K input
        { type: "Interconnect", tree: [p(15, 5), p(17, 5), [p(17, 7), [p(12, 7), p(12, 10), p(13, 10)], [p(17, 13), p(6, 13), p(6, 12), p(7, 12)]], [p(20, 5)]] }, // Q output
        { type: "Interconnect", tree: [p(15, 11), p(16, 11), [p(16, 9), [p(11, 9), p(11, 6), p(13, 6)], [p(16, 3), p(6, 3), p(6, 4), p(7, 4)]], [p(20, 11)]] }, // !Q output
    ]
});