require.config({
    urlArgs: "?bust=" + new Date().getTime(),
    paths: {
        "sightings": "sightings",
        "search": "search",
        "router": "router",
        "timeline": "timeline",
        "map": "map",
        "messenger": "messenger",
        "moment": "lib/moment.min",
        "typeahead": "lib/typeahead",
        "jqui": "lib/ui"
    }
})

define(["moment", "map", "sightings", "search", "timeline", "router","typeahead", "jqui"], function(mom, map, sightings, search, timeline, router){
    require(["messenger"], function(messenger){
        sightings.getKey(function() {
            map.getMapInstance(document.getElementById("map-canvas"));
            sightings.initialize();
                // t = timeline.initialize({map: map.map, collection: map.getActiveSightings()});
                // t.render();
                // messenger.when("show:sightings", function() {
                    // t.setCollection(map.getActiveSightings());
                // })
        });
        messenger.when("render:timeline", function() {
            // t.render();
        });
        messenger.when("reset:timeline", function() {
            // t.reset();
            // t.render();
            // t.updateHandles();
        })
    })

    $("#launch-help-modal").on("click", function() {
        $("#help-modal").fadeToggle("fast");
    });

    $(".js-show-all").on("click", function() {
        messenger.dispatch("navigate","all", true);
    });
})