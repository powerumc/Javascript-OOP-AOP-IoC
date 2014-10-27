
;
var DEBUG = function() { console.log(arguments[0]); }

var oop = (function(oop) {
    ;

    var Accessor = {
        Public: "public",
        Private: "private"
    };

    var getProperties = function(clazz) {
        var type = (clazz instanceof Object) ? clazz : clazz;
        var propList = [];
        for(var p in type) {
            if (!type.hasOwnProperty(p)) continue;
            propList.push(p);
        }
        return propList;
    };

    var Class = function(classInfo) {

        //parent = parent || {};
        //clazz  = clazz | function() { };

        return (function() {
            var self = this;
            var type = this.constructor;

            (function() {
            })();

            return self;
        });
    
    };

    oop = {
        extend: function(parent, clazz) {
            for(var p in clazz) {
                if (parent.hasOwnProperty(p)) {
                    clazz[p] = parent[p];
                    console.log(p);
                };

                var extend_proxy            = function() {};
                extend_proxy.prototype      = parent.prototype;
                clazz.prototype             = new extend_proxy();
                clazz.prototype.constructor = clazz;
            }
        },
        class: function(classInfo) { 
            return new Class(classInfo); 
        },
        getset: function(get, set) {
            this.get = get;
            this.set = set;
        },
        get: function() { },
        set: function(value) { }

    };

    Object.defineProperty(oop, "public", {
        get: function() { return oop; }
    });

/*
    function IProgram() { 
        console.log("IProgram.IProgram");
        this.name = "POWERUMC";
        IProgram.prototype.func = function() { console.log("base.func"); };
    }

    var Program = (function(type) {
        oop.extend(type, Program);

        var self = this;
        var base = type.prototype;

        function Program() {
            console.log("Program.Program");
            type.apply(this, arguments)
        }

        Program.prototype.func = function() {
            console.log("Program.func");
            type.prototype.func.apply(this, arguments);
        }

        return Program;
    })(IProgram);

*/

/*
    var Program = oop.public.class({
        Program: function() { },
        static: {

        },
        Id: oop.getset(function() { return _id; },
                       function(value) { _id = value; })
    });
*/

    return oop;

})(oop);

var Program = oop.public.class({
    Program: function() { },
    Init: function() { },
    static: {
        Version: "1.0.0",
        Date: "2014-10-27"
    },
    A: "A"
});

DEBUG("---------------");
DEBUG("program");
DEBUG(new Program());

