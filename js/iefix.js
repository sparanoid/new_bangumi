'use strict';

//if Array.prototype.indexOf didn't exist, then add one
if (typeof Array.prototype.indexOf !== 'function') {
    Array.prototype.indexOf = function(target) {
        if (target) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (this[i] == target) {
                    return i;
                }
            }
            return -1;
        } else {
            throw new Error('illegal target');
        }
    };
}

if (typeof Array.prototype.map !== 'function') {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}

if (typeof Array.prototype.filter !== 'function') {
    Array.prototype.filter= function(filter, that /*opt*/) {
        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}

angular.module('ieFix', [])
    
//fix IE7- bugs
.config(['$sceProvider', function($sceProvider) {
    if (navigator.appName === "Microsoft Internet Explorer" && 
    +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 8) {
        $sceProvider.enabled(false);
    }
}])

.directive('classFix', function() {
    if (navigator.appName === "Microsoft Internet Explorer" && 
    +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 8) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) { 
                scope.$watch(function() {
                    return element[0]['class'];
                }, function() {
                    if (element[0]['class']) {
                        element[0].className = element[0]['class'];
                    } else {
                        element[0].className = '';
                    }
                });
            }
        };
    } else {
        return {
            restrict: 'A'
        };
    }
})

.directive('spanFix', function() {
    if (navigator.appName === "Microsoft Internet Explorer" && 
    +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 9) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) { 
                element[0].className = 'hide';
            }
        };
    } else {
        return {
            restrict: 'A'
        };
    }
});


