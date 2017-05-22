// Many thanks to Helka Homba for these posts, which provided the idea of a Stack Snippets KotH and heavily informed this code.
// Red vs. Blue - Pixel Team Battlebots: https://codegolf.stackexchange.com/q/48353/20283
// Block Building Bot Flocks: https://codegolf.stackexchange.com/q/50690/20283

/* SETUP */

$(load)

function load() {
	setGlobals()
	loadPlayers()
	initialiseInterface()
}

function setGlobals() {
	qid = 50690
	site = 'codegolf'
	players = []
	leaderboardInfo = []
	population = []
	delay = 150
	debug = true
	currentAntIndex = 0
	maxPlayers = 16
	display = true
	zoomed = false
	zoomLocked = false
	continuousMoves = true
	singleAntStep = false
	gameInProgress = false
	ongoingTournament = false
	currentGameInfo = []
	zoomedAreaCentreX = 0
	zoomedAreaCentreY = 0
	zoomOnLeft = true
	timeoutID = 0
	permittedTime = 5
	noMove = {cell: 4, colour: 0, workerType: 0}
	arenaWidth = 2500
	arenaHeight = 1000
	arenaArea = arenaWidth * arenaHeight
	arena = new Array(arenaArea)
	for (i=0; i<arenaArea; i++) {
		arena[i] = {
			food: 0,
			colour: 1,
			ant: null
		}
	}
	rotator = [
		[0, 1, 2, 3, 4, 5, 6, 7, 8],
		[6, 3, 0, 7, 4, 1, 8, 5, 2],
		[8, 7, 6, 5, 4, 3, 2, 1, 0],
		[2, 5, 8, 1, 4, 7, 0, 3, 6]
	]
	arenaCanvas = document.createElement('canvas')
	arenaCanvas.width = arenaWidth
	arenaCanvas.height = arenaHeight
	arenaCtx = arenaCanvas.getContext('2d')
	arenaImage = arenaCtx.createImageData(arenaWidth, arenaHeight)
	
	zoomCanvas = document.createElement('canvas')
	zoomCanvas.width = 1000
	zoomCanvas.height = 1000
	zoomCtx = zoomCanvas.getContext('2d')
	zoomImage = zoomCtx.createImageData(zoomCanvas.width, zoomCanvas.height)
	
	displayCanvas = document.getElementById('display_canvas')
	displayCtx = displayCanvas.getContext('2d')	
}

/* HELPERS */

function maskedEval(functionBody, params) //thanks http://stackoverflow.com/a/543820 (with the warning not to use this with untrusted code)
{
    var mask = {}
    for (i in this)
        mask[i] = undefined
    for (i in params) {
        if (params.hasOwnProperty(i))
            mask[i] = params[i]
    }
    return (new Function('with(this) { ' + functionBody + ';}')).call(mask)
}

function decode(html) {
	return $('<textarea>').html(html).text()
}

cryptoRandom = (function() {
	a = new Uint32Array(16384)
	i = a.length - 1
	return function(n) {
		i = (i + 1) % a.length
		if (i === 0) {
			window.crypto.getRandomValues(a)
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

/* INTERFACE */

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
		$('#reset_leaderboard').prop('disabled', false)
		if (!gameInProgress) {
			startNewGame()
		}		
	})
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
		$('#reset_leaderboard').prop('disabled', false)
		if (!gameInProgress) {
			startNewGame()
		}
	})
	$('#no_display').prop('disabled', true)
	$('#no_display').click(function() {
		$('#top_hidden_area').hide(300)
		$('#bottom_hidden_area').hide(300)
		$('#abandon_game').hide(300)
		$('#reset_leaderboard').hide(300)
		$('#restore_display').show(300)
		display = false
		continuousMoves = true
	})
	$('#delay').val(delay)
	$('#delay').change(function() {
		delay = $('#delay').val()
	})
	$('#play').prop('disabled', true)
	$('#play').click(function() {
		continuousMoves = true
		$('#play').prop('disabled', true)
		$('#pause').prop('disabled', false)
		clearTimeout(timeoutID)
		processCurrentAnt()			
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
	$('#max_players').val(maxPlayers)
	$('#max_players').change(function() {
		maxPlayers = $('#max_players').val()
	})
	$('#fit_canvas').click(function() {})
	$('#display_canvas').mousemove(function(event) {
		if (!zoomLocked) {
			zoomed = true
			zoomedAreaCentreX = event.offsetX
			zoomedAreaCentreY = event.offsetY
		}
	})
	$('#display_canvas').mouseleave(function() {
		if (!zoomLocked) {
			zoomed = false
		}
	})
	$('#display_canvas').click(function() {
		zoomLocked = !zoomLocked
	})
	$('#restore_display').hide()
	$('#restore_display').click(function() {
		$('#restore_display').hide(300)
		$('#top_hidden_area').show(300)
		$('#bottom_hidden_area').show(300)
		$('#abandon_game').show(300)
		$('#reset_leaderboard').show(300)
	})
	$('#abandon_game').prop('disabled', true)
	$('#abandon_game').click(function() {
		if (ongoingTournament) {
			startNewGame()
		} else {
			$('#completed_moves_area').html('0 moves of 10000 completed')
			$('#current_game_body').html('')
			$('#run_single_game').prop('disabled', false)
			$('#no_display').prop('disabled', true)
			$('#play').prop('disabled', true)
			$('#pause').prop('disabled', true)
			$('#step').prop('disabled', true)
			$('#step_ant').prop('disabled', true)
			$('#abandon_game').prop('disabled', true)
		}		
	})
	$('#reset_leaderboard').prop('disabled', true)
	$('#reset_leaderboard').click(function() {
		$('#reset_leaderboard').prop('disabled', true)
		leaderboardInfo = []
		initialiseLeaderboard()
	})
	$('#permitted_time_override').val(permittedTime)
	$('#permitted_time_override').change(function() {
		permittedTime = $('#permitted_time_override').val()
	})
	$('#debug').prop('checked', debug)
	$('#debug').change(function() {
		debug = $('#debug').prop('checked')
	})
	$('#seeded_random').prop('checked', false)
	$('#seeded_random').change(function() {
		$('#seed').prop('disabled', !$('#seeded_random').prop('checked'))
	})
	$('#seed').prop('disabled', true)
	$('#new_challenger_text').change(function() {})
}

function showLoadedTime() {
	$('#loaded_at').html('<i>Players loaded from contest post</i> ' + (new Date()).toString())
}

function initialiseLeaderboard() {
	players.forEach(function(player) {
		var row = { id: player['id'], position: 1, name: player['title'], score: 0, confidence: 0, included: player['included'] }
		leaderboardInfo.push(row)
	})
	displayLeaderboard()
}

function displayLeaderboard() {
	var	content = ''
	leaderboardInfo.forEach(function(row) {
		var checkboxId = 'included_' + row['id']
		content += '<tr>'
		content += '<td>'
		content += row['position']
		content += '</td>'
		content += '<td>'
		content += row['name']
		content += '</td>'
		content += '<td>'
		content += row['score']
		content += '</td>'
		content += '<td>'
		content += row['confidence']
		content += '</td>'
		content += '<td>'
		content += '<input id=' + checkboxId + ' type=checkbox>'
		content += '</td>'
		content += '</tr>'
	})
	$('#leaderboard_body').html(content)
	leaderboardInfo.forEach(function(row) {
		var id = row['id']
		var checkboxId = '#included_' + id
		$(checkboxId).prop('checked', row['included'])
		var player = players[players.findIndex(function(player){
			return player['id'] === id
		})]
		$(checkboxId).change(function() {
			player['included'] = $(checkboxId).prop('checked')
		})
	})	
}

/* GAMEPLAY */

function startNewGame() {
	if ($('#seeded_random').prop('checked')) {
		random = seededRandomInitialiser($('#seed').val())
	} else {
		random = cryptoRandom
	}
	for (i=0; i<arenaWidth; i++) {
		arena[i].food = 1
	}
	for (i=arenaWidth; i<arenaArea; i++) {
		arena[i].food = 0
	}
	for (i=0; i<arenaArea; i++) {
		otherCell = random(arenaArea)
		temp = arena[i].food
		arena[i].food = arena[otherCell].food
		arena[otherCell].food = temp
		
		arena[i].colour = 0
		arena[i].ant = null
	}
	includedPlayers = []
	players.forEach(function(player) {
		if (player['included']) {
			includedPlayers.push(player)
		}
	})
	numberOfPlayers = Math.min(includedPlayers.length, maxPlayers)
	for (i=0; i<numberOfPlayers; i++) {
		r = random(numberOfPlayers)
		temp = includedPlayers[i]
		includedPlayers[i] = includedPlayers[r]
		includedPlayers[r] = temp
	}
	playersThisGame = includedPlayers.slice(0, numberOfPlayers)
	playersThisGame.forEach(function(player) {
		player.time = 0
		player.permittedTime = 0
		while (true) {
			x = random(arenaWidth)
			y = random(arenaHeight)
			if (arena[x + y*arenaWidth].ant === null && arena[x + y*arenaWidth].food === 0) {
				var ant = {
					player: player,
					type: 0,
					food: 0,
					x: x,
					y: y
				}
				arena[x + y*arenaWidth].ant = ant
				population.push(ant)
				break
			}
		}
	})
	clearTimeout(timeoutID)
	timeoutID = setTimeout(processCurrentAnt, 0)
}

function processCurrentAnt() {
	currentAnt = population[currentAntIndex]	
	unrotatedView = nineVisibleSquares()	
	var rotation = random(4)
	rotatedView = []
	for (i=0; i<9; i++) {
		rotatedView.push(unrotatedView[rotator[rotation][i]])
	}
	response = getMove(rotatedView)
	if (debug) {
		console.log('Rotated view: ' + rotatedView)
		console.log('Unrotated view: ' + unrotatedView)
		console.log('Response: ' + response)
	}
	targetCell = rotator[rotation][response.cell]	
	if (response.colour) {
		if (response.workerType) {
			console.log('Not permitted: Both colour and worker type specified.')
		} else {
			setColour()
		}
	} else {
		if (response.workerType) {
			makeWorker()
		} else {
			moveAnt()
		}
	}		
	passFood()	
	prepareForNextAnt()
}

function passFood() {}

function prepareForNextAnt() {
	currentAntIndex = (currentAntIndex + 1) % population.length
	if (display) {
		if (continuousMoves) {
			if (currentAntIndex === 0) {
				timeoutID = setTimeout(processCurrentAnt, delay)
				displayArena()
			} else {
				timeoutID = setTimeout(processCurrentAnt, 0)
			}
		} else {
			if (singleAntStep) {
				if (zoomed && !visible(currentAntIndex)) {
					timeoutID = setTimeout(processCurrentAnt, 0)
				} else {
					displayArena()
				}
			} else {
				if (currentAntIndex !== 0) {
					timeoutID = setTimeout(processCurrentAnt, 0)
				} else {
					displayArena()
				}
			}
		}
	}
}

function nineVisibleSquares() {
	var view = []
	for (vertical=-1; vertical<=1; y++) {
		for (horizontal=-1; horizontal<=1; x++) {
			x = (horizontal + arenaWidth) % arenaWidth
			y = (vertical + arenaHeight) % arenaHeight
			var arenaSquare = arena[x + y*arenaWidth]
			var square = {}
			square.colour = arenaSquare.colour
			square.food = arenaSquare.food
			var ant = arenaSquare.ant
			if (ant) {
				if (ant.player = currentAnt.player) {
					square.friend = {
						food: ant.food,
						type: ant.type
					}
					square.enemy = null
				} else {
					square.friend = null
					square.enemy = {
						food: ant.food,
						type: Math.sign(ant.type)
					}
				}
			} else {
				square.friend = null
				square.enemy = null
			}
			view.push(square)
		}
	}
	return view
}

function getMove(ant) {
	var player = ant.player
	var code = player.code
	var parameters = {}
	parameters.view = rotatedView
	if (id === 0) {
		parameters.console = console
	}
	time = performance.now()
	try {
		response = maskedEval(code, parameters)
	} catch(e) {
		response = noMove
		disqualifyPlayer(e + '    Disqualified for error')
	}
	time = performance.now() - time
	if (debug && time > permittedTime) {
		console.log('Exceeded permitted time of ' + permittedTime + 'ms: ' + time)
	}
	player.time += time
	player.permittedTime += permittedTime
	if (player.time > 10000 && player.time > player.permittedTime) {
		response = noMove
		disqualifyPlayer('    Disqualified for exceeding permitted time')
	}
	return response
}

function disqualifyPlayer(message) {
	if (debug) {
		console.log(message)
	}
	
}

function step() {
	continuousMoves = false
	singleAntStep = false
	$('#play').prop('disabled', false)
	$('#pause').prop('disabled', true)
	clearTimeout(timeoutID)
	processCurrentAnt()		
}

function stepAnt() {	// Step next visible ant, or next ant if no zoom (only if display not hidden)
	continuousMoves = false
	singleAntStep = true
	$('#play').prop('disabled', false)
	$('#pause').prop('disabled', true)
	clearTimeout(timeoutID)
	processCurrentAnt()
}

function visible(ant) {
	// return true if the ant is within the zoomed area, including the first layer of out of range cells since they still affect the area 
}

function displayArena() {
	
	if (zoomed) {
		displayZoomedArea()
	}
}

function displayZoomedArea() {}


/* PLAYER LOADING */

function loadPlayers() {
	loadAnswers(site, qid, function(answers) {
        createPlayers(answers)
	})
	showLoadedTime()
}

function loadAnswers(site, qid, onFinish) {
    var answers = []
    function loadPage() {
        $.get(
            'https://api.stackexchange.com/2.2/questions/' +
            qid.toString() + '/answers?page=' +
            (page++).toString() +
            '&pagesize=100&order=asc&sort=creation&site=' +
            site + '&filter=!YOKGPOBC5Yad4mOOn8Z4WcAE6q', readPage)
    }
    function readPage(data) {
        answers = answers.concat(data.items)
        if (data.hasMore)
            loadPage()
        else
            onFinish(answers)
    }
    var page = 1
    loadPage(page, readPage)
}

function createPlayers(answers) {
    var codePattern = /<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/
    var namePattern = /<h1\b[^>]*>(.*?)<\/h1>/
	
	var testPlayer = { id: 0, included: false, code: '', link: 'javascript:;', title: 'NEW CHALLENGER' }
	players.push(testPlayer)
	
	answers.forEach(function(answer) {
		var user = decode(answer.owner.display_name)
		var codeMatch = codePattern.exec(answer.body)
		var nameMatch = namePattern.exec(answer.body)
		if (codeMatch !== null && codeMatch.length > 0 && nameMatch !== null && nameMatch.length > 0) {
			var player = {}
			player.id = answer.answer_id
			player.included = true
			player.code = decode(codeMatch[1])
			player.link = answer.link
			player.title = nameMatch[1].substring(0,20) + ' - ' + user
			players.push(player)
		}		
	})
	initialiseLeaderboard()
}

