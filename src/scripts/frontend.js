"use strict";

var LogikSim = LogikSim || {};
LogikSim.Frontend = LogikSim.Frontend || {};



Array.prototype.extend = function (other_array) {
    /* you should include a test to check whether other_array really is an array */
    other_array.forEach(function (v) { this.push(v); }, this);
};


LogikSim.Frontend.Scene = function (scene_id, scene_data) {
    this.scene_id = scene_id;
    this.scene_data = scene_data;

    // create svg scene and draw background
    this.scene = this.create_scene();

    // setup simulation backend

    this.simulation = new LogikSim.Backend.Simulation('scripts/');

    this.simulation.set_handler('update', this.backend_handler.bind(this));

    // create components

    var i;
    var to_grid = this.to_grid.bind(this);
    var frontend_items = [];

    this.items = {}; // backend-id --> frontend-item
    this.backend_id_of_frontend_id = {}; // id translation
    for (i = 0; i < this.scene_data.items.length; i++) {
        var item = this.scene_data.items[i];
        var backend_id = this.simulation.create_component(item.type).component_id;
        var frontend_item = new type_map[item.type](this, item, backend_id);
        this.items[backend_id] = frontend_item;
        frontend_items.push(frontend_item)
        if (item.id !== undefined) {
            this.backend_id_of_frontend_id[item.id] = backend_id;
        }
    }

    // setup connection for interconnect items
    for (var backend_id in this.items) {
        if (this.items.hasOwnProperty(backend_id)) {
            var item = this.items[backend_id];
            if (item instanceof LogikSim.Frontend.Interconnect) {
                item.connect(this.backend_id_of_frontend_id);
            }
        }
    }

    
    // create all items
    var logicitems = this.scene.selectAll("g.item")
        .data(frontend_items)
        .enter().append("g")
        .attr("transform", function (d) {
            return "translate(" +
                to_grid(d.x) + "," + to_grid(d.y) + ")";
        })
        .attr("class", function (d) {
            return d.types;
        });

    // create text items

    var baseitems = this.scene.selectAll("g.baseitem");

    var overlapp = 0.37;

    // rect
    baseitems.append("rect")
        .attr("class", "logic")
        .attr("y", to_grid(-overlapp))
        .attr("width", to_grid(2))
        .attr("height", to_grid(2 + 2 * overlapp));

    //input connector
    for (i = 0; i < 3; ++i) {
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
        .text(function (d) {
            return d.text;
        });


    // create interconnect items

    // draw paths
    this.scene.selectAll("g.interconnect")
        .selectAll("g")
        .data(function (d) { return d.paths; })
        .enter()
        .append("path")
        .attr("class", "interconnect")
        .attr("d", function (d) { return d; });

    // draw edge indicators
    var radius = 0.22;
    this.scene.selectAll("g.interconnect")
        .selectAll("g")
        .data(function (d) { return d.indicators; })
        .enter()
        .append("rect")
        .attr("class", "interconnect")
        .attr("x", function (d) { return to_grid(d.x - radius); })
        .attr("y", function (d) { return to_grid(d.y - radius); })
        .attr("width", to_grid(2 * radius))
        .attr("height", to_grid(2 * radius));

    // draw trigger points
    this.scene.selectAll("g.interconnect")
        .selectAll("g")
        .data(function (d) { return d.triggers; })
        .enter()
        .append("circle")
        .attr("class", "interconnect trigger")
        .attr("cx", function (d) { return to_grid(d.x); })
        .attr("cy", function (d) { return to_grid(d.y); })
        .attr("r", function (d) { return to_grid(0.5); })
        .on("click", function(d, i) { d.on_trigger(d, this); })

    // register top DOM elements in javascript objects
    this.scene.selectAll("g.item")
        .each(function (d, i) {
            d.register_dom(this);
        });

    // start simulation
    this.simulation.start();
}

LogikSim.Frontend.Scene.prototype = {
    backend_handler: function (msg) {
        if (msg.message_type === "update") {
            this.items[msg.props.id].update(msg.props, msg.clock);
        }
    },


    /**
     * Convert scene coordinates to view coordinates
     * @param z Scene coordinate
     * @return {number} View coordinate
     */
    to_grid: function(z) {
        return Math.round(z * this.scene_data.scale);
    },

    create_scene: function () {
        //
        // SVG scene
        //

        var width = this.to_grid(this.scene_data.scene_width) + 2,
            height = this.to_grid(this.scene_data.scene_height) + 2;

        var scene = d3.select("#"+this.scene_id+".scene")
            .attr("width", width)
            .attr("height", height);

        scene = scene.append("g")
            .attr("transform", "translate(0.5, 0.55)");

        //
        // background
        //

        var grid_group = scene.append("g");
        var line_class;
        var i;
        for (i = 0; i <= this.scene_data.scene_height; i++) {
            line_class = i % 5 === 0 ? "grid-major" : "grid-minor";
            grid_group.append("line")
                .attr("class", line_class)
                .attr("x1", this.to_grid(0))
                .attr("x2", this.to_grid(this.scene_data.scene_width))
                .attr("y1", this.to_grid(i))
                .attr("y2", this.to_grid(i));
        }

        for (i = 0; i <= this.scene_data.scene_width; i++) {
            line_class = i % 5 === 0 ? "grid-major" : "grid-minor";
            grid_group.append("line")
                .attr("class", line_class)
                .attr("x1", this.to_grid(i))
                .attr("x2", this.to_grid(i))
                .attr("y1", this.to_grid(0))
                .attr("y2", this.to_grid(this.scene_data.scene_height));
        }

        return scene;
    }
}





//
// frontend logicitems
//

// Item

LogikSim.Frontend.Item = function (scene, data, backend_id) {
    this.types = "item";
    this.scene = scene;
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.backend_id = backend_id;
    this.dom = undefined;
}

LogikSim.Frontend.Item.prototype = {
    update: function (props, clock) {
        return;
    },

    register_dom: function (dom) {
        this.dom = dom;
    }
}

// Logic

LogikSim.Frontend.Logic = function (scene, data, backend_id) {
    LogikSim.Frontend.Item.call(this, scene, data, backend_id);

    this.types += " logic";
}

LogikSim.Frontend.Logic.prototype = Object.create(LogikSim.Frontend.Item.prototype);
LogikSim.Frontend.Logic.prototype.constructor = LogikSim.Frontend.Logic;


// AndItem

LogikSim.Frontend.AndItem = function AndItem(scene, data, backend_id) {
    LogikSim.Frontend.Logic.call(this, scene, data, backend_id);

    this.types += " baseitem and";
    this.text = "&";
}

LogikSim.Frontend.AndItem.prototype = Object.create(LogikSim.Frontend.Logic.prototype);
LogikSim.Frontend.AndItem.prototype.constructor = LogikSim.Frontend.AndItem;

// OrItem

LogikSim.Frontend.OrItem = function (scene, data, backend_id) {
    LogikSim.Frontend.Logic.call(this, scene, data, backend_id);

    this.types += " baseitem and";
    this.text = "≥1";
}

LogikSim.Frontend.OrItem.prototype = Object.create(LogikSim.Frontend.Logic.prototype);
LogikSim.Frontend.OrItem.prototype.constructor = LogikSim.Frontend.OrItem;

// XorItem

LogikSim.Frontend.XorItem = function (scene, data, backend_id) {
    LogikSim.Frontend.Logic.call(this, scene, data, backend_id);

    this.types += " baseitem and";
    this.text = "=1";
}

LogikSim.Frontend.XorItem.prototype = Object.create(LogikSim.Frontend.Logic.prototype);
LogikSim.Frontend.XorItem.prototype.constructor = LogikSim.Frontend.XorItem;

// Interconnect

LogikSim.Frontend.Interconnect = function (scene, data, backend_id) {
    LogikSim.Frontend.Item.call(this, scene, data, backend_id);

    this.types += " interconnect";
    this.tree = data.tree;
    this.paths = this.tree_to_paths(data.tree);
    this.indicators = this.tree_to_indicators(data.tree);
    this.triggers = this.tree_to_triggers(data.tree);
}

LogikSim.Frontend.Interconnect.prototype = Object.create(LogikSim.Frontend.Item.prototype);
LogikSim.Frontend.Interconnect.prototype.constructor = LogikSim.Frontend.Interconnect;

LogikSim.Frontend.Interconnect.prototype._p_to_str = function(p) {
    return this.scene.to_grid(p.x) + " " + this.scene.to_grid(p.y);
}

LogikSim.Frontend.Interconnect.prototype._iter_tree_to_paths = function (tree, last_node) {
    var path = "";
    if (last_node !== null) {
        path += "M " + this._p_to_str(last_node);
    }
    var paths = [];
    for (var i = 0; i < tree.length; i++) {
        var item = tree[i];
        if (item instanceof Array) {
            paths.extend(this._iter_tree_to_paths(item, last_node));
        } else {
            var str_p = this._p_to_str(item);
            if (last_node === null) {
                path += "M " + str_p;
            } else {
                path += " L " + str_p;
            }
            last_node = item;
        }
    }
    paths.push(path);
    return paths;
}

LogikSim.Frontend.Interconnect.prototype.tree_to_paths = function (tree) {
    return this._iter_tree_to_paths(tree, null);
}

LogikSim.Frontend.Interconnect.prototype.tree_to_indicators = function (tree) {
    function iter_tree(tree, last_node) {
        var indicators = [];
        var subpath_count = 0;
        for (var i = 0; i < tree.length; i++) {
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

LogikSim.Frontend.Interconnect.prototype._iter_tree_to_triggers = function (tree) {
    var triggers = [];
    for (var i = 0; i < tree.length; i++) {
        var item = tree[i];
        if (item instanceof Array) {
            triggers.extend(this._iter_tree_to_triggers(item));
        } else {
            if (item.type === "trigger") {
                triggers.push(item);
                // create trigger function
                item.last_state = false;
                item.on_trigger = function (data, dom) {
                    var new_state = !data.last_state;
                    this.scene.simulation.schedule_edge(this.backend_id, 0, new_state, 0);
                    data.last_state = new_state;
                }.bind(this);
            }
        }
    }
    return triggers;
}

LogikSim.Frontend.Interconnect.prototype.tree_to_triggers = function (tree) {
    
    return this._iter_tree_to_triggers(tree);
}

/**
 * Setup all connections in the backend based on path definition.
 * @param self_id backend id of the interconnect itself
 * @param simulation backend simulation reference
 * @param backend_id_of_frontend_id translation dict to convert frontend ids
 *            to backend ids
 */
LogikSim.Frontend.Interconnect.prototype.connect = function (backend_id_of_frontend_id) {
    var last_id = 0;
    var my_id = this.backend_id;
    var simulation = this.scene.simulation;
    function iter_tree(tree) {
        for (var i = 0; i < tree.length; i++) {
            var item = tree[i];
            if (item instanceof Array) {
                iter_tree(item);
            } else {
                if (item.type === "output") {
                    simulation.connect(
                        backend_id_of_frontend_id[item.elem_id], item.con_num - 1, 
                        my_id, 0);
                } else if (item.type === "input") {
                    simulation.connect(
                        my_id, last_id++,
                        backend_id_of_frontend_id[item.elem_id], item.con_num - 1);
                }
            }
        }
    }
    iter_tree(this.tree);
}

LogikSim.Frontend.Interconnect.prototype.update = function (props, clock) {
    if (props.input_states !== undefined) {
        d3.select(this.dom).selectAll("*").classed("activated", props.input_states[0]);
    }
}

// Type Map

var type_map = {
    AND: LogikSim.Frontend.AndItem,
    NAND: LogikSim.Frontend.AndItem,
    OR: LogikSim.Frontend.OrItem,
    XOR: LogikSim.Frontend.XorItem,
    Interconnect: LogikSim.Frontend.Interconnect
};

