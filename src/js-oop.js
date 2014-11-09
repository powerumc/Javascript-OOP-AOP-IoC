
;
var LOG   = function() { console.log.apply(console, arguments); };
var DEBUG = function() { (console.debug || console.warn).apply(console, arguments); };
var TRACE = function() { console.trace.apply(console, arguments); };
var ERROR = function() { console.error.apply(console, arguments); };


oop = (function() {
    //Function.apply = function() { var a = Function.apply(arguments); a.objectId++;}

    (function() {
        var __id = 1;
        Object.defineProperty(Object.prototype, "__object_id", {
            writable: true
        });
        Object.defineProperty(Object.prototype, "objectId", {
            get: function() {
                if (this.__object_id == undefined)
                    this.__object_id = __id++;
                return this.__object_id;
            }
        });
    }());

    var isObject = function(obj) {
        return typeof obj === "object" && obj.constructor.name !== "Array";
    }

    var isProperty = function(obj) {
        return isObject(obj) && (obj.get || obj.set);
    }

    var isFunction = function(obj) {
        return typeof obj === "function";
    }

    var isArray = function(obj) {
        return typeof obj === "object" && obj.constructor.name === "Array";
    }

    var isStatic = function(obj) {

    }

    var setStaticMethod = function(type, static_objects) {
        for(var pp in static_objects) {
            if (!static_objects.hasOwnProperty(pp)) continue;
            LOG("[set static] ", pp);
            type[pp] = static_objects[pp];
        }
    }

    var setProperty = function(self, propName, funcGet, funcSet) {
        Object.defineProperty(self, propName, { get: funcGet, set: funcSet });
    }

    var getProperties = function(clazz) {
        var propList = [];
        var type = clazz;
        for(var p in type) {
            if (!type.hasOwnProperty(p)) continue;
            propList.push({ "name":p, "object":type[p] });
        }
        return propList;
    };

    var getClassFromLiterals = function(literals) {
        var props = getProperties(literals);
        function ____() { };

        for(var p in props) {
            setPropertySpecification(____, props[p]);
        }

        return ____;
    };

    var setPropertySpecification = function(type, p) {

        var target = p.object;

        if (p.name == "static") {
            LOG("[set static] ", p.name);
            setStaticMethod(type, target);
            return;
        }

        if (isProperty(target)) {
            LOG("[set property] ", p.name);
            setProperty(self, p.name, target.get, target.set);
            return;
        }

        if (isFunction(target)) {
            LOG("[set function] ", p.name);
            var params = getFunctionParameters(target.toString());
            // LOG("[set function prototype] ", p.name);

            // if (params && params.indexOf("base") >= 0 /*&& parent_object*/) {
            //     // var id = parent_object.objectId || 0;
            //     // if (oop.objects.indexOf(id) < 0) 
            //     //     oop.objects[id] = parent_object;

            //     var inject_param_base = "oop.objects[" + id +"]";
            //     var inject_params     = ".apply(this,(function() { \n" + 
            //         "var a=Array.prototype.slice.call((arguments[0] || [])); \n" + 
            //         "a.push(" + inject_param_base + ");return a; })(arguments));";
            //     var inject_body       = "(" + target.toString() + ")" + inject_params;
            //     var inject_func       = Function.call(this, inject_body);
            //     target                = inject_func;
            //     LOG(inject_body);
            // }
            type.prototype[p.name] = target;
            return;
        } else {
            LOG("[set function] ", p.name);
        }
    }

    var getFunctionParameters = function(func) {
        var pattern = /function[\s\w]*\(([(\w\s, ^\/\*,) ]+)\)/g;
        var match = pattern.exec(func.toString());
        if (!match) return null;
        var params = match[1].replace(/ /g, "").split(',');
        return params;
    };

    var Inject = function() {
        var methods = Array.prototype.slice.apply(arguments, []);
        for(var m in methods) {
            m = methods[m];
            p = getFunctionParameters(m);
            DEBUG("[oop.inject] ", p);
        }
    };

    var Class = function(parents, classInfo) {
        classInfo      = Array.prototype.slice.apply(arguments, [-1])[0];
        var arrParents = Array.prototype.slice.apply(arguments, [0, arguments.length-1]);
        if (arrParents && arrParents.length <= 1) { parents = undefined }
        LOG("[classInfo] ", classInfo);

        if (classInfo === undefined) { 
            classInfo = parents; 
            parents = undefined;
        }

        var parent_object;
        var self_arguments = arguments;
        var self           = this;
        var type           = this.constructor;
        var ret            = {};

        var clazz_definition = getClassFromLiterals(classInfo);

        for(var parent in arrParents) {
            parent = arrParents[parent];
            parent = (self.constructor && self.constructor.name !== "Window") ? parent : undefined;
            if (parent) { 
                oop.extend(parent, clazz_definition)
            }
        }

        return clazz_definition;


        return ret;
    };

    return {
        extend: function(parent, clazz) {
            var parent_object;
            (function() {
                if (parent) {
                    parent_object = Object.create(parent.prototype);
                    clazz.prototype.__base__ = parent_object;
                }
                if (clazz.init) { 
                    clazz.init.apply(self, arguments);
                }
            })();

            for(var p in parent_object) { if (parent.prototype.hasOwnProperty(p)) { clazz.prototype[p] = parent_object[p]; } }
            clazz.prototype.constructor = clazz;

            return clazz;
        },
        class: function(parents, classInfo) {
            return Class.apply(this, arguments);
        },
        inject: function(method) {
            return Inject.apply(this, arguments);
        },
        injectBehavior : function(before, after, exception, finally_) {
            return InjectBehavior.apply(arguments);
        },
        getset: function(get, set) {
            this.get = get;
            this.set = set;
        },
        get: function(funcGet) { setProperty(this, "prop2", funcGet, undefined); return "A"; },
        set: function(value) { },
        static: function(static_objects) {
        },
        objects: []
    }

})();

/*
var IProgram = oop.public.class({
    interface1: function() { console.log("IProgram.prototype.interface1();"); }
});

var Program = oop.public.class({
    init: function() { console.log("Program.prototype.init()"); },
    say: function(msg) { console.log("Hello " + msg); },
    static: {
        Version: "1.0.0",
        Date: "2014-10-27"
    },
    Name: "Junil Um"
});
function a()

function() { }
*/

var IFProgram = function() {
    this.NAME = "POWERUMC";
    IFProgram.prototype.FUNC = function() { console.log("FUNC"); };
}

var IProgram1 = oop.class({
    interface1: function(base) { console.log("IProgram1.prototype.interface1"); },
});

var IProgram2 = oop.class(IProgram1, {
    interface2: function(base) { console.log("IProgram2.prototype.interface2"); base.interface1(); },
    interface3: function(base) { console.log("IProgram2.prototype.interface3"); }
});
/*
var Program1 = oop.class(IProgram2, {
    interface3: function(arg1, arg2, base) { console.log("Program1.prototype.interface3"); },
    interface4: function() { console.log("Program1.prototype.interface4"); },
    static: {
        Name: "POWERUMC",
        getName: function() { return this.Name; }
    },
    prop1 : {
        get: function() { return this._name; },
        set: function(value) { this._name = value; }
    }
});
*/
// var Program2 = oop.class(Program1, {
//     interface5: function() { console.log("Program2.prototype.interface5"); }
// });

var p1 = new IProgram2();
DEBUG(oop.inject(p1.interface1));
TRACE(p1);
// 