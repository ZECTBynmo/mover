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
exports.createMover = function( plan, isRelativePaths, src, dest ) { 
	return new Mover( plan, isRelativePaths, src, dest ); 
}

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
	fs = require("fs"),
	getBaseName = require("path").basename;


//////////////////////////////////////////////////////////////////////////
// Constructor
function Mover( plan, isRelativePaths, src, dest ) {
	this.plan = plan || {};
	this.dest = dest || process.cwd();
	this.src = src || process.cwd();
	this.isRelativePaths = isRelativePaths || false;	// True when our input  
														// paths are relative
} // end Mover()


//////////////////////////////////////////////////////////////////////////
// Sets a new plan for this mover
Mover.prototype.setPlan = function( plan, isRelativePaths ) {
	this.plan = plan;
	this.isRelativePaths = isRelativePaths || false;
} // end setPlan()


//////////////////////////////////////////////////////////////////////////
// Sets the location that we'll move our output files to
Mover.prototype.setDest = function( dest ) {
	this.dest = dest;
} // end setPlan()


//////////////////////////////////////////////////////////////////////////
// Sets the place we're getting out input files
Mover.prototype.setSrc = function( src ) {
	this.src = src;
} // end setPlan()


//////////////////////////////////////////////////////////////////////////
// Move all the things
Mover.prototype.move = function( callback ) {
	var outputMap = this.getOutputMap(),
		destPath = this.isRelativePaths ? process.cwd() + "/" : this.dest + "/",
		outputArray = [];

	// We need to create an array of the output files, so that we can
	// use async to iterate through it
	for( var iFile in outputMap ) {
		var input = this.src + "/" + iFile,
			output = destPath + outputMap[iFile];

		var fileMapping = {
			input : input,
			output : output
		}

		outputArray.push( fileMapping );
	}

	function fnIterator( fileMapping, callback ) {
		log( "\n" );
		log( fileMapping );
		copyFile( fileMapping.input, fileMapping.output, callback );
	}

	log( "Moving " + outputArray.length + " Files", true );

	async.forEach( outputArray, fnIterator, callback);
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
			if( thisPath[iItem] == "files" && iItem == thisPath.length - 2 ) {
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
	var readStream = fs.createReadStream( source );
	readStream.on( "error", function(err) {
		done(err);
	});

	function write() {
		var outputFilePath = target + "/" + getBaseName(source);
		
		log("Writing " + outputFilePath );

		var wr = fs.createWriteStream(outputFilePath);
		wr.on( "error", function(err) {
			done(err);
		});
		wr.on( "close", function(ex) {
			done();
		});
		readStream.pipe( wr );
	}

	function done(err) {
		if( err != undefined && err != null )
			log( err );

		if ( !cbCalled ) {
		  	cb(err);
		  	cbCalled = true;
		}
	}

	// Do try catch to make sure that the folders exist (they might easily not)
	try {
	    // Query the entry
	    var stats = fs.lstatSync( target );

	    log( "Project folder " + target + " already exists" );

	    // Is it a directory?
	    if( stats.isDirectory() ) {
	        write();
	    }
	} catch( error ) {
		log( "Creating directory: " + target );

		// Create the directory
		wrench.mkdirSyncRecursive( target, function(error) {
			if( error != null ) {
				log(error); 
			}
		});

		// We successfully created the dir, now write the file
		write();
	}
} // end copyFile