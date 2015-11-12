define(["messenger", "sightings"], function(messenger, bird_data) {

    $searchbar = $("#searchbar");

    (function (_) {
        'use strict';

        _.compile = function (templ) {
            var compiled = this.template(templ);
            compiled.render = function (ctx) {
                return this(ctx);
            }
            return compiled;
        }
    })(window._);

    var selected = {};

    function filter(suggestions, id) {
        return $.grep(suggestions, function(suggestion) {
            return _.isUndefined(selected[suggestion[id]]) === true;
        });
    }

    function parse(birds) {
        var addedPlaces = {};
        var addedBirds = {};
        var by_band = []
        var by_place = []

        _.each(birds.models, function(bird) {
            var bandstring = bird.get("bandstring");
            var bandnumber = bird.get("bandnumber");
            var sighting = bird.get("sightings").first()
            var tokens = [sighting.get("ul"), sighting.get("ur"), sighting.get("lr"), sighting.get("ll")];
            var loc = sighting.get("sightinglocation");
            var className = sighting.getBandsClassName();

            by_band.push({
                tokens: tokens,
                val: bandstring,
                type: "bandstring",
                bandnumber: bandnumber,
                model: sighting,
                className: className
            });
            by_band.push({
                tokens: tokens,
                val: new String(bandnumber),
                type: 'bandnumber',
                bandnumber: bandnumber,
                model: sighting,
                className: className,
            });
            if (_.isUndefined(addedPlaces[loc])) {
                var loc_id = loc.toLowerCase().replace(" ", "");
                var locsightings = bird_data.getByLocation()[loc_id];
                addedPlaces[loc] = true;
                by_place.push({
                    tokens: [loc],
                    val: loc,
                    type: 'location',
                    loc_id: loc_id,
                    model: sighting,
                    sightings: locsightings,
                    sightingslength: locsightings.length
                })
            }
        })
        return {
            by_band: by_band,
            by_place: by_place
        }
    }
    messenger.when("loaded:sightings", function(birds) {
        var tokens = parse(birds);
        var band_engine = new Bloodhound({
            local: tokens.by_band,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.val);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10
        });
        band_engine.initialize()

        var place_engine = new Bloodhound({
            local: tokens.by_place,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.val);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10
        });
        place_engine.initialize()

        $searchbar.typeahead(
            {
                hint: true,
                minLength: 1,
                highlight: true
            }, 
            {
                displayKey: "val",
                source: function(query, cb) {
                    band_engine.get(query, function(suggestions) {
                        cb(filter(suggestions, "bandnumber"));
                    });
                },
                templates: {
                    empty: "<div class='tt-empty-results'>No results found.</div>",
                    suggestion: _.compile($("#suggestion-template").html()),
                    header: "<h2>By Bands</h2>"
                }
            },
            {
                displayKey: "val",
                source: function(query, cb) {
                    place_engine.get(query, function(suggestions) {
                        cb(filter(suggestions, "val"));
                    });
                },
                templates: {
                    empty: "<div class='tt-empty-results'>No results found.</div>",
                    suggestion: _.compile($("#suggestion-location-template").html()),
                    header: "<h2>By Location</h2>"
            },
        }).on("typeahead:selected", function(e, suggestion) {
            switch(suggestion.type) {
                case "bandnumber": 
                case "bandstring":
                    var bird = bird_data.getBirds()._byId[suggestion.bandnumber]
                    if (bird) {
                        selected[suggestion.bandnumber] = true;
                        messenger.dispatch("add:sightings", bird.get("sightings"), bird);
                    }
                break;
                case "location":
                    selected[suggestion.val] = true;
                    messenger.dispatch("show:location", suggestion.val, suggestion.sightings);
                break;
            }
            $searchbar.typeahead("val", "")
        });

        messenger.when("add:filter", function(id) {
console.log("GETTING HERE!");
            console.log(id);
            selected[id] = true;
        })

        messenger.when("remove:filter", function(id) {
            selected[id] = void 0;
        })
    })
})
