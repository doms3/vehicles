let tempmap;
let vehicle;

function setup() {
    createCanvas(800, 800);
    rectMode( CENTER );
    tempmap = makeHeatmap(temperature_LampAtCenter);
    vehicle = new braitenburgVehicle( Complex(Math.random(-width/2, width/2), Math.random(-height/2,height/2)), Complex( { arg: Math.random(0, 2 * Math.PI), abs: 1 } ) );
    vehicle.sensorThrusterPairs.push( new braitenburgSensorThruster( orientation.CENTER, orientation.CENTER, temperature_LampAtCenter, x => x ) ); 
}

function draw() {
    vehicle.advanceTime();
    background( tempmap );
    vehicle.draw();
}

function makeHeatmap( temperatureCallback ) {
    let heatmap = createImage(width, height);
    const from = color( 72,  61, 139);
    const to   = color(218, 165,  32);
    heatmap.loadPixels();
    for ( let i = 0; i < heatmap.width; i++ ) {
        for ( let j = 0; j < heatmap.height; j++ ) {
            heatmap.set( i, j, lerpColor( from, to, temperatureCallback(Complex(i,j).sub(Complex(width/2, height/2)) ) ) );
        } 
    }
    heatmap.updatePixels();
    return heatmap;
}

function temperature_LampAtCenter(z) {
    const d0 = 100;
    return exp(-z.div(d0).abs()*z.div(d0).abs()); 
}

function braitenburgVehicle(z_initial, angle_initial) {
    this.size = 20;
    this.inertia = 5;

    this.z = z_initial;
    this.v = Complex(0,0);
    this.a = Complex(0,0);
    
    this.angle = angle_initial;
    this.av = 0;
    this.aa = 0;     

    this.sensorThrusterPairs = [];
    console.log( this );
}

braitenburgVehicle.prototype.getLeftSensorLocation = function() {
    return this.z.add( Complex( this.size / 2, this.size / 2 ) ).mul( this.angle );
};
braitenburgVehicle.prototype.getRightSensorLocation = function() {
    return this.z.add( Complex( -1 * this.size / 2, this.size / 2 ) ).mul( this.angle );
};
braitenburgVehicle.prototype.getCenterSensorLocation = function() {
    return this.z.add( Complex( 0, this.size / 2 ) ).mul( this.angle );
};

const orientation = { LEFT: 0, RIGHT: 1, CENTER: 2 };

function braitenburgSensorThruster( sensorLocation, thrusterLocation, stimulusFunction, activationFunction ) {
    this.sensorLocation     = sensorLocation;
    this.thrusterLocation   = thrusterLocation;
    this.stimulusFunction   = stimulusFunction;
    this.activationFunction = activationFunction;
} 

braitenburgSensorThruster.prototype.getForce = function( vehicle ) {
    if( this.sensorLocation === orientation.LEFT ) {
        return this.activationFunction( this.stimulusFunction( vehicle.getLeftSensorLocation() ) ); 
    } else if( this.sensorLocation === orientation.CENTER ) {
        return this.activationFunction( this.stimulusFunction( vehicle.getCenterSensorLocation() ) );
    } else {
        return this.activationFunction( this.stimulusFunction( vehicle.getRightSensorLocation() ) ); 
    }
};

braitenburgSensorThruster.prototype.getAcceleration = function( vehicle ) {
    return vehicle.angle.mul( Complex( this.getForce( vehicle ) / vehicle.inertia, 0 ) ); 
};

braitenburgSensorThruster.prototype.getAccelerationAngular = function( vehicle ) {
    if( this.thrusterLocation === orientation.CENTER ) { return 0; }
    else if( this.thrusterLocation === orientation.LEFT ) { return -1 * this.getForce / (vehicle.size * vehicle.inertia); }
    else { return this.getForce / (vehicle.size * vehicle.inertia); }
};


braitenburgVehicle.prototype.draw = function() { 
    push();
    translate(width/2 + this.z.re, height/2 + this.z.im);
    rotate(this.angle.arg());
    square( 0, 0, this.size, 0, this.size * 10 / 4, this.size * 10 / 4, 0); 
    pop();
};

braitenburgVehicle.prototype.setAcceleration = function() {
    this.a = Complex(0,0); this.aa = 0;
    for( obj of this.sensorThrusterPairs ) {
        this.a  = this.a.add( obj.getAcceleration( this ) );
        this.aa = this.aa + obj.getAccelerationAngular( this );
    };
};

braitenburgVehicle.prototype.advanceTime = function() {
    const dt = 1;
    this.setAcceleration();
    this.v = this.v.add( this.a.mul( Complex( dt, 0 ) ) );
    this.z = this.z.add( this.v.mul( Complex( dt, 0 ) ) );

    this.av = this.av + this.aa * dt;
    this.angle = this.angle.mul( Complex( { arg: this.av * dt, abs: 1 } ) );

    this.v = this.v.mul( Complex(0.95) );
    this.av = this.av * 0.95;
};
