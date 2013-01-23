This module takes files from one place and moves (copies) them into another place.

Installation
```
npm install mover
```

To use mover, you need to setup a moving plan. This is basically just an object that maps input files to output locations. Here's there plan that I used to test everything:

```JavaScript
var plan = {
	"folder1": {
		"folder2": {
			files: [
				"LICENSE",
			],	
					
			"folder3" : {
				files: [
					"package.json",
					"mover.js"
				]
			}
		}
	}
} // end plan

exports.plan = plan;
```
This plan takes the files 'LICENSE', 'mover.js', and 'package.json' and moves them into some new folders. The plan's purpose is to create a simple way to define a folder structure and map sources to destinations.

NOTE: You can only move an input file to one output location. The plan will choose the last output location it encounters for a given input file.

Once you've constructed a plan, you can start moving files around. Here's an exapmle of typical usage
```JavaScript
var plan = require("./movingPlan").plan,
	mover = require("mover").createMover();

// Set our mover's plan using relative input paths (the second argument)
mover.setPlan( plan, true );

// Do all the moving
mover.move();
```

Try running "node test.js" inside the project directory to test things out :)