Javascript-OOP-AOP-IoC
======================

Easily Javascript OOP Library

![travis build results](https://travis-ci.org/powerumc/Javascript-OOP-AOP-IoC.svg?branch=master)

# Install

- npm

```bash
npm install javascript-oop-aop
```

- bower

```bash
bower install javascript-oop-aop-ioc
```

1. Basic
=========

We can learn to define the classes so easily. ```oop.class(...)``` method is it.

### oop.class( [parents,] classInfo )

1. Define class.

    ```js
    var Program = oop.class({
        say: function() { return "Hello"; }
    });

    var p = new Program();
    p.say();

    // return "Hello"
    ```

2. Define properties.

	- Define basically properties.

		```js
		// Define class.
		var Program = oop.class({
			say: function() { return "Hello"; },
			name: "엄준일"
		});
	
		var p = new Program();
		console.log("My name is ", p.name);
	
		// output
		My name is 엄준일
		```
	
	- Define custom get/set property.
		```js
		var Program = oop.class({
			say: function() { return "Hello"; },
			name: "엄준일",
			age: { get: function()      { return this._age; },
				   set: function(value) { this._age = value; }
		});
	
		var p = new Program();
		p.age = 35;
		console.log("My age is ", p.age);
	
		// output
		My age is 35
		```
		

2. Inheritances
================

### oop.class( parents, classInfo )

1. **Inheritance** from parent.

	```js
	// Define parent class
	var Program = oop.class({
		version: "1.0.2",
		show: function() { 
        	console.log("openning window."); 
            /* some code.. */
        }
	});
	
	// Define class.
	var Outlook = oop.class( Program, {
		run: function() { console.log("running outlook program."); }
	});
	
    // Run code.
	var outlook = new Outlook();
	console.log("version " + outlook.version);
	outlook.run();
	outlook.show();
	
	// Output
	version 1.0.2
	running outlook program.
	openning window.
	```

2. '**self**' instance reference.

	```js
	var Program = oop.class({
		version: "1.0.2",
		show: function() { 
        	console.log("openning window.");
            /* some code.. */ }
	});
	
	var Outlook = oop.class( Program, {
		run: function(self) { // inject 'self' argument name.
        	console.log("running outlook program.");
            
            // *** HERE ***
            // a method call inhertianced Program.show method.
            self.show();
        }
	});
	
	var outlook = new Outlook();
	console.log("version " + outlook.version);
	outlook.run();
	//outlook.show();      remove this line.
	
	// Output
	version 1.0.2
	running outlook program.
	openning window.
	```

3. '**base**' parent instance reference.

    ```js
    var Program = oop.class({
        run: function() { console.log("run Program.") }
    });

    var Outlook = oop.class( Program, { // HERE inheritance Program class.
        run: function(base) { 
            console.log("run Outlook.");  

            // *** HERE ***
            // You can call parent method from base keyword.
            base.run();
        }
    });

    // Output
    // run Outlook.
    // run Program.
    ```

4. Hierarchically Inheritances.

	```js
    var Program = oop.class( { 
    	run: function() { console.log("Program.run();");  
    }});
    var ProgramBase = oop.class( Program, { 
    	run: function(base) { console.log("ProgramBase.run();"); base.run();
    }});
    var Outlook = oop.class( ProgramBase, { 
    	run: function(base) { console.log("Outlook.run();"); base.run(); 
    }});
    
    var outlook = new Outlook();
    outlook.run();
    
    // Output
    Outlook.run();
	ProgramBase.run();
	Program.run(); 
    ```


3. Injection
=============

### oop.inject( [argument], ... )

1. Inject to pass arguments.
	
	```js
     var Program = oop.class({
		version: "v1.0"
     });
     
     var Outlook = oop.class( Program, {
     	version: "v2.0",
     	run: function(base, self) { 
        	console.log("base version: "   , base.version)
        	console.log("current version: ", self.version);
        }
     });
     
     var outlook = new Outlook();
     outlook.run();
     
     // Output
     base version: v1.0
     current version: v2.0
	```

2. Inject to resolve container.


4. Interception - AOP
======================

- ### oop.interception( function, behavior )

- ### oop.interceptionBehavior( before, after, exception, finally_ )

1. Interception a class or method.

    - Interception **a method**

        ```js
        var Program = oop.class({
            run: function(msg) { console.log("run Program. ", msg); }
        });

        // *** HERE ***
        // Setup the interception a method
        var p = new Program();
        oop.interception( p.run, oop.behaviors.LoggingBehavior );

        // Call a 'run' method.
        p.run("Now running...");

        // Output
        ------ enter interception ------
        [Thu Nov 13 2014 09:29:41 GMT+0900 (KST)]  {}
        run Program.  Now running...
        ------ end interception ------
        ```

    - Interception **a class instance**.

        ```js
        var Program = oop.class({
            run: function()       { console.log("run Program.", msg); },
            terminate: function() { console.log("Terminated the Program.") }
        });

        // *** HERE ***
        // Pass class instance arguments
        var p = new Program();
        oop.interception( p, oop.behaviors.LoggingBehavior );

        // Call a 'run' method.
        p.run("Now running...");
        p.terminate();

        // Output
        ------ enter interception ------
        [Thu Nov 13 2014 09:29:41 GMT+0900 (KST)]  {}
        run Program.  Now running...
        Terminated the Program.
        ------ end interception ------
        ```

2. Interception custom **behaviors**

	- Define the custom behavior

	 	You can make the interception behaviors, call the oop.interceptionBehavior method.

	```js
    var customBehavior = oop.interceptionBehavior(
    	function() { console.log("before"); },
    	function() { console.log("after"); },
    	function() { console.log("throw exception"); },
    	function() { console.log("finally"); }
    );
    
    var Program = oop.class({
    	run: function() { console.log("run Program."); }
	});
    
    var p = new Program();
    oop.interception(p,  customBehavior);
    p.run();
    
    // Output
    before
    run Program.
    after
    finally
    ```
    
    If it throw the exception, invoke exception behavior. For examples,
    
    ```js
    var Program = oop.class({
        run: function() { 
        	console.log("run Program."); 
            throw "crashing... "; 
     }});
    
    var p = new Program();
    oop.interception(p,  customBehavior);
    p.run();
    
    // Output
    before
    run Program.
    throw exception crashing...   // HERE exception behavior.
    finally
    ```
