// Requires
var Q = require('q');
var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');

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
    this._actions = _.keys(this._options.actions);
    this._steps = this._options.actions;
    this._state = this._options.defaultState;

    // Get all states
    var allStates = _.values(this._steps).map(function(actionData) {
                        return [actionData.to, actionData.from];
                    });

    var states = _.unique(_.flatten(allStates));



    // Build the state machine's action methods
    _.forEach(this._actions, function(action) {
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
    Machine.super_.call(this);
}

// Inherit parents
util.inherits(Machine, EventEmitter);


// Exports
exports.Machine = Machine;