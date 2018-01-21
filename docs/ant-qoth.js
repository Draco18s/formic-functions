// Many thanks to Helka Homba for these posts, which provided the idea of a web browser hosted KotH and heavily informed this code.
// Red vs. Blue - Pixel Team Battlebots: https://codegolf.stackexchange.com/q/48353/20283
// Block Building Bot Flocks: https://codegolf.stackexchange.com/q/50690/20283

/* SETUP */

$(load)

function load() {
	suppressButtonsUntilLoaded()
	confirmRefresh()
	setGlobals()
	loadPlayers()
	// Pauses the game (just like hitting the 'pause' button)
	console.pause = function() {
		console.log("PAUSE");
		$('#pause').trigger('click');
	};

	// Sets the game step delay to a new value
	console.setDelay = function(value) {
		console.log("SET DELAY");
		$('#delay').val(value);
		$('#delay').trigger('change');
	};
	
	// Pauses and waits for a number of ms
	// Similar to setDelay, only it will only happen once (each time its executed),
	// rather than setting the simulation speed permanently to the new value
	// Note: will not pause remaining execution
	console.waitFor = function(value) {
		console.log("WAIT");
		$('#pause').trigger('click');
		setTimeout(function() {
			$('#play').trigger('click');
		}, (value));
	}
}

function confirmRefresh() {
	//window.addEventListener('beforeunload', function(e) {
		//e.returnValue = ''
	//})
}

function setGlobals() {
	qid = 135102
	site = 'codegolf'
	players = []
	invalidPlayers = []
	gameStats = []
	disqualifiedInfo = []
	population = []
	maxAnts = -1;
	moveCounter = 0
	movesPerGame = $('#moves_per_game').val()
	paletteSize = 8
	numberOfLeaderboards = 6
	codeUpToDate = true
	$('#completed_moves_area').html('0 moves of ' + movesPerGame + ' completed.')
	delay = parseInt($('#delay').val(), 10)
	processingStartTime = 0
	debug = $('#debug').prop('checked')
	pauseDebug = $('#pauseDebug').prop('checked')
	doPauseAfter = $('#doPauseAfter').prop('checked')
	pauseAfterNMoves = parseInt($('#moves_before_pause').val(), 10)
	currentAntIndex = 0
	maxPlayers = parseInt($('#max_players').val(), 10)
	display = true
	displayFrameLengthTarget = 33
	noDisplayFrameLengthTarget = 1000
	frameLengthTarget = displayFrameLengthTarget
	zoomed = false
	zoomLocked = false
	continuousMoves = true
	singleAntStep = false
	gameInProgress = false
	gamesPlayed = 0
	ongoingTournament = false
	currentGameInfo = []
	zoomedAreaCentreX = 0
	zoomedAreaCentreY = 0
	zoomOnLeft = true
	timeoutID = 0
	permittedTime = parseInt($('#permitted_time_override').val(), 10)
	noMove = {cell:4, color:0, type:0, dummy_move_as_player_disqualified__See_disqualified_table:true}
	arenaWidth = 2500
	arenaHeight = 1000
	arenaArea = arenaWidth * arenaHeight
	arena = new Array(arenaArea)
	for (var i=0; i<arenaArea; i++) {
		arena[i] = {
			food: 0,
			color: 1,
			ant: null
		}
	}
	rotator = [
		[0, 1, 2, 3, 4, 5, 6, 7, 8],
		[6, 3, 0, 7, 4, 1, 8, 5, 2],
		[8, 7, 6, 5, 4, 3, 2, 1, 0],
		[2, 5, 8, 1, 4, 7, 0, 3, 6]
	]
	neighbours = [
		{x:-1, y:-1},
		{x:0, y:-1},
		{x:1, y:-1},
		{x:-1, y:0},
		{x:1, y:0},
		{x:-1, y:1},
		{x:0, y:1},
		{x:1, y:1}
	]
	paletteChoice = 0
	initialiseColorPalettes()
	initialiseSupplementaryCanvases()
	antMarkerImage = new Image();
	antMarkerImage.src = "./marker.png";
	playersThisGame = []
}

function initialiseColorPalettes() {
	var arenaColor = {}
	arenaColors = []
	
	arenaColor.tile = [
		[255, 255, 255],
		[255, 255, 0],
		[255, 0, 255],
		[0, 255, 255],
		[255, 0, 0],
		[0, 255, 0],
		[0, 0, 255],
		[0, 0, 0]
	]
	arenaColor.food = arenaColor.tile[7]
	arenaColor.ant = arenaColor.tile[7]
	arenaColors.push(arenaColor)
	
	arenaColor = {}
	arenaColor.tile = [
		[255, 255, 255],
		[240, 228, 66],
		[204, 121, 167],
		[86, 180, 233],
		[213, 94, 0],
		[0, 158, 115],
		[0, 114, 178],
		[0, 0, 0]
	]
	arenaColor.food = arenaColor.tile[7]
	arenaColor.ant = arenaColor.tile[7]
	arenaColors.push(arenaColor)
		
	arenaColor = {}
	arenaColor.tile = [
		[255, 255, 255],
		[218, 218, 218],
		[181, 181, 181],
		[144, 144, 144],
		[108, 108, 108],
		[72, 72, 72],
		[36, 36, 36],
		[0, 0, 0]
	]
	arenaColor.food = arenaColor.tile[7]
	arenaColor.ant = arenaColor.tile[7]
	arenaColors.push(arenaColor)
}

function initialiseSupplementaryCanvases() {
	var i, j
	arenaCanvas = document.createElement('canvas')
	arenaCanvas.width = arenaWidth
	arenaCanvas.height = arenaHeight
	arenaCtx = arenaCanvas.getContext('2d')
	arenaImage = arenaCtx.createImageData(arenaWidth, arenaHeight)
	for (i=0; i<arenaCanvas.width*arenaCanvas.height; i++) {
		arenaImage.data[i*4 + 3] = 255
	}
	fillArenaCanvas()
	
	zoomCanvas = document.createElement('canvas')
	zoomCanvas.width = 1000
	zoomCanvas.height = 1000
	zoomCtx = zoomCanvas.getContext('2d')
	zoomCellsPerSide = parseInt($('#squares_per_side').val(), 10)
	zoomCellSideLength = zoomCanvas.width / zoomCellsPerSide
	zoomImage = zoomCtx.createImageData(zoomCanvas.width, zoomCanvas.height)
	for (i=0; i<zoomCanvas.width*zoomCanvas.height; i++) {
		zoomImage.data[i*4 + 3] = 255
	}
	
	zoomCtx.imageSmoothingEnabled = false
	zoomCtx.msImageSmoothingEnabled = false
	zoomCtx.webkitImageSmoothingEnabled = false
	
	displayCanvas = document.getElementById('display_canvas')
	displayCanvas.width = arenaWidth / 2
	displayCanvas.height = arenaHeight / 2
	displayCtx = displayCanvas.getContext('2d')
	
	var paletteCanvas, paletteCtx, paletteImage, enlargedPaletteCanvas, enlargedPaletteCtx
	paletteCanvases = []
	paletteContexts = []
	enlargedPaletteCanvases = []
	for (i=0; i<arenaColors.length; i++) {
		paletteCanvas = document.createElement('canvas')
		paletteCanvas.width = paletteSize
		paletteCanvas.height = 1
		paletteCtx = paletteCanvas.getContext('2d')
		paletteImage = paletteCtx.createImageData(paletteCanvas.width, paletteCanvas.height)
		for (j=0; j<paletteSize; j++) {
			for (var c=0; c<3; c++) {
				paletteImage.data[j*4 + c] = arenaColors[i].tile[j][c]
			}
			paletteImage.data[j*4 + 3] = 255
		}
		paletteCtx.putImageData(paletteImage, 0, 0)
		paletteCanvases.push(paletteCanvas)
		paletteContexts.push(paletteCtx)
		enlargedPaletteCanvas = document.createElement('canvas')
		enlargedPaletteCanvas.width = 20 * paletteCanvas.width
		enlargedPaletteCanvas.height = 20 * paletteCanvas.height
		enlargedPaletteCtx = enlargedPaletteCanvas.getContext('2d')
		
		enlargedPaletteCtx.imageSmoothingEnabled = false
		enlargedPaletteCtx.msImageSmoothingEnabled = false
		enlargedPaletteCtx.webkitImageSmoothingEnabled = false
		
		enlargedPaletteCtx.drawImage(paletteCanvas, 0, 0, paletteCanvas.width, paletteCanvas.height, 0, 0, enlargedPaletteCanvas.width, enlargedPaletteCanvas.height)
		enlargedPaletteCanvases.push(enlargedPaletteCanvas)
	}
	initialisePaletteDropdown()
}

function initialisePaletteDropdown() {
	var canvas, imageSource, i, content=''
	paletteImageSources = []
	enlargedPaletteCanvases.forEach(function(canvas) {
		imageSource = canvas.toDataURL()
		paletteImageSources.push(imageSource)
	})	
	$('#selected_palette').attr('src', paletteImageSources[paletteChoice]) 
	for (i=0; i<paletteImageSources.length; i++) {
		content += '<div onclick="setNewPalette(' + i + ')"><img src=\'' + paletteImageSources[i] + '\' class=\'palette_row_image\'></img></div>'
	}
	$('#palette_dropdown_options').html(content)
}

function setNewPalette(selectedDropdownRow) {
	if (selectedDropdownRow !== paletteChoice) {
		paletteChoice = selectedDropdownRow
		$('#selected_palette').attr('src', paletteImageSources[paletteChoice])
		displayGameTable()
		displayLeaderboard()
		fillArenaCanvas()
		displayArena()
	}
}

function colorPlayers() {
	random = seededRandomInitialiser(1)
	var playerColorNumbers, canvas, context, count, color, x, y, enlargedAvatarCanvas, enlargedAvatarCtx, imageSource
	var colors = [1, 2, 3, 4, 5, 6, 7, 8]
	players.forEach(function(player) {
		player.avatars = []
		player.imageTags = []
		shuffle(colors, random)
		playerColorNumbers = colors.slice(0, 4)
		paletteCanvases.forEach(function(paletteCanvas) {
			canvas = document.createElement('canvas')
			canvas.width = 2
			canvas.height = 2
			context = canvas.getContext('2d')
			count = 0
			for (y=0; y<2; y++) {
				for (x=0; x<2; x++) {
					color = playerColorNumbers[count]
					context.drawImage(paletteCanvas, color-1, 0, 1, 1, x, y, 1, 1)
					count++
				}
			}
			player.avatars.push(canvas)
			enlargedAvatarCanvas = document.createElement('canvas')
			enlargedAvatarCanvas.width = 20
			enlargedAvatarCanvas.height = 20
			enlargedAvatarCtx = enlargedAvatarCanvas.getContext('2d')
			
			enlargedAvatarCtx.imageSmoothingEnabled = false
			enlargedAvatarCtx.msImageSmoothingEnabled = false
			enlargedAvatarCtx.webkitImageSmoothingEnabled = false

			enlargedAvatarCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, enlargedAvatarCanvas.width, enlargedAvatarCanvas.height)			
			imageSource = enlargedAvatarCanvas.toDataURL()
			player.imageTags.push('<img src=\'' + imageSource + '\' class=\'tableImage\'></img>')
		})
	})
}

/* HELPERS */

function antFunctionMaker(player) {
	try {
		antFunction = new Function('with(this) { ' + player.code + '\n}')
	}
	catch (e) {
		antFunction = null
		invalidPlayers.push({player:player, errorMessage:e})
	}
	return antFunction
}

function maskedEval(antFunction, params) {	//thanks http://stackoverflow.com/a/543820 (with the warning not to use this with untrusted code)
	var mask = {}
	for (var i in this) {
		mask[i] = undefined
	}
	for (var i in params) {
		if (params.hasOwnProperty(i))
		mask[i] = params[i]
	}
	return antFunction.call(mask)
}

function decode(html) {
	return $('<textarea>').html(html).text()
}

cryptoRandom = (function() {
	var a = new Uint32Array(16384)
	var i = 0
	var crypto = window.crypto || window.msCrypto
	crypto.getRandomValues(a)
	return function(n) {
		i = (i + 1) % a.length
		if (i === 0) {
			crypto.getRandomValues(a)
		}
		return a[i] % n
	}
})()

seededRandomInitialiser = function(seed) {		// thanks https://en.wikipedia.org/wiki/Xorshift
	var stateArray = new Uint32Array(1)
	stateArray[0] = seed
	return function(n) {
		stateArray[0] ^= stateArray[0] << 13
		stateArray[0] ^= stateArray[0] >> 17
		stateArray[0] ^= stateArray[0] << 5
		return stateArray[0] % n
	}
}

function shuffle(array, randomToUse) {
	for (var i=0; i<array.length-1; i++) {  // No need to consider last element of array as it would only ever be swapped with itself.
		var target = randomToUse(array.length - i) + i
		var temp = array[i]
		array[i] = array[target]
		array[target] = temp
	}
}

Number.isInteger = Number.isInteger || function(value) {
	return typeof value === 'number' && 
	isFinite(value) && 
	Math.floor(value) === value
}

function dumpLeaderboardHtmlToConsole() {
	var content = ''
	for (var i=0; i<numberOfLeaderboards+1; i++) {
		content += '<table><thead><tr><th>Position<th>Player<th>Score<th>Games<th>Score per game</thead><tbody>'
		players.forEach(function(player) {
			if (player.included) {
				content += '<tr><td>' + player.position + '<sup>' + ordinalIndicator(player.position) + '</sup>'
				var lower = Math.min(minPossiblePosition(player, 0), minPossiblePosition(player, 1))
				var upper = Math.max(maxPossiblePosition(player, 0), maxPossiblePosition(player, 1))
				content += ' (' + lower + '-' + upper + ')'
				
				if (player.id === 0) {
					content += '<td>' + player.title
				} else {
					content += '<td><a href="' + player.link + '" target="_blank">' + player.title + '</a>'
				}
				content += '<td>' + player.score[i] + '<td>' + player.games[i] + '<td>' + player.scorePerGame[i].toFixed(2)
			}
		})
		content += '</tbody></table>'
	}
	console.log(content)
}

ordinalIndicator = (function() {
	var t
	var standard = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th']
	var eighty = []
	for (t=0; t<8; t++) {
		eighty = eighty.concat(standard)
	}
	var teens = ['th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th']
	var indicators = standard.concat(teens, eighty)
	return function(n) {
		return indicators[n%100]
	}
})()

/* INTERFACE */

function suppressButtonsUntilLoaded() {
	$('#run_single_game').prop('disabled', true)
	$('#run_ongoing_tournament').prop('disabled', true)
}

function initialiseInterface() {
	$('document').keypress(function(event) {
		if ((String.fromCharCode(event.which)).toUpperCase() == 'S') {
			if (display) {
				step()
			}
		} else if ((String.fromCharCode(event.which)).toUpperCase() == 'A') {
			if (display) {
				stepAnt()
			}
		}
	})
	$('#run_single_game').prop('disabled', false)
	$('#run_single_game').click(function() {
		ongoingTournament = false
		$('#run_single_game').html('<h2>Running single game</h2>')
		$('#run_single_game').prop('disabled', true)
		$('#run_ongoing_tournament').html('<h2>Run ongoing tournament</h2>')
		$('#run_ongoing_tournament').prop('disabled', false)
		$('#no_display').prop('disabled', false)
		if (continuousMoves) {
			$('#play').prop('disabled', true)
			$('#pause').prop('disabled', false)
		} else {
			$('#play').prop('disabled', false)
			$('#pause').prop('disabled', true)
		}
		$('#step').prop('disabled', false)
		$('#step_ant').prop('disabled', false)
		$('#abandon_game').prop('disabled', false)
		if (!gameInProgress) {
			startNewGame()
		}		
	})
	$('#run_ongoing_tournament').prop('disabled', false)
	$('#run_ongoing_tournament').click(function() {
		ongoingTournament = true
		$('#run_single_game').html('<h2>Run single game</h2>')
		$('#run_single_game').prop('disabled', false)
		$('#run_ongoing_tournament').html('<h2>Running ongoing tournament</h2>')
		$('#run_ongoing_tournament').prop('disabled', true)
		$('#no_display').prop('disabled', false)
		if (continuousMoves) {
			$('#play').prop('disabled', true)
			$('#pause').prop('disabled', false)
		} else {
			$('#play').prop('disabled', false)
			$('#pause').prop('disabled', true)
		}
		$('#step').prop('disabled', false)
		$('#step_ant').prop('disabled', false)
		$('#abandon_game').prop('disabled', false)
		if (!gameInProgress) {
			startNewGame()
		}
	})
	$('#check_all').change(function() {
		players.forEach(function(player) {
			var checkboxID = 'included_' + player.id
			if (player.id != 0 || (player.code != "")) {
				$('#'+checkboxID).prop('checked',$('#check_all').prop('checked'))
				player.included = $('#check_all').prop('checked')
			}
		})
		updateLeaderboardPositions()
		displayLeaderboard()
	})
	$('#no_display').prop('disabled', true)
	$('#no_display').click(function() {
		$('.hide_when_no_display').hide(300)
		$('.show_when_no_display').show(300)
		display = false
		continuousMoves = true
		frameLengthTarget = noDisplayFrameLengthTarget
	})
	$('#delay').val(delay)
	$('#delay').change(function() {
		delay = parseInt($('#delay').val(), 10)
	})
	$('#play').prop('disabled', true)
	$('#play').click(function() {
		continuousMoves = true
		$('#play').prop('disabled', true)
		$('#pause').prop('disabled', false)
		clearTimeout(timeoutID)
		processAnts()			
	})
	$('#pause').prop('disabled', true)
	$('#pause').click(function() {
		continuousMoves = false
		$('#play').prop('disabled', false)
		$('#pause').prop('disabled', true)
		clearTimeout(timeoutID)			
	})
	$('#step').prop('disabled', true)
	$('#step').click(function() {
		step()
	})
	$('#step_ant').prop('disabled', true)
	$('#step_ant').click(function() {
		stepAnt()
	})
	$('#squares_per_side').change(function() {
		zoomCellsPerSide = parseInt($('#squares_per_side').val(), 10)
		zoomCellSideLength = zoomCanvas.width / zoomCellsPerSide
		if (zoomed) {
			fillZoomCanvas()
			displayZoomedArea()
		}
	})
	$('#fit_canvas').click(function() {
		displayCanvas.style.borderLeft = 'none'
		displayCanvas.style.borderRight = 'none'
		displayCanvas.width = document.body.clientWidth
		displayCanvas.height = displayCanvas.width * 500/1250
		$('#new_challenger_text').width(Math.min(1250, displayCanvas.width - 20))
		displayArena()
	})
	$('#display_canvas').mousemove(function(event) {
		if (!zoomLocked) {
			zoomed = true
			zoomedAreaCentreX = Math.floor(event.offsetX * arenaWidth / displayCanvas.width)
			zoomedAreaCentreY = Math.floor(event.offsetY * arenaHeight / displayCanvas.height)
			if (zoomedAreaCentreX < (arenaWidth + 2*arenaHeight) / 4) {
				zoomOnLeft = false
			} else if (zoomedAreaCentreX > (3*arenaWidth - 2*arenaHeight) / 4) {
				zoomOnLeft = true
			}
			fillZoomCanvas()
			displayArena()
		}
		else {
			var ratio = arenaWidth/displayCanvas.width;
			var cellSize = (zoomCanvas.width / zoomCellsPerSide) / ratio;
			if (event.pageX == null && event.clientX != null) {
				eventDoc = (event.target && event.target.ownerDocument) || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = event.clientX +
				  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
				  (doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = event.clientY +
				  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
				  (doc && doc.clientTop  || body && body.clientTop  || 0 );
			}
			var offset = zoomCellsPerSide / 2;
			var Lll = (zoomedAreaCentreX - offset + arenaWidth) % arenaWidth;
			var Ttt = (zoomedAreaCentreY - offset + arenaHeight) % arenaHeight;
			offset = zoomCellsPerSide * cellSize;
			if(zoomOnLeft) {
				offset = 0;
			}
			else {
				offset = (arenaWidth/ratio) - offset;
			}
			var posX = (event.offsetX - offset);
			var posY = Math.floor((event.offsetY / cellSize) + Ttt);
			if(posX >= 0 && posX <= 500) {
				posX = Math.floor((posX / cellSize) + Lll);
				var cell = arena[posX + posY*arenaWidth];
				var tool = $("#tooltip");
				if(cell !=  null && cell.ant != null) {
					tool.css("display","block");
					tool.css("left",event.pageX+8);
					tool.css("top",event.pageY+8);
					tool.html(cell.ant.player.title +"<br>Type: " + cell.ant.type + " Food: " + cell.ant.food);
				}
				else {
					tool.css("display","none");
				}
			}
			else {
				tool.css("display","none");
			}
		}
	})
	$('#display_canvas').mouseleave(function() {
		if (!zoomLocked) {
			zoomed = false
			displayArena()
		}
	})
	$('#display_canvas').click(function() {
		zoomLocked = !zoomLocked
	})
	$('.show_when_no_display').hide()
	$('#restore_display').click(function() {
		$('.show_when_no_display').hide(300)
		$('.hide_when_no_display').show(300)
		display = true
		frameLengthTarget = displayFrameLengthTarget
	})
	$('#abandon_game').prop('disabled', true)
	$('#abandon_game').click(checkThenAbandonGame)
	$('#reset_leaderboard').prop('disabled', true)
	$('#reset_leaderboard').click(checkThenResetLeaderboard)
	$('#current_game_table').hide()
	$('#disqualified_table').hide()
	$('#max_players').val(maxPlayers)
	$('#max_players').change(function() {
		maxPlayers = parseInt($('#max_players').val(), 10)
	})
	$('#permitted_time_override').change(function() {
		permittedTime = parseInt($('#permitted_time_override').val(), 10)
	})
	$('#max_ants_override').change(function() {
		maxAnts = parseInt($('#max_ants_override').val(), 10)
		if(maxAnts < 5) {
			maxAnts = -1
			$('#max_ants_override').val(maxAnts)
		}
		if(maxAnts > 200) {
			maxAnts = 200
			$('#max_ants_override').val(maxAnts)
		}
	})
	$('#debug').change(function() {
		debug = $('#debug').prop('checked')
	})
	$('#pauseDebug').change(function() {
		pauseDebug = $('#pauseDebug').prop('checked')
	})
	$('#doPauseAfter').change(function() {
		doPauseAfter = $('#doPauseAfter').prop('checked')
	})
	$('#moves_before_pause').change(function() {
		pauseAfterNMoves = parseInt($('#moves_before_pause').val(), 10)
	})
	$('#seeded_random').prop('checked', false)
	$('#seeded_random').change(function() {
		$('#seed').prop('disabled', !$('#seeded_random').prop('checked'))
	})
	$('#seed').prop('disabled', true)
	$('#code_up_to_date').click(function() {
		players.forEach(function(player) {
			if (player.id === 0) {
				player.code = $('#new_challenger_text').val()
				player.antFunction = antFunctionMaker(player)
			}
		})
		$('#code_up_to_date').html('Code up to date')
		$('#code_up_to_date').prop('disabled', true)
		codeUpToDate = true
	})
	$('#new_challenger_text').change(function() {
		if (codeUpToDate) {
			codeUpToDate = false
			$('#code_up_to_date').html('<h2>Code changed - click to use this new version</h2>')
			$('#code_up_to_date').prop('disabled', false)
		}
	})
	$('#pass_debug_value').click(function() {
		players.forEach(function(player) {
			if (player.id === 0) {
				var testCode = $('#new_challenger_debug').val();
				var retPat = /(return){0,1}[ ]*\[(.*)/;
				if(!retPat.test(testCode)) {
					testCode = testCode.replace(/return[ ]*/, "");
					testCode = "[" + testCode;
				}
				retPat = /(.*)\]$/;
				if(!retPat.test(testCode)) {
					testCode = testCode + "]";
				}
				retPat = /return[ ]*/;
				if(!retPat.test(testCode)) {
					testCode = "return " + testCode;
				}
				retPat = /,{/g;
				if(retPat.test(testCode)) {
					testCode = testCode.replace(retPat, ",\n{");
				}
				retPat = /\[{/g;
				if(retPat.test(testCode)) {
					testCode = testCode.replace(retPat, "[\n{");
				}
				$('#new_challenger_debug').val(testCode);
				
				var testInput = new Function('with(this) { ' + testCode + '\n}'); //antFunctionMaker(testCode);
				var response;
				try {
					var parsedInput = maskedEval(testInput);
					var parameters = {}
					parameters.view = parsedInput
					if (player.id === 0) {
						parameters.console = console
					}
					//$('#response').val(JSON.stringify(parsedInput));
					response = maskedEval(player.antFunction, parameters);
				} catch(e) {
					response = e;
				}
				$('#response').val(JSON.stringify(response));
			}
		})
	})
}

function showLoadedTime() {
	$('#loaded_at').html('<i>Players loaded from contest post</i> ' + (new Date()).toString())
}

function displayGameTable() {
	var content = ''
	gameStats.forEach(function(row) {
		if (row.player.disqualified) {
			content += '<tr class="greyed_row"><td><a href="#disqualified_table">DISQUALIFIED: </a>' + row.title
		} else if (row.player.id === 0) {
			content += '<tr><td><a href="' + row.link + '">' + row.title + '</a>'
		} else {
			content += '<tr><td><a href="' + row.link + '" target="_blank">' + row.title + '</a>'
		}
		content += '<td>' + row.player.imageTags[paletteChoice] +
			'<td>' + row.food +
			'<td>' + row.type1 +
			'<td>' + row.type2 +
			'<td>' + row.type3 +
			'<td>' + row.type4
	})
	$('#current_game_body').html(content)
}

function initialiseLeaderboard() {
	gamesPlayed = 0
	$('#game_counter').html('0 games played.')
	players.forEach(function(player) {
		player.position = 1
		player.score = []
		player.games = []
		player.scorePerGame = []
		for (var t=0; t<numberOfLeaderboards+1; t++) {
			player.score.push(0)
			player.games.push(0)
			player.scorePerGame.push(0)
		}
	})
	displayLeaderboard()
}

function displayLeaderboard() {
	var	content = ''
	players.forEach(function(player) {
		var checkboxID = 'included_' + player.id
		var markerboxID = 'showmarker_' + player.id
		if (player.disqualified) {
			content += '<tr class="greyed_row"><td><a href="#disqualified_table">DISQUALIFIED</a>'
		} else if (player.included) {
			content += '<tr><td>' + player.position + '<sup>' + ordinalIndicator(player.position) + '</sup>'
			var lower = Math.min(minPossiblePosition(player, 0), minPossiblePosition(player, 1))
			var upper = Math.max(maxPossiblePosition(player, 0), maxPossiblePosition(player, 1))
			content += ' (' + lower + '-' + upper + ')'
		} else {
			content += '<tr><td>-'
		}
		if (player.id === 0) {
			content += '<td><a href="' + player.link + '">' + player.title + '</a>'
		} else {
			content += '<td><a href="' + player.link + '" target="_blank">' + player.title + '</a>'
		}
		content += '<td>' + player.imageTags[paletteChoice] +
			'<td>' + player.score[numberOfLeaderboards] +
			'<td>' + player.games[numberOfLeaderboards] +
			'<td>' + player.scorePerGame[numberOfLeaderboards].toFixed(2) +
			'<td><input id=' + checkboxID + ' type=checkbox>' +
			'<td><input id=' + markerboxID + ' type=checkbox' + (player.showmark?' checked>':'>')
	})
	$('#leaderboard_body').html(content)
	players.forEach(function(player) {
		var checkboxID = '#included_' + player.id
		var markerboxID = '#showmarker_' + player.id
		$(checkboxID).prop('checked', player.included)
		$(checkboxID).prop('disabled', player.disqualified)
		$(checkboxID).change(function() {
			player.included = $(checkboxID).prop('checked')
			updateLeaderboardPositions()
			displayLeaderboard()
		})
		$(markerboxID).change(function() {
			player.showmark = $(markerboxID).prop('checked')
		})
	})
}

function disqualify(player, reason, input, response) {
	console.log(reason)
	console.log('\tDISQUALIFIED: ' + player.title)
	var row = {
		player: player,
		reason: reason,
		input: input,
		response: response
	}	
	disqualifiedInfo.push(row)
	displayDisqualifiedTable()
	player.disqualified = true
	player.included = false
	sortGameStats()
	updateLeaderboardPositions()
	displayGameTable()
	displayLeaderboard()
	if(pauseDebug) {
		if(!display) {
			$('.show_when_no_display').hide(300)
			$('.hide_when_no_display').show(300)
			display = true
			batchSize = 1
		}
		continuousMoves = false
		$('#play').prop('disabled', false)
		$('#pause').prop('disabled', true)
		clearTimeout(timeoutID)
	}
}

function removeFromDisqualifiedTable(player) {
	var i, index
	for (i=0; i<disqualifiedInfo.length; i++) {
		if (disqualifiedInfo[i].player === player) {
			index = i
			break
		}
	}
	disqualifiedInfo.splice(index, 1)
	if (disqualifiedInfo.length === 0) {
		$('#disqualified_table').hide()
	} else {
		displayDisqualifiedTable()
	}
	player.disqualified = false
	player.included = true
	if (player.id === 0) {
		player.antFunction = antFunctionMaker(player)
	}
	sortGameStats()
	updateLeaderboardPositions()
	displayGameTable()
	displayLeaderboard()
}

function displayDisqualifiedTable() {
	var content, buttonID
	$('#disqualified_table').show()
	content = ''
	disqualifiedInfo.forEach(function(row) {
		buttonID = 'restore_' + row.player.id
		content += '<tr><td><button id="' + buttonID + '">Restore</button>' +
			'<td><a href="' + row.player.link + '" target="_blank">' + row.player.title + '</a>' +
			'<td>' + row.player.imageTags[paletteChoice] +
			'<td>' + row.reason +
			'<td>' + JSON.stringify(row.input) +
			'<td>' + JSON.stringify(row.response)
	})
	$('#disqualified_body').html(content)
	disqualifiedInfo.forEach(function(row) {
		buttonID = '#restore_' + row.player.id
		$(buttonID).click(function() {
			removeFromDisqualifiedTable(row.player)
		})
	})
}

function fillArenaCanvas() {
	var x, y
	for (y=0; y<arenaHeight; y++) {
		for (x=0; x<arenaWidth; x++) {
			updateArenaCanvasCell(x, y)
		}
	}
	putImageToArenaCanvas()
}

function updateArenaCanvasCell(x, y) {
	var cell, i
	cell = arena[x + y*arenaWidth]
	if (cell.food) {
		for (i=0; i<3; i++) {
			arenaImage.data[(x + y*arenaWidth) * 4 + i] = arenaColors[paletteChoice].food[i]
		}
	} else if (cell.ant) {
		for (i=0; i<3; i++) {
			arenaImage.data[(x + y*arenaWidth) * 4 + i] = arenaColors[paletteChoice].ant[i]
		}			
	} else {
		for (i=0; i<3; i++) {
			arenaImage.data[(x + y*arenaWidth) * 4 + i] = arenaColors[paletteChoice].tile[cell.color-1][i]
		}			
	}
}

function putImageToArenaCanvas() {
	arenaCtx.putImageData(arenaImage, 0, 0)
}

function fillZoomCanvas() {
	var offset = Math.floor(zoomCellsPerSide / 2)
	var left = (zoomedAreaCentreX - offset + arenaWidth) % arenaWidth
	var top = (zoomedAreaCentreY - offset + arenaHeight) % arenaHeight
	for (var y=0; y<zoomCellsPerSide; y++) {
		var wrappedY = (y + top) % arenaHeight
		for (var x=0; x<zoomCellsPerSide; x++) {
			var wrappedX = (x + left) % arenaWidth
			var cell = arena[wrappedX + wrappedY*arenaWidth]
			paintTile(x, y, cell.color)
			if (cell.food || (cell.ant && cell.ant.type < 5 && cell.ant.food)) {
				paintFood(x, y)
			}
			if (cell.ant) {
				paintAnt(x, y, cell.ant)
			}
		}
	}
}

function paintTile(x, y, color) {
	zoomCtx.drawImage(paletteCanvases[paletteChoice], color-1, 0, 1, 1, x * zoomCellSideLength, y * zoomCellSideLength, zoomCellSideLength, zoomCellSideLength) 
}

function paintFood(x, y) {
	//draw white outline
	zoomCtx.fillStyle = 'rgb(255, 255, 255)'
	zoomCtx.beginPath()
	zoomCtx.moveTo((x+1) * zoomCellSideLength+1.5,                      y * zoomCellSideLength + zoomCellSideLength/2)
	zoomCtx.lineTo(x     * zoomCellSideLength + zoomCellSideLength/2, y * zoomCellSideLength-1.5)
	zoomCtx.lineTo(x     * zoomCellSideLength-1.5,                      y * zoomCellSideLength + zoomCellSideLength/2)
	zoomCtx.lineTo(x     * zoomCellSideLength + zoomCellSideLength/2, (y+1) * zoomCellSideLength+1.5)
	zoomCtx.fill()
	
	zoomCtx.fillStyle = 'rgb(0, 0, 0)'
	zoomCtx.beginPath()
	zoomCtx.moveTo((x+1) * zoomCellSideLength, y * zoomCellSideLength + zoomCellSideLength/2)
	zoomCtx.lineTo(x * zoomCellSideLength + zoomCellSideLength/2, y * zoomCellSideLength)
	zoomCtx.lineTo(x * zoomCellSideLength, y * zoomCellSideLength + zoomCellSideLength/2)
	zoomCtx.lineTo(x * zoomCellSideLength + zoomCellSideLength/2, (y+1) * zoomCellSideLength)
	zoomCtx.fill()
}

function paintAnt(x, y, ant) {
	if (ant.type === 5) {
		var size = zoomCellSideLength * .3
	} else {
		var size = zoomCellSideLength * .2
	}
	var player = ant.player
	zoomCtx.drawImage(player.avatars[paletteChoice], 0, 0, 2, 2, (x+0.5)*zoomCellSideLength - size, (y+0.5)*zoomCellSideLength - size, size*2, size*2)
	
	zoomCtx.fillStyle = "rgba(120,120,255,1)";
	switch(ant.type) {
		case 5:
			zoomCtx.fillStyle = "rgba(255,180,0,1)";
			break;
	}
	size = zoomCellSideLength * .3;
	x = (x+0.5)*zoomCellSideLength - size;
	y = (y+0.5)*zoomCellSideLength + 6;
	var w = size/2*Math.min(ant.type,4);
	zoomCtx.fillRect(x, y, w, 6);
}

function displayArena() {	
	putImageToArenaCanvas()
	displayCtx.drawImage(arenaCanvas, 0, 0, arenaWidth, arenaHeight, 0, 0, displayCanvas.width, displayCanvas.height)
	var ratio = arenaWidth/displayCanvas.width;
	population.forEach(function(ant) {
		if(ant.player.showmark) {
			
			displayCtx.drawImage(antMarkerImage,Math.round(ant.x/ratio),Math.round(ant.y/ratio-16))
			var x = Math.round(ant.x/ratio+ 9)
			var y = Math.round(ant.y/ratio-13)
			for(var xx=x; xx<=x+2;xx+=2) { 
				for(var yy=y; yy<=y+2;yy+=2) { 
					for(var xo=0; xo <= 1; xo++) {
						for(var yo=0; yo <= 1; yo++) {
							displayCtx.drawImage(ant.player.avatars[paletteChoice], (xx-x)/ratio, (yy-y)/ratio, 1, 1, xx+xo, yy+yo, 1, 1)
						}
					}
				}
			}
			y-=4
			displayCtx.fillStyle = "rgba(120,120,255,1)";
			switch(ant.type) {
				case 5:
					displayCtx.fillStyle = "rgba(255,180,0,1)";
					break;
			}
			displayCtx.fillRect(x, y, ant.type, 2);
			displayCtx.fillStyle = "rgba(255,255,255,1)";
			if(ant.type != 5 && ant.food > 0) {
				displayCtx.fillRect(x-1, y+13, 4, 2);
				displayCtx.fillRect(x,   y+12, 2, 4);
				displayCtx.fillStyle = "rgba(0,0,0,1)";
				displayCtx.fillRect(x, y+13, 2, 2);
			}
		}
	})
	if (zoomed) {
		displayZoomedArea()
	}
}

function displayZoomedArea() {
	fillZoomCanvas()
	if (zoomOnLeft) {
		displayCtx.drawImage(zoomCanvas, 0, 0, zoomCanvas.width, zoomCanvas.height, 0, 0, displayCanvas.height, displayCanvas.height)
	} else {
		displayCtx.drawImage(zoomCanvas, 0, 0, zoomCanvas.width, zoomCanvas.height, displayCanvas.width - displayCanvas.height, 0, displayCanvas.height, displayCanvas.height)		
	}
}

/* GAMEPLAY */

function startNewGame() {
	movesPerGame = $('#moves_per_game').val()
	pauseDebug = $('#pauseDebug').prop('checked')
	doPauseAfter = $('#doPauseAfter').prop('checked')
	pauseAfterNMoves = parseInt($('#moves_before_pause').val(), 10)
	gameInProgress = true
	$('#current_game_table').show()
	seededRandom = $('#seeded_random').prop('checked')
	if (seededRandom) {
		random = seededRandomInitialiser(parseInt($('#seed').val(), 10))
	} else {
		random = cryptoRandom
	}
	moveCounter = 0
	for (var i=0; i<arenaWidth; i++) {
		arena[i].food = 1
		arena[i].color = 1
		arena[i].ant = null
	}
	for (var i=arenaWidth; i<arenaArea; i++) {
		arena[i].food = 0
		arena[i].color = 1
		arena[i].ant = null
	}
	shuffle(arena, random)
	var includedPlayers = []
	players.forEach(function(player) {
		if (player.included) {
			includedPlayers.push(player)
		}
	})
	includedPlayers.sort(function(a, b) {  // If players are not sorted, the random order will not be the same when using seeded random.
		if (a.id < b.id) {
			return 1
		} else {
			return -1
		}
	})
	shuffle(includedPlayers, random)
	var numberOfPlayers = Math.min(includedPlayers.length, maxPlayers)
	playersThisGame = includedPlayers.slice(0, numberOfPlayers)
	gameStats = []
	population = []
	playersThisGame.forEach(function(player) {
		player.elapsedTime = 0
		player.permittedTime = 0
		if (seededRandom) {
			player.random = seededRandomInitialiser(random(4294967296))  // Gives a seed from the full range of UInt32.
		} else {
			player.random = cryptoRandom
		}
		while (true) {
			var x = random(arenaWidth)
			var y = random(arenaHeight)
			if (arena[x + y*arenaWidth].ant === null && arena[x + y*arenaWidth].food === 0) {
				var ant = {
					player: player,
					type: 5,
					food: 0,
					x: x,
					y: y
				}
				arena[x + y*arenaWidth].ant = ant
				population.push(ant)
				break
			}
		}
		var row = {
			player: player,
			id: player.id,
			title: player.title,
			link: player.link,
			type1: 0,
			type2: 0,
			type3: 0,
			type4: 0,
			food: 0
		}
		gameStats.push(row)
	})
	currentAntIndex = 0
	displayGameTable()
	$('#completed_moves_area').html('0 moves of ' + movesPerGame + ' completed.')
	fillArenaCanvas()
	clearTimeout(timeoutID)
	processingStartTime = performance.now()
	timeoutID = setTimeout(prepareForNextBatch, 0)
}

function checkThenResetLeaderboard() {
	//if (window.confirm('Confirm that you want to lose all the data in the leaderboard.')) {
		$('#reset_leaderboard').prop('disabled', true)
		initialiseLeaderboard()
		deleteAllCookies()
	//}
}
	
function checkThenAbandonGame() {
	//if (window.confirm('Confirm that you want to abandon this game.')) {
		abandonGame()
	//}
}

function abandonGame() {
	gameInProgress = false
	clearTimeout(timeoutID)
	if (ongoingTournament) {
		startNewGame()
	} else {
		$('#run_single_game').html('<h2>Run single game</h2>')
		$('#run_single_game').prop('disabled', false)
		$('#no_display').prop('disabled', true)
		$('#play').prop('disabled', true)
		$('#pause').prop('disabled', true)
		$('#step').prop('disabled', true)
		$('#step_ant').prop('disabled', true)
		$('#abandon_game').prop('disabled', true)
	}
}

function processAnts() {
	processingStartTime = performance.now()
	var antMovesSoFar = 0
	var antJustMoved
	while (true) {
		processCurrentAnt()
		antMovesSoFar++
		antJustMoved = currentAntIndex
		currentAntIndex = (currentAntIndex + 1) % population.length
		if (currentAntIndex === 0) {
			moveCounter++
			if (moveCounter >= movesPerGame) {
				break
			}
			if (delay > 0 && display && continuousMoves) {
				break
			}
		}
		timeSoFar = performance.now() - processingStartTime
		averageMoveTime = timeSoFar / antMovesSoFar
		timeRemaining = frameLengthTarget - timeSoFar
		if (timeRemaining < averageMoveTime && continuousMoves || (doPauseAfter && moveCounter == pauseAfterNMoves)) {
			break
		}
		if (!continuousMoves) {
			if (singleAntStep) {
				if (!zoomed || !atLeastOneVisibleAnt() || visible(population[antJustMoved])) {
					break
				}
			} else {
				if (currentAntIndex === 0) {
					break
				}
			}			
		}
	}
	if (moveCounter === 1) {
		$('#completed_moves_area').html('1 move of ' + movesPerGame + ' completed.')
	} else {
		$('#completed_moves_area').html(moveCounter + ' moves of ' + movesPerGame + ' completed.')
	}
	if(doPauseAfter && moveCounter == pauseAfterNMoves) {
		if(!display) {
			$('.show_when_no_display').hide(0)
			$('.hide_when_no_display').show(0)
			display = true
			batchSize = 1
		}
		continuousMoves = false
		$('#play').prop('disabled', false)
		$('#pause').prop('disabled', true)
		clearTimeout(timeoutID)	
	}
	if (moveCounter >= movesPerGame) {
		gameOver()
	} else {
		prepareForNextBatch()
	}
}

function prepareForNextBatch() {	
	if (display) {
		if (continuousMoves) {
			if (currentAntIndex === 0) {
				var adjustment = performance.now() - processingStartTime
				var adjustedDelay = Math.max(delay - adjustment, 0)
				timeoutID = setTimeout(processAnts, adjustedDelay)
				displayArena()
			} else {
				timeoutID = setTimeout(processAnts, 0)
				displayArena()
			}
		} else {
			displayArena()
		}
	} else {
		timeoutID = setTimeout(processAnts, 0)
	}
}

function processCurrentAnt() {
	var currentAnt = population[currentAntIndex]
	if (!currentAnt.player.disqualified) {
		var unrotatedView = nineVisibleSquares(currentAnt)	
		var rotation = currentAnt.player.random(4)  // Separate random per player so that changes in one player leave others with same behaviour up until contact. Makes seeded random more useful for debugging a player.
		var rotatedView = []
		for (i=0; i<9; i++) {
			rotatedView.push(unrotatedView[rotator[rotation][i]])
		}
		var response = getMove(currentAnt, rotatedView)
		if (debug && currentAnt.player.id === 0) {
			displayMoveInfo(currentAnt, rotatedView, response)
		}
		var targetCell = rotator[rotation][response.cell]
		var x = (currentAnt.x + targetCell%3 - 1 + arenaWidth) % arenaWidth
		var y = (currentAnt.y + Math.floor(targetCell/3) - 1 + arenaHeight) % arenaHeight
		if (response.color) {
			setColor(x, y, response.color)
		} else if (response.type) {
			var totalAntsOwned = 0;
			gameStats.forEach(function(row) {
				if (row.id === currentAnt.player.id) {
					totalAntsOwned = row['type1']+row['type2']+row['type3']+row['type4']
				}
			})
			if(maxAnts < 0 || totalAntsOwned < maxAnts) {
				makeWorker(x, y, response.type, currentAnt, rotatedView, response)
			}
			else {
				teleportWorker(x, y, response.type, currentAnt, rotatedView, response)
			}
		} else if (response.cell !== 4) {
			moveAnt(x, y, currentAnt, rotatedView, response)
		}
		passFood(currentAnt)
	}
}

function displayMoveInfo(ant, rotatedView, response) {
	var identity, carrying
	identity = ['', 'Worker type 1', 'Worker type 2', 'Worker type 3', 'Worker type 4', 'Queen'][ant.type]
	if (ant.type === 5) {
		carrying = ''
	} else {
		if (ant.food) {
			carrying = 'Laden '
		} else {
			carrying = 'Unladen '
		}
	}
	console.log(carrying + identity + ': location (' + ant.x + ', ' + ant.y + '):')
	console.log('Received: ' + JSON.stringify(rotatedView))
	console.log('Response: ' + JSON.stringify(response))
}

function setColor(x, y, color) {
	arena[x + y*arenaWidth].color = color
	updateArenaCanvasCell(x, y)
}

function teleportWorker(x, y, type, parent, input, response) {
	if (parent.type < 5) {
		disqualify(parent.player, 'A worker cannot create a new worker.', input, response)
		return
	}
	if (!parent.food) {
		disqualify(parent.player, 'Cannot create a new worker without food.', input, response)
		return
	}
	var birthCell = arena[x + y*arenaWidth]
	if (birthCell.food) {
		disqualify(parent.player, 'Cannot create new worker on top of food.', input, response)
		return
	}
	if (birthCell.ant) {
		if (parent.x === x && parent.y === y) {
			disqualify(parent.player, 'Cannot create new worker on own cell.', input, response)
			return
		} else {
			disqualify(parent.player, 'Cannot create new worker on top of another ant.', input, response)
			return
		}
	}
	var newAnt = null;
	for(var a = 0; a < currentAntIndex; a++) {
		var currentAnt = population[a]
		if(currentAnt.type == type && currentAnt.player == parent.player) {
			var distFromQueen = distance(currentAnt.x, currentAnt.y, parent.x, parent.y)
			if(distFromQueen > 10) {
				population.splice(a, 1)
				newAnt = currentAnt;
				break;
			}
		}
	}
	if(newAnt != null) {
		var deathCell = arena[newAnt.x + newAnt.y*arenaWidth]
		deathCell.ant = null
		updateArenaCanvasCell(newAnt.x, newAnt.y)
		newAnt.x = x
		newAnt.y = y
		newAnt.food = 0
		birthCell.ant = newAnt
		population.splice(currentAntIndex-1, 0, newAnt)
		parent.food--
		sortGameStats()
		displayGameTable()
		updateArenaCanvasCell(newAnt.x, newAnt.y)
	}
	else {
		makeWorker(x, y, type, parent, input, response)
	}
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2))
}

function makeWorker(x, y, type, parent, input, response) {
	if (parent.type < 5) {
		disqualify(parent.player, 'A worker cannot create a new worker.', input, response)
		return
	}
	if (!parent.food) {
		disqualify(parent.player, 'Cannot create a new worker without food.', input, response)
		return
	}
	var birthCell = arena[x + y*arenaWidth]
	if (birthCell.food) {
		disqualify(parent.player, 'Cannot create new worker on top of food.', input, response)
		return
	}
	if (birthCell.ant) {
		if (parent.x === x && parent.y === y) {
			disqualify(parent.player, 'Cannot create new worker on own cell.', input, response)
			return
		} else {
			disqualify(parent.player, 'Cannot create new worker on top of another ant.', input, response)
			return
		}
	}
	var newAnt = {
		player: parent.player,
		type: type,
		food: 0,
		x: x,
		y: y
	}
	birthCell.ant = newAnt
	population.splice(currentAntIndex, 0, newAnt)
	currentAntIndex++
	parent.food--
	var id = parent.player.id
	gameStats.forEach(function(row) {
		if (row.id === id) {
			var type_key = 'type' + type
			row[type_key]++
			row.food--
		}
	})
	sortGameStats()
	displayGameTable()
	updateArenaCanvasCell(x, y)
}

function moveAnt(x, y, ant, input, response) {
	var departureCell = arena[ant.x + ant.y*arenaWidth]
	var destinationCell = arena[x + y*arenaWidth]	
	if (destinationCell.ant) {
		disqualify(ant.player, 'Cannot move onto another ant.', input, response)
		return
	}
	if (destinationCell.food && ant.type < 5 && ant.food) {
		disqualify(ant.player, 'A laden worker cannot move onto food.', input, response)
		return
	}	
	destinationCell.ant = ant
	departureCell.ant = null
	updateArenaCanvasCell(ant.x, ant.y)
	updateArenaCanvasCell(x, y)
	ant.x = x
	ant.y = y
	if (destinationCell.food) {
		destinationCell.food = 0
		ant.food++
		if (ant.type === 5) {
			var id = ant.player.id
			gameStats.forEach(function(row) {
				if (row.id === id) {
					row.food++
				}
			})
			sortGameStats()
			displayGameTable()					
		}
	}
}

function passFood(ant) {
	if (ant.type === 5) {
		passFoodQueen(ant)
	} else {
		passFoodWorker(ant)
	}
}

function adjustFood(ant, change) {
	var id
	ant.food = ant.food + change
	id = ant.player.id
	gameStats.forEach(function(row) {
		if (row.id === id) {
			row.food = row.food + change
		}
	})
	sortGameStats()
	displayGameTable()
}

function passFoodQueen(ant) {
	var x, y, i, cell, cells, candidate
	cells = neighbours.slice()
	shuffle(cells, ant.player.random)
	for (i=0; i<cells.length; i++) {	// Check for enemy workers to lose food to.
		if (!ant.food) {
			break
		}
		x = (ant.x + cells[i].x + arenaWidth) % arenaWidth
		y = (ant.y + cells[i].y + arenaHeight) % arenaHeight
		cell = arena[x + y*arenaWidth]
		candidate = cell.ant
		if (candidate && candidate.type < 5 && !candidate.food && candidate.player !== ant.player) {
			candidate.food = 1
			adjustFood(ant, -1)
		}
	}
	for (i=0; i<cells.length; i++) {	// Check for own workers to take food from.
		x = (ant.x + cells[i].x + arenaWidth) % arenaWidth
		y = (ant.y + cells[i].y + arenaHeight) % arenaHeight
		cell = arena[x + y*arenaWidth]
		candidate = cell.ant
		if (candidate && candidate.type < 5 && candidate.food && candidate.player === ant.player) {
			candidate.food = 0
			adjustFood(ant, 1)
		}
	}
}
	
function passFoodWorker(ant) {
	var x, y, i, cell, cells, candidate
	if (ant.food) {	// Check for own queen to give food to.
		for (i=0; i<neighbours.length; i++) {
			x = (ant.x + neighbours[i].x + arenaWidth) % arenaWidth
			y = (ant.y + neighbours[i].y + arenaHeight) % arenaHeight
			cell = arena[x + y*arenaWidth]
			candidate = cell.ant
			if (candidate && candidate.type === 5 && candidate.player === ant.player) {
				ant.food = 0
				adjustFood(candidate, 1)
				return
			}		
		}
	} else {	// Check for enemy queen to take food from.
		cells = neighbours.slice()
		shuffle(cells, ant.player.random)
		for (i=0; i<cells.length; i++) {
			x = (ant.x + cells[i].x + arenaWidth) % arenaWidth
			y = (ant.y + cells[i].y + arenaHeight) % arenaHeight
			cell = arena[x + y*arenaWidth]
			candidate = cell.ant
			if (candidate && candidate.type === 5 && candidate.food && candidate.player !== ant.player) {
				ant.food = 1
				adjustFood(candidate, -1)
				return
			}
		}
	}
}

function gameOver() {
	var id, score
	gameStats.forEach(function(row) {
		if (!row.player.disqualified) {
			score = playersWithLessFood(row.player)
			row.player.score[gamesPlayed % numberOfLeaderboards] += score
			row.player.score[numberOfLeaderboards] +=score
			row.player.games[gamesPlayed % numberOfLeaderboards]++
			row.player.games[numberOfLeaderboards]++
			row.player.scorePerGame[gamesPlayed % numberOfLeaderboards] = row.player.score[gamesPlayed % numberOfLeaderboards] / row.player.games[gamesPlayed % numberOfLeaderboards]
			row.player.scorePerGame[numberOfLeaderboards] = row.player.score[numberOfLeaderboards] / row.player.games[numberOfLeaderboards]
		}
	})
	updateLeaderboardPositions()
	$('#reset_leaderboard').prop('disabled', false)
	displayLeaderboard()
	gamesPlayed++
	if (gamesPlayed === 1) {
		$('#game_counter').html('1 game played.')
	} else {
		$('#game_counter').html(gamesPlayed + ' games played.')
	}
	abandonGame()
	saveToCookie()
}

function saveToCookie() {
	document.cookie = "gamesPlayed="+gamesPlayed;
	players.forEach(function(player) {
		document.cookie = player.id +"_score=" + player.score;
		document.cookie = player.id +"_games=" + player.games;
		document.cookie = player.id +"_inc=" + player.included;
	})
}

function loadFromCookie() {
	var decodedCookie = decodeURIComponent(document.cookie);
	console.log(document.cookie);
	gamesPlayed = getCookie(decodedCookie, "gamesPlayed");
	if(gamesPlayed == 0) return;//gamesPlayed = 1;
	players.forEach(function(player) {
		player.score = []
		player.games = []
		player.scorePerGame = []
		for (var t=0; t<numberOfLeaderboards+1; t++) {
			player.score.push(0)
			player.games.push(0)
			player.scorePerGame.push(0)
		}
		var scores = getCookie(decodedCookie, player.id +"_score");
		//console.log(player.id + ":" + scores);
		var s = scores.split(',');
		player.score[0] = parseInt(s[0], 10);
		player.score[1] = parseInt(s[1], 10);
		player.score[2] = parseInt(s[2], 10);
		var gamess = getCookie(decodedCookie, player.id +"_games");
		//console.log(player.id + ":" + gamess);
		var g = gamess.split(',');
		player.games[0] = parseInt(g[0], 10);
		player.games[1] = parseInt(g[1], 10);
		player.games[2] = parseInt(g[2], 10);
		
		player.scorePerGame[0] = player.games[0] > 0 ? player.score[0] / player.games[0] : 0
		player.scorePerGame[1] = player.games[1] > 0 ? player.score[1] / player.games[1] : 0
		player.scorePerGame[2] = player.games[2] > 0 ? player.score[2] / player.games[2] : 0
		
		var inc = getCookie(decodedCookie, player.id +"_inc");
		
		var checkboxID = 'included_' + player.id;
		//console.log(player.id + ":" + (inc == "true"));
		$('#'+checkboxID).prop('checked', (inc == "true"));
		player.included = (inc == "true");
	});
	$('#reset_leaderboard').prop('disabled', false);
	setTimeout(function() {
		$('#run_ongoing_tournament').trigger('click');
	}, 1000);
}

function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function getCookie(decodedCookie, cname) {
    var name = cname + "=";
    //var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
	updateLeaderboardPositions()
	displayLeaderboard()
}

function sortLeaderboard() {	//	Sort by scorePerGame, then by id if scorePerGame equal.
	players.sort(function(a, b) {
		if (a.disqualified > b.disqualified) {
			return 1
		}
		if (a.disqualified < b.disqualified) {
			return -1
		}
		if (a.included > b.included) {
			return -1
		}
		if (a.included < b.included) {
			return 1
		}
		if (a.scorePerGame[numberOfLeaderboards] > b.scorePerGame[numberOfLeaderboards]) {
			return -1
		}
		if (a.scorePerGame[numberOfLeaderboards] < b.scorePerGame[numberOfLeaderboards]) {
			return 1
		}
		if (a.id > b.id) {
			return 1
		}
		if (a.id < b.id) {
			return -1
		}
	})
}

function sortGameStats() {	//	Sort by food, then by number of workers if food equal, then by id if those equal.
	gameStats.sort(function(a, b) {
		if (a.player.disqualified > b.player.disqualified) {
			return 1
		}
		if (a.player.disqualified < b.player.disqualified) {
			return -1
		}
		if (a.food > b.food) {
			return -1
		}
		if (a.food < b.food) {
			return 1
		}
		if (a.type1 + a.type2 + a.type3 + a.type4 > b.type1 + b.type2 + b.type3 + b.type4) {
			return -1
		}
		if (a.type1 + a.type2 + a.type3 + a.type4 < b.type1 + b.type2 + b.type3 + b.type4) {
			return 1
		}
		if (a.id > b.id) {
			return 1
		}
		if (a.id < b.id) {
			return -1
		}
	})
}

function updateLeaderboardPositions() {
	var lower, upper, i
	var endpoints = []
	players.forEach(function(player) {
		lower = minPossiblePositionOverall(player)
		upper = maxPossiblePositionOverall(player)
		if (lower < upper) {
			endpoints.push({min: lower, max: upper})
		}
	})
	players.forEach(function(player) {
		player.naivePosition = minPossiblePosition(player, numberOfLeaderboards)
		player.position = player.naivePosition	
	})
	sortLeaderboard()
	for (i=1; i<players.length; i++) {
		if (bothInAnyRange(i, i+1, endpoints)) {
			players[i].position = players[i-1].position
		}
	}
	for (i=players.length-2; i>0; i--) {
		players[i].position = Math.min(players[i].position, players[i+1].position)
	}
}

function minPossiblePositionOverall(player) {
	var candidate
	var minimum = players.length
	for (var i=0; i<numberOfLeaderboards; i++) {
		candidate = minPossiblePosition(player, i)
		if (candidate < minimum) {
			minimum = candidate
		}
	}
	return minimum
}

function maxPossiblePositionOverall(player) {
	var candidate
	var maximum = 1
	for (var i=0; i<numberOfLeaderboards; i++) {
		candidate = maxPossiblePosition(player, i)
		if (candidate > maximum) {
			maximum = candidate
		}
	}
	return maximum
}

function bothInAnyRange(position1, position2, ranges) {
	var contained = false
	ranges.forEach(function(range) {
		if (position1 >= range.min && position2 >= range.min && position1 <= range.max && position2 <= range.max) {
			contained = true
		}
	})
	return contained
}

function minPossiblePosition(player, index) {
	return playersWithHigherScorePerGame(player.id, player.scorePerGame, index) + 1
}

function maxPossiblePosition(player, index) {
	return numberOfIncludedPlayers() - playersWithLowerScorePerGame(player.id, player.scorePerGame, index)
}

function numberOfIncludedPlayers() {
	var number = 0
	players.forEach(function(player) {
		if (player.included) {
			number++
		}
	})
	return number
}

function positionOfBlockAbove(naivePosition) {
	var previousNaivePosition = naivePositionOfBlockAbove(naivePosition)
	var position = 0
	players.forEach(function(player) {
		if (player.included && player.naivePosition === previousNaivePosition) {
			position = player.position
		}
	})
	return position
}

function naivePositionOfBlockAbove(naivePosition) {
	var previousNaivePosition = 0
	players.forEach(function(player) {
		if (player.included && player.naivePosition > previousNaivePosition && player.naivePosition < naivePosition) {
			previousNaivePosition = player.naivePosition
		}
	})
	return previousNaivePosition
}

function playersWithHigherScorePerGame(id, scorePerGame, index) {
	var count = 0
	players.forEach(function(player) {
		if (player.included && player.scorePerGame[index] > scorePerGame[index]) {
			count++
		}
	})
	return count
}

function playersWithLowerScorePerGame(id, scorePerGame, index) {
	var count = 0
	players.forEach(function(player) {
		if (player.included && player.scorePerGame[index] < scorePerGame[index]) {
			count++
		}
	})
	return count
}

function playersWithLessFood(player) {
	var count = 0
	var playerFood = 0
	gameStats.forEach(function(row) {
		if (row.player === player) {
			playerFood = row.food
		}
	})
	gameStats.forEach(function(row) {
		if (row.food < playerFood && !row.player.disqualified) {
			count++
		}
	})
	return count
}

function nineVisibleSquares(currentAnt) {
	var view = []
	for (var vertical=-1; vertical<=1; vertical++) {
		for (var horizontal=-1; horizontal<=1; horizontal++) {
			var x = (currentAnt.x + horizontal + arenaWidth) % arenaWidth
			var y = (currentAnt.y + vertical + arenaHeight) % arenaHeight
			var arenaSquare = arena[x + y*arenaWidth]
			var square = {}
			square.color = arenaSquare.color
			square.food = arenaSquare.food
			var ant = arenaSquare.ant
			if (ant) {
				square.ant = {
					food: ant.food,
					type: ant.type,
					friend: ant.player === currentAnt.player
				}
			} else {
				square.ant = null
			}
			view.push(square)
		}
	}
	return view
}

function getMove(ant, rotatedView) {
	var player = ant.player
	var antFunction = player.antFunction
	var parameters = {}
	parameters.view = rotatedView
	if (player.id === 0) {
		parameters.console = console
	}
	var time = performance.now()
	try {
		var response = maskedEval(antFunction, parameters)
	} catch(e) {
		disqualify(player, e, rotatedView, response)
		return noMove
	}
	var elapsedTime = performance.now() - time
	player.elapsedTime += elapsedTime
	player.permittedTime += permittedTime
	if (player.id === 0 && debug) {
		console.log('Responded in ' + elapsedTime + ' ms.')
		if (elapsedTime > permittedTime) {
			console.log(player.title + ': Exceeded permitted time of ' + permittedTime + 'ms.')
		}
		console.log('________________________')
	}
	if (typeof response === 'undefined') {
		disqualify(player, 'Response undefined.', rotatedView, response)
		return noMove
	}
	if (typeof response.cell === 'undefined') {
		disqualify(player, 'Cell undefined.', rotatedView, response)
		return noMove
	}
	if (!Number.isInteger(response.cell)) {
		disqualify(player, 'Cell is not an integer: ' + response.cell, rotatedView, response)
		return noMove
	}
	if (response.cell < 0 || response.cell > 8) {
		disqualify(player, 'Cell out of range: ' + response.cell, rotatedView, response)
		return noMove
	}
	if (typeof response.color !== 'undefined') {
		if (!Number.isInteger(response.color)) {
			disqualify(player, 'Color is not an integer: ' + response.color, rotatedView, response)
			return noMove
		}
		if (response.color < 0 || response.color > paletteSize) {
			disqualify(player, 'Color out of range: ' + response.color, rotatedView, response)
			return noMove
		}
	}
	if (typeof response.type !== 'undefined') {
		if (!Number.isInteger(response.type)) {
			disqualify(player, 'Type is not an integer: ' + response.type, rotatedView, response)
			return noMove
		}
		if (response.type < 0 || response.type > 4) {
			disqualify(player, 'Type out of range: ' + response.type, rotatedView, response)
			return noMove
		}
	}
	if (typeof response.color !== 'undefined' && typeof response.type !== 'undefined') {
		if (response.color && response.type) {
			disqualify(player, 'Both color and type specified.', rotatedView, response)
			return noMove
		}
	}
	if (player.elapsedTime > 10000 && player.elapsedTime > player.permittedTime) {
		disqualify(player, 'Exceeded permitted time averaged over more than 10 seconds.', rotatedView, response)
		return noMove
	}
	return response
}

function step() {	// Step all ants up to the last one in the population.
	continuousMoves = false
	singleAntStep = false
	$('#play').prop('disabled', false)
	$('#pause').prop('disabled', true)
	clearTimeout(timeoutID)
	processAnts()		
}

function stepAnt() {	// Step next visible ant, or next ant if no zoom (only if display not hidden).
	continuousMoves = false
	singleAntStep = true
	$('#play').prop('disabled', false)
	$('#pause').prop('disabled', true)
	clearTimeout(timeoutID)
	processAnts()
}

function visible(ant) {	// Return true if the ant is within the zoomed area.
	var offset = Math.floor(zoomCellsPerSide / 2)
	var littleOffset = zoomCellsPerSide - offset
	var x = ant.x, y = ant.y
	var cx = zoomedAreaCentreX, cy = zoomedAreaCentreY
	if (((cx - x <= offset) && (x - cx <= littleOffset) || (cx + arenaWidth - x <= offset) && (x + arenaWidth - cx <= littleOffset)) && 
		((cy - y <= offset) && (y - cy <= littleOffset) || (cy + arenaHeight - y <= offset) && (y + arenaHeight - cy <= littleOffset))) {
		return true
	}
	return false
}

function atLeastOneVisibleAnt() {
	for (var i=0; i<population.length; i++) {
		if (visible(population[i])) {
			return true
		}
	}
	return false
}

/* PLAYER LOADING */

function loadPlayers() {
	loadAnswers(site, qid, function(answers) {
		createPlayers(answers)
	initialiseInterface()
	})
}

function loadAnswers(site, qid, onFinish) {
	var answers = []
	function loadPage() {
		$.get(
			'https://api.stackexchange.com/2.2/questions/' +
			qid.toString() + '/answers?page=' +
			(page++).toString() +
			'&pagesize=100&order=asc&sort=creation&site=' +
			site + '&filter=!YOKGPOBC5Yad4mOOn8Z4WcAE6q', readPage
		)
	}
	function readPage(data) {
		answers = answers.concat(data.items)
		if (data.hasMore) {
			loadPage()
		} else {
			onFinish(answers)
		}
	}
	var page = 1
	loadPage(page, readPage)
}

function createPlayers(answers) {
	var codePattern = /<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/
	var namePattern = /<h1\b[^>]*>(.*?)<\/h1>/
	var testPlayer = { id: 0, included: false, disqualified: false, code: '', link: '#new_challenger_heading', title: 'NEW CHALLENGER' }
	testPlayer.code = $('#new_challenger_text').val()
	testPlayer.antFunction = antFunctionMaker(testPlayer)
	players.push(testPlayer)
	
	answers.forEach(function(answer) {
		var user = decode(answer.owner.display_name)
		var codeMatch = codePattern.exec(answer.body)
		var nameMatch = namePattern.exec(answer.body)
		if (codeMatch !== null && codeMatch.length > 0 && nameMatch !== null && nameMatch.length > 0) {
			var player = {}
			player.id = answer.answer_id
			player.included = true
			player.disqualified = false
			player.code = decode(codeMatch[1])
			player.link = answer.link
			player.title = nameMatch[1].substring(0,40) + ' - ' + user
			player.antFunction = antFunctionMaker(player)
			players.push(player)
		}		
	})
	showLoadedTime()
	colorPlayers()
	invalidPlayers.forEach(function(record) {
		var reason = 'Excluded at load. Invalid function body: ' + record.errorMessage
		var input = 'None - never played.'
		var response = 'None - never played.'
		disqualify(record.player, reason, input, response)
	})
	initialiseLeaderboard()
	if(document.cookie.length > 0) {
		loadFromCookie()
		updateLeaderboardPositions()
		displayLeaderboard()
	}
}

