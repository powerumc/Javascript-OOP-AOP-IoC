
;
var LOG   = function() { console.log.apply(console, arguments); };
var DEBUG = function() { (console.debug || console.warn).apply(console, arguments); };
var TRACE = function() { console.trace.apply(console, arguments); };
var ERROR = function() { console.error.apply(console, arguments); };

var ptn = 

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

    function isObject(obj) {
        return typeof obj === "object" && obj.constructor.name !== "Array";
    }

    function isProperty(obj) {
        return isObject(obj) && (obj.get || obj.set);
    }

    function isFunction(obj) {
        return typeof obj === "function";
    }

    function isArray(obj) {
        return typeof obj === "object" && obj.constructor.name === "Array";
    }

    function isStatic(obj) {

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
            setProperty(type.prototype, p.name, target.get, target.set);
            return;
        }

        if (isFunction(target)) {
            LOG("[set function] ", p.name);
            target = injectMethod(target);
            type.prototype[p.name] = target;
            return;
        } else {
            LOG("[set else] ", p.name);
            type.prototype[p.name] = target;
            return;
        }
    }

    var getFunctionParameters = function(func) {
        var pattern = /function[\s\w]*\(([(\w\s, ^\/\*,) ]+)\)/g;
        var pattern_comment = /(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/gm;
        var match = pattern.exec(func.toString());
        if (!match) return null;
        var params = match[1].replace(/ /g, "").replace(pattern_comment, "").split(',');
        return params;
    };

    var getFunctionBody = function(func) { 
        var pattern = /[^{]{((?:[^}])|(?:[^{]))*}[^}]/gm;
        return func.toString().match(pattern)[0].trim().substring(2)
    };

    var surroundTryCatch = function(func, exceptionFunc) {
        if (!func && !exceptionFunc) return "";

        return "\ntry {"
             + func
             + "} catch(err) { " + (exceptionFunc || "throw err;") + "}";
    };

    var surroundTryCatchFinally = function(func, exceptionFunc, finallyFunc) {
        if (!func && !exceptionFunc && !finallyFunc) return "";

        return "\ntry {"
             + func
             + "} catch(err) { " + (exceptionFunc || "throw err;") + "} "
             + (finallyFunc ? "finally { " + (finallyFunc || "") + " }" : "");
    };

    var surroundBehavior = function(func, behavior) {
        DEBUG(behavior);
        behavior          = behavior || {};
        var enteringFunc  = surroundTryCatch(immediateFunc(behavior.before || ""));
        var proc_func     = surroundTryCatch(func);
        var enterFunc     = surroundTryCatch(immediateFunc(behavior.after || ""));
        var exceptionFunc = surroundTryCatchFinally(enteringFunc+proc_func+enterFunc, immediateFunc(behavior.exception), immediateFunc(behavior.finally));
        return exceptionFunc;
    };

    var Interception = function(func, behavior) {
        func = getFunctionBody(func);
        var behaviorFunc = surroundBehavior(func, behavior);
        func = behaviorFunc;

        var f = new Function(func);
        DEBUG(f);
        return f;
    };

    function immediateFunc(func, args) {
        args = args || []; 
        if (!func) return "";

        var func_body = "";
        var func_args = "";
        if (func) {
            //if (!isFunction(func) || func.toString().indexOf("function") != 0) { func_body += "(function() {"; }
            func_body = "(" + func + ")";
            if (args) { func_args = "(" + args.join(",") + ")"; }
            //if (!isFunction(func) || func.toString().indexOf("function") != 0) { func_body += "})();"; }
        }

        return func_body + func_args;
    };

    var injectMethod = function(m, b) {
        var p                = getFunctionParameters(m);
        var func_param       = [];
        var func_param_ahead = [];

        if (p && p.length > 0) {
            for(var i=0; i<p.length; i++) {
                if (p[i] == "base") func_param.push("this.__base__");
                else {
                    func_param.push(p[i]);
                    func_param_ahead.push(p[i]);
                }
            }
        }

        var func_body = immediateFunc(m, func_param);
        func_body     = surroundTryCatch(func_body);

        var func      = new Function(func_param_ahead.join(","), func_body);
        return func;
    }

    var Inject = function() {
        var methods = Array.prototype.slice.apply(arguments, []);
        var ret = [];
        for(var m in methods) {
            m = methods[m];
            p = getFunctionParameters(m);
            ret.push(injectMethod(p, m));
        }
        return ret;
    };

    var InterceptionBehavior = function(before, after, exception, finally_) {
        
        this.before     = before;
        this.after      = after;
        this.finally_   = finally_;
        this.exception  = exception;

        return {
            "before"   : this.before,
            "after"    : this.after,
            "finally"  : this.finally_,
            "exception": this.exception
        };
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
        var clazz_def      = getClassFromLiterals(classInfo);

        for(var parent in arrParents) {
            parent = arrParents[parent];
            parent = (self.constructor && self.constructor.name !== "Window") ? parent : undefined;
            if (parent) { 
                oop.extend(parent, clazz_def)
            }
        }

        return clazz_def;
    };

    return {
        extend: function(parent, clazz) {
            var parent_object;
            (function() {
                if (parent) {
                    parent_object = Object.create(parent.prototype);
                }
                if (clazz.init) { 
                    clazz.init.apply(self, arguments);
                }
            })();

            for(var p in parent_object) { if (parent.prototype.hasOwnProperty(p)) { clazz.prototype[p] = parent_object[p]; } }
            clazz.prototype.constructor = clazz;
            clazz.prototype.__base__ = parent_object;

            return clazz;
        },
        class: function(parents, classInfo) {
            return Class.apply(this, arguments);
        },
        inject: function(method) {
            return Inject.apply(this, arguments);
        },
        interceptionBehavior : function(before, after, exception, finally_) {
            return InterceptionBehavior(before, after, exception, finally_);
        },
        interception: function(func, behavior) {
            return Interception(func, behavior);
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

(function(oop) {
    oop.behaviors = {
            LoggingBehavior: oop.interceptionBehavior(function() { 
                                                                    console.log("------ enter interception ------")
                                                                    if (!this.date) {
                                                                        this.date = new Date(); 
                                                                        options = {
                                                                          year: 'numeric', month: 'numeric', day: 'numeric',
                                                                          hour: 'numeric', minute: 'numeric', second: 'numeric',
                                                                          hour12: false
                                                                        };
                                                                    }
                                                                    console.log("["+this.date.toLocaleString('en-US', this.options)+"] ", arguments);
                                                                },
                                                                function() { 
                                                                    console.log("------ end interception ------")
                                                                }, undefined,undefined),
            ExceptionBehavior: oop.interceptionBehavior(undefined,undefined,undefined,undefined)
        };
})(oop);

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
    interface2: function(a, b, base) { console.log("IProgram2.prototype.interface2 "); base.interface1(); },
    interface3: function(base) { console.log("IProgram2.prototype.interface3"); },
    Name: "A"
});

var Program1 = oop.class(IProgram2, {
    interface3: function(arg1, arg2, base) { console.log("Program1.prototype.interface3"); },
    interface4: function(base) { console.log("Program1.prototype.interface4"); console.log("[base] ", base); base.interface2(); },
    static: {
        Name: "POWERUMC",
        getName: function() { return this.Name; }
    },
    prop1 : {
        get: function() { return this._name; },
        set: function(value) { this._name = value; }
    }
});

// var Program2 = oop.class(Program1, {
//     interface5: function() { console.log("Program2.prototype.interface5"); }
// });

var p1 = new Program1();
//DEBUG(p1.interface4);
//DEBUG(oop.interception(p1.interface4, oop.behaviors.LoggingBehavior));

p1.interface4 = oop.interception(p1.interface4, oop.behaviors.LoggingBehavior);
p1.interface4();