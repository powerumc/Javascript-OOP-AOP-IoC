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

	1. Define basically properties.

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
	
	2. Define custom get/set property.
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

1. Inheritance from parent.

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
		run: function() { console.log("running excel program."); }
	});
	
    // Execuable code.
	var outlook = new Outlook();
	console.log("version " + outlook.version);
	outlook.run();
	outlook.show();
	
	// Output
	version 1.0.2
	running excel program.
	openning window.
	```

2. self reference.

	```js
	var Program = oop.class({
		version: "1.0.2",
		show: function() { 
        	console.log("openning window."); 
            /* some code.. */ }
	});
	
	var Outlook = oop.class( Program, {
		run: function(self) { 	// inject 'self' argument name.
        	console.log("running excel program."); 
            
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
	running excel program.
	openning window.
	```

