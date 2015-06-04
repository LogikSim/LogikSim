﻿"use strict";

var LogikSim = LogikSim || {};
LogikSim.Frontend = LogikSim.Frontend || {};



Array.prototype.extend = function (other_array) {
    /* you should include a test to check whether other_array really is an array */
    other_array.forEach(function (v) { this.push(v); }, this);
};


LogikSim.Frontend.Scene = function (scene_id, scene_data) {
    console.log(scene_data);
    this.scene_id = scene_id;
    this.scene_data = scene_data;

    // create svg scene and draw background
    this.scene = this.create_scene();

    // setup simulation backend

    var simulation = new LogikSim.Backend.Simulation('scripts/');

    simulation.set_handler('update', function (msg) {
        console.log(msg);
    });

    // create components

    var to_grid = this.to_grid.bind(this);

    this.items = [];
    for (var i = 0; i < this.scene_data.items.length; i++) {
        var item = this.scene_data.items[i];
        simulation.create_component(item.type);
        this.items.push(new type_map[item.type](this, item));
    }
    
    // create all items
    var logicitems = this.scene.selectAll("g.item")
        .data(this.items)
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
    var radius = 0.27;
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
}

LogikSim.Frontend.Scene.prototype = {
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

LogikSim.Frontend.Item = function (scene, data) {
    this.types = "item";
    this.scene = scene;
    this.x = data.x || 0;
    this.y = data.y || 0;
}

LogikSim.Frontend.Logic = function (scene, data) {
    LogikSim.Frontend.Item.call(this, scene, data);

    this.types += " logic";
}

LogikSim.Frontend.AndItem = function AndItem(scene, data) {
    LogikSim.Frontend.Logic.call(this, scene, data);

    this.types += " baseitem and";
    this.text = "&";
}

LogikSim.Frontend.OrItem = function (scene, data) {
    LogikSim.Frontend.Logic.call(this, scene, data);

    this.types += " baseitem and";
    this.text = "≥1";
}

LogikSim.Frontend.XorItem = function (scene, data) {
    LogikSim.Frontend.Logic.call(this, scene, data);

    this.types += " baseitem and";
    this.text = "=1";
}

LogikSim.Frontend.Interconnect = function (scene, data) {
    LogikSim.Frontend.Item.call(this, scene, data);

    this.types += " interconnect";
    this.tree = data.tree;
    this.paths = this.tree_to_paths(data.tree);
    this.indicators = this.tree_to_indicators(data.tree);
}

LogikSim.Frontend.Interconnect.prototype = {
    
    _p_to_str: function(p) {
        return this.scene.to_grid(p.x) + " " + this.scene.to_grid(p.y);
    },

    _iter_tree: function (tree, last_node) {
        var path = "";
        if (last_node !== null) {
            path += "M " + this._p_to_str(last_node);
        }
        var paths = [];
        for (var i = 0; i < tree.length ; i++) {
            var item = tree[i];
            if (item instanceof Array) {
                paths.extend(this._iter_tree(item, last_node));
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
    },

    tree_to_paths: function (tree) {
        return this._iter_tree(tree, null);
    },

    tree_to_indicators: function (tree) {
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
}

var type_map = {
    AND: LogikSim.Frontend.AndItem,
    OR: LogikSim.Frontend.OrItem,
    XOR: LogikSim.Frontend.XorItem,
    Interconnect: LogikSim.Frontend.Interconnect
};
