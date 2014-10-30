
;
var DEBUG = function() { console.log(arguments[0]); }

var oop = (function(oop) {
    ;

    var Accessor = {
        Public: "public",
        Private: "private"
    };

    function isObject(obj) {
        return typeof obj === "object" && obj.constructor.name !== "Array";
    }

    function isProperty(obj) {
        return isObject(obj) && obj.get && obj.set;
    }

    function isFunction(obj) {
        return typeof obj === "function";
    }

    function isArray(obj) {
        return typeof obj === "object" && obj.constructor.name === "Array";
    }

    function isStatic(obj) {
        
    }

    var getProperties = function(clazz) {
        DEBUG("----------- getProperties ---------");
        var type = clazz[0];
        var propList = [];
        for(var p in type) {
            if (!type.hasOwnProperty(p)) continue;
            DEBUG( "name:" + p + "   object:" + type[p] );
            propList.push({ "name":p, "object":type[p] });
        }
        DEBUG(propList);
        return propList;
    };

    var Class = function(parents, classInfo) {
        DEBUG("Class -------------");
        
        classInfo      = Array.prototype.slice.apply(arguments, [-1]);
        var arrParents = Array.prototype.slice.apply(arguments, [0, arguments.length-1]);
        if (arrParents && arrParents.length <= 1) { parents = undefined; }
        DEBUG("parents: " + parents);
        DEBUG("classInfo: " + classInfo);

        if (classInfo === undefined) { 
            DEBUG("classInfo === undefined");
            classInfo = parents; 
            parents = undefined;
        }
        

        return (function() {
                DEBUG(parents);
                if (parents) oop.extend(parents, this);

                var self  = this;
                var type  = this.constructor;
                var props = getProperties(classInfo);
                

                /*
                for(var i=0; i<props.length; i++) {
                    if (props[i].name == "static") {
                        type[props[i].name] = props[i].object[props[i.name]];
                    } else {
                        DEBUG("COPY " + props[i].name);
                        type.prototype[props[i].name] = props[i].object;
                    }
                }*/
                for(var p in props) {
                    if (!props.hasOwnProperty(p)) continue;
                    if (props[p].name == "static") {
                        var static_object = props[p].object;
                        for(var pp in static_object) {
                            type[pp] = static_object[pp];
                        }
                    } else {
                        DEBUG("COPY " + props[p].name);
                        type.prototype[props[p].name] = props[p].object;   
                    }
                }


                (function() {
                    DEBUG("call constructor...");
                    if (parents) {
                        DEBUG("call constructor...parent...");
                        DEBUG(parents);
                        parents.apply(this, arguments);
                    }
                    // if (self.init) { 
                    //     DEBUG("call constructor...self...");
                    //     self.init.apply(this, arguments);
                    // }
                })();

                return this;
        });
    };

    oop = {
        extend: function(parent, clazz) {
            DEBUG("oop.extend...");
            for(var p in parent) if (parent.hasOwnProperty(p)) clazz[p] = parent[p];

            var extend_proxy            = function() { };
            extend_proxy.prototype      = parent.prototype;
            clazz.prototype             = new extend_proxy();
            clazz.prototype.constructor = clazz;
        },
        class: function(parents, classInfo) { 
            return Class.apply(this, arguments);
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

    return oop;

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
*/

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
var p = new Program();
DEBUG("Program ------------------");
DEBUG(p);

// var Program = oop.public.class({
//     Program: function() { },
//     static: {

//     },
//     Id: oop.getset(function() { return _id; },
//                    function(value) { _id = value; })
// });

function IIProgram() { 
    console.log("call IIProgram");
    this.user = "POWERUMC";
    IIProgram.prototype.func = function() { console.log("base.func"); };
}

var ProgramImpl = oop.public.class(IIProgram, {
    interface2: function() { console.log("ProgramImpl.prototype.interface2"); },
    interface3: function() { console.log("ProgramImpl.prototype.interface3"); },
    interface4: function() { console.log("ProgramImpl.prototype.interface3"); },
    static: {
        Name: "POWERUMC",
        getName: function() { return this.Name; }
    },
    prop1 : {
        get: function() { return this._name; },
        set: function(value) { this._name = value; }
    }
});

DEBUG("pimpl ---------------");
var pimpl = new ProgramImpl();
DEBUG(pimpl);
