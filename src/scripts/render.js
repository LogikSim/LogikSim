
//
// scene
//

function P(x, y) {
    return { x: x, y: y };
};

var scene_data = {
    width: 500, // view width in px
    scene_width: 50, // scene width in scene coordinates
    scene_height: 30, // scene height in scene coordinates
    items: [
        { type: "and", x: 10, y: 4 },
        { type: "or", x: 10, y: 8 },
        { type: "xor", x: 16, y: 6 },
        { type: "interconnect", tree: [P(5, 4), P(7, 4), [P(10, 4)], [P(7, 8), P(10, 8)]] },
        { type: "interconnect", tree: [P(5, 6), P(8, 6), [P(10, 6)], [P(8, 10), P(10, 10)]] },
        { type: "interconnect", tree: [P(12, 5), P(14, 5), P(14, 6), P(16, 6)] },
        { type: "interconnect", tree: [P(12, 9), P(14, 9), P(14, 8), P(16, 8)] },
        { type: "interconnect", tree: [P(18, 7), P(23, 7)] },
    ]
};



var grid = 100; // spacing
var scale = scene_data.width / grid / scene_data.scene_width;

// convert scene coordinates to view coordinates
function to_grid(z) {
    return Math.round(z * grid * scale);
}

var width = to_grid(scene_data.scene_width) + 2,
    height = to_grid(scene_data.scene_height) + 2;

var scene = d3.select(".scene")
    .attr("width", width)
    .attr("height", height);

scene = scene.append("g")
    .attr("transform", function (d, i) {
        return "translate(0.5, 0.55)";
    })



//
// background
//

var grid_group = scene.append("g");
for (var i = 0; i <= scene_data.scene_height; i++) {
    var line_class = i  % 5 === 0 ? "grid-major" : "grid-minor";
    grid_group.append("line")
        .attr("class", line_class)
        .attr("x1", to_grid(0))
        .attr("x2", to_grid(scene_data.scene_width))
        .attr("y1", to_grid(i))
        .attr("y2", to_grid(i));
}
for (var i = 0; i <= scene_data.scene_width; i++) {
    var line_class = i % 5 === 0 ? "grid-major" : "grid-minor";
    grid_group.append("line")
        .attr("class", line_class)
        .attr("x1", to_grid(i))
        .attr("x2", to_grid(i))
        .attr("y1", to_grid(0))
        .attr("y2", to_grid(scene_data.scene_height));
}


//
// logicitems
//

function Item(data) {
    this.types = "item";
    this.x = data.x || 0;
    this.y = data.y || 0;
}

function Logic(data) {
    Item.call(this, data);

    this.types += " logic";
}

function AndItem(data) {
    Logic.call(this, data);

    this.types += " baseitem and";
    this.text = "&";
}

function OrItem(data) {
    Logic.call(this, data);

    this.types += " baseitem and";
    this.text = "≥1";
}

function XorItem(data) {
    Logic.call(this, data);

    this.types += " baseitem and";
    this.text = "=1";
}

function Interconnect(data) {
    Item.call(this, data);

    this.types += " interconnect";
    this.tree = data.tree;
    this.paths = this.tree_to_paths(data.tree);
    this.indicators = this.tree_to_indicators(data.tree);
}

Array.prototype.extend = function (other_array) {
    /* you should include a test to check whether other_array really is an array */
    other_array.forEach(function (v) { this.push(v) }, this);
}

Interconnect.prototype.tree_to_paths = function(tree) {
    function p_to_str(p) {
        return to_grid(p.x) + " " + to_grid(p.y);
    }
    function iter_tree(tree, last_node) {
        var path = "";
        if (last_node !== null) {
            path += "M " + p_to_str(last_node);
        }
        var paths = [];
        for (var i = 0; i < tree.length ; i++) {
            var item = tree[i];
            if (item instanceof Array) {
                paths.extend(iter_tree(item, last_node));
            } else {
                var str_p = p_to_str(item);
                if (last_node == null) {
                    path += "M " + str_p;
                } else {
                    path += " L " + str_p;
                }
                last_node = item;
            }
        }
        paths.push(path)
        return paths;
    }
    return iter_tree(tree, null);
}

Interconnect.prototype.tree_to_indicators = function (tree) {
    function iter_tree(tree, last_node) {
        var indicators = [];
        var subpath_count = 0;
        for (var i = 0; i < tree.length ; i++) {
            var item = tree[i];
            if (item instanceof Array) {
                indicators.extend(iter_tree(item, last_node));
                subpath_count += 1;
            } else {
                last_node = item;
            }
        }
        if (subpath_count >= 2) {
            indicators.push(last_node);
        }
        return indicators;
    }
    return iter_tree(tree, null);
}

var type_map = {
    and: AndItem,
    or: OrItem,
    xor: XorItem,
    interconnect: Interconnect,
}

items = [];
scene_data.items.forEach(function (item) {
    items.push(new type_map[item.type](item));
});


// create all items
var logicitems = scene.selectAll("g.item")
    .data(items)
    .enter().append("g")
    .attr("transform", function (d, i) {
        return "translate(" +
            to_grid(d.x) + "," + to_grid(d.y) + ")";
    })
    .attr("class", function (d, i) {
        return d.types;
    });
    
    


// create text items
    
var baseitems = scene.selectAll("g.baseitem");
    
var overlapp = 0.37;
    
// rect
baseitems.append("rect")
    .attr("class", "logic")
    .attr("y", to_grid(-overlapp))
    .attr("width", to_grid(2))
    .attr("height", to_grid(2 + 2 * overlapp));
    
//input connector
for (var i = 0; i < 3; ++i) {
    baseitems.append("line")
        .attr("class", "logic")
        .attr("x1", to_grid(-0.5))
        .attr("x2", 0)
        .attr("y1", to_grid(i))
        .attr("y2", to_grid(i));
}
    
// output connector
baseitems.append("line")
    .attr("class", "logic")
    .attr("x1", to_grid(2))
    .attr("x2", to_grid(2.5))
    .attr("y1", to_grid(1))
    .attr("y2", to_grid(1));
    
// label
baseitems.append("text")
    .attr("class", "logic")
    .attr("x", to_grid(1))
    .attr("y", to_grid(1))
    .text(function (d, i) {
        return d.text;
    });
    

// create interconnect items

// draw paths
scene.selectAll("g.interconnect")
    .selectAll("g")
    .data(function (d) { return d.paths })
    .enter()
    .append("path")
    .attr("class", "interconnect")
    .attr("d", function (d) { return d });

// draw edge indicators
var radius = 0.27;
scene.selectAll("g.interconnect")
    .selectAll("g")
    .data(function (d) { return d.indicators })
    .enter()
    .append("rect")
    .attr("class", "interconnect")
    .attr("x", function (d) { return to_grid(d.x - radius) })
    .attr("y", function (d) { return to_grid(d.y - radius) })
    .attr("width", to_grid(2 * radius))
    .attr("height", to_grid(2 * radius));
