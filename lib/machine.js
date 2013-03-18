// Requires
var Q = require('q');
var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');

var methodPrefix = 'do';

function actorName(action) {
    var letters = _.toArray(action);
    letters[0] = action.charAt(0).toUpperCase();
    return methodPrefix + letters.join('');
}

function isFrom(fromStates, currentState) {
    if(fromStates === '*') {
        return true;
    } else if(_.isString(fromStates)) {
        return _.isEqual(fromStates, currentState);
    } else if(_.isArray(fromStates)) {
        return _.contains(fromStates, currentState);
    }
    return false;
}

// An evented state machine
function Machine(options) {
    var that = this;
    this._options = options || {};
    this._actions = _.keys(this._options.actions);
    this._steps = this._options.actions;
    this._state = this._options.initial;
    this._failed = this._options.failed || 'failed';

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

            assert(isFrom(from, that._state), "Current state is "+that._state+", expected "+from+" (action = "+action+")");

            // Function to do work with
            var actor = that[actorName(action)];
            assert(actor, "Have no handler for "+action+", handler name is "+actorName(action));

            // Say that we've started that said action
            that.emit(transition, actionArgs);

            // Do the actual work
            var promise = actor.apply(that, actionArgs);

            return promise.then(function() {
                // Say that we're finished
                that._state = to;
                that.emit(to, actionArgs);
            }).fail(function(err) {
                that.emit('error', err);
            });
        };
    });

    // Call super
    Machine.super_.call(this);
}

Machine.prototype.getState = function() {
    return this._state;
};

// Inherit parents
util.inherits(Machine, EventEmitter);


// Exports
exports.Machine = Machine;