let agent;
let numAgents = 12;
let agentColony = new Array(numAgents);


function setup() {
  createCanvas(700, 700);
  ellipseMode(CENTER);

  agent = new Agent(width/2, height/2); // create a new agent in the center of the canvas
  
	for(let i=0; i < numAgents; i++){
		agentColony[i] = new Agent(random(width), random(height));
	}
	agentColony[numAgents/2].sick = true;
}

function draw() {
  background(255);
	//for testing
	//agent.update();
	//agent.draw();
	//agent.wander();

	for(let j=0; j < numAgents; j++){
		agentColony[j].update();
		agentColony[j].draw();
		if(mouseIsPressed){
			//agentColony[j].flee(createVector(mouseX, mouseY));
			agentColony[j].seek(createVector(mouseX, mouseY));
		}
		if(agentColony[j].role === 'family'){
			agentColony[j].cohesion(agentColony);
			agentColony[j].wander();
		}
		if(agentColony[j].role === 'reckless'){
			agentColony[j].wander();
		}
		if(agentColony[j].role === 'loner'){
			agentColony[j].separate(agentColony);
			agentColony[j].wander();
		}
	//check health of nearby agents
	agentColony[j].checkVirus(agentColony);
	}
	rect(mouseX, mouseY, 5, 5);
}


class Agent{
  constructor(x, y){
    this.position = createVector(x, y);
    this.velocity = createVector(0,0);
    this.acceleration = createVector(0,0);
		this.maxSpeed = random(1,6);
		this.maxForce = random(0.1, 0.6);
		this.role = random(['reckless', 'family', 'loner']);
		this.health = random(4);
		this.sick = false;
		//add color
  }

  applyForce(force){
    this.acceleration.add(force);
  }

	seek(target){
		let speed;

		//make sure this doesn't update target's vector
		let desiredV = p5.Vector.sub(target, this.position);
		let squaredDistance = desiredV.magSq();
		//if agent should wrap
		if(abs(desiredV.x) > width/2){
			if(this.position.x < target.x){
				desiredV.x -= width;
			}
			else{
				desiredV.x += width;
			}
		}

		if(abs(desiredV.y) > height/2){
			if(this.position.y < target.y){
				desiredV.y -= height;
			}
			else{
				desiredV.y += height;
			}
		}

		desiredV.normalize();
		//not sure if this is the right spot. but for now let's go
		if(squaredDistance <= 10000){
			//check if this works
			speed = map(squaredDistance, 0, 10000, 0, this.maxSpeed);
			desiredV.mult(speed);
		}
		else{
			desiredV.mult(this.maxSpeed);
		}

		let steeringForce = p5.Vector.sub(desiredV, this.velocity);
		steeringForce.limit(this.maxForce);
		//not sure if I should call it without the this.
		this.applyForce(steeringForce);

	}


	flee(target){
		let speed;

		this.velocity.copy();
		let desiredV = p5.Vector.sub(this.position, target);
		let squaredDistance = desiredV.magSq();
		//if agent should wrap

		desiredV.normalize();
		//not sure if this is the right spot. but for now let's go
		if(squaredDistance <= 10000){
			desiredV.mult(this.maxSpeed);
		}
		else{
			desiredV.mult(0);
		}

		let steeringForce = p5.Vector.sub(desiredV, this.velocity);
		//steeringForce.limit(this.maxForce);
		//not sure if I should call it without the this.
		this.applyForce(steeringForce);

		//don't know what to do about wrapping for the flee
		/*
		if(this.position.x < 0){
			this.position.x += width;
		}
		if(this.position.x > width){
			this.position.x -= width;
		}
		if(this.position.y < 0){
			this.position.y += height;
		}
		if(this.position.y > height){
			this.position.y -= height;
		}
		*/
	}

	separate(otherAgents){
		let desiredSeparation = 35;
		let sum = new p5.Vector();
		let count = 0;
		for(let i = 0; i < numAgents; i++){
			//could potentially use agentColony as well
			let dist = p5.Vector.dist(this.position, otherAgents[i].position);

			if((dist > 0) & (dist < desiredSeparation)){
				let diff = p5.Vector.sub(this.position, otherAgents[i].position);
				diff.normalize();
				sum.add(diff);
				count++;
			}
		}

		if(count > 0){
			sum.div(count);
			sum.normalize();
			sum.mult(this.maxSpeed);
			let steer = p5.Vector.sub(sum, this.velocity);
			steer.limit(this.maxForce);
			this.applyForce(steer);
		}
	}

	cohesion(otherAgents){
		let neighborhoodSize = 35;
		let sum = new p5.Vector();
		let count = 0;
		for(let i = 0; i < numAgents; i++){
			//could potentially use agentColony as well
			let dist = p5.Vector.dist(this.position, otherAgents[i].position);
			if((dist > 0) & (dist < neighborhoodSize)){
				sum.add(otherAgents[i].position);
				count++;
			}
		}

		if(count > 0){
			sum.div(count);
			this.seek(sum);
		}
	}

	wander(){
		//velocity is increasing infinitely
		//debugger;

		//normalize veloctiy to get offset
		let offset = this.velocity.copy();
		//offset.normalize();
		//mult by 2
		offset.mult(20);
		//add my desiredWander

		//add this.position as well

		let desiredWander = p5.Vector.random2D();
		desiredWander.mult(10);
		desiredWander.add(offset);
		desiredWander.normalize();
		//this is making it super negative
		//desiredWander.sub(this.position);
		if(this.role === 'reckless'){
			desiredWander.mult(this.maxSpeed);
		}
		else{
			desiredWander.mult(this.maxSpeed / 2);
		}
		let desiredVector = p5.Vector.sub(desiredWander, this.velocity);
		desiredVector = desiredVector.limit(this.maxForce);
		this.applyForce(desiredVector);
		
	}

	checkVirus(otherAgents){
		let virusDistance = 60;
		let closeVirusDistance = 15;
		let count = 0;
		for(let i = 0; i < numAgents; i++){
			let dist = p5.Vector.dist(this.position, otherAgents[i].position);
			if(dist < virusDistance && otherAgents[i].sick === true){
					count++;
				if(dist < closeVirusDistance){
					count+=2;
				}
			}
		}
		if(count > 1){
			this.health--;
			//if health drops below threshold set sick
			if(this.health < 0){
				this.sick = true;
			}
		}
	}

  update(){
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    if (this.position.x > width){
      this.position.x -= width;
    }
    if (this.position.x < 0){
      this.position.x += width;
    }

    if (this.position.y > height){
      this.position.y -= height;
    }
    if (this.position.y < 0){
      this.position.y += height;
    }
  }

  draw(){
		rectMode(CENTER);
		ellipseMode(CENTER);
    stroke(0);
    fill(200);
    push();
    translate(this.position.x, this.position.y);
    rotate(this.velocity.heading());
		//set fill color by sickness by sickness
		if(this.sick === true){
			fill('red');
		}
		else{
			fill('green');
		}
		if(this.role === 'loner'){
			triangle(-10, -5,
				-10, 5,
				0, 0);
		}
		else if(this.role === 'family'){
			rect(0, 0, 10, 10);
		}
		else{
			ellipse(0, 0, 10);

		}
    pop();
  }
}
