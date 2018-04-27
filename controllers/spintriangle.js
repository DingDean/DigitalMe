const DM = (function () {

  this.assets;

  function init () {
    let scene = new THREE.Scene()

    let camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      2,
      2000
    )
    camera.position.z = 20
    let control = new THREE.OrbitControls(camera)
    control.update()
    camera.__control = control

    let renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )

    document.body.appendChild( renderer.domElement )
    return {scene, camera, renderer}
  }

  function animate ( assets ) {
    requestAnimationFrame(() => animate( assets ))
    let {camera, renderer, scene} = assets
    camera.__control.update()
    assets.speed = Math.max(0, assets.speed - 0.1)
    assets.triangle.rotation.x += assets.speed
    renderer.render(scene, camera)
  }

  function main() {
    this.assets = init()
    let geometry = new THREE.BoxGeometry( 1, 1, 1 )
    let material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
    let mesh = new THREE.Mesh( geometry, material )
    this.assets.scene.add( mesh )
    this.assets.triangle = mesh
    this.assets.speed = 0;
    animate( this.assets )
  }

  return {init, animate, main}
})()

DM.main()
