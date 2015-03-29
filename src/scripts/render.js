
//
// scene
//

var scene_data = {
    width: 500, // view width in px
    scene_width: 50, // scene width in scene coordinates
    scene_height: 30, // scene height in scene coordinates
    items: [
        { type: "and", x: 5, y: 5 },
        { type: "or", x: 5, y: 8 },
        { type: "xor", x: 10, y: 6 },
        { type: "interconnect", tree: [(7,6), [(10, 6)]]}
    ]
};



var grid = 100; // spacing
var scale = scene_data.width / grid / scene_data.scene_width;

// convert scene coordinates to view coordinates
function to_grid(z) {
    return Math.round(z * grid * scale);
}

var width = to_grid(scene_data.scene_width) + 1,
    height = to_grid(scene_data.scene_height) + 1;

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
var logicitems = scene.selectAll("g")
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
