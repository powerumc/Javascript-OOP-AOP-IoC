Javascript-OOP
==============

Easily Javascript OOP Library


1. Basic
=========

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
			age: { get: function() { return this._age; },
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

2. **self** instance reference.

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

3. **base** parent instance reference.

    ```js
    var Program = oop.class({
        run: function() { console.log("run Program.") }
    });

    var Outlook = oop.class( Program, {
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


3. Interception - AOP
======================

1. Interception **a method**

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

2. Interception **a class instance**.

    ```js
    var Program = oop.class({
    	run: function() { console.log("run Program.", msg); },
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






