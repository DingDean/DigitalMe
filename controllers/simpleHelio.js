let scene, camera, renderer, gene

init()
animate()

/**
 * init
 *
 * @return {Object}
 */
function init() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 20
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
  gene.rotation.z += 0.005
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
 * @return {Array}
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
 * @return {Array}
 */
function randSpherePoints(x0, y0, z0, radius, points) {
  let vertices = []
  while (points--) {
    let randr = Math.random() * radius
    let vector = randSpherePoint(x0, y0, z0, randr)
    vertices.push(new THREE.Vector3(...vector))
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
  let geo = new THREE.Geometry()
  let climbIndex = 0
  let intertiwne = 9
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
      geo.vertices.push(...rightPoints)

      let x1 = radius * Math.cos(beta)
      let y1 = radius * Math.sin(beta)
      let z1 = z0
      let leftPoints = randSpherePoints(x1, y1,
        z0, sphereRadius, 300
      )
      geo.vertices.push(...leftPoints)

      if (thetaIndex % 3 == 0) {
        let tubesPoints = makeTube(
          [x0, y0, z0],
          [x1, y1, z1],
          300
        )
        geo.vertices.push(...tubesPoints)
      }

      thetaIndex = (thetaIndex + 1) % roundStep
      betaIndex = (betaIndex + 1) % roundStep
      climbIndex++
    }
  }
  let mat = new THREE.PointsMaterial({size: 0.1})

  return new THREE.Points(geo, mat)
}

/**
 * 制作基因的横轴
 *
 * @param {Number[]} vecA 右侧基点
 * @param {Number[]} vecB 左侧基点
 * @param {Number} pointsNum 由多少粒子组成
 * @return {Object[]}
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
    vertices.push(new THREE.Vector3(...vec))
  }
  return vertices
}
