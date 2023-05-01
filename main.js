
import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from './node_modules/three/addons/environments/RoomEnvironment.js';


(function() {
	
	// Set my main variables
	let scene,  
	  renderer,
	  composer,
	  camera,
	  model,                              // Our model
	  neck,                               // Reference to the neck bone in the skeleton
	  waist,                               // Reference to the waist bone in the skeleton
	  neck2,                               // Reference to the neck2 bone in the skeleton
	  waist2,  								// Reference to the waist2 bone in the skeleton
	  possibleAnims,                      // Animations found in our file
	  mixer,                              // THREE.js animations mixer
	  idle,                               // Idle, the default state our character returns to
	  clock = new THREE.Clock(),          // Used for anims, which run to a clock instead of frame rate 
	  currentlyAnimating = false,         // Used to check whether characters neck is being used in another anim
	  raycaster = new THREE.Raycaster(); // Used to detect the click on our character
	  
	  init(); 

      function init() {
		const MODEL_PATH = './models/Maho_ model_ to 3js.glb';
		const canvas = document.querySelector('#c');
        const backgroundColor = 0xecf2e6;

	

		// Init the scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);

        scene.fog = new THREE.Fog(backgroundColor, 60, 100);

		// Init the renderer
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);
		const pmremGenerator = new THREE.PMREMGenerator( renderer );
		scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;


		// Add a camera
        camera = new THREE.PerspectiveCamera(
	    20,
	    window.innerWidth / window.innerHeight,
	    0.1, 1000
	    
        );
		
        camera.position.z = 40;
        camera.position.x = 10;
        camera.position.y = -22;
		camera.lookAt(new THREE.Vector3(0,-2.5,0));
		

		const loader = new GLTFLoader();
	
		loader.load(
			MODEL_PATH,
			function(gltf) {
			 // A lot is going to happen here
			 model = gltf.scene;
             let fileAnimations = gltf.animations;
			 console.log(fileAnimations);
			 model.traverse(o => {
				if (o.isBone) {
					//console.log(o.name);
				  }
				if (o.isMesh) {
				  o.castShadow = true;
				  o.receiveShadow = true;
				 
				}
				 // Reference the neck and waist bones
				if (o.isBone && o.name === 'Bone009') { 
					neck = o;
				}
				if (o.isBone && o.name === 'Bone002') { 
					waist = o;
				}
				if (o.isBone && o.name === 'Bone020') { 
					neck2 = o;
				}
				if (o.isBone && o.name === 'Bone016') { 
					waist2 = o;
				}
			  });

			// Set the models initial scale
			model.scale.set(12,12,12);

			model.position.y = -11.3;

			scene.add(model);
			
            
			//play animations
			mixer = new THREE.AnimationMixer(model);

			let clips = fileAnimations.filter(val => val.name );
			
			possibleAnims = clips.map(val => {
				let clip = THREE.AnimationClip.findByName(clips, val.name);			
				 clip.tracks.splice(6,3);
			     clip.tracks.splice(18,3);
			     clip.tracks.splice(36,3);
			     clip.tracks.splice(42,3);
				 clip = mixer.clipAction(clip);
				return clip;
			   }
			  );

			let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idel');
			idle = mixer.clipAction(idleAnim);
			idle.play();
			console.log(idleAnim);
			},
			undefined, 
			function(error) {
			console.error(error);
			}
		  );

		// Add lights
		let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
		hemiLight.position.set(0, 50, 0);

		// Add hemisphere light to scene
		scene.add(hemiLight);
		let d = 8.25;
		let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
		dirLight.position.set(-8, 12, 8);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
		dirLight.shadow.camera.near = 0.1;
		dirLight.shadow.camera.far = 1500;
		dirLight.shadow.camera.left = d * -1;
		dirLight.shadow.camera.right = d;
		dirLight.shadow.camera.top = d;
		dirLight.shadow.camera.bottom = d * -1;

		// Add directional Light to scene
		scene.add(dirLight);

      }
	  function update() {
		if (mixer) {
			mixer.update(clock.getDelta());
			
		  }

		if (resizeRendererToDisplaySize(renderer)) {
		  const canvas = renderer.domElement;
		  camera.aspect = canvas.clientWidth / canvas.clientHeight;
		  camera.updateProjectionMatrix();
		}
		renderer.render(scene, camera);
		requestAnimationFrame(update);
	  }
	  
	  update();

	  function resizeRendererToDisplaySize(renderer) {
		const canvas = renderer.domElement;
		let width = window.innerWidth;
		let height = window.innerHeight;
		let canvasPixelWidth = canvas.width / window.devicePixelRatio;
		let canvasPixelHeight = canvas.height / window.devicePixelRatio;
	  
		const needResize =
		  canvasPixelWidth !== width || canvasPixelHeight !== height;
		if (needResize) {
		  renderer.setSize(width, height, false);
		}
		return needResize;
	  }

	window.addEventListener('click', e => raycast(e));
	window.addEventListener('touchend', e => raycast(e, true));

	//ray cast

	function raycast(e, touch = false) {
	var mouse = {};
	if (touch) {
		mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
		mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
	} else {
		mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
		mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
	}
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera(mouse, camera);

	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects(scene.children, true);
	//console.log(intersects);

	if (intersects[0]) {
		var object = intersects[0].object;
		console.log(object.name);

		if (object.name === 'disk001') {
		if (!currentlyAnimating) {
			currentlyAnimating = true;
			playOnClick(0);
			playOnClick(6);
			playOnClick(10);

			// create an AudioListener 
			const listener = new THREE.AudioListener();
			// create a global audio source
			const sound = new THREE.Audio( listener );
			const file = './sounds/clip1.mp3';
			// load a sound and set it as the Audio object's buffer
			const audioLoader = new THREE.AudioLoader();
			audioLoader.load( file, function( buffer ) {
				sound.setBuffer( buffer );
				//sound.setLoop( true );
				sound.setVolume( 0.5 );
				sound.play();
		});
		}
		}

		if (object.name === 'disk002') {
			if (!currentlyAnimating) {
				currentlyAnimating = true;
				playOnClick(1);
				playOnClick(7);
				playOnClick(11);
			

			// create an AudioListener and add it to the camera
			const listener = new THREE.AudioListener();
	
			// create a global audio source
			const sound = new THREE.Audio( listener );
			const file = './sounds/clip2.mp3';
			// load a sound and set it as the Audio object's buffer
			const audioLoader = new THREE.AudioLoader();
			audioLoader.load( file, function( buffer ) {
				sound.setBuffer( buffer );
				//sound.setLoop( true );
				sound.setVolume( 0.5 );
				sound.play();
		});

			
		}
		}

		if (object.name !== 'disk002'&& object.name !== 'disk001') {
			// create an AudioListener and add it to the camera
			const listener = new THREE.AudioListener();
	
			// create a global audio source
			const sound = new THREE.Audio( listener );
			const file = './sounds/hoo.wav';
			// load a sound and set it as the Audio object's buffer
			const audioLoader = new THREE.AudioLoader();
			audioLoader.load( file, function( buffer ) {
				sound.setBuffer( buffer );
				//sound.setLoop( true );
				sound.setVolume( 0.5 );
				sound.play();
		});
		}
		
	}
	} 
     


	// Get a animation, and play it 
	function playOnClick(anim) {
		playModifierAnimation(idle, 0.15, possibleAnims[anim], 0.15);
	  }

	function playModifierAnimation(from, fSpeed, to, tSpeed) {
	to.setLoop(THREE.LoopOnce);
	to.reset();
	to.play();
	from.crossFadeTo(to, fSpeed, true);
	setTimeout(function() {
		from.enabled = true;
		to.crossFadeTo(from, tSpeed, true);
		currentlyAnimating = false;
	}, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000));
	}  

	document.addEventListener('mousemove', function(e) {
    var mousecoords = getMousePos(e);
	if (neck && waist) {
		moveJoint(mousecoords, neck, 40);
		moveJoint(mousecoords, waist, 10);
	}
	if (neck2 && waist2) {
		moveJoint(mousecoords, neck2, 40);
		moveJoint(mousecoords, waist2, 10);
	}
	});

	function getMousePos(e) {
	return { x: e.clientX, y: e.clientY };
	}
	function moveJoint(mouse, joint, degreeLimit) {
		let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
		joint.rotation.y = THREE.MathUtils.degToRad(degrees.x);
		joint.rotation.z = THREE.MathUtils.degToRad(degrees.y);
	  }

	  function getMouseDegrees(x, y, degreeLimit) {
		let dx = 0,
			dy = 0,
			xdiff,
			xPercentage,
			ydiff,
			yPercentage;
	  
		let w = { x: window.innerWidth, y: window.innerHeight };
	  
		// Left (Rotates neck left between 0 and -degreeLimit)
		
		 // 1. If cursor is in the left half of screen
		if (x <= w.x / 2) {
		  // 2. Get the difference between middle of screen and cursor position
		  xdiff = w.x / 2 - x;  
		  // 3. Find the percentage of that difference (percentage toward edge of screen)
		  xPercentage = (xdiff / (w.x / 2)) * 100;
		  // 4. Convert that to a percentage of the maximum rotation we allow for the neck
		  dx = ((degreeLimit * xPercentage) / 100) * -1; }
	  // Right (Rotates neck right between 0 and degreeLimit)
		if (x >= w.x / 2) {
		  xdiff = x - w.x / 2;
		  xPercentage = (xdiff / (w.x / 2)) * 100;
		  dx = (degreeLimit * xPercentage) / 100;
		}
		// Up (Rotates neck up between 0 and -degreeLimit)
		if (y <= w.y / 2) {
		  ydiff = w.y / 2 - y;
		  yPercentage = (ydiff / (w.y / 2)) * 100;
		  // Note that I cut degreeLimit in half when she looks up
		  dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
		  }
		
		// Down (Rotates neck down between 0 and degreeLimit)
		if (y >= w.y / 2) {
		  ydiff = y - w.y / 2;
		  yPercentage = (ydiff / (w.y / 2)) * 100;
		  dy = (degreeLimit * yPercentage) / 100;
		}
		return { x: dx, y: dy };
	  }
	})(); // Don't add anything below this line