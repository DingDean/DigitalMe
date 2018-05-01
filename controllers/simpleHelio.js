/**
 * 混沌初开
 * 编程聚生
 * 页面初打开，呈现一片四散的粒子
 * 当用户在编辑器中进行连续操作的时候，四散的粒子会慢慢聚合
 * 最终形成象征生命的基因链条.
 * 如果用户超过两秒不再进行输入，那么链条就会慢慢在此四散开来。
 */

let scene, camera, renderer, cloc, gene
let x = Math.PI / 2 // 由socketio控制大小
let intensity = 0.0
let lastInput = 0

init()
animate()

/**
 * init
 *
 * @return {Object}
 */
function init() {
  clock = new THREE.Clock( /*autoStart*/true )

  scene = new THREE.Scene()
  scene.background = new THREE.Color( 0xffffff )

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z =15
  let control = new THREE.OrbitControls(camera)
  control.update()
  camera.__control = control
  camera.position.z = 100

  renderer = new THREE.WebGLRenderer()
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)

  gene = makeGene(5, 32, 2, 20, 3)
  gene.geometry.center()
  gene.rotation.x = - Math.PI / 2
  gene.rotation.y = -0.5
  scene.add(gene)

  document.body.appendChild(renderer.domElement)
  window.addEventListener('resize', onWindowResize, false)
}

/**
 * animate
 *
 * @param {Object} assets
 */
function animate() {
  requestAnimationFrame( animate )
  camera.__control.update()
  gene.rotation.z += 0.003
  let scale = gene.material.uniforms.scale.value

  x -= intensity
  if ( x < 0 )
    x = 0
  let elapsed = clock.getElapsedTime()
  if ( elapsed - lastInput >= 2 ) {
    intensity = 0.0
    x += 0.002
    if ( x > Math.PI / 2 ) {
      x = Math.PI / 2
    }
  }
  scale = Math.sin( x )

  gene.material.uniforms.scale.value = scale
  gene.material.uniforms.u_time.value = elapsed
  renderer.render(scene, camera)
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize( window.innerWidth, window.innerHeight )
}

/**
 * fillSphere
 *
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} z0
 * @param {Number} radius
 * @return {Number[]}
 */
function randSpherePoint(x0, y0, z0, radius) {
  let u = Math.random()
  let v = Math.random()
  let theta = 2 * Math.PI * u
  let phi = Math.acos(2 * v - 1)
  let x = x0 + (radius * Math.sin(phi) * Math.cos(theta))
  let y = y0 + (radius * Math.sin(phi) * Math.sin(theta))
  let z = z0 + (radius * Math.cos(phi))
  return [x, y, z]
}

/**
 * randSpherePoints
 *
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} z0
 * @param {Number} radius
 * @param {Number} points
 * @return {Number[]}
 */
function randSpherePoints(x0, y0, z0, radius, points) {
  let vertices = []
  while (points--) {
    let randr = Math.random() * radius
    let vector = randSpherePoint(x0, y0, z0, randr)
    vertices.push( ...vector )
  }
  return vertices
}

/**
 * 制作基因的横轴
 *
 * @param {Number[]} vecA 右侧基点
 * @param {Number[]} vecB 左侧基点
 * @param {Number} pointsNum 由多少粒子组成
 * @return {Number[]}
 */
function makeTube(vecA, vecB, pointsNum) {
  let vertices = []
  while (pointsNum--) {
    let t = Math.random()
    let vec = []
    for (let i=0; i<3; i++) {
      let a = vecA[i]
      let b = vecB[i]
      let c = t * a + (1-t) * b
      vec.push(c)
    }
    vec = vec.map((e) => e + Math.random() * 2)
    vertices.push( ...vec )
  }
  return vertices
}

/**
 * makeGene
 *
 * @param {Number} rounds
 * @param {Number} roundStep
 * @param {Number} climbSpeed
 * @param {Number} radius
 * @param {Number} sphereRadius
 * @return {Object}
 */
function makeGene(rounds, roundStep, climbSpeed, radius, sphereRadius) {
  let geo = new THREE.BufferGeometry()
  let climbIndex = 0
  let intertiwne = 9
  let positions = []
  let POINTS_NUM = 0;
  while (rounds--) {
    let thetaIndex = 0
    let betaIndex = thetaIndex + intertiwne

    for (let i=0; i<roundStep; i++) {
      let theta = (thetaIndex / roundStep) * 2 * Math.PI
      let beta = (betaIndex / roundStep) * 2 * Math.PI

      let x0 = radius * Math.cos(theta)
      let y0 = radius * Math.sin(theta)
      let z0 = climbIndex * climbSpeed
      let rightPoints = randSpherePoints(x0, y0, z0, sphereRadius, 300)
      positions.push(...rightPoints)
      POINTS_NUM += 300;

      let x1 = radius * Math.cos(beta)
      let y1 = radius * Math.sin(beta)
      let z1 = z0
      let leftPoints = randSpherePoints(x1, y1,
        z0, sphereRadius, 300
      )
      positions.push(...leftPoints)
      POINTS_NUM += 300;

      if (thetaIndex % 3 == 0) {
        let tubesPoints = makeTube(
          [x0, y0, z0],
          [x1, y1, z1],
          300
        )
        positions.push(...tubesPoints)
        POINTS_NUM += 300;
      }

      thetaIndex = (thetaIndex + 1) % roundStep
      betaIndex = (betaIndex + 1) % roundStep
      climbIndex++
    }
  }
  positions = new Float32Array( positions )
  geo.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ))

  let displacement = [];
  let pointSize = [];
  for ( let i=0; i < POINTS_NUM; i++ ) {
    displacement.push( Math.random() * 200  - 100)
    displacement.push( Math.random() * 200  - 100)
    displacement.push( Math.random() * 200  - 100)
    pointSize.push( Math.random() * 10 - 5 )
  }
  displacement = new Float32Array( displacement )
  pointSize = new Float32Array( pointSize )
  geo.addAttribute(
    'displacement',
    new THREE.BufferAttribute( displacement, 3 )
  )
  geo.addAttribute(
    'pointSize',
    new THREE.BufferAttribute( pointSize, 1 )
  )

  let mat = new THREE.ShaderMaterial({
    uniforms: {
      scale: { value: 1.0 },
      u_time: { value: 0.0 }
    },
    vertexShader: document.getElementById('vshader').textContent,
    fragmentShader: document.getElementById('fshader').textContent
  })

  return new THREE.Points(geo, mat)
}
