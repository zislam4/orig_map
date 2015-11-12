define(["messenger", "sightings"], function(messenger, sightings) {
    var Router = Backbone.Router.extend({
        initialize: function() {
            this.all_birds = sightings.getBirds();
            console.log(sightings);
            var active_birds = sightings.getActiveBirds();
            this.active_birds = active_birds;

            this.listenTo(active_birds, {
                "add": function(bird, coll, opts) {
                    if (opts.from_route === true && !opts.location) {
                        return;
                    }

                    var current = Backbone.history.fragment.split("/").slice(1);

                    if (opts.location === true) {
                        if (current.indexOf(bird.get("val")) === -1) {
                            current.push(bird.get("val"));
                            this.navigate("birds/" + current.join("/"), {replace: false, trigger: false});
                        }
                    }
                    else {
                        var i = active_birds.indexOf(bird);
                        current.splice(i,1,bird.get("bandnumber"));
                        messenger.dispatch("add:sightings", bird.get("sightings"), bird);
                        this.active_birds.add(bird, {from_route: true});
                        this.navigate("birds/" + current.join("/"), {replace: false, trigger: false});
                    }
                },
                "remove": function() {
                    this.navigate(this.constructURL(), {replace: true, trigger: true});
                }
            })
        },
        constructURL: function() {
            var current = Backbone.history.fragment;
            var url = "birds/";
            if (this.active_birds.length === 0) {
                return "";
            }
            this.active_birds.each(function(bird) {
                url += bird.get("bandnumber") + "/";
            });
            return url;
        },
        routes: {
            "all": "all",
            "*splat": "generate"
        },
        all: function() {
            messenger.dispatch("show:markers", sightings.getSightings(), {});
        },
        generate: function(birds) {
            if (!birds) {
                return;
            }
            identifiers = birds.split("/").slice(1);
            var that = this;
            _.each(identifiers, function(id){
                var bird = that.all_birds._byId[id];
                if (bird){
                    messenger.dispatch("add:sightings", bird.get("sightings"), bird);
                    messenger.dispatch("add:filter", bird.get("bandnumber"));
                }
                else {
                    var str = id.toLowerCase().replace(" ", "");
                    var locations = sightings.getByLocation()[str];
                    if (locations) {
                        messenger.dispatch("show:location", id, locations)
                    }

                }
            });
        }

    })

    messenger.when("loaded:sightings", function(){
        app = new Router();
        Backbone.history.start();
    });

    messenger.when("navigate", function(route, options) {
        app.navigate(route, true);
    })
});