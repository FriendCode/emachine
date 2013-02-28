// Requires
var Q = require('q');
var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var methodPrefix = 'do';

function actorName(action) {
    var actionUpper = action;
    actionUpper[0] = action[0].toUpperCase();
    return methodPrefix + actionUpper;
}

// An evented state machine
function Machine(options) {
    var that = this;
    this._options = options || {};
    this._actions = _.keys(options.actions);
    this._steps = options.actions;
    this._state = options.defaultState;

    // Get all states
    var allStates = _.values(options.actions).map(function(actionData) {
                        return [actionData.to, actionData.from];
                    });

    var states = _.unique(_.flatten(allStates));



    // Build the state machine's action methods
    _.forEach(actions, function(action) {
        that[action] = function() {
            var actionArgs = arguments;
            var steps = that._steps[action];
            var to = steps.to;
            var from = steps.from;
            var transition = steps.transition;

            assert(that.from === this._state);

            // Function to do work with
            var actor = that[actorName(action)].bind(that);

            // Say that we've started that said action
            that.emit(transition, actionArgs);

            // Do the actual work
            var promise = actor.apply(that, actionArgs);

            promise.then(function() {
                // Say that we're finished
                that._state = to;
                that.emit(to, actionArgs);
            }).fail(function() {
                that.emit();
            });
        };
    });

    // Call super
    this.super_.call(this);
}

// Inherit parents
util.inherits(Machine, EventEmitter);


// Exports
exports.Machine = Machine;