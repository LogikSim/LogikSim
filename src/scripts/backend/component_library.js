"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

/**
 * Creates a new ComponentLibrary instance for handling component templates.
 *
 * The ComponentLibrary is a backend module that can load component
 * templates and provides a way to instantiate these components for
 * use in a simulation.
 *
 * @param logger
 * @constructor
 */
LogikSim.Backend.ComponentLibrary = function(logger) {
    this.log = typeof logger !== 'undefined' ? logger : new LogikSim.Logger("Lib");
    this.component_templates = {}; // Type -> template
};

LogikSim.Backend.ComponentLibrary.prototype = {
    /**
     * Adds multiple templates to the library.
     *
     * A template is a set of basic properties components
     * are based on. All instances of the component will
     * share this template properties and can later on be
     * customized by overriding them.
     *
     * @param component_templates type->template map
     * @return Number of templates actually added
     */
    add_templates: function(component_templates) {
        var given_templates = 0;
        var added_template_count = 0;

        for (var type in component_templates) {
            if (!component_templates.hasOwnProperty(type)) {
                continue;
            }

            //FIXME: Must do error checking and validation
            //TODO: Do we need to deep-copy component_templates.
            //      Horrible enough passing stuff through json seems to be the sanest
            //      way to do so in JS :( Ofc then we can't pass functions

            ++given_templates;

            if (type in this.component_templates) {
                this.log.warn("Tried to add duplicate type " + type + ". Ignored.");
                continue;
            }

            var template = component_templates[type];

            // When we derive from the template later we want to also get the type
            Object.defineProperty(template, "type", {
                value: type,
                writable: false,
                enumerable: true
            });

            // If we received a JSON object we have to eval the logic property to
            // create our callable logic function.
            if (typeof template.logic === 'string') {
                // Here be dragons.
                template.logic = eval(template.logic);
            } else if (typeof template.logic !== 'function') {
                this.log.info(template.type + " is missing a valid logic function");
                continue;
            }

            Object.defineProperty(template, "logic", {
                value: template.logic,
                writable: false,
                enumerable: true
            });

            // Seal template because we can. Might help the optimizer.
            // We don't freeze it as we want to allow most properties of the
            // templates to be customized in the instances.
            Object.seal(template);

            this.component_templates[type] = template;
            ++added_template_count;

            this.log.info("Component " + type + " added to library");
        }

        this.log.info("Added " + added_template_count + "/"
            + given_templates + " component templates. Now have "
            + Object.keys(this.component_templates).length + "."); //TODO: I really have to pull the keys??

        return added_template_count;
    },
    /**
     * Instantiates a component from a template stored in the library.
     *
     * @param type Component template type to instantiate
     * @param id ID to give the component on instantiation
     * @param parent Parent component to pass to new component
     * @param custom_properties Additional properties to set on the component
     * @return {LogikSim.Backend.Component} New component if successful, null otherwise
     */
    instantiate: function(type, id, parent, custom_properties) {
        //TODO: Do we need to deep-copy custom_properties?
        custom_properties = custom_properties || {};

        var template = this.component_templates[type];
        if (typeof template === 'undefined') {
            this.log.warn("Tried to instantiate unknown component with type " + type);
            return null;
        }

        // Create a properties object for our new component whose prototype is
        // the template. This means that we can override template properties in
        // the object while not paying memory for the fields we don't touch.
        var properties = Object.create(template);

        // Make sure the custom properties don't contain our write-only
        // properties.
        if ('type' in custom_properties) {
            delete custom_properties.type;
        }

        // Set the id as a custom property
        custom_properties.id = id;

        // Extend the new properties object with the given custom properties. These
        // properties are specific to the object and correspondingly mustn't be part
        // of the template/prototype.
        LogikSim._.extendOwn(properties, custom_properties);

        var component = new LogikSim.Backend.Component(parent, properties);

        this.log.debug("Created new component: " + component);

        return component;
    },
    /**
     * Returns a list of all types available in the library.
     * @return List of types
     */
    get_types: function() {
        return this.component_templates.keys();
    },
    /**
     * Returns a type->template map for the given types.
     *
     * @param types Types to fetch. If falsy all are fetched.
     * @return Map type->template
     */
    get_templates: function(types) {
        types = types || this.get_types();

        var result = {};
        for (var i = 0; i < types.length; ++i) {
            var type = types[0];

            var template = this.component_templates[type];
            if (typeof template === 'undefined') {
                continue;
            }

            result[type] = template;
        }

        // Return a poor-mans deep-copy
        return JSON.parse(JSON.stringify(result, function (key, value) {
            if (typeof value == 'function') {
                //TODO: Think about whether we don't want to preserve the original and have a special _logic for the function.
                //      maybe even do the eval on instantiation and rely on an eval cache being used somewhere.
                return value.toString();
            }
            return value;
        }));
    }
};
