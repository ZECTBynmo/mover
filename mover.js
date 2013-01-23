//////////////////////////////////////////////////////////////////////////
// 
//////////////////////////////////////////////////////////////////////////
//
// 
//
/* ----------------------------------------------------------------------
                                                    Object Structures
-------------------------------------------------------------------------

	
*/
//////////////////////////////////////////////////////////////////////////
// Node.js Exports
exports.createMover = function() { return new Mover(); }

//////////////////////////////////////////////////////////////////////////
// Namespace (lol)
var DEBUG = true;
var log = function( text, isImportant ) { 
	if(DEBUG && isImportant) {
		console.log("\n******************************************")
		console.log("* " + text)
		console.log("******************************************\n")
	} else if(DEBUG) {
		console.log(text); 
	}
}			

var async = require("async"),
	traverse = require("traverse"),
	wrench = require("wrench"),
	fs = require("fs");


//////////////////////////////////////////////////////////////////////////
// Constructor
function Mover( plan, isRelativePaths ) {
	this.plan = plan || {};
	this.isRelativePaths = isRelativePaths || false;
} // end Mover()


//////////////////////////////////////////////////////////////////////////
// Sets a new plan for this mover
Mover.prototype.setPlan = function( plan, isRelativePaths ) {
	this.plan = plan;
	this.isRelativePaths = isRelativePaths || false;
} // end setPlan()


//////////////////////////////////////////////////////////////////////////
// Move all the things
Mover.prototype.move = function() {
	var outputMap = this.getOutputMap(),
		strPrepend = this.isRelativePaths ? __dirname + "/" : "",
		outputArray = [];

	// We need to create an array of the output files, so that we can
	// use async to iterate through it
	for( var iFile in outputMap ) {
		var fileMapping = {
			input : strPrepend + iFile,
			output : strPrepend + outputMap[iFile]
		}

		outputArray.push( fileMapping );
	}

	function fnIterator( fileMapping, callback ) { 
		log( "Moving stuff" );
		log( fileMapping );
		copyFile( fileMapping.input, fileMapping.output, callback );
	}

	async.mapSeries( outputArray, fnIterator, function() {
		log( "All done!" );
	});
} // end move()


//////////////////////////////////////////////////////////////////////////
// Get a map of input files to output files
// map[input] = output
Mover.prototype.getOutputMap = function() {
	// Traverse the plan object and find all of the possible paths
	var paths = traverse(this.plan).paths(),
		outputMap = {};

	for( var iPath = 0; iPath < paths.length; ++iPath ) {
		var thisPath = paths[iPath],
			isValidPath = false,
			concatPath = "";

		// If this path contains the keyword "files", it must lead to
		// an input file we're trying to move
		for( var iItem = 0; iItem < thisPath.length; ++iItem ) {
			if( thisPath[iItem] == "files" ) {
				isValidPath = true;
//				concatPath += "/";
				break;
			} else {
				concatPath += thisPath[iItem] + "/";
			}
		}

		// If we just found a valid output path, push the file 
		// into our output map
		if( isValidPath ) {
			var inputFile = traverse(this.plan).get( thisPath ),
				outputPath = concatPath;

			if( typeof(inputFile) == "string" )
				outputMap[inputFile] = outputPath
		}
	} // end for each path

	return outputMap;
} // end getOutputMap()


//////////////////////////////////////////////////////////////////////////
// Copy a file
function copyFile(source, target, cb) {
	var _this = this,
		cbCalled = false;

	// Assume that our intput file exists
	var rd = fs.createReadStream( source );
	rd.on( "error", function(err) {
		done(err);
	});

	function write() {
		var wr = fs.createWriteStream(target);
		wr.on( "error", function(err) {
			done(err);
		});
		wr.on( "close", function(ex) {
			done();
		});
		rd.pipe( wr );
	}
	

	function done(err) {
		log( err );
		if ( !cbCalled ) {
		  	cb(err);
		  	cbCalled = true;
		}
	}

	// Do try catch to make sure that the folders exist (they might easily not)
	try {
	    // Query the entry
	    stats = fs.lstatSync( target );

	    log( "Project folder " + target + " already exists" );

	    // Is it a directory?
	    if( stats.isDirectory() ) {
	        write();
	    }
	} catch( error ) {
		log( "Creating directory: " + target );

		// Create the directory
		wrench.mkdirSyncRecursive( target, function(error) {
			if( error === null ) {
				write();
			} else { 
				log(error); 
			}
		});
	}
} // end copyFile