
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';


(function () {

	// Set my main variables
	let scene,
		renderer,
		composer,
		camera,
		model,                              // the model
		neck,                               // Reference to the neck bone in the skeleton
		waist,                              // Reference to the waist bone in the skeleton
		neck2,                              // Reference to the neck2 bone in the skeleton
		waist2,  							// Reference to the waist2 bone in the skeleton
		possibleAnims,                      // Animations found in file
		mixer,                              // THREE.js animations mixer
		idle,                               // Idle, the default state our character returns to
		clock = new THREE.Clock(),          // Used for anims, which run to a clock instead of frame rate 
		currentlyAnimating = false,         // Used to check whether characters neck is being used in another anim
		raycaster = new THREE.Raycaster();  // Used to detect the click on our character
	var disk1 = false;                      // Used to control disks to play animations
	var disk2 = false;

	init();
	// Create the dialogue box in htmls
	var dialogueBox = document.createElement("div");
	dialogueBox.classList.add("dialogue-box");
	dialogueBox.style.display = "none";
	document.body.appendChild(dialogueBox);
	// Create the message element
	var message = document.createElement("div");
	message.classList.add("message");

	// Create the dialogue box2
	var dialogueBox2 = document.createElement("div");
	dialogueBox2.classList.add("dialogue-box2");
	dialogueBox2.style.display = "none";
	document.body.appendChild(dialogueBox2);	
	// Create the message element2
	var message2 = document.createElement("div");
	message2.classList.add("message");


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
		const pmremGenerator = new THREE.PMREMGenerator(renderer);
		scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

		// Add a camera
		camera = new THREE.PerspectiveCamera(
			20,
			window.innerWidth / window.innerHeight,
			0.1, 1000
		);
		camera.position.z = 40;
		camera.position.x = 10;
		camera.position.y = -22;
		camera.lookAt(new THREE.Vector3(0, -2.5, 0));

		//load models
		const loader = new GLTFLoader();
		loader.load(
			MODEL_PATH,
			function (gltf) {
				model = gltf.scene;
				let fileAnimations = gltf.animations;
				console.log(fileAnimations);
				model.traverse(o => {
					if (o.isBone) {
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
				model.scale.set(12, 12, 12);
				model.position.y = -11.3;
				scene.add(model);

				//play animations
				mixer = new THREE.AnimationMixer(model);
				let clips = fileAnimations.filter(val => val.name);
				//animations in files
				possibleAnims = clips.map(val => {
					let clip = THREE.AnimationClip.findByName(clips, val.name);
					//splice neck and waiste bones
					clip.tracks.splice(6, 3);
					clip.tracks.splice(18, 3);
					clip.tracks.splice(36, 3);
					clip.tracks.splice(42, 3);
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
			function (error) {
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

	//resize window 
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

	// code for using arduino, using bottoms
	// Listen for keyboard events
	window.addEventListener("keydown", onKeyDown, false);
	function onKeyDown(event) {
		if (event.key === "z" || event.key === "A") {
			console.log("Z key pressed");
			disk1 = true;
			disk2 = false;
			playDisk(disk1, disk2);
		}
		if (event.key === "x" || event.key === "A") {
			console.log("X key pressed");
			disk1 = false;
			disk2 = true;
			playDisk(disk1, disk2);
		}
	}
    // code for using mouse click
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
		if (intersects[0]) {
			var object = intersects[0].object;
			//disk1
			if (object.name === 'disk001') {
				disk1 = true;
				disk2 = false;
				playDisk(disk1, disk2);
				console.log("disk1="+disk1);
			}
			//disk2
			if (object.name === 'disk002') {
				disk1 = false;
				disk2 = true;
				playDisk(disk1, disk2);
				console.log("disk2="+disk2);
			}

			if (object.name !== 'disk002' && object.name !== 'disk001') {
				// create an AudioListener and add it to the camera
				const listener = new THREE.AudioListener();
				// create a global audio source
				const sound = new THREE.Audio(listener);
				const file = './sounds/hoo.wav';
				const audioLoader = new THREE.AudioLoader();
				audioLoader.load(file, function (buffer) {
					sound.setBuffer(buffer);
					//sound.setLoop( true );
					sound.setVolume(0.5);
					sound.play();
				});
			}

			// add event listener to document object
			document.addEventListener("click", function (event) {
				// check if the click event occurs outside the dialogue box
				if (!dialogueBox.contains(event.target)) {
					// hide the dialogue box
					dialogueBox.style.display = "none";
					dialogueBox2.style.display = "none";
					// clear the text contents
					dialogueBox.textContent = "";
					dialogueBox2.textContent = "";
					disk2 = false;

				}
			});
		}
	}

	function playDisk(disk1, disk2) {
		if (disk1) {
			if (!currentlyAnimating) {
				currentlyAnimating = true;
				//play animation
				playOnClick(0);
				playOnClick(6);
				playOnClick(10);
				//show text
				message2.textContent = "I did it! I finally became a streamer! ٩(｡•́‿•̀｡)۶ I can't believe it. I've been thinking about this for so long, and now it's finally happening. It started this morning. I woke up early and set up my computer and camera. I was so nervous. What if no one watched me? What if I was terrible at it?But then, I hit 'start streaming', and it was like magic. People started joining my stream right away. At first, it was just a few people, but then more and more started coming. They were all so nice and supportive. They were telling me I was doing a great job, and that I was cute and funny. (^▽^)It was amazing.  ";
				showText(message2.textContent, dialogueBox2, 24);
				dialogueBox2.style.display = "block";

				// create an AudioListener 
				const listener = new THREE.AudioListener();
				const sound = new THREE.Audio(listener);
				const file = './sounds/clip1.mp3';
				const audioLoader = new THREE.AudioLoader();
				audioLoader.load(file, function (buffer) {
					sound.setBuffer(buffer);
					sound.setVolume(0.5);
					sound.play();
				});
			}
		}

		if (disk2) {
			if (!currentlyAnimating) {
				currentlyAnimating = true;
				//play animation
				playOnClick(1);
				playOnClick(7);
				playOnClick(11);
				//show text
				message.textContent = "Today was a tough day. I tried to make some new content on my stream to keep my fans interested, but it seems like they are more interested in fighting with each other in the chat. It's frustrating because I put so much effort into creating something new and different for them, but it feels like no one is even paying attention to me. I feel like my fans are not really here for me anymore. They're just here for the drama and the arguments. It's like I'm just a backdrop for their entertainment. I wish they would focus on me, on what I have to offer, on who I am as a person. ";
				showText(message.textContent, dialogueBox, 30);
				dialogueBox.style.display = "block";

				// create an AudioListener 
				const listener = new THREE.AudioListener();
				const sound = new THREE.Audio(listener);
				const file = './sounds/clip2.mp3';
				const audioLoader = new THREE.AudioLoader();
				audioLoader.load(file, function (buffer) {
					sound.setBuffer(buffer);
					sound.setVolume(0.5);
					sound.play();
				});
			}
		}
		
	}

	//type text one by one
	function showText(text, element, delay) {
		// Split the text into an array of characters
		const characters = text.split("");
		let index = 0;
		// Create an interval that adds the characters to the element one by one with a delay
		const intervalId = setInterval(() => {
			if (index < characters.length) {
				element.textContent += characters[index];
				index++;
			} else {
				clearInterval(intervalId);
			}
		}, delay);
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
		setTimeout(function () {
			from.enabled = true;
			to.crossFadeTo(from, tSpeed, true);
			currentlyAnimating = false;
		}, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000));
	}

	document.addEventListener('mousemove', function (e) {
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

	//get mouse position
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
		if (x <= w.x / 2) {
			xdiff = w.x / 2 - x;
			xPercentage = (xdiff / (w.x / 2)) * 100;
			dx = ((degreeLimit * xPercentage) / 100) * -1;
		}
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

})(); 