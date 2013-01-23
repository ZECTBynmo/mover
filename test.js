var plan = require("./testplan").plan,
	mover = require("./mover").createMover();

// Set our mover's plan using relative input paths
mover.setPlan( plan, true );

mover.move();