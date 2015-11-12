define(["messenger"], function(messenger) {

    var Marker = Backbone.View.extend({
        initialize: function(attrs) {
            this.map = attrs.map;
            var sighting = attrs.model;
            this.listenTo(this.model, {
                "show": function() {
                    if (!this.isShowing()) {
                        this.showing = true;
                        this.marker.setMap(this.map);
                    }
                },
                "hide": function() {
                    if (this.isShowing()) {
                        this.marker.setMap(null);
                        this.showing = false;
                    }
                } 
            });
            this.latLng = new google.maps.LatLng(sighting.get("lat"), sighting.get("lng"));
            this.marker = new google.maps.Marker({
                position: this.latLng,
                title: sighting.getBandString() + " sighted here",
                animation: google.maps.Animation.DROP
            })
        },
        render: function() {
            this.marker.setMap(this.map);
        },
        isShowing: function() {
            return this.showing;
        }
    })

    function Map(el) {
        this.map = new google.maps.Map(el, {
            center: {lat: 20.7, lng: -156.9601584},
            zoom: 8
        });    

        var that = this;
        this.active_sighting_models = new Backbone.Collection();
        this.active_sighting_models.comparator = function(model) {
            return model.get("date");
        }
        this.active_sighting_models.on("remove", function(model, collection) {
            if (collection.length > 2)
                messenger.dispatch("render:timeline");
            else { 
                messenger.dispatch("reset:timeline")
            }
            that.fitToBounds();
        })

        messenger.when("show:markers add:sightings", function() {
            that.showMarkers.apply(that,arguments);
        });

        _.bindAll(this, "showMarkers");

        // messenger.when("add:sightings", function(sightings, bird) {
            // console.log(sightings.at(0));
            // debugger
            // that.showMarkers.call(that, sightings, bird);
        // });

        messenger.when("toggle:markers", function(lowerbound, upperbound) {
            that.active_sighting_models.each(function(model) {
                var date = model.get("date").unix() * 1000;
                if (date < lowerbound || date > upperbound) {
                    model.trigger("hide");
                }
                else {
                    model.trigger("show");
                }
            })
        })
    }
    
    Map.prototype.getActiveSightings = function() {
        this.active_sighting_models.sort();
        return this.active_sighting_models;
    }

    Map.prototype.fitToBounds = function() {
        var bounds = new google.maps.LatLngBounds();
        var len = this.active_sighting_models.length;
        if (len === 0) {
            this.map.setCenter({lat: 20.7, lng: -156.9601584})
            this.map.setZoom(8);
            return this;
        }
        for(i=0;i<len;i++) {
         bounds.extend(this.active_sighting_models.at(i).latLng);
        }
        this.map.setCenter(bounds.getCenter());
        this.map.fitBounds(bounds);
        this.map.setZoom(this.map.getZoom() - 1);
        return this;
    }

    Map.prototype.showMarkers = function(sightings, parent) {
        var that = this;
        that.active_sighting_models.add(sightings.models);
        sightings.each(function(sighting) {
            sighting.allsightings = that.active_sighting_models;
            if (_.isUndefined(sighting.marker)) {
                var marker = new Marker({model: sighting, map: that.map});
                marker.render();
                sighting.marker = marker.marker;
                sighting.latLng = marker.latLng;
                sighting.marker.setIcon(parent.marker_url);
                var infowindow = new google.maps.InfoWindow(
                  { 
                    content: "<span class='marker-date'>" + sighting.get("date").format("M/D/YY") + "</span>",
                  });
                infowindow.open(that.map, marker.marker);
                google.maps.event.addListener(marker.marker, 'click', function() {
                    if (infowindow.getMap() !== null) {
                        infowindow.close()
                    }
                    else {
                        infowindow.open(that.map, marker.marker);
                    }
                    // that.openInfoWindow = infowindow;
                });
            }
            else {
                sighting.trigger("bounce");
            }
        });
        that.fitToBounds()
    }

    return {
        getMapInstance: function(el) {
            return new Map(el);
        }
    }
})