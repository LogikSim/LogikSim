myLayout = null;

$(document).ready(function () {
    // Initialize jquery slider
    $("#slider").slider();
    
    // Create the model class via Backbone (which sets up things like prototype objects correctly). 
    // This particular model is a very simple one. It'll have just 1 attribute - "slidervalue"
    var SliderModel = Backbone.Model.extend({});

    // A "View" abstraction for the slider.
    // Whenever the slider position changes, this view updates the model with the new value.
    var SliderView = Backbone.View.extend({
        el: $("#slider"), // Specifies the DOM element which this view handles

        events: {
            // Call the event handler "updateVal" when slider value changes.
            // 'slidechange' is the jquery slider widget's event type. 
            // Refer http://jqueryui.com/demos/slider/#default for information about 'slidechange'.
            "slidechange": "updateVal"
        },

        updateVal: function () {
            // Get slider value and set it in model using model's 'set' method.
            console.log('SliderView.updateVal');
            var val = this.el.slider("option", "value");
            this.model.set({ slidervalue: val });
        }
    });

    // Create the instances
    var sliderModel = new SliderModel;
    var sliderView = new SliderView({ model: sliderModel });
});
