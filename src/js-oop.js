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



var LOG   = LOG || function() { console.log.apply(console, arguments); };
var DEBUG = DEBUG || function() { (console.debug || console.warn).apply(console, arguments); };
var TRACE = TRACE || function() { console.trace.apply(console, arguments); };
var ERROR = ERROR || function() { console.error.apply(console, arguments); };


var oop = (function() {


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
        if (!func) return [];
        var pattern         = /function[\s\w]*\(([($\w\s, ^\/\*,) ]+)\)/g;
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

    var injectMethod = function(m, b, o) {
        var p                = getFunctionParameters(m);
        var func_param       = [];
        var func_param_ahead = [];

        if (p && p.length > 0) {
            for(var i=0; i<p.length; i++) {
                if (p[i] == "base") func_param.push("this.__base__");
                else if(p[i] == "self") func_param.push("this");
                else {
                    var name = (o.prefix || "") + p[i] + (o.suffix || "");
                    func_param.push(name);
                    func_param_ahead.push(p[i]);
                }
            }
        }

        var func_body = immediateFunc(m, func_param);
        func_body     = surroundTryCatch(func_body);

        return new Function(func_param_ahead.join(","), func_body);
    };

    var Inject = function() {
        var m = Array.prototype.slice.apply(arguments, [])[0];
        var o = arguments.length > 1 ? arguments[1] : null;
        var ret = [];
        //for(var m in methods) {
            //m = methods[m];
            p = getFunctionParameters(m);
            ret.push(injectMethod(m, p, o));
        //}
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
        objects: [],
        globals: {}
    }

})();



(function(oop) {
    var msie = document.documentMode;
    function createEvent(name, arg) {

        var event;
        if (msie && msie>0 && document.createEvent) {
            //throw "should be implement to createEvent method"
            event = document.createEvent("CustomEvent", {detail: arg});
            event.initEvent(name, true, true);
        } else if (window.CustomEvent) {
            event = new CustomEvent(name, {detail: arg});
        }

        return event;
    }

    oop.subscribe = function(name, callback) {
        window.addEventListener(name, callback, false);
    };

    oop.publish = function(name, arg) {
        window.dispatchEvent(createEvent(name, arg));
    };

})(oop);



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
                this.xhr.onload = function(e) { callback(e.target.response || e.target.responseText); /* ie9 */ };
                return this;
            },
            error: function(callback) {
                this.xhr.onerror = function(e) { callback(e.target.response || e.target.responseText); };
                return this;
            },
            timeout: function(callback) {
                this.ontimeout = function(e) { callback(e.target.response || e.target.responseText); };
                return this;
            }
        };
    };
    
    var mimeTypes = [];
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
        },
        "getMimeType": function(ext) {
            for(var i=mimeTypes.length-1; i>=0; i--) {
                if (mimeTypes[i].ext === ext) 
                    return mimeTypes[i].mimeType;
            }
            return null; 
        },
        "setMimeType": function(ext, mimeType) {
            mimeTypes.push({"ext":ext, "mimeType": mimeType});
            return this;
        }
        
    };  
})(oop);

(function() {
oop.xhr.setMimeType("js", "text/javascript")
       .setMimeType("css", "text/css")
       .setMimeType("html", "text/html");

oop.subscribe("js.oop.imported");
oop.subscribe("js.oop.importingAllCompleted", loaded);
window.onload = loaded;
oop.globals.imported = [];
function loaded(o) {
    for(var i=0; i<oop.globals.ready.length; i++) {
        var fn = oop.globals.ready.splice(0,1);
        fn[0].call(this);
    }
}
})();

oop.import = (function(list, callback) {
    oop.globals.importedCount = (oop.globals.importedCount || 0)+1;
    oop.globals.enabledImportingCount = true;

    function require(define, onLoad) {
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
                source.type = oop.xhr.getMimeType("js");
                source.src = define.url;
                if (!define.async) { 
                    source.onload = onLoad;
                }
                
                source.id = getFilenameWithoutExtension(define.url);
                source.attributes["data-id"] = source.id;
                source.attributes["data-order"] = define.order;
                if (define.preHandler) define.preHandler(source);
                append("head");
                
            } else if (define.sourceKind === "css") {
                source = document.createElement("link");
                source.type = oop.xhr.getMimeType("css");
                source.rel = "stylesheet";
                source.href = define.url;
                source.attributes["data-order"] = define.order;
                if (!define.async) { source.onload = onLoad; }
                
                if (define.preHandler) define.preHandler(source);
                append("head");
                
            } else {
                loadFrom(define);
            }
        } else {   
            loadFrom(define);
        }
        
        function loadFrom(define) {
            var xhr = oop.xhr.get(define.url, function(result) {
            })
            .success(function(result) {
                result = (result || "").replace("\n", "");
                var uniqueId = getFilenameWithoutExtension(define.url);
                if (!document.getElementById(uniqueId)) {
                    source = document.createElement("script");
                    source.innerHTML = result;
                    source.type = oop.xhr.getMimeType(define.url.split(".").pop());
                    source.id = uniqueId + "-template";
                    source.attributes["data-order"] = define.order;
                    
                    if (define.preHandler) define.preHandler(source);
                    append("head");
                    
                    if (onLoad) onLoad();
                }
                
            })
            .error(function(result) {
                if (define.callback) define.callback(result, define);
            });
            
            xhr.send();
        }

        function append(nodeName) {
            sourceList.push(source);
            var dom = document.getElementsByTagName(nodeName) || document.getElementsByTagName("head");
            if (dom.length > 0) {
                dom[0].appendChild(source);
                if (define.callback) define.callback(source, define);
            }
        }

        function getFilenameWithoutExtension(url) {
            return url.split('/').pop().split('.').slice(0,-1).join(".");
        }
    }
    
    var sourceList = [];
    var total = 0;
    var count = 0;
    var downloadedCount = 0;

    function incrementCount() { return ++downloadedCount; }
    function getIncrementCount() { return downloadedCount; }

    function getTotal(arr) {
        total++;
        if (!arr.depends) return true;
        
        for(var y=0; y<arr.depends.length; y++) {
            getTotal(arr.depends[y]);
        }
    }
    
    for(var i=0; i<list.length; i++) {
        var result = getTotal(list[i]);
        if (result) continue;
    }
    
    function c(obj, onLoad) {
        if (!obj) return;
        
        if (oop.isString(obj)) { require({"url": list[i], order:count++}, function() { c_callback(incrementCount()); }); }
        else {
            obj.order = count++;
            if (obj.depends) {
                if (!oop.isArray(obj.depends)) {
                    throw "depends must be array."
                }
                
                var cb = function(nestedObj) {
                    for(var d=0; d<nestedObj.depends.length; d++) {
                        c(nestedObj.depends[d]);
                    }
                    c_callback(incrementCount());
                };
                
                require(obj, function() { cb(obj); });
                
            } else {
                require(obj, function() { c_callback(incrementCount()); });
            }
        }
    }
    
    function getGlobalImportingCount() { return oop.globals.globalImportingCount; }
    function incrementGlobalImportingCount() {
        oop.globals.globalImportingCount = oop.globals.globalImportingCount || 0;
        oop.globals.globalImportingCount++;
        return oop.globals.globalImportingCount;
    }
    function c_callback(cnt) {
        var sortedList = sourceList.sort(function(a,b) {
            var aa = a.attributes["data-order"];
            var bb = b.attributes["data-order"];
            return aa < bb ? -1 : aa > bb ? 1 : 0;
        });
        if (total == cnt) {
            if (callback) callback(sortedList);

            oop.publish("js.oop.imported", { importedCount : incrementGlobalImportingCount(), object: sortedList });
            if (oop.globals.importedCount === getGlobalImportingCount()) {
                oop.globals.enabledImportingCount = false;
                for(var i in window) {
                    if (window.hasOwnProperty(i)) {
                        oop.globals.imported[i] = window[i];
                    }
                }
                oop.publish("js.oop.importingAllCompleted");
            }
        }
    }
    
    for(var i=0; i<list.length; i++) {
        c(list[i]);
    }
});

oop.globals.ready = [];
oop.ready = function(resolveCallback) {

    function Ready(resolveCallback) {
        this.callbacks = resolveCallback;
    }

    var readyObj = Object.call(Ready, arguments);
    var r = oop.inject(readyObj[0], {prefix:"oop.globals.imported."});

    oop.globals.ready.push(r[0]);
};