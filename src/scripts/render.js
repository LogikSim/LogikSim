
//
// scene
//

var grid = 100;
var scale = 0.12;

function to_grid(z) {
    return Math.round(z * grid * scale);
}

var width = 10000,
    height = 10000;

var scene = d3.select(".scene")
    .attr("width", width)
    .attr("height", height);



//
// background
//

var pattern = scene.append('defs')
    .append('pattern')
        .attr('id', 'gridPattern')
        .attr('width', to_grid(5))
        .attr('height', to_grid(5))
        .attr('patternUnits', 'userSpaceOnUse')
for (var i = 0; i < 5; i++) {
    var line_class = i === 0 ? "grid-major" : "grid-minor";
    pattern.append("line")
        .attr("class", line_class)
        .attr("x1", to_grid(0))
        .attr("x2", to_grid(5))
        .attr("y1", to_grid(i))
        .attr("y2", to_grid(i));
    pattern.append("line")
        .attr("class", line_class)
        .attr("x1", to_grid(i))
        .attr("x2", to_grid(i))
        .attr("y1", to_grid(0))
        .attr("y2", to_grid(5));
}
scene.append("rect")
    .attr('width', width)
    .attr('height', height)
    .attr("fill", 'url(#gridPattern)');

//
// logicitems
//

function gen_data(x_range, y_range, x_step, y_step) {
    var res = [];
    for (var x = 0; x < x_range; x++) {
        for (var y = 0; y < y_range; y++) {
            res.push({
                "x": 10 + x * x_step,
                "y": 10 + y * y_step
            });
        }
    }
    return res;
}


var data = gen_data(10, 10, 5, 5);

var overlapp = 0.37

var logicitems = scene.selectAll("g")
    .data(data)
    .enter().append("g")
    .attr("transform", function (d, i) {
        return "translate(" +
            to_grid(d.x) + "," + to_grid(d.y) + ")";
    });

// body
logicitems.append("rect")
    .attr("class", "logicitem")
    .attr("y", to_grid(-overlapp))
    .attr("width", to_grid(2))
    .attr("height", to_grid(2 + 2 * overlapp));

// input connectors
for (var i = 0; i < 3; ++i) {
    logicitems.append("line")
        .attr("class", "logicitem")
        .attr("x1", to_grid(-0.5))
        .attr("x2", 0)
        .attr("y1", to_grid(i))
        .attr("y2", to_grid(i));
}

// output connector
logicitems.append("line")
    .attr("class", "logicitem")
    .attr("x1", to_grid(2))
    .attr("x2", to_grid(2.5))
    .attr("y1", to_grid(1))
    .attr("y2", to_grid(1));

// label
logicitems.append("text")
    .attr("class", "logicitem")
    .attr("x", to_grid(1))
    .attr("y", to_grid(1))
    .text("&");

//
// fps
//

scene.append("text")
    .attr("class", "control_fps")
    .attr("x", 20)
    .attr("y", 20)

var t = 0;
var last = 0;
var last_print = 0;
d3.timer(function (elapsed) {
    t = elapsed / 1000;
    var fps = 1 / (elapsed - last) * 1000;
    last = elapsed;
    if (elapsed - last_print > 200) {
        scene.selectAll("text.control_fps")
            .text("fps = " + Math.round(fps));
        last_print = elapsed;
    }
    update_lines(t);
})

//
// linetrees
//

/*
function gen_line_data(x_range, y_range, x_step, y_step) {
    var res = [];
    for (var x = 0; x < x_range; x++) {
        for (var y = 0; y < y_range; y++) {
            res.push({
                "x": 10 + x * x_step,
                "y": 8 + y * y_step,
                "length": 17, //Math.max(1, Math.round(Math.random() * 19)),
                "update": get_update_function()
            });
        }
    }
    return res;
}

var line_data = gen_line_data(10, 1, 20, 5);

scene.selectAll("linetree")
    .data(line_data)
    .enter().append("g")
    .attr("transform", function (d, i) {
        return "translate(" +
            to_grid(d.x) + "," + to_grid(d.y) + ")"
    })
    .attr("class", "linetree");

function update_lines(t) {
    d3.selectAll(".linetree").each(function (d, i) {
        d.update(t, this);
    });
}

function get_update_function() {
    var first = true;
    var next_state = true;
    var next_signal = 0;
    return function(time, d) {
        if (first || time > next_signal) {
            first = false;

            //var signal_length = Math.exp(Math.random());
            var signal_length = this.length * 2;
            var line_length = this.length * 2;

            //var line_class = next_state ? "linetree-active" : "linetree-inactive";
            var line_class = "linetree-active";
            next_state = !next_state;
            next_signal = time + signal_length;

            var tween_x1 = function(d, i, a) {
                var basic_interpolator = d3.interpolate(-to_grid(signal_length),
                    to_grid(line_length));
                return function(t) {
                    return Math.max(basic_interpolator(t), 0);
                }
            }
            var tween_x2 = function(d, i, a) {
                var basic_interpolator = d3.interpolate(0, to_grid(line_length) +
                    to_grid(signal_length));
                return function(t) {
                    return Math.min(basic_interpolator(t),
                        to_grid(line_length));
                }
            }
            d3.select(d).append("line")
                .attr("class", line_class)
                .attr("x1", to_grid(line_length))
                .attr("stroke-dasharray", "10, 10, 10, 10")
                .attr("stroke-dashoffset", 0)
                .transition()
                .duration((signal_length + line_length) * 1000)
                .ease("linear")
                .attr("stroke-dashoffset", to_grid(line_length))
                //.remove();

            return;

            d3.select(d).append("line")
                .attr("class", line_class)
                .transition()
                .duration((signal_length + line_length) * 1000)
                .ease("linear")
                .attrTween("x1", tween_x1)
                .attrTween("x2", tween_x2)
                .remove();
        }
    }
}
*/