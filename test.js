var plan = require("./testplan").plan,
	mover = require("./mover").createMover();	// .createMover([plan], [isRelativePaths], [dest])

// Setup our mover
mover.setPlan( plan, false );		// Use absolute paths
mover.setSrc( process.cwd() );		// Set our source folder
mover.setDest( process.cwd() );		// Set our destination folder

mover.move( function() {
	console.log( "All moved in" );
});