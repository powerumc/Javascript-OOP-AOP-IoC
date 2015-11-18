
;
oop = (function() {

    var LOG   = function() { console.log.apply(console, arguments); };
    var DEBUG = function() { (console.debug || console.warn).apply(console, arguments); };
    var TRACE = function() { console.trace.apply(console, arguments); };
    var ERROR = function() { console.error.apply(console, arguments); };


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
        return typeof obj === "string" && obj === "static";
    }

    var setStaticMethod = function(type, static_objects) {
        for(var p in static_objects) {
            if (!static_objects.hasOwnProperty(p)) continue;
            type[p] = static_objects[p];
        }
    };

    var setProperty = function(self, propName, funcGet, funcSet) {
        Object.defineProperty(self, propName, { get: funcGet, set: funcSet });
    };

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
        function ____() { }

        for(var p in props) {
            setPropertySpecification(____, props[p]);
        }

        return ____;
    };

    var setPropertySpecification = function(type, p) {
        var target = p.object;

        if (isStatic(p.name)) {
            setStaticMethod(type, target);
            return;
        }

        if (isProperty(target)) {
            setProperty(type.prototype, p.name, target.get, target.set);
            return;
        }

        if (isFunction(target)) {
            target = injectMethod(target);
            target.name = p.name;
            type.prototype[p.name] = target;
            type.prototype[p.name].prototype.name = p.name;
            type.prototype[p.name].constructor = type;
            return;
        } else {
            type.prototype[p.name] = target;
            return;
        }
    };

    var getFunctionParameters = function(func) {
        var pattern         = /function[\s\w]*\(([(\w\s, ^\/\*,) ]+)\)/g;
        var pattern_comment = /(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/gm;
        var match = pattern.exec(func.toString());
        if (!match) return [];
        var params = match[1].replace(/ |\n/g, "").replace(pattern_comment, "").split(',');
        return params || [];
    };

    var getFunctionBody = function(func) { 
        var pattern = /[^{]{((?:[^}])|(?:[^{]))*}[^}]/gm;
        return func.toString().match(pattern)[0].trim().substring(2)
    };

    var surroundTryCatch = function(func, exceptionFunc) {
        if (!func && !exceptionFunc) return "";

        return "\ntry {" + func + "} catch(err) { " + (exceptionFunc || "throw err;") + "}";
    };

    var surroundTryCatchFinally = function(func, exceptionFunc, finallyFunc) {
        if (!func && !exceptionFunc && !finallyFunc) return "";

        return "\ntry {" + func + "} catch(err) { " + (exceptionFunc || "throw err;") + "} " + (finallyFunc ? "finally { " + (finallyFunc || "") + " }" : "");
    };

    var surroundBehavior = function(func, behavior) {
        behavior          = behavior || {};
        var beforeFunc    = surroundTryCatch(immediateFunc(behavior.before || ""));
        var proc_func     = surroundTryCatch(func);
        var afterFunc     = surroundTryCatch(immediateFunc(behavior.after || ""));
        return surroundTryCatchFinally(beforeFunc + proc_func + afterFunc, immediateFunc(behavior.exception), immediateFunc(behavior.finally));
    };

    var InterceptionFunc = function(func, behavior) {
        var params       = getFunctionParameters(func);
        var proxyFunc    = getFunctionBody(func);
        proxyFunc        = surroundBehavior(proxyFunc, behavior);

        DEBUG("params ", params);

        var interceptionFunc         = new Function(params.join(","), proxyFunc);
        interceptionFunc.constructor = func.constructor;
        interceptionFunc.prototype   = func.prototype;
        interceptionFunc.constructor.prototype[interceptionFunc.prototype.name] = interceptionFunc;
    };

    var Interception = function(func, behavior) {
        if (isFunction(func)) { InterceptionFunc(func, behavior); }
        else if (isObject(func) && func.constructor && func.constructor.name === "____") {
            for(var p in func) {
                if (isFunction(func[p])) { InterceptionFunc(func[p], behavior); }
            }
        }
    };

    function immediateFunc(func, args) {
        args = args || []; 
        if (!func) return "";

        var func_body = "";
        var func_args = "";
        if (func) {
            func_body = "(" + func + ")";
            if (args) { func_args = "(" + args.join(",") + ")"; }
        }

        return func_body + func_args;
    }

    var injectMethod = function(m, b) {
        var p                = getFunctionParameters(m);
        var func_param       = [];
        var func_param_ahead = [];

        if (p && p.length > 0) {
            for(var i=0; i<p.length; i++) {
                if (p[i] == "base") func_param.push("this.__base__");
                else if(p[i] == "self") func_param.push("this");
                else {
                    func_param.push(p[i]);
                    func_param_ahead.push(p[i]);
                }
            }
        }

        var func_body = immediateFunc(m, func_param);
        func_body     = surroundTryCatch(func_body);

        return new Function(func_param_ahead.join(","), func_body);
    };

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

            for(var p in parent_object) { if (!clazz.prototype[p]) { clazz.prototype[p] = parent_object[p]; } }
            clazz.prototype.constructor = clazz;
            clazz.prototype.__base__    = parent_object;

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