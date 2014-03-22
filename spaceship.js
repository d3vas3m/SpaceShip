/**
 * Created by Devajit on 19/3/14.
 * art assets by kim
 */

window.addEventListener('load',eventWindowLoaded,false);
function eventWindowLoaded(){
    spaceshipLoad();
}
function spaceshipLoad(){
    var display = document.getElementById("display");
    var canvas = display.getContext("2d");

    var score = 0,
        lives = 3,
        time = 0.5,
        WIDTH = 800,
        HEIGHT = 600,
        started = false;
    var rock_group = [];
    var missile_group = [];
    var explosion_group = [];
    var timer;

    function  ImageInfo(parameters){
        var center = parameters.center;
        var size = parameters.size;
        var radius = parameters.radius;
        var lifespan = parameters.lifespan;
        var animated = parameters.animated;
        this.center = center;
        this.size = size;
        this.radius = radius;
        this.animated = animated;
        if (lifespan) this.lifespan = lifespan;
        else this.lifespan = parseFloat('life');

    }
    ImageInfo.prototype.get_center =   function(){
        return this.center;
    };

    ImageInfo.prototype.get_size=function(){
        return this.size;
    };

    ImageInfo.prototype.get_radius=function(){
        return this.radius;
    };

    ImageInfo.prototype.get_lifespan= function(){
        return this.lifespan;
    };
    ImageInfo.prototype.get_animated =function(){
        return this.animated;
    };

// debris images
    var debris_info = new ImageInfo({center: [320, 240], size: [640, 480]});
    var debris_image = new Image();
    debris_image.src = "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/debris4_brown.png";

// nebula images
    var nebula_info=new ImageInfo({center: [400, 300], size: [800, 600]});
    var nebula_image = new Image();
    nebula_image.src = "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/nebula_blue.f2013.png";

// splash image
    var splash_info =  new ImageInfo({center: [200, 150], size: [400, 300]});
    var splash_image = new Image();
    splash_image.src = "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/splash.png";

// ship image
    var ship_info = new ImageInfo({center: [45, 45], size: [90, 90], radius: 35});
    var ship_image =  new Image();
    ship_image.src = "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/double_ship.png";

// missile image
    var missile_info = new ImageInfo({center: [5, 5], size: [10, 10], radius: 3, lifespan: 50});
    var missile_image =  new Image();
    missile_image.src= "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/shot1.png";

// asteroid image
    var asteroid_info = new ImageInfo({center: [45, 45], size: [90, 90], radius: 40});
    var asteroid_image = new Image();
    asteroid_image.src = "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/asteroid_blend.png";

// animated explosion
    var explosion_info =  new ImageInfo({center: [64, 64], size: [128, 128], radius: 17, lifespan: 24, animated: true});
    var explosion_image = new Image();
    explosion_image.src = "http://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/explosion_alpha.png";
//
//// loading  sound and creating sound handlers
//    var missile_sound = "sounds/missile.mp3";
//    var ship_thrust_sound = "sounds/thrust.mp3";
//    var soundtrack = "sounds/soundtrack.mp3";
//    var explosion_sound = "sounds/explosion.mp3";
//
//    function playSound(sound,volume,playStatus){
//        var tempSound = document.createElement("audio");
//        tempSound.setAttribute("src",sound);
//        tempSound.loop = false;
//        tempSound.volume = volume;
//        if (playStatus) {
//            tempSound.play();
//        }
//        else if(!playStatus) tempSound.pause();
////    sounds.push(tempSound);
//    }

// handling transformations

    function angle_to_vector(ang){
        var angleInRad = ang * Math.PI/180;
        return [Math.cos(angleInRad),Math.sin(angleInRad)];
    }

    function dist(p,q){
        return Math.sqrt(Math.pow((p[0]-q[0]),2)+Math.pow((p[1]-q[1]),2));
    }

    function process_sprite_group(group){
        var elem = {};
        var groupLength = group.length - 1;
        for(var spriteCtr = groupLength; spriteCtr >=0;spriteCtr-- ){
            elem= group[spriteCtr];
//            console.log(elem);
            elem.draw();
            if (!elem.update()) group.splice(spriteCtr,1);
        }

    }

    function group_collide(group, other_object){
        var collisions = 0;
        var elem = {};
        var exploSprite;
        for(var tempSpriteCtr=group.length-1;tempSpriteCtr>=0;tempSpriteCtr--  ){
            elem = group[tempSpriteCtr];
            if( elem.collide(other_object)){
                console.log(elem.collide(other_object));
                collisions += 1;
                exploSprite = new Sprite({pos: elem.pos, vel: [0, 0],source:[0,0], ang: 0, ang_vel: 0, image: explosion_image, info: explosion_info});

                explosion_group.push(exploSprite);
                group.splice(tempSpriteCtr,1);
            }

        }
        return collisions;
    }

    function group_group_collide(group, other_group){
        var collisions = 0;
        var elem ={};
        for(var tempSpriteCtr = group.length-1;tempSpriteCtr>=0;tempSpriteCtr--){
            elem = group[tempSpriteCtr];
            collisions = group_collide(other_group, elem);
            if (collisions > 0){
                score += collisions;
                group.splice(tempSpriteCtr,1);
            }
        }
        return collisions;
    }

// Ship
    function Ship(parameters){
        var pos = parameters.pos;
        var vel = parameters.vel;
        var angle = parameters.angle;
        var image = parameters.image;
        var info = parameters.info;
        var source = parameters.source;
        this.pos = [pos[0],pos[1]];
        this.vel=vel;
        this.thrust=false;
        this.angle=angle;
        this.angle_vel= 0 ;
        this.source=source;
        this.image = image;
        this.image_center = info.center;
        this.image_size = info.size;
        this.radius = info.radius;

    }
    Ship.prototype.draw = function(){
        canvas.save();
        canvas.setTransform(1,0,0,1,0,0);
        var angleInRadians = this.angle*Math.PI/180;
        var x = this.pos[0];
        var y = this.pos[1];

        var width = this.image_center[0];
        var height= this.image_center[1];
        canvas.translate(x+width, y+height);
        canvas.rotate(angleInRadians);
        canvas.drawImage(this.image,this.source[0],this.source[1],this.image_size[0],this.image_size[1],-width,-height,this.image_size[0],this.image_size[1]);
        canvas.restore();

    };
    Ship.prototype.update = function(){
        this.pos[0] = (this.pos[0]+this.vel[0]) % WIDTH ;
        this.pos[1] = (this.pos[1]+this.vel[1]) % HEIGHT ;
        if(this.pos[0]+this.image_size[0]<0) this.pos[0] = WIDTH;
        else if(this.pos[1]+this.image_size[1]<0) this.pos[1] = HEIGHT;

        // update angle
        this.angle += this.angle_vel;

        // update velocity
        this.vel[0] *= 1 - 0.012 ;  //friction
        this.vel[1] *= 1 - 0.012  ; //friction
        if (this.thrust){
            this.vel[0] += angle_to_vector(this.angle)[0]/10;
            this.vel[1] +=angle_to_vector(this.angle)[1]/10;
        }

    };
    Ship.prototype.thruster=function(){
        if (this.thrust == true){
            this.source[0] = 90;


        }
        else if (this.thrust == false){
            this.source[0] = 0;

        }
    };
    Ship.prototype.shoot = function(){
        var missile_pos = [(this.pos[0]+this.image_center[0])+angle_to_vector(this.angle)[0]*this.radius, (this.pos[1]+this.image_center[1])+angle_to_vector(this.angle)[1]*this.radius];
        var missile_vel = [this.vel[0]+angle_to_vector(this.angle)[0]*6,this.vel[1]+angle_to_vector(this.angle)[1]*6];
        var tempMissile = new Sprite({pos: missile_pos, vel: missile_vel, source:[0,0],ang: 0, ang_vel: 0, image: missile_image, info: missile_info});
        missile_group.push(tempMissile);
    };

// Sprites
    function Sprite(parameters){
        var pos = parameters.pos;
        var vel = parameters.vel;
        var ang = parameters.ang;
        var ang_vel = parameters.ang_vel;
        var image = parameters.image;
        var info = parameters.info;
        var source = parameters.source;
        this.pos = pos;
        this.vel = vel;
        this.source = source;
//        this.init_vel = vel;
        this.angle = ang;
        this.angle_vel = ang_vel;
        this.image = image;
        this.image_center = info.center;
        this.image_size = info.size;
        this.radius = info.radius;
        this.lifespan = info.lifespan;
        this.animated = info.animated;
        this.age = 0;

    }
    Sprite.prototype.draw =  function(){
        if (this.animated){
            canvas.drawImage(this.image, this.source[0] + this.image_size[0] * this.age,this.source[1],
                this.image_size[0],this.image_size[1], this.pos[0],this.pos[1],this.image_size[0],this.image_size[1]);
        }
        else{
        canvas.save();
        canvas.setTransform(1,0,0,1,0,0);
        var angleInRadians = this.angle * Math.PI/180;
        var x = this.pos[0];
        var y = this.pos[1];
        var halfWidth = this.image_center[0];
        var halfHeight = this.image_center[1];
        canvas.translate(x+halfWidth,y+halfHeight);
        canvas.rotate(angleInRadians);
        canvas.drawImage(this.image, this.source[0],this.source[1],this.image_size[0],this.image_size[1],-halfWidth,-halfHeight,this.image_size[0],this.image_size[1]);

        canvas.restore();

        }
    };
    Sprite.prototype.update = function () {
        // update angle
        this.angle += this.angle_vel;

        //update position
        this.pos[0] = (this.pos[0] + this.vel[0]) % WIDTH;
        this.pos[1] = (this.pos[1] + this.vel[1]) % HEIGHT;
        if(this.pos[0]+this.image_size[0]<0) this.pos[0] = WIDTH;
        else if(this.pos[1]+this.image_size[1]<0) this.pos[1] = HEIGHT;

        this.age += 1;
        if (this.age >= this.lifespan) {
            return false;
        }
        return true;

    };

    Sprite.prototype.collide = function(other_object){
        var distance = dist(this.pos,other_object.pos);
        if (distance <= (this.radius + other_object.radius)) {
            return true;
        }
    };

// Key Handlers
    window.addEventListener('keydown',keyDown,false);
    window.addEventListener('keyup',keyUp,false);
    window.addEventListener('click',click,false);
    function keyDown(e){
        var key = e.keyCode;
        if (key == '37') my_ship.angle_vel -= 0.05;
        else if (key == '39') my_ship.angle_vel += 0.05;
        else if (key == '38') {
            my_ship.thrust = true;
            my_ship.thruster();
        }
        else if (key == '32'){
            my_ship.shoot();
        }
    }

    function keyUp(e){
        var key = e.keyCode;
        if (key == '37') my_ship.angle_vel = 0;
        else if (key == '39') my_ship.angle_vel = 0;
        else if (key == '38'){
            my_ship.thrust = false;

            my_ship.thruster();
        }
    }

    function click(e){
        var pos =[e.clientX, e.clientY];
        center = [WIDTH / 2, HEIGHT / 2];
        size = splash_info.get_size();
        inwidth = (center[0] - size[0] / 2) < pos[0] < (center[0] + size[0] / 2);
        inheight = (center[1] - size[1] / 2) < pos[1] < (center[1] + size[1] / 2);
        if ((!started) && inwidth && inheight) started = true;
        lives = 3;
        score = 0;

    }

    function draw(){
        time += 1;
        var wtime = (time / 4) % WIDTH;
        var size = debris_info.get_size();
        canvas.drawImage(nebula_image,0,0,nebula_info.get_size()[0],nebula_info.get_size()[1],0,0,nebula_info.get_size()[0],nebula_info.get_size()[1]);
        canvas.drawImage(debris_image, 0,0, size[0],size[1],(wtime - WIDTH / 2),( HEIGHT / 2), WIDTH, HEIGHT);
        canvas.drawImage(debris_image,0,0, size[0],size[1], 0, (wtime- HEIGHT/2), WIDTH, HEIGHT);
        my_ship.update();
        my_ship.draw();

        process_sprite_group(missile_group);
        process_sprite_group(rock_group);
        process_sprite_group(explosion_group);
        group_group_collide(missile_group, rock_group);
        group_collide(rock_group, my_ship);

    }

// rock spawner
    function rock_spawner(){

        if (rock_group.length > 12 || ! started) return;
        var rock_pos = [random(0, WIDTH), random(0, HEIGHT)];
        var rock_vel = [Math.random() * .6 - .3, Math.random() * .6 - .3];
        var rock_avel = Math.random() * 0.5 - .1;

        //avoid new rocks to appear over my_ship
        var distance = dist(rock_pos, my_ship.pos);
        console.log(distance);
       if (distance < 100){
            rock_pos = [random(0, WIDTH), random(0, HEIGHT)];
        }
        //add rock to the group
        var rock_sprite = new Sprite({pos: rock_pos,source:[0,0], vel: rock_vel, ang: 0, ang_vel: rock_avel, image: asteroid_image, info: asteroid_info});
        rock_group.push(rock_sprite);
    }
    function random(min,max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    var my_ship = new Ship({pos: [WIDTH / 2,HEIGHT/2], vel: [0,0], source:[0,0],angle: 0, image:ship_image, info: ship_info});


    function startSpawning(){
        timer = window.setInterval(rock_spawner,2000);
    }
    startSpawning();

    function start(){
        window.setInterval(draw,1000/60.0);
    }
    start();

}


