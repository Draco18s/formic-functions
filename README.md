# Formic Functions - Ant Queen of the Hill contest

This is the code behind the JavaScript programming contest hosted on Programming Puzzles & Code Golf Stack Exchange.

## [View/enter the contest here.](https://codegolf.stackexchange.com/questions/135102/formic-functions-ant-queen-of-the-hill-contest)

## [Run modified controller](https://draco18s.github.io/formic-functions/)

![dance floor ant GIF](https://i.stack.imgur.com/7xiOD.gif)

<sup>Not actual game footage.</sup>

Each player starts with one ant - a queen, who collects food. Each piece of food can be held or used to produce a worker. Workers also collect food to be brought back to the queen.

All players compete in one arena. The winner is the queen holding the most food after she has taken 30,000 turns. The catch is that the ants can only communicate by changing the colors of the arena squares, which may also be changed by rival ants...

### Modifications from official

The changes adds a marker that can be turned on or off for each faction:

![Example](https://s4.postimg.org/8vll1ir71/marker.png)

Handles multiple markers per faction

![Several ants](https://s18.postimg.org/pki82ktd5/marker_multi.png)

Shows ant type

![Queen and Worker](https://s14.postimg.org/cyzp75ygh/marker_notation.png)

And shows if workers are carrying food

![Food](https://s22.postimg.org/mqvirzi5d/marker_food.png)

This is helpful for bot-writers in figuring out what their ants are doing and locating them all.

Additionally, food in the zoom view has been given a white outline so it is visible on all colors

![Food outline](https://s1.postimg.org/jtsbryndb/black-food.png)

Zoom view also has a marker for Worker Type (same as the marker icon, drawn below the ant). The above image shows a Type 1 ant.

![Zoom hover](https://i.stack.imgur.com/Jll5I.png)

Hover over ants to see their faction name, type, and food amount

##Leaderboard

[Leaderboad available at Trichoplax's master branch](https://github.com/trichoplax/formic-functions/blob/master/README.md#leaderboard)