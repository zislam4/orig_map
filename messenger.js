define(function() {
    messenger = _.extend({}, Backbone.Events)
    // Semantic aliases
    messenger.when = messenger.on
    messenger.dispatch = messenger.trigger
    return messenger;
})