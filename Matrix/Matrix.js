
var text_height = 15;
var columns_count = 84;
var lines_count = 32;
var simultaneous_messages = 8;

var fade_in = 300;

var srt_file;

var messages = [];
var lines = [];

var text_width = 0;
var matrixFont;

var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$+-*/÷=%\"'#&_(),.;:?!\\|{}<>[]^~       "
var keywords = ["morpheus", "matrix", "Morpheus", "Matrix", "Neo", "neo", "Agent", "agent", "Smith", "smith", "rabbit", "Rabbit"];

function initTextIndexes()
{	
	textSize(text_height);

	for(var i = 0; i < characters.length; i++)
		if(textWidth(characters[i]) > text_width)
			text_width = textWidth(characters[i]);

	columns_count = width / text_width;
	lines_count = height / text_height;
}

function preload() 
{
	matrixFont = loadFont('Matrix/matrix_font.otf');
}

function createNextMessage()
{
	var go = true;
	var newMessages = [];
	var messageWidth = 0;
	var messageHeight = 0;

	srt_file = srt_file.substring(srt_file.indexOf("-->"));

	do
	{
		srt_file = srt_file.substring(srt_file.indexOf("\n") + 1);

		if(srt_file.indexOf('\n') != 1)
		{
			var msg = srt_file.substring(0, srt_file.indexOf("\n") + 1);
			if(msg.length > messageWidth) messageWidth = msg.length;

			newMessages.push(msg);
		}

		else go = false;
	}while(go);

	height = newMessages.length;

	do
	{
		var x = int(random(0, columns_count - messageWidth));
		var y = int(random(0, lines_count - messageHeight));

		go = true;

		for(var i = 0; i < messages.length; i++)
			for(var j = 0; j < messageHeight; j++)
				if(messages[i].x + messages[i].message.length > x && messages[i].x < x + messageWidth && messages[i].y != y + j)
					go = false;
	}while(!go);

	for(var i = 0; i < newMessages.length; i++)
		messages.push(new Message(newMessages[i], x, y + i));
}

function setup() 
{
  createCanvas(window.innerWidth, window.innerHeight);
  //createCanvas(columns_count * text_width, lines_count * text_height);
  frameRate(200);
  background(0);

  //default_font = matrixFont;
  default_font = 'Courier New';

  textFont(default_font);
  initTextIndexes();

  fetch('Matrix/mt.srt')
     .then(response => response.text())
     .then(text => {
     	srt_file = text;

     	for(var i = 0; i < simultaneous_messages; i++)
     		createNextMessage(); 
  })

  //createNextMessage();

   // messages.push(new Message("WAKE UP VIRGILE", 60, 5));
   // messages.push(new Message("EVERYTHING AROUND YOU IS A LIE", 55, 15));
   // messages.push(new Message("TAKE THE PILL AND LET ME SHOW YOU THE REAL WORLD", 45, 25));

  for(var x = 0; x < columns_count; x++)
  {	
  	var newLine = new Line(x);

  	lines.push(newLine);
  }

  for(var i = 0; i < characters.length; i++)
  {
  	stroke(0);
   	text(characters[i], i * 10, 30);
  }

}

var t;

function draw() 
{
  background(0);

  //print(new Date().getTime() - t + "ms");
  t = new Date().getTime();

  for(var i = 0; i < lines.length; i++)
  {
  	lines[i].update();
  	lines[i].show();
  }

  // for(var y = 0; y < lines_count; y++)
 	//  for(var x = 0; x < columns_count; x++)
 	//  {
  // 		fill(0, 255, 65)
 	//  	text(characters[int(random(0, characters.length))], x * text_width, y * text_height);
 	//  }
}

function Message(message, x, y)
{
	this.message = message;
	this.x = x;
	this.y = y;
	this.id = random();
	this.onScreen = [];
	this.timeAtComplete = 0;

	for(var i = 0; i < this.message.length; i++)
		this.onScreen[i] = false;

	this.completed = function()
	{
		for(var i = 0; i < this.message.length; i++)
			if(this.onScreen[i] == false && this.message[i] != ' ')
				return false;

		return true;
	}

	this.finished = function()
	{
		for(var i = 0; i < this.message.length; i++)
			if(this.onScreen[i] == true)
				return false;

		return true;
	}
}

function Line(x)
{
	this.x = x;
	this.id = x;
	this.symbols = [];
	this.head = new Symbol(x, int(random(0, lines_count)));
    this.speed = random(1, 15) * 5;
    this.lifeSpan = random(30, 220) * 5;
    this.lifeSpan = 600 * random(1,5);
    this.direction = 1

    this.timeAtLastUpdate = new Date().getTime();

	this.show = function()
	{
		for(var i = 0; i < this.symbols.length; i++)
			this.symbols[i].show();

		this.head.show();
	}

	this.checkMessages = function()
	{		
		for(var i = 0; i < messages.length; i++)
		{
			if(this.head.x >= messages[i].x && this.head.x < messages[i].x + messages[i].message.length && this.head.y == messages[i].y)
			{
				var characterID = this.x - messages[i].x;

				if(messages[i].timeAtComplete != 0 && new Date().getTime() - messages[i].timeAtComplete > 7000)
				{
					for(var j = 0; j < this.symbols.length; j++)
						if(this.symbols[j].messageID == messages[i].id && this.symbols[j].stay)
						{
							messages[i].onScreen[characterID] = false;
							this.symbols.splice(j, 1);
						}

					if(messages[i].finished())
					{
						messages.splice(i, 1);

						if(messages.length < simultaneous_messages)
							createNextMessage();
					}

					return true;
				}

				if((messages[i].onScreen[characterID] || random(0,1) > 0.4) && messages[i].message[characterID] != ' ')
				{
					this.head.value = messages[i].message[characterID];
					if(!messages[i].onScreen[characterID]) 
					{
						this.addNewSymbol(true);
						this.symbols[this.symbols.length - 1].messageID = messages[i].id;

						for(var j = 0; j < keywords.length; j++)
							if(messages[i].message.search(keywords[j]) != -1)
								this.symbols[this.symbols.length - 1].matchKeyword = true;
					}
 
					messages[i].onScreen[characterID] = true;

					if(messages[i].completed() && messages[i].timeAtComplete == 0)
						messages[i].timeAtComplete = new Date().getTime();

					return false;
				}
				else return true;
			}
		}

		return true;
	}

	this.update = function()
	{
    	var timeElapsedSinceLastUpdate = new Date().getTime() - this.timeAtLastUpdate;

		if(timeElapsedSinceLastUpdate > this.speed)
		{
			if(this.direction) this.head.y++
			else this.head.y--

			if(this.head.y > lines_count)
				this.head.y = 0;
			else if(this.head.y < 0)
				this.head.y = lines_count - 1

			if(this.checkMessages())
			{
				this.head.initRandomValue();
				this.addNewSymbol(false);
			}

			this.timeAtLastUpdate = new Date().getTime() + (timeElapsedSinceLastUpdate - this.speed)%this.speed;
		}

		for(var i = 0; i < this.symbols.length; i++)
			if(this.symbols[i].update())
			{	
				this.symbols.splice(i, 1);
			}
	}

	this.addNewSymbol = function(forceStatic)
	{
		let newSymbol = new Symbol(this.head.x, this.head.y);
		newSymbol.value = this.head.value;
		newSymbol.lifeSpan = this.lifeSpan;

		if(forceStatic) 
		{
			newSymbol.dynamic = false;
			newSymbol.stay = true;
			newSymbol.finalValue = newSymbol.value;
		}
		this.symbols.push(newSymbol);
	}
}

function Symbol(x, y)
{
  this.x = x;
  this.y = y;
  this.value;
  this.finalValue;
  this.dynamic = int(random(0,2));
  this.timeAtLastUpdate = new Date().getTime();
  this.timeAtSpawn = this.timeAtLastUpdate;
  this.cycleTreshold = random(30, 60) * 5;
  this.lifeSpan = undefined;
  this.stay = false;
  this.messageID = undefined;
  this.matchKeyword = false;

  this.initRandomValue = function()
  {
  	this.value = characters[int(random(0, characters.length))];
  	//this.value = String.fromCharCode(0x30A0+ int(random(0, 96)))
  	//this.value = String.fromCharCode(0x0200+ int(random(0, 96)))
  	if(this.value == ' ') this.dynamic = false;
  }

  this.show = function()
  {
    var timeElapsedSinceSpawn = new Date().getTime() - this.timeAtSpawn;

  	if(timeElapsedSinceSpawn < fade_in)
  	{
  		var c = map(timeElapsedSinceSpawn, 0, fade_in, 255, 0);
  		fill(c, 255, 65 + c)
  	}
  	else  		
  	{
  		var c = map(timeElapsedSinceSpawn, fade_in, this.lifeSpan, 0, 255);
  		fill(0, 255-c, 65 - c)
  	}

  	if(this.stay)
  	{
  		var timeUntilStabilization = this.lifeSpan * 3;

  		if(timeElapsedSinceSpawn < timeUntilStabilization)
  			fill(255);
  		else if(timeElapsedSinceSpawn < timeUntilStabilization + fade_in * 2)
  		{
  			if(this.matchKeyword)
  			{
  				var c = map(timeElapsedSinceSpawn, timeUntilStabilization, timeUntilStabilization + fade_in * 2, 255, 0);
  				fill(255, c, c)
  			}
  			else
  			{
  				var c = map(timeElapsedSinceSpawn, timeUntilStabilization, timeUntilStabilization + fade_in * 2, 255, 200);
  				fill(c, 255, 65 + c)
  			}
  		}
  		else
  		{
  			if(this.matchKeyword) fill(255, 0, 0);
  			else fill(200, 255, 65 + 200);
  		}

  		if(timeElapsedSinceSpawn < timeUntilStabilization && timeElapsedSinceSpawn%int(this.cycleTreshold/5) == 0)
  			this.initRandomValue();
  		else if(timeElapsedSinceSpawn > timeUntilStabilization)
  			this.value = this.finalValue;
  	}

  	if(this.stay) textFont('Courier');
  	if(this.stay && random(0,1) <  0.01) text(characters[int(random(0, characters.length))], this.x * text_width, this.y * text_height+ random(-2,2));
  	else text(this.value, this.x * text_width, this.y * text_height);
    if(this.stay) textFont(default_font);
}

  this.update = function()
  {
  	if(!this.stay)
  	{
	    var timeElapsedSinceLastUpdate = new Date().getTime() - this.timeAtLastUpdate;
	    var timeElapsedSinceSpawn = new Date().getTime() - this.timeAtSpawn;

	  	if(this.dynamic)
	  	{
	  		if(timeElapsedSinceLastUpdate > this.cycleTreshold)
	  		{
	  			this.timeAtLastUpdate = new Date().getTime() + (timeElapsedSinceLastUpdate - this.cycleTreshold)%this.cycleTreshold;
	  			this.initRandomValue();
	  		}
	  	}

	  	if(timeElapsedSinceSpawn > this.lifeSpan && this.lifeSpan != undefined) return true;
	  	else return false;
	 }

	 return false;
  }
}
