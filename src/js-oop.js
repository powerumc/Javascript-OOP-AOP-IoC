/*
The MIT License (MIT)

Copyright (c) 2014 Junil Um

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

github: https://github.com/powerumc/Javascript-OOP-AOP-IoC
blog  : http://blog.powerumc.kr/
*/

;
var oop = (function() {

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
        return (typeof obj === "object" && obj.constructor.name === "Array") || (Array.isArray && Array.isArray(obj));
    }
    
    function isString(obj) {
        return typeof obj === "string";
    }
    
    function isNumber(obj) {
        return typeof obj === "number";
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
        isObject: isObject,
        isFunction: isFunction,
        isNumber: isNumber,
        isString: isString,
        isArray: isArray,
        isProperty: isProperty,
        isStatic: isStatic,
        objects: []
    }

})();

oop.xhr = (function(oop) {
    var msie = document.documentMode;
    var createHttpRequest = function() {
        if (window.ActiveXObject && msie && msie < 8) {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
    };
    
    var commonXhr = function(self) {
        return {
            open: function(method, url, isAsync) {
                this.xhr = createHttpRequest();
                this.xhr.open(method, url, isAsync);
                return self;
            },
            send: function(data) { 
                this.xhr.send(data || null);
                return void(0);
            },
            success: function(callback) {
                this.xhr.onload = function(e) { callback(e.target.response); };
                return this;
            },
            error: function(callback) {
                this.xhr.onerror = function(e) { callback(e.target.response); };
                return this;
            },
            timeout: function(callback) {
                this.ontimeout = function(e) { callback(e.target.response); };
                return this;
            }
        };
    };
    
    function getContentType(data) {
        if (oop.isObject(data)) return "application/json";
        else if (oop.isString(data) || oop.isNumber(data)) return "text/plain";
        
        return "text/xml";
    }
    
    return {
        "get": function(url, data, isAsync) {
            isAsync = isAsync || true;
            var xhr = commonXhr(xhr);
            xhr.open.apply(xhr, ["get", url, isAsync]);
            xhr.xhr.setRequestHeader("Content-Type", getContentType(data));
            xhr.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            return xhr;
        },
        "post": function(url, data, isAsync) {
            isAsync = isAsync || true;
            var xhr = commonXhr(xhr);
            xhr.open.apply(xhr, ["post", url, isAsync]);
            xhr.xhr.setRequestHeader("Content-Type", getContentType(data));
            xhr.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            return xhr;
        }
    };  
})(oop);

oop.import = (function(list) {
    var require = function(define, onLoad) {
        if (!define) return;
        
        var source;
        
        define.isLiteral = define.isLiteral === undefined ? false : true;
        
        if (!define.sourceKind) {
            var arr = define.url.split(".").slice(-1);
            if (arr.length > 0) {
                define.sourceKind = arr[0];
            }
        }
        
        if (!define.isLiteral) {
            if (define.sourceKind === "js") {
                source = document.createElement("script");
                source.type = "text/javascript";
                source.src = define.url;
                if (!define.async) { 
                    source.onload = onLoad;
                }
                
                if (define.preHandler) define.preHandler(source);
                append("head");
            } else if (define.sourceKind === "css") {
                source = document.createElement("link");
                source.type = "text/css";
                source.rel = "stylesheet";
                source.href = define.url;
                if (!define.async) { 
                    source.onload = onLoad;
                }
                
                if (define.preHandler) define.preHandler(source);
                append("head");
            }
        } else {   
            var xhr = oop.xhr.get(define.url, function(result) {
            })
            .success(function(result) {
                result = result.replace("\n", "");
                var uniqueId = getFilenameWithoutExtension(define.url);
                if (!document.getElementById(uniqueId)) {
                    source = document.createElement("script");
                    source.id = uniqueId;
                    source.innerHTML = result;

                    if (define.preHandler) define.preHandler(source);
                    append("head");
                }
                
            })
            .error(function(result) {
                if (define.callback) define.callback(result, define);
            });
            
            xhr.send();
        }

        function append(nodeName) {
            var dom = document.getElementsByTagName(nodeName) || document.getElementsByTagName("head");
            if (dom.length > 0) {
                dom[0].appendChild(source);
                if (define.callback) define.callback(source, define);
            }
        }

        function getFilenameWithoutExtension(url) {
            return url.split('/').pop().split('.')[0];
        }
    };
    
    function c(obj, onLoad) {
        if (!obj) return;
        
        if (oop.isString(obj)) { require( {"url": list[i] }); }
        else {
            if (obj.dependsOn) {
                if (!oop.isArray(obj.dependsOn)) {
                    throw "dependsOn must be array."
                }
                var callback = function(nestedObj) {
                    for(var d=0; d<nestedObj.dependsOn.length; d++) {
                        c(nestedObj.dependsOn[d]);
                    }
                };
                
                require(obj, function() { callback(obj); });
                
            } else {
                require(obj);
            }
        }
    }
    
    for(var i=0; i<list.length; i++) {
        c(list[i]);
    }
    
});

oop.importTemplate = (function(list, callback) {
    var loaded = 0;
    var count = 0;
    for(var i=0; i<list.length; i++) {
        var objTemplate = {
            url: list[i], isLiteral:true, preHandler: function(source) {
                source.type = "x-nexon-template"; 
                source.id += "-template";
                source.attributes["data-order"] = count++;
            },
            order: i,
            callback: function(result, define) {
                loaded++;
                result.attributes["data-order"] = define.order;
                
                if (loaded == list.length) {
                    if (callback) callback(getTemplates("x-nexon-template"));
                } 
            }
        };
        oop.import([objTemplate]);
    }
    
    function getTemplates(scriptType) {
        scriptType = scriptType || "x-nexon-template";
        
        var arr = [];
        var scripts = document.getElementsByTagName("script");
        for(var i=0; i<scripts.length; i++) {
            if (scripts[i].type != scriptType) continue;
            
            arr.push(scripts[i]);
        }
        
        return arr.sort(function(a,b) {
            var aa = a.attributes["data-order"];
            var bb = b.attributes["data-order"];
            return aa < bb ? -1 : aa > bb ? 1 : 0;
        });
    }
});

/**
 * OOP Flow
 */
(function(oop) {
    
    
    oop.flow = function(obj) {
        return {
            "then": function() {
                return this;
            },
            "with": function() {
                return this;
            }
        };
    };
    
})(oop);

(function(oop) {
    oop.behaviors = {
            LoggingBehavior: oop.interceptionBehavior(function() {
                                                                    this.date = new Date();
                                                                    if (!this.date) {
                                                                    LOG(this.date.toLocaleString() + " [js.oop] LoggingBehavior Begin ");
                                                                    var options = {
                                                                          year: 'numeric', month: 'numeric', day: 'numeric',
                                                                          hour: 'numeric', minute: 'numeric', second: 'numeric',
                                                                          hour12: false
                                                                        };
                                                                    }
                                                                    LOG("["+this.date.toLocaleString('en-US', this.options)+"] ", arguments);
                                                                },
                                                                function() { 
                                                                    LOG(this.date.toLocaleString() + " [js.oop] LoggingBehavior End ")
                                                                }, undefined,undefined),
            ExceptionBehavior: oop.interceptionBehavior(undefined,undefined,undefined,undefined)
        };

})(oop);