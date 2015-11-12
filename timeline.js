define(["messenger"], function(messenger){
  var Timeline = Backbone.View.extend({
    el: 'footer',
    speeds: {
      forward: 32,
      back: 32
    },
    dir: "forward",
    initialize: function(attrs) {
      var self, update_val;
      self = this;
      this.map = attrs.map;
      _.bindAll(this, "render", "addMarker", "changeValue", "play", "stop", "updateHandles");
      update_val = function(e, ui) {
        var cleaned, display, handle, pos, range;
        handle = $(ui.handle);
        pos = handle.index() - 1;
        range = ui.values;
        cleaned = moment(range[pos]).format("M/D");
        display = $("<div/>").addClass("handle-display-value").text(cleaned);
        handle.find("div").remove().end().append(display);
        messenger.dispatch("toggle:markers", ui.values[0], ui.values[1]);
      };
      this.$timeline = this.$(".timeline-slider");
      this.$timeline.slider({
        range: true,
        values: [0, 100],
        step: 10000,
        slide: update_val,
        change: update_val
      });
      return this;
    },
    reset: function() {
      this.min = this.max = void 0;
      return this;
    },
    clearMarkers: function() {
      this.$(".timeline-marker").remove();
      return this;
    },
    render: function() {
      var self;
      self = this;
      this.clearMarkers();
      this.updateHandles();
      _.each(this.collection.models, function(story) {
        return self.addMarker(story);
      });
      return this;
    },
    setCollection: function(collection) {
      this.collection = collection;
      this.render();
    },
    addMarker: function(model) {
      var $slider, pixeladdition, pos, range, view, width;
      $slider = this.$(".slider-wrap");
      width = $slider.width();
      pos = new Date(model.get("date")).getTime();
      range = this.max - this.min;
      pos -= this.min;
      pos /= range;
      pixeladdition = 10 / width;
      view = new TimelineMarker({
        model: model,
        left: pos
      });
      $slider.append(view.render().el);
      return this;
    },
    play: function() {
      var dir, hi, inc, lo, values;
      values = this.$timeline.slider("values");
      lo = values[0];
      hi = values[1];
      this.isPlaying = true;
      dir = this.dir === "forward" ? 1 : 1;
      inc = dir * Math.ceil(Math.abs((hi - lo) / 300));
      this.changeValue(lo, hi, inc, function(locmp, hicmp) {
        return locmp <= hicmp;
      });
      return this;
    },
    stop: function() {
      this.isPlaying = false;
      this.$(".js-pause-timeline").trigger("switch");
      return this;
    },
    toEnd: function() {
      var $tl, end;
      $tl = this.$timeline;
      this.stop();
      end = $tl.slider("option", "max");
      $tl.slider("values", 1, end);
      return end;
    },
    toStart: function() {
      var $tl, start;
      $tl = this.$timeline;
      this.stop();
      start = $tl.slider("values", 0);
      $tl.slider("values", 1, start);
      return start;
    },
    changeValue: function(lo, hi, increment, comparator) {
      var self;
      self = this;
      window.setTimeout(function() {
        var newlo;
        if (comparator(lo, hi) === true && self.isPlaying === true) {
          newlo = lo + increment;
          self.$timeline.slider("values", 1, newlo);
          return self.changeValue(newlo, hi, increment, comparator);
        } else {
          return self.stop();
        }
      }, this.speeds[this.dir]);
      return this;
    },
    updateHandles: function() {
      var $timeline, handles, max, maxdate, min, mindate, prevcomparator;
      if (this.collection.length < 2) {
        this.$el.fadeOut("fast");
        return this;
      }
      else {
        this.$el.fadeIn("fast");
      }
      prevcomparator = this.collection.comparator;
      this.collection.comparator = function(model) {
        return model.get("date");
      };
      this.collection.sort();
      this.min = min = moment(this.collection.first().get("date"));
      this.max = max = moment(this.collection.last().get("date"));
      mindate = min.unix() * 1000;
      maxdate = max.unix() * 1000;
      $timeline = this.$timeline;
      handles = $timeline.find(".ui-slider-handle");
      handles.first().data("display-date", moment(min).format("M/D"));
      handles.last().data("display-date", moment(max).format("M/D"));
      $timeline.slider("option", {
        min: mindate,
        max: maxdate
      });
      $timeline.slider("values", 0, mindate);
      $timeline.slider("values", 1, maxdate);
      this.max = this.max.unix() * 1000;
      this.min = this.min.unix() * 1000;
      return this;
    },
    setSpeed: function(dir) {
      var rel, speed;
      rel = Math.pow(2, 5);
      speed = this.speeds[dir];
      if (speed > 1) {
        speed /= 2;
      } else {
        speed = 32;
      }
      this.speeds[dir] = speed;
      this.dir = dir;
      return rel / speed;
    },
    renderSpeed: function(e) {
      var $t, speed;
      if (e != null) {
        $t = $(e.currentTarget);
        speed = this.setSpeed($t.attr("dir" || "forward"));
        $t.attr("speed", speed + "x");
        return $t.addClass("selected").siblings(".js-speed-control").removeClass("selected");
      }
    },
    zoomTo: function(date) {
      var $t, center, high, low, offset, offsetH, offsetL;
      if (!this.min || !this.max) {
        return this;
      }
      center = (new Date(date)).getTime();
      offsetL = (this.max - center) / 2;
      offsetH = (center - this.min) / 2;
      offset = offsetL > offsetH ? offsetH : offsetL;
      $t = this.$timeline;
      low = parseInt(center - offset);
      high = parseInt(center + offset);
      $t.slider("values", 0, low);
      $t.slider("values", 1, high);
      return this;
    },
    events: {
      "click .js-play-timeline": function(e) {
        $(e.currentTarget).removeClass("js-play-timeline").addClass("js-pause-timeline");
        if (!this.isPlaying) {
          return this.play();
        }
      },
      "click .js-pause-timeline": function(e) {
        $(e.currentTarget).removeClass("js-pause-timeline").addClass("js-play-timeline");
        return this.stop();
      },
      "switch .js-pause-timeline": function(e) {
        return $(e.currentTarget).removeClass("js-pause-timeline").addClass("js-play-timeline");
      },
      "click .js-fast-forward": "renderSpeed",
      "click .js-rewind": "renderSpeed",
      "click .js-to-end": "toEnd",
      "click .js-to-start": "toStart",
      "mouseover .timeline-controls li": function(e) {
        var $t;
        return $t = $(e.currentTarget);
      }
    }
  });

var TimelineMarker = Backbone.View.extend({
    className: 'timeline-marker',
    template: $("#date-bubble").html(),
    initialize: function(attrs) {
      _.extend(this, attrs);
      return this.listenTo(this.model, {
        "hide:marker": function() {
          return this.$el.hide();
        },
        "show:marker": function() {
          return this.$el.show();
        },
        "highlight": function() {
          return this.$el.addClass("highlighted");
        },
        "unhighlight": function() {
          return this.$el.removeClass("highlighted");
        },
        "change:hasLocation": function(model, hasLocation) {
          if (hasLocation) {
            return this.$el.removeClass("no-location-marker");
          } else {
            return this.$el.addClass("no-location-marker");
          }
        }
      });
    },
    render: function() {
      var $el, num;
      num = this.left;
      $el = this.$el;
      $el.css('left', (num * 100) + "%");
      $el.html(_.template(this.template, {
        date: moment(this.model.get("date")).format("M/D")
      }));
      if (!this.model.hasLocation()) {
        $el.addClass("no-location-marker");
      }
      this.$(".date-bubble").hide();
      return this;
    },
    events: {
      "mouseover": function() {
        return this.model.trigger("highlight");
      },
      "mouseout": function() {
        return this.model.trigger("unhighlight");
      },
      "click": function(e) {
        return this.model.trigger("showpopup");
      }
    }
  });


  return {
    initialize: function(attrs) {
      return new Timeline(attrs);
    }
  }
});
